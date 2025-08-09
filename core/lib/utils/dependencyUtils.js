const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

/**
 * Dependency Utility Functions for AIX Studio
 * Provides helper methods for managing project dependencies
 */
class DependencyUtils {
  /**
   * Create dependency utilities instance
   * @param {Object} options - Dependency options
   */
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.timeout = options.timeout || 30000; // 30 seconds
    this.cacheDir = options.cacheDir || path.join(process.env.HOME || process.env.USERPROFILE, '.aix-studio', 'cache');
    this.mavenBaseUrl = options.mavenBaseUrl || 'https://repo1.maven.org/maven2';
    this.centralSearchUrl = options.centralSearchUrl || 'https://search.maven.org/solrsearch/select';
  }

  /**
   * Add dependency to project
   * @param {string} projectPath - Project directory path
   * @param {string} dependency - Dependency specification (groupId:artifactId:version)
   * @param {Object} options - Add options
   * @returns {Promise<Object>} - Add result
   */
  async addDependency(projectPath, dependency, options = {}) {
    try {
      // Parse dependency specification
      const depInfo = this.parseDependencySpec(dependency);
      
      // Validate project path
      if (!await fs.pathExists(projectPath)) {
        throw new Error(`Project directory does not exist: ${projectPath}`);
      }
      
      // Ensure libs directory exists
      const libsDir = path.join(projectPath, 'libs');
      await fs.ensureDir(libsDir);
      
      // Download dependency
      const downloadResult = await this.downloadDependency(depInfo, options);
      
      // Copy to project libs directory
      const destPath = path.join(libsDir, downloadResult.filename);
      await fs.copy(downloadResult.path, destPath);
      
      // Clean up temporary file
      await fs.remove(downloadResult.path);
      
      // Update project configuration
      await this.updateProjectConfig(projectPath, depInfo, destPath);
      
      return {
        success: true,
        dependency: depInfo,
        path: destPath,
        size: downloadResult.size,
        sizeFormatted: this.formatFileSize(downloadResult.size),
        checksum: downloadResult.checksum,
        message: `Dependency ${depInfo.name} added successfully`
      };
    } catch (error) {
      throw new Error(`Failed to add dependency: ${error.message}`);
    }
  }

  /**
   * Parse dependency specification
   * @param {string} spec - Dependency specification
   * @returns {Object} - Parsed dependency information
   */
  parseDependencySpec(spec) {
    // Format: groupId:artifactId:version or artifactId:version or artifactId
    const parts = spec.split(':');
    
    if (parts.length === 1) {
      // Just artifact name, assume latest version
      return {
        groupId: null,
        artifactId: parts[0],
        version: 'latest',
        name: parts[0]
      };
    } else if (parts.length === 2) {
      // artifactId:version
      return {
        groupId: null,
        artifactId: parts[0],
        version: parts[1],
        name: parts[0]
      };
    } else if (parts.length >= 3) {
      // groupId:artifactId:version[:classifier]
      return {
        groupId: parts[0],
        artifactId: parts[1],
        version: parts[2],
        classifier: parts[3] || null,
        name: parts[1]
      };
    }
    
    throw new Error(`Invalid dependency specification: ${spec}`);
  }

  /**
   * Download dependency from Maven Central
   * @param {Object} depInfo - Dependency information
   * @param {Object} options - Download options
   * @returns {Promise<Object>} - Download result
   */
  async downloadDependency(depInfo, options = {}) {
    try {
      // Ensure cache directory exists
      await fs.ensureDir(this.cacheDir);
      
      // Resolve dependency if needed
      if (!depInfo.groupId || depInfo.version === 'latest') {
        const resolved = await this.resolveDependency(depInfo);
        depInfo = { ...depInfo, ...resolved };
      }
      
      // Check cache first
      const cacheKey = `${depInfo.groupId}:${depInfo.artifactId}:${depInfo.version}`;
      const cachePath = path.join(this.cacheDir, this.generateCacheKey(cacheKey));
      
      if (await fs.pathExists(cachePath)) {
        const stats = await fs.stat(cachePath);
        return {
          path: cachePath,
          filename: `${depInfo.artifactId}-${depInfo.version}.jar`,
          size: stats.size,
          checksum: await this.calculateChecksum(cachePath)
        };
      }
      
      // Download from Maven Central
      const downloadUrl = this.getMavenDownloadUrl(depInfo);
      const tempPath = await this.downloadFile(downloadUrl);
      
      // Verify checksum if available
      if (options.verifyChecksum !== false) {
        await this.verifyChecksum(tempPath, depInfo);
      }
      
      // Cache the downloaded file
      await fs.copy(tempPath, cachePath);
      
      const stats = await fs.stat(tempPath);
      
      return {
        path: tempPath,
        filename: `${depInfo.artifactId}-${depInfo.version}.jar`,
        size: stats.size,
        checksum: await this.calculateChecksum(tempPath)
      };
    } catch (error) {
      throw new Error(`Failed to download dependency ${depInfo.name}: ${error.message}`);
    }
  }

  /**
   * Resolve dependency information
   * @param {Object} depInfo - Partial dependency information
   * @returns {Promise<Object>} - Resolved dependency information
   */
  async resolveDependency(depInfo) {
    try {
      // Search Maven Central for dependency
      const searchParams = new URLSearchParams({
        q: `a:"${depInfo.artifactId}"`,
        rows: '1',
        wt: 'json'
      });
      
      if (depInfo.groupId) {
        searchParams.set('q', `g:"${depInfo.groupId}"+AND+a:"${depInfo.artifactId}"`);
      }
      
      const searchUrl = `${this.centralSearchUrl}?${searchParams.toString()}`;
      
      const response = await axios.get(searchUrl, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'AIX-Studio/1.0'
        }
      });
      
      const docs = response.data.response.docs;
      if (docs.length === 0) {
        throw new Error(`Dependency not found: ${depInfo.artifactId}`);
      }
      
      const doc = docs[0];
      const version = depInfo.version === 'latest' ? doc.latestVersion : depInfo.version || doc.latestVersion;
      
      return {
        groupId: doc.g,
        artifactId: doc.a,
        version: version,
        name: doc.a
      };
    } catch (error) {
      throw new Error(`Failed to resolve dependency: ${error.message}`);
    }
  }

  /**
   * Get Maven download URL
   * @param {Object} depInfo - Dependency information
   * @returns {string} - Download URL
   */
  getMavenDownloadUrl(depInfo) {
    const groupPath = depInfo.groupId.replace(/\./g, '/');
    const classifier = depInfo.classifier ? `-${depInfo.classifier}` : '';
    
    return `${this.mavenBaseUrl}/${groupPath}/${depInfo.artifactId}/${depInfo.version}/${depInfo.artifactId}-${depInfo.version}${classifier}.jar`;
  }

  /**
   * Download file from URL
   * @param {string} url - Download URL
   * @returns {Promise<string>} - Downloaded file path
   */
  async downloadFile(url) {
    try {
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        timeout: this.timeout,
        headers: {
          'User-Agent': 'AIX-Studio/1.0'
        }
      });
      
      const tempPath = await fs.mkdtemp(path.join(this.cacheDir, 'download-'));
      const filePath = path.join(tempPath, 'temp.jar');
      const writer = fs.createWriteStream(filePath);
      
      response.data.pipe(writer);
      
      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(filePath));
        writer.on('error', reject);
      });
    } catch (error) {
      throw new Error(`Failed to download file from ${url}: ${error.message}`);
    }
  }

  /**
   * Verify dependency checksum
   * @param {string} filePath - File path
   * @param {Object} depInfo - Dependency information
   * @returns {Promise<void>}
   */
  async verifyChecksum(filePath, depInfo) {
    try {
      // Download checksum file
      const checksumUrl = `${this.getMavenDownloadUrl(depInfo)}.sha1`;
      
      const response = await axios.get(checksumUrl, {
        timeout: this.timeout
      });
      
      const expectedChecksum = response.data.trim();
      const actualChecksum = await this.calculateChecksum(filePath, 'sha1');
      
      if (expectedChecksum.toLowerCase() !== actualChecksum.toLowerCase()) {
        throw new Error(`Checksum verification failed for ${depInfo.name}`);
      }
    } catch (error) {
      // Log warning but don't fail if checksum verification fails
      this.logger.warn(`Checksum verification failed: ${error.message}`);
    }
  }

  /**
   * Calculate file checksum
   * @param {string} filePath - File path
   * @param {string} algorithm - Hash algorithm
   * @returns {Promise<string>} - File checksum
   */
  async calculateChecksum(filePath, algorithm = 'sha256') {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash(algorithm);
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (error) => reject(error));
    });
  }

  /**
   * Generate cache key
   * @param {string} key - Cache key
   * @returns {string} - Hashed cache key
   */
  generateCacheKey(key) {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Update project configuration
   * @param {string} projectPath - Project directory path
   * @param {Object} depInfo - Dependency information
   * @param {string} depPath - Dependency file path
   * @returns {Promise<void>}
   */
  async updateProjectConfig(projectPath, depInfo, depPath) {
    try {
      const configPath = path.join(projectPath, 'aix.dependencies.json');
      let config = { dependencies: [] };
      
      // Load existing configuration
      if (await fs.pathExists(configPath)) {
        config = await fs.readJson(configPath);
      }
      
      // Add or update dependency
      const existingIndex = config.dependencies.findIndex(d => 
        d.groupId === depInfo.groupId && d.artifactId === depInfo.artifactId
      );
      
      const depEntry = {
        groupId: depInfo.groupId,
        artifactId: depInfo.artifactId,
        version: depInfo.version,
        name: depInfo.name,
        path: path.relative(projectPath, depPath),
        added: new Date().toISOString()
      };
      
      if (existingIndex >= 0) {
        config.dependencies[existingIndex] = depEntry;
      } else {
        config.dependencies.push(depEntry);
      }
      
      // Save configuration
      await fs.writeJson(configPath, config, { spaces: 2 });
    } catch (error) {
      this.logger.warn(`Failed to update project configuration: ${error.message}`);
    }
  }

  /**
   * Remove dependency from project
   * @param {string} projectPath - Project directory path
   * @param {string} dependency - Dependency specification
   * @returns {Promise<Object>} - Remove result
   */
  async removeDependency(projectPath, dependency) {
    try {
      const depInfo = this.parseDependencySpec(dependency);
      const libsDir = path.join(projectPath, 'libs');
      
      // Find dependency file
      const depFilename = `${depInfo.artifactId}-${depInfo.version}.jar`;
      const depPath = path.join(libsDir, depFilename);
      
      if (await fs.pathExists(depPath)) {
        await fs.remove(depPath);
      }
      
      // Update project configuration
      await this.removeFromProjectConfig(projectPath, depInfo);
      
      return {
        success: true,
        dependency: depInfo,
        removed: depPath,
        message: `Dependency ${depInfo.name} removed successfully`
      };
    } catch (error) {
      throw new Error(`Failed to remove dependency: ${error.message}`);
    }
  }

  /**
   * Remove dependency from project configuration
   * @param {string} projectPath - Project directory path
   * @param {Object} depInfo - Dependency information
   * @returns {Promise<void>}
   */
  async removeFromProjectConfig(projectPath, depInfo) {
    try {
      const configPath = path.join(projectPath, 'aix.dependencies.json');
      
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        
        config.dependencies = config.dependencies.filter(d => 
          !(d.groupId === depInfo.groupId && d.artifactId === depInfo.artifactId)
        );
        
        await fs.writeJson(configPath, config, { spaces: 2 });
      }
    } catch (error) {
      this.logger.warn(`Failed to update project configuration: ${error.message}`);
    }
  }

  /**
   * List project dependencies
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Array>} - Project dependencies
   */
  async listDependencies(projectPath) {
    try {
      const configPath = path.join(projectPath, 'aix.dependencies.json');
      
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        return config.dependencies || [];
      }
      
      // Fallback: scan libs directory
      const libsDir = path.join(projectPath, 'libs');
      if (await fs.pathExists(libsDir)) {
        const libFiles = await fs.readdir(libsDir);
        const jarFiles = libFiles.filter(file => file.endsWith('.jar'));
        
        return jarFiles.map(file => ({
          name: file.replace(/-\d+\.\d+\.\d+.*\.jar$/, ''),
          version: this.extractVersion(file),
          file: file,
          path: path.join('libs', file)
        }));
      }
      
      return [];
    } catch (error) {
      this.logger.warn(`Failed to list dependencies: ${error.message}`);
      return [];
    }
  }

  /**
   * Extract version from filename
   * @param {string} filename - Filename
   * @returns {string|null} - Version string
   */
  extractVersion(filename) {
    const versionRegex = /(\d+\.\d+\.\d+(?:[-.][\w.-]+)?)/;
    const match = filename.match(versionRegex);
    return match ? match[1] : null;
  }

  /**
   * Update all dependencies to latest versions
   * @param {string} projectPath - Project directory path
   * @param {Object} options - Update options
   * @returns {Promise<Object>} - Update result
   */
  async updateDependencies(projectPath, options = {}) {
    try {
      const dependencies = await this.listDependencies(projectPath);
      const results = [];
      
      for (const dep of dependencies) {
        try {
          const currentVersion = dep.version;
          const resolvedDep = await this.resolveDependency({
            groupId: dep.groupId,
            artifactId: dep.artifactId,
            version: 'latest'
          });
          
          const latestVersion = resolvedDep.version;
          
          if (latestVersion !== currentVersion) {
            // Remove old version
            const oldPath = path.join(projectPath, dep.path);
            if (await fs.pathExists(oldPath)) {
              await fs.remove(oldPath);
            }
            
            // Add new version
            const addResult = await this.addDependency(projectPath, 
              `${resolvedDep.groupId}:${resolvedDep.artifactId}:${latestVersion}`, 
              options
            );
            
            results.push({
              dependency: dep.name,
              oldVersion: currentVersion,
              newVersion: latestVersion,
              updated: true,
              result: addResult
            });
          } else {
            results.push({
              dependency: dep.name,
              oldVersion: currentVersion,
              newVersion: latestVersion,
              updated: false,
              message: 'Already up to date'
            });
          }
        } catch (error) {
          results.push({
            dependency: dep.name,
            error: error.message,
            updated: false
          });
        }
      }
      
      const updatedCount = results.filter(r => r.updated).length;
      const errorCount = results.filter(r => r.error).length;
      
      return {
        success: true,
        results,
        updated: updatedCount,
        errors: errorCount,
        total: results.length,
        message: `Updated ${updatedCount} of ${results.length} dependencies`
      };
    } catch (error) {
      throw new Error(`Failed to update dependencies: ${error.message}`);
    }
  }

  /**
   * Search for dependencies in Maven Central
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} - Search results
   */
  async searchDependencies(query, options = {}) {
    try {
      const limit = options.limit || 20;
      const searchParams = new URLSearchParams({
        q: query,
        rows: limit,
        wt: 'json'
      });
      
      const searchUrl = `${this.centralSearchUrl}?${searchParams.toString()}`;
      
      const response = await axios.get(searchUrl, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'AIX-Studio/1.0'
        }
      });
      
      const docs = response.data.response.docs;
      
      return docs.map(doc => ({
        groupId: doc.g,
        artifactId: doc.a,
        version: doc.latestVersion || doc.v,
        packaging: doc.p,
        description: doc.ec || 'No description available',
        timestamp: doc.timestamp,
        downloadUrl: `${this.mavenBaseUrl}/${doc.g.replace(/\./g, '/')}/${doc.a}/${doc.latestVersion || doc.v}/${doc.a}-${doc.latestVersion || doc.v}.jar`
      }));
    } catch (error) {
      throw new Error(`Failed to search dependencies: ${error.message}`);
    }
  }

  /**
   * Get dependency information from Maven Central
   * @param {string} groupId - Group ID
   * @param {string} artifactId - Artifact ID
   * @param {string} version - Version (optional)
   * @returns {Promise<Object>} - Dependency information
   */
  async getDependencyInfo(groupId, artifactId, version = null) {
    try {
      let searchQuery = `g:"${groupId}"+AND+a:"${artifactId}"`;
      if (version) {
        searchQuery += `+AND+v:"${version}"`;
      }
      
      const searchParams = new URLSearchParams({
        q: searchQuery,
        rows: '1',
        wt: 'json'
      });
      
      const searchUrl = `${this.centralSearchUrl}?${searchParams.toString()}`;
      
      const response = await axios.get(searchUrl, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'AIX-Studio/1.0'
        }
      });
      
      const docs = response.data.response.docs;
      if (docs.length === 0) {
        throw new Error(`Dependency not found: ${groupId}:${artifactId}${version ? `:${version}` : ''}`);
      }
      
      const doc = docs[0];
      const resolvedVersion = version || doc.latestVersion;
      
      return {
        groupId: doc.g,
        artifactId: doc.a,
        version: resolvedVersion,
        packaging: doc.p,
        description: doc.ec || doc.text || 'No description available',
        timestamp: doc.timestamp,
        downloadUrl: `${this.mavenBaseUrl}/${doc.g.replace(/\./g, '/')}/${doc.a}/${resolvedVersion}/${doc.a}-${resolvedVersion}.jar`,
        pomUrl: `${this.mavenBaseUrl}/${doc.g.replace(/\./g, '/')}/${doc.a}/${resolvedVersion}/${doc.a}-${resolvedVersion}.pom`,
        sourcesUrl: `${this.mavenBaseUrl}/${doc.g.replace(/\./g, '/')}/${doc.a}/${resolvedVersion}/${doc.a}-${resolvedVersion}-sources.jar`,
        javadocUrl: `${this.mavenBaseUrl}/${doc.g.replace(/\./g, '/')}/${doc.a}/${resolvedVersion}/${doc.a}-${resolvedVersion}-javadoc.jar`
      };
    } catch (error) {
      throw new Error(`Failed to get dependency info: ${error.message}`);
    }
  }

  /**
   * Get dependency tree (including transitive dependencies)
   * @param {string} groupId - Group ID
   * @param {string} artifactId - Artifact ID
   * @param {string} version - Version
   * @returns {Promise<Array>} - Dependency tree
   */
  async getDependencyTree(groupId, artifactId, version) {
    try {
      // Download POM file
      const pomUrl = `${this.mavenBaseUrl}/${groupId.replace(/\./g, '/')}/${artifactId}/${version}/${artifactId}-${version}.pom`;
      
      const response = await axios.get(pomUrl, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'AIX-Studio/1.0'
        }
      });
      
      const pomContent = response.data;
      
      // Extract dependencies from POM (simplified parsing)
      const dependencies = [];
      const depRegex = /<dependency>\s*<groupId>([^<]+)<\/groupId>\s*<artifactId>([^<]+)<\/artifactId>\s*(?:<version>([^<]+)<\/version>)?/g;
      let match;
      
      while ((match = depRegex.exec(pomContent)) !== null) {
        dependencies.push({
          groupId: match[1],
          artifactId: match[2],
          version: match[3] || 'latest',
          scope: 'compile' // Default scope
        });
      }
      
      return dependencies;
    } catch (error) {
      throw new Error(`Failed to get dependency tree: ${error.message}`);
    }
  }

  /**
   * Download dependency with all transitive dependencies
   * @param {string} projectPath - Project directory path
   * @param {string} dependency - Dependency specification
   * @param {Object} options - Download options
   * @returns {Promise<Object>} - Download result
   */
  async downloadWithTransitives(projectPath, dependency, options = {}) {
    try {
      const depInfo = this.parseDependencySpec(dependency);
      
      // Resolve dependency information
      const resolvedDep = await this.resolveDependency(depInfo);
      
      // Get dependency tree
      const dependencies = await this.getDependencyTree(
        resolvedDep.groupId, 
        resolvedDep.artifactId, 
        resolvedDep.version
      );
      
      // Add main dependency
      dependencies.unshift({
        groupId: resolvedDep.groupId,
        artifactId: resolvedDep.artifactId,
        version: resolvedDep.version
      });
      
      // Download all dependencies
      const results = [];
      for (const dep of dependencies) {
        try {
          const result = await this.addDependency(projectPath, 
            `${dep.groupId}:${dep.artifactId}:${dep.version}`, 
            options
          );
          results.push({ ...dep, ...result, success: true });
        } catch (error) {
          results.push({ ...dep, success: false, error: error.message });
        }
      }
      
      const successful = results.filter(r => r.success).length;
      
      return {
        success: true,
        mainDependency: resolvedDep,
        dependencies: results,
        successful,
        total: results.length,
        message: `Downloaded ${successful} of ${results.length} dependencies`
      };
    } catch (error) {
      throw new Error(`Failed to download with transitives: ${error.message}`);
    }
  }

  /**
   * Validate project dependencies
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Validation result
   */
  async validateDependencies(projectPath) {
    const errors = [];
    const warnings = [];
    
    try {
      const dependencies = await this.listDependencies(projectPath);
      
      for (const dep of dependencies) {
        try {
          // Check if dependency file exists
          const depPath = path.join(projectPath, dep.path);
          if (!await fs.pathExists(depPath)) {
            errors.push(`Dependency file not found: ${dep.name}`);
            continue;
          }
          
          // Check file size
          const stats = await fs.stat(depPath);
          if (stats.size === 0) {
            errors.push(`Dependency file is empty: ${dep.name}`);
          } else if (stats.size > 100 * 1024 * 1024) { // 100MB
            warnings.push(`Dependency file is very large: ${dep.name} (${this.formatFileSize(stats.size)})`);
          }
          
          // Check for version conflicts
          const versionConflicts = dependencies.filter(d => 
            d.artifactId === dep.artifactId && d.version !== dep.version
          );
          
          if (versionConflicts.length > 0) {
            warnings.push(`Version conflict detected for ${dep.artifactId}: ${dep.version} vs ${versionConflicts[0].version}`);
          }
          
        } catch (error) {
          errors.push(`Failed to validate dependency ${dep.name}: ${error.message}`);
        }
      }
      
    } catch (error) {
      errors.push(`Dependency validation failed: ${error.message}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Format file size
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Clean dependency cache
   * @returns {Promise<Object>} - Clean result
   */
  async cleanCache() {
    try {
      if (await fs.pathExists(this.cacheDir)) {
        const files = await fs.readdir(this.cacheDir);
        const cacheFiles = files.filter(file => file.length === 64); // SHA-256 hashes
        
        let totalSize = 0;
        for (const file of cacheFiles) {
          const filePath = path.join(this.cacheDir, file);
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
          await fs.remove(filePath);
        }
        
        return {
          success: true,
          cleaned: cacheFiles.length,
          size: totalSize,
          sizeFormatted: this.formatFileSize(totalSize),
          message: `Cleaned ${cacheFiles.length} cached dependencies`
        };
      }
      
      return {
        success: true,
        cleaned: 0,
        size: 0,
        message: 'Cache directory does not exist'
      };
    } catch (error) {
      throw new Error(`Failed to clean cache: ${error.message}`);
    }
  }

  /**
   * Get dependency statistics
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Dependency statistics
   */
  async getDependencyStats(projectPath) {
    try {
      const dependencies = await this.listDependencies(projectPath);
      
      let totalSize = 0;
      const versions = {};
      
      for (const dep of dependencies) {
        try {
          const depPath = path.join(projectPath, dep.path);
          if (await fs.pathExists(depPath)) {
            const stats = await fs.stat(depPath);
            totalSize += stats.size;
            
            if (!versions[dep.artifactId]) {
              versions[dep.artifactId] = [];
            }
            versions[dep.artifactId].push(dep.version);
          }
        } catch (error) {
          // Continue with other dependencies
        }
      }
      
      return {
        total: dependencies.length,
        size: totalSize,
        sizeFormatted: this.formatFileSize(totalSize),
        uniqueArtifacts: Object.keys(versions).length,
        versionConflicts: Object.values(versions).filter(v => v.length > 1).length,
        averageSize: dependencies.length > 0 ? totalSize / dependencies.length : 0,
        averageSizeFormatted: this.formatFileSize(dependencies.length > 0 ? totalSize / dependencies.length : 0)
      };
    } catch (error) {
      throw new Error(`Failed to get dependency stats: ${error.message}`);
    }
  }

  /**
   * Export dependencies to file
   * @param {string} projectPath - Project directory path
   * @param {string} exportPath - Export file path
   * @returns {Promise<Object>} - Export result
   */
  async exportDependencies(projectPath, exportPath) {
    try {
      const dependencies = await this.listDependencies(projectPath);
      
      // Create export data
      const exportData = {
        project: path.basename(projectPath),
        exported: new Date().toISOString(),
        dependencies: dependencies.map(dep => ({
          groupId: dep.groupId,
          artifactId: dep.artifactId,
          version: dep.version,
          name: dep.name
        }))
      };
      
      // Write to file
      await fs.writeJson(exportPath, exportData, { spaces: 2 });
      
      return {
        success: true,
        path: exportPath,
        dependencies: dependencies.length,
        message: `Exported ${dependencies.length} dependencies to ${exportPath}`
      };
    } catch (error) {
      throw new Error(`Failed to export dependencies: ${error.message}`);
    }
  }

  /**
   * Import dependencies from file
   * @param {string} projectPath - Project directory path
   * @param {string} importPath - Import file path
   * @param {Object} options - Import options
   * @returns {Promise<Object>} - Import result
   */
  async importDependencies(projectPath, importPath, options = {}) {
    try {
      // Read import file
      const importData = await fs.readJson(importPath);
      
      if (!importData.dependencies || !Array.isArray(importData.dependencies)) {
        throw new Error('Invalid import file format');
      }
      
      // Import dependencies
      const results = [];
      for (const dep of importData.dependencies) {
        try {
          const depSpec = `${dep.groupId}:${dep.artifactId}:${dep.version}`;
          const result = await this.addDependency(projectPath, depSpec, options);
          results.push({ ...dep, success: true, result });
        } catch (error) {
          results.push({ ...dep, success: false, error: error.message });
        }
      }
      
      const successful = results.filter(r => r.success).length;
      
      return {
        success: true,
        imported: successful,
        total: results.length,
        results,
        message: `Imported ${successful} of ${results.length} dependencies`
      };
    } catch (error) {
      throw new Error(`Failed to import dependencies: ${error.message}`);
    }
  }

  /**
   * Create dependency lock file
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Lock file result
   */
  async createLockFile(projectPath) {
    try {
      const dependencies = await this.listDependencies(projectPath);
      const lockFile = path.join(projectPath, 'aix-dependencies.lock');
      
      // Create lock file content
      const lockContent = {
        generated: new Date().toISOString(),
        project: path.basename(projectPath),
        dependencies: dependencies.map(dep => ({
          name: dep.name,
          groupId: dep.groupId,
          artifactId: dep.artifactId,
          version: dep.version,
          checksum: dep.checksum || 'unknown'
        }))
      };
      
      await fs.writeJson(lockFile, lockContent, { spaces: 2 });
      
      return {
        success: true,
        path: lockFile,
        dependencies: dependencies.length,
        message: `Created lock file with ${dependencies.length} dependencies`
      };
    } catch (error) {
      throw new Error(`Failed to create lock file: ${error.message}`);
    }
  }

  /**
   * Check for dependency updates
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Update check result
   */
  async checkForUpdates(projectPath) {
    try {
      const dependencies = await this.listDependencies(projectPath);
      const updates = [];
      
      for (const dep of dependencies) {
        try {
          const latestInfo = await this.getDependencyInfo(
            dep.groupId, 
            dep.artifactId, 
            'latest'
          );
          
          if (latestInfo.version !== dep.version) {
            updates.push({
              name: dep.name,
              current: dep.version,
              latest: latestInfo.version,
              updateAvailable: true,
              groupId: dep.groupId,
              artifactId: dep.artifactId
            });
          }
        } catch (error) {
          // Continue checking other dependencies
        }
      }
      
      return {
        success: true,
        updates,
        available: updates.length,
        total: dependencies.length,
        message: `Found ${updates.length} updates available`
      };
    } catch (error) {
      throw new Error(`Failed to check for updates: ${error.message}`);
    }
  }
}

module.exports = DependencyUtils;