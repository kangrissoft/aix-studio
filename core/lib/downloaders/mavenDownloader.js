const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const EventEmitter = require('events');

/**
 * Maven Central Downloader for AIX Studio
 * Downloads libraries from Maven Central Repository
 */
class MavenDownloader extends EventEmitter {
  constructor(options = {}) {
    super();
    this.baseUrl = options.baseUrl || 'https://search.maven.org';
    this.repoUrl = options.repoUrl || 'https://repo1.maven.org/maven2';
    this.timeout = options.timeout || 30000;
    this.retries = options.retries || 3;
    this.userAgent = options.userAgent || 'AIX-Studio/1.0';
    this.verbose = options.verbose || false;
  }

  /**
   * Search for Maven artifacts
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} - Search results
   */
  async search(query, options = {}) {
    try {
      const params = new URLSearchParams({
        q: query,
        rows: options.limit || 20,
        wt: 'json'
      });
      
      const url = `${this.baseUrl}/solrsearch/select?${params.toString()}`;
      
      this.emit('search-start', { query, url });
      
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: {
          'User-Agent': this.userAgent
        }
      });
      
      const docs = response.data.response.docs;
      const results = docs.map(doc => ({
        groupId: doc.g,
        artifactId: doc.a,
        version: doc.latestVersion || doc.v,
        packaging: doc.p,
        description: doc.ec || doc.text || 'No description available',
        timestamp: doc.timestamp,
        downloadUrl: `${this.repoUrl}/${doc.g.replace(/\./g, '/')}/${doc.a}/${doc.latestVersion || doc.v}/${doc.a}-${doc.latestVersion || doc.v}.jar`
      }));
      
      this.emit('search-complete', { query, count: results.length });
      
      return results;
    } catch (error) {
      this.emit('search-error', { query, error: error.message });
      throw new Error(`Maven search failed: ${error.message}`);
    }
  }

  /**
   * Get artifact details
   * @param {string} groupId - Group ID
   * @param {string} artifactId - Artifact ID
   * @param {string} version - Version (optional)
   * @returns {Promise<Object>} - Artifact details
   */
  async getArtifactDetails(groupId, artifactId, version = null) {
    try {
      let url;
      if (version) {
        url = `${this.baseUrl}/solrsearch/select?q=g:${groupId}+AND+a:${artifactId}+AND+v:${version}&rows=1&wt=json`;
      } else {
        url = `${this.baseUrl}/solrsearch/select?q=g:${groupId}+AND+a:${artifactId}&rows=1&wt=json`;
      }
      
      this.emit('artifact-details-start', { groupId, artifactId, version });
      
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: {
          'User-Agent': this.userAgent
        }
      });
      
      const docs = response.data.response.docs;
      if (docs.length === 0) {
        throw new Error(`Artifact not found: ${groupId}:${artifactId}${version ? `:${version}` : ''}`);
      }
      
      const doc = docs[0];
      const latestVersion = version || doc.latestVersion;
      
      const details = {
        groupId: doc.g,
        artifactId: doc.a,
        version: latestVersion,
        packaging: doc.p,
        description: doc.ec || doc.text || 'No description available',
        timestamp: doc.timestamp,
        downloadUrl: `${this.repoUrl}/${doc.g.replace(/\./g, '/')}/${doc.a}/${latestVersion}/${doc.a}-${latestVersion}.jar`,
        pomUrl: `${this.repoUrl}/${doc.g.replace(/\./g, '/')}/${doc.a}/${latestVersion}/${doc.a}-${latestVersion}.pom`,
        sourcesUrl: `${this.repoUrl}/${doc.g.replace(/\./g, '/')}/${doc.a}/${latestVersion}/${doc.a}-${latestVersion}-sources.jar`,
        javadocUrl: `${this.repoUrl}/${doc.g.replace(/\./g, '/')}/${doc.a}/${latestVersion}/${doc.a}-${latestVersion}-javadoc.jar`
      };
      
      this.emit('artifact-details-complete', details);
      
      return details;
    } catch (error) {
      this.emit('artifact-details-error', { groupId, artifactId, version, error: error.message });
      throw new Error(`Failed to get artifact details: ${error.message}`);
    }
  }

  /**
   * Download Maven artifact
   * @param {string} groupId - Group ID
   * @param {string} artifactId - Artifact ID
   * @param {string} version - Version
   * @param {string} destination - Destination path
   * @param {Object} options - Download options
   * @returns {Promise<Object>} - Download result
   */
  async downloadArtifact(groupId, artifactId, version, destination, options = {}) {
    const startTime = Date.now();
    
    try {
      // Ensure destination directory exists
      await fs.ensureDir(path.dirname(destination));
      
      // Get artifact details
      const artifact = await this.getArtifactDetails(groupId, artifactId, version);
      
      this.emit('download-start', { 
        groupId, 
        artifactId, 
        version, 
        destination,
        url: artifact.downloadUrl
      });
      
      // Download with retries
      const result = await this.downloadWithRetries(artifact.downloadUrl, destination, options);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.emit('download-complete', { 
        groupId, 
        artifactId, 
        version, 
        destination,
        size: result.size,
        duration
      });
      
      return {
        success: true,
        groupId,
        artifactId,
        version,
        destination,
        size: result.size,
        duration,
        checksum: result.checksum,
        message: 'Artifact downloaded successfully'
      };
    } catch (error) {
      this.emit('download-error', { 
        groupId, 
        artifactId, 
        version, 
        destination,
        error: error.message 
      });
      
      throw new Error(`Failed to download Maven artifact ${groupId}:${artifactId}:${version}: ${error.message}`);
    }
  }

  /**
   * Download with retry logic
   * @param {string} url - Download URL
   * @param {string} destination - Destination path
   * @param {Object} options - Download options
   * @returns {Promise<Object>} - Download result
   */
  async downloadWithRetries(url, destination, options = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        this.emit('retry', { attempt, url });
        
        const result = await this.performDownload(url, destination, options);
        return result;
      } catch (error) {
        lastError = error;
        this.emit('retry-failed', { attempt, url, error: error.message });
        
        if (attempt < this.retries) {
          // Wait before retry
          await this.delay(1000 * attempt);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Perform actual download
   * @param {string} url - Download URL
   * @param {string} destination - Destination path
   * @param {Object} options - Download options
   * @returns {Promise<Object>} - Download result
   */
  async performDownload(url, destination, options = {}) {
    const writer = fs.createWriteStream(destination);
    
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: this.timeout,
      headers: {
        'User-Agent': this.userAgent,
        ...options.headers
      },
      onDownloadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          this.emit('progress', { 
            url, 
            loaded: progressEvent.loaded, 
            total: progressEvent.total, 
            percent 
          });
        }
      }
    });
    
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', async () => {
        try {
          const stats = await fs.stat(destination);
          const checksum = await this.calculateChecksum(destination);
          
          resolve({
            size: stats.size,
            checksum: checksum
          });
        } catch (error) {
          reject(error);
        }
      });
      
      writer.on('error', (error) => {
        // Clean up partial file
        fs.unlink(destination).catch(() => {});
        reject(error);
      });
    });
  }

  /**
   * Calculate file checksum
   * @param {string} filePath - File path
   * @returns {Promise<string>} - SHA-256 checksum
   */
  async calculateChecksum(filePath) {
    const crypto = require('crypto');
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (error) => reject(error));
    });
  }

  /**
   * Resolve latest version
   * @param {string} groupId - Group ID
   * @param {string} artifactId - Artifact ID
   * @returns {Promise<string>} - Latest version
   */
  async resolveLatestVersion(groupId, artifactId) {
    try {
      const url = `${this.baseUrl}/solrsearch/select?q=g:${groupId}+AND+a:${artifactId}&rows=1&wt=json`;
      
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: {
          'User-Agent': this.userAgent
        }
      });
      
      const docs = response.data.response.docs;
      if (docs.length === 0) {
        throw new Error(`Artifact not found: ${groupId}:${artifactId}`);
      }
      
      return docs[0].latestVersion;
    } catch (error) {
      throw new Error(`Failed to resolve latest version: ${error.message}`);
    }
  }

  /**
   * Get artifact dependencies from POM
   * @param {string} groupId - Group ID
   * @param {string} artifactId - Artifact ID
   * @param {string} version - Version
   * @returns {Promise<Array>} - Dependencies
   */
  async getDependencies(groupId, artifactId, version) {
    try {
      const pomUrl = `${this.repoUrl}/${groupId.replace(/\./g, '/')}/${artifactId}/${version}/${artifactId}-${version}.pom`;
      
      this.emit('pom-download-start', { groupId, artifactId, version, url: pomUrl });
      
      const response = await axios.get(pomUrl, {
        timeout: this.timeout,
        headers: {
          'User-Agent': this.userAgent
        }
      });
      
      // Simple XML parsing for dependencies (in a real implementation, use proper XML parser)
      const pomContent = response.data;
      const dependencies = [];
      
      // Extract dependencies using regex (simplified)
      const depRegex = /<dependency>\s*<groupId>([^<]+)<\/groupId>\s*<artifactId>([^<]+)<\/artifactId>\s*(?:<version>([^<]+)<\/version>)?/g;
      let match;
      
      while ((match = depRegex.exec(pomContent)) !== null) {
        dependencies.push({
          groupId: match[1],
          artifactId: match[2],
          version: match[3] || 'latest'
        });
      }
      
      this.emit('pom-download-complete', { groupId, artifactId, version, count: dependencies.length });
      
      return dependencies;
    } catch (error) {
      this.emit('pom-download-error', { groupId, artifactId, version, error: error.message });
      throw new Error(`Failed to get dependencies: ${error.message}`);
    }
  }

  /**
   * Download artifact with dependencies
   * @param {string} groupId - Group ID
   * @param {string} artifactId - Artifact ID
   * @param {string} version - Version
   * @param {string} libsDir - Libraries directory
   * @param {Object} options - Download options
   * @returns {Promise<Object>} - Download result with dependencies
   */
  async downloadWithDependencies(groupId, artifactId, version, libsDir, options = {}) {
    try {
      // Download main artifact
      const mainArtifactPath = path.join(libsDir, `${artifactId}-${version}.jar`);
      const mainResult = await this.downloadArtifact(groupId, artifactId, version, mainArtifactPath, options);
      
      // Get dependencies
      const dependencies = await this.getDependencies(groupId, artifactId, version);
      
      // Download dependencies
      const depResults = [];
      for (const dep of dependencies) {
        try {
          const depVersion = dep.version === 'latest' 
            ? await this.resolveLatestVersion(dep.groupId, dep.artifactId)
            : dep.version;
            
          const depPath = path.join(libsDir, `${dep.artifactId}-${depVersion}.jar`);
          const depResult = await this.downloadArtifact(dep.groupId, dep.artifactId, depVersion, depPath, options);
          depResults.push(depResult);
        } catch (error) {
          depResults.push({
            success: false,
            groupId: dep.groupId,
            artifactId: dep.artifactId,
            version: dep.version,
            error: error.message
          });
        }
      }
      
      return {
        success: true,
        main: mainResult,
        dependencies: depResults,
        message: 'Artifact and dependencies downloaded successfully'
      };
    } catch (error) {
      throw new Error(`Failed to download artifact with dependencies: ${error.message}`);
    }
  }

  /**
   * List popular libraries
   * @returns {Array} - Popular libraries
   */
  listPopularLibraries() {
    return [
      {
        name: 'Google Gson',
        groupId: 'com.google.code.gson',
        artifactId: 'gson',
        description: 'JSON library for Java'
      },
      {
        name: 'Apache Commons Lang',
        groupId: 'org.apache.commons',
        artifactId: 'commons-lang3',
        description: 'Provides highly reusable static utility methods'
      },
      {
        name: 'Retrofit',
        groupId: 'com.squareup.retrofit2',
        artifactId: 'retrofit',
        description: 'Type-safe HTTP client for Android and Java'
      },
      {
        name: 'OkHttp',
        groupId: 'com.squareup.okhttp3',
        artifactId: 'okhttp',
        description: 'HTTP client for Android and Java'
      },
      {
        name: 'JUnit',
        groupId: 'junit',
        artifactId: 'junit',
        description: 'Unit testing framework for Java'
      },
      {
        name: 'Mockito',
        groupId: 'org.mockito',
        artifactId: 'mockito-core',
        description: 'Mocking framework for unit tests'
      }
    ];
  }

  /**
   * Delay function for retries
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = MavenDownloader;