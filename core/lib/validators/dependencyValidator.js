const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

/**
 * Dependency Validator for AIX Studio
 * Validates project dependencies, checks for conflicts, and ensures compatibility
 */
class DependencyValidator {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.strict = options.strict !== false;
    this.checksumAlgorithm = options.checksumAlgorithm || 'sha256';
  }

  /**
   * Validate project dependencies
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Dependency validation result
   */
  async validate(projectPath) {
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      dependencies: {},
      conflicts: {},
      compatibility: {},
      security: {}
    };

    try {
      // Validate dependencies structure
      validation.dependencies = await this.validateDependencies(projectPath);
      
      // Check for conflicts
      validation.conflicts = await this.checkConflicts(projectPath);
      
      // Check compatibility
      validation.compatibility = await this.checkCompatibility(projectPath);
      
      // Check security vulnerabilities
      validation.security = await this.checkSecurity(projectPath);
      
      // Aggregate results
      const allResults = [
        validation.dependencies,
        validation.conflicts,
        validation.compatibility,
        validation.security
      ];
      
      for (const result of allResults) {
        if (result.errors) {
          validation.errors.push(...result.errors);
        }
        if (result.warnings) {
          validation.warnings.push(...result.warnings);
        }
      }
      
      validation.valid = validation.errors.length === 0;
      
    } catch (error) {
      validation.valid = false;
      validation.errors.push(`Dependency validation failed: ${error.message}`);
    }

    return validation;
  }

  /**
   * Validate dependencies structure and integrity
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Dependencies validation result
   */
  async validateDependencies(projectPath) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      jarFiles: 0,
      totalSize: 0,
      hasRequiredDeps: false,
      missingDeps: []
    };

    try {
      const libsDir = path.join(projectPath, 'libs');
      if (!await fs.pathExists(libsDir)) {
        result.warnings.push('No libs/ directory found');
        return result;
      }

      const libFiles = await fs.readdir(libsDir);
      const jarFiles = libFiles.filter(file => file.endsWith('.jar'));
      
      result.jarFiles = jarFiles.length;
      result.totalSize = await this.calculateTotalSize(libsDir, jarFiles);

      if (jarFiles.length === 0) {
        result.warnings.push('No JAR files found in libs/ directory');
      }

      // Check for required dependencies
      const requiredDeps = [
        { name: 'appinventor-components.jar', description: 'App Inventor components library' },
        { name: 'android.jar', description: 'Android SDK library' }
      ];
      
      const missingDeps = [];
      for (const dep of requiredDeps) {
        if (!jarFiles.includes(dep.name)) {
          missingDeps.push(dep);
          result.errors.push(`Missing required dependency: ${dep.name} (${dep.description})`);
          result.valid = false;
        }
      }
      
      result.missingDeps = missingDeps;
      result.hasRequiredDeps = missingDeps.length === 0;

      // Validate individual JAR files
      for (const jarFile of jarFiles) {
        const jarPath = path.join(libsDir, jarFile);
        const jarValidation = await this.validateJarFile(jarPath);
        result.errors.push(...jarValidation.errors);
        result.warnings.push(...jarValidation.warnings);
      }

      // Check for duplicate dependencies
      const duplicates = await this.findDuplicates(libsDir, jarFiles);
      if (duplicates.length > 0) {
        result.warnings.push(`Found ${duplicates.length} duplicate dependencies`);
        duplicates.forEach(dup => {
          result.warnings.push(`Duplicate: ${dup.name} (${dup.versions.join(', ')})`);
        });
      }

    } catch (error) {
      result.errors.push(`Dependencies validation failed: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Calculate total size of JAR files
   * @param {string} libsDir - Libraries directory path
   * @param {Array} jarFiles - JAR file names
   * @returns {Promise<number>} - Total size in bytes
   */
  async calculateTotalSize(libsDir, jarFiles) {
    let totalSize = 0;
    
    for (const jarFile of jarFiles) {
      try {
        const jarPath = path.join(libsDir, jarFile);
        const stats = await fs.stat(jarPath);
        totalSize += stats.size;
      } catch (error) {
        // Continue with other files
      }
    }
    
    return totalSize;
  }

  /**
   * Validate individual JAR file
   * @param {string} jarPath - JAR file path
   * @returns {Promise<Object>} - JAR validation result
   */
  async validateJarFile(jarPath) {
    const result = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      const fileName = path.basename(jarPath);
      const stats = await fs.stat(jarPath);

      // Check if file exists and is readable
      await fs.access(jarPath, fs.constants.R_OK);

      // Check file size
      if (stats.size === 0) {
        result.errors.push(`JAR file is empty: ${fileName}`);
        result.valid = false;
      } else if (stats.size > 100 * 1024 * 1024) { // 100MB
        result.warnings.push(`JAR file is very large (${this.formatFileSize(stats.size)}): ${fileName}`);
      }

      // Check file extension
      if (!fileName.endsWith('.jar')) {
        result.warnings.push(`File may not be a JAR: ${fileName}`);
      }

      // Check for version in filename
      if (!this.hasVersionInName(fileName) && !fileName.includes('android.jar')) {
        result.warnings.push(`JAR file name should include version: ${fileName}`);
      }

      // Validate checksum
      const checksumValidation = await this.validateChecksum(jarPath);
      result.warnings.push(...checksumValidation.warnings);

    } catch (error) {
      result.errors.push(`Cannot access JAR file ${path.basename(jarPath)}: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Check if filename contains version information
   * @param {string} fileName - File name
   * @returns {boolean} - True if version found
   */
  hasVersionInName(fileName) {
    return /\d+\.\d+\.\d+/.test(fileName) || 
           /\d+\.\d+/.test(fileName) || 
           /v\d+/.test(fileName);
  }

  /**
   * Validate file checksum
   * @param {string} filePath - File path
   * @returns {Promise<Object>} - Checksum validation result
   */
  async validateChecksum(filePath) {
    const result = {
      warnings: []
    };

    try {
      // Generate checksum
      const checksum = await this.calculateChecksum(filePath);
      
      // Check if checksum file exists
      const checksumFile = `${filePath}.sha256`;
      if (await fs.pathExists(checksumFile)) {
        const expectedChecksum = await fs.readFile(checksumFile, 'utf8');
        if (expectedChecksum.trim() !== checksum) {
          result.warnings.push(`Checksum mismatch for ${path.basename(filePath)}`);
        }
      }

    } catch (error) {
      result.warnings.push(`Checksum validation failed for ${path.basename(filePath)}: ${error.message}`);
    }

    return result;
  }

  /**
   * Calculate file checksum
   * @param {string} filePath - File path
   * @returns {Promise<string>} - File checksum
   */
  async calculateChecksum(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash(this.checksumAlgorithm);
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (error) => reject(error));
    });
  }

  /**
   * Find duplicate dependencies
   * @param {string} libsDir - Libraries directory path
   * @param {Array} jarFiles - JAR file names
   * @returns {Promise<Array>} - Duplicate dependencies
   */
  async findDuplicates(libsDir, jarFiles) {
    const dependencies = {};
    
    // Group files by artifact name
    for (const jarFile of jarFiles) {
      const artifactName = this.extractArtifactName(jarFile);
      const version = this.extractVersion(jarFile);
      
      if (!dependencies[artifactName]) {
        dependencies[artifactName] = [];
      }
      
      dependencies[artifactName].push({
        name: jarFile,
        version: version,
        path: path.join(libsDir, jarFile)
      });
    }
    
    // Find duplicates
    const duplicates = [];
    for (const [artifactName, versions] of Object.entries(dependencies)) {
      if (versions.length > 1) {
        duplicates.push({
          name: artifactName,
          versions: versions.map(v => v.version),
          files: versions.map(v => v.name)
        });
      }
    }
    
    return duplicates;
  }

  /**
   * Extract artifact name from JAR file name
   * @param {string} fileName - JAR file name
   * @returns {string} - Artifact name
   */
  extractArtifactName(fileName) {
    return fileName.replace(/-\d+\.\d+\.\d+.*\.jar$/, '')
                  .replace(/-\d+\.\d+.*\.jar$/, '')
                  .replace(/-v\d+.*\.jar$/, '');
  }

  /**
   * Extract version from JAR file name
   * @param {string} fileName - JAR file name
   * @returns {string} - Version string
   */
  extractVersion(fileName) {
    const versionRegex = /(\d+\.\d+\.\d+(?:[-.][\w.-]+)?)/;
    const match = fileName.match(versionRegex);
    return match ? match[1] : 'unknown';
  }

  /**
   * Check for dependency conflicts
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Conflict check result
   */
  async checkConflicts(projectPath) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      conflicts: []
    };

    try {
      const libsDir = path.join(projectPath, 'libs');
      if (!await fs.pathExists(libsDir)) {
        return result;
      }

      const libFiles = await fs.readdir(libsDir);
      const jarFiles = libFiles.filter(file => file.endsWith('.jar'));

      // Check for version conflicts
      const versionConflicts = await this.checkVersionConflicts(libsDir, jarFiles);
      result.conflicts.push(...versionConflicts);
      result.warnings.push(...versionConflicts.map(c => 
        `Version conflict: ${c.artifact} (${c.versions.join(', ')})`
      ));

      // Check for incompatible dependencies
      const incompatibilities = await this.checkIncompatibilities(libsDir, jarFiles);
      result.conflicts.push(...incompatibilities);
      result.warnings.push(...incompatibilities.map(c => 
        `Incompatible dependency: ${c.dependency} conflicts with ${c.conflictsWith}`
      ));

      // Check for circular dependencies (simplified)
      const circularDeps = await this.checkCircularDependencies(projectPath);
      if (circularDeps.length > 0) {
        result.errors.push(...circularDeps.map(c => 
          `Circular dependency detected: ${c.join(' -> ')}`
        ));
        result.valid = false;
      }

    } catch (error) {
      result.errors.push(`Conflict checking failed: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Check for version conflicts
   * @param {string} libsDir - Libraries directory path
   * @param {Array} jarFiles - JAR file names
   * @returns {Promise<Array>} - Version conflicts
   */
  async checkVersionConflicts(libsDir, jarFiles) {
    const conflicts = [];
    const artifactVersions = {};

    // Group by artifact name
    for (const jarFile of jarFiles) {
      const artifactName = this.extractArtifactName(jarFile);
      const version = this.extractVersion(jarFile);
      
      if (!artifactVersions[artifactName]) {
        artifactVersions[artifactName] = [];
      }
      
      artifactVersions[artifactName].push({
        version: version,
        file: jarFile
      });
    }

    // Find conflicts
    for (const [artifactName, versions] of Object.entries(artifactVersions)) {
      if (versions.length > 1) {
        const uniqueVersions = [...new Set(versions.map(v => v.version))];
        if (uniqueVersions.length > 1) {
          conflicts.push({
            artifact: artifactName,
            versions: uniqueVersions,
            files: versions.map(v => v.file)
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Check for incompatible dependencies
   * @param {string} libsDir - Libraries directory path
   * @param {Array} jarFiles - JAR file names
   * @returns {Promise<Array>} - Incompatibility issues
   */
  async checkIncompatibilities(libsDir, jarFiles) {
    const incompatibilities = [];

    // Define known incompatibilities
    const knownIncompatibilities = {
      'gson': ['json-simple'],
      'retrofit': ['volley'],
      'okhttp': ['httpclient']
    };

    const artifactNames = jarFiles.map(file => this.extractArtifactName(file));

    for (const [artifact, incompatibleList] of Object.entries(knownIncompatibilities)) {
      if (artifactNames.includes(artifact)) {
        const conflicts = incompatibleList.filter(incompatible => 
          artifactNames.includes(incompatible)
        );
        
        if (conflicts.length > 0) {
          incompatibilities.push({
            dependency: artifact,
            conflictsWith: conflicts
          });
        }
      }
    }

    return incompatibilities;
  }

  /**
   * Check for circular dependencies (simplified)
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Array>} - Circular dependencies
   */
  async checkCircularDependencies(projectPath) {
    // This is a simplified implementation
    // In a real-world scenario, this would analyze actual dependency trees
    return [];
  }

  /**
   * Check dependency compatibility
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Compatibility check result
   */
  async checkCompatibility(projectPath) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      compatibility: {
        java: null,
        android: null,
        appinventor: null
      }
    };

    try {
      const libsDir = path.join(projectPath, 'libs');
      if (!await fs.pathExists(libsDir)) {
        return result;
      }

      const libFiles = await fs.readdir(libsDir);
      const jarFiles = libFiles.filter(file => file.endsWith('.jar'));

      // Check Java compatibility
      const javaCompatibility = await this.checkJavaCompatibility(libsDir, jarFiles);
      result.compatibility.java = javaCompatibility;
      if (!javaCompatibility.compatible) {
        result.warnings.push(`Java compatibility issue: ${javaCompatibility.issue}`);
      }

      // Check Android compatibility
      const androidCompatibility = await this.checkAndroidCompatibility(libsDir, jarFiles);
      result.compatibility.android = androidCompatibility;
      if (!androidCompatibility.compatible) {
        result.warnings.push(`Android compatibility issue: ${androidCompatibility.issue}`);
      }

      // Check App Inventor compatibility
      const appinventorCompatibility = await this.checkAppInventorCompatibility(libsDir, jarFiles);
      result.compatibility.appinventor = appinventorCompatibility;
      if (!appinventorCompatibility.compatible) {
        result.errors.push(`App Inventor compatibility issue: ${appinventorCompatibility.issue}`);
        result.valid = false;
      }

    } catch (error) {
      result.errors.push(`Compatibility checking failed: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Check Java compatibility
   * @param {string} libsDir - Libraries directory path
   * @param {Array} jarFiles - JAR file names
   * @returns {Promise<Object>} - Java compatibility result
   */
  async checkJavaCompatibility(libsDir, jarFiles) {
    const result = {
      compatible: true,
      issue: null,
      javaVersion: null
    };

    try {
      // Check for Java 8 compiled libraries
      for (const jarFile of jarFiles) {
        if (jarFile.includes('java8') || jarFile.includes('jdk1.8')) {
          result.compatible = false;
          result.issue = `Library compiled for Java 8: ${jarFile}`;
          break;
        }
      }

      // Check build.xml for Java version
      const buildFile = path.join(libsDir, '..', 'build.xml');
      if (await fs.pathExists(buildFile)) {
        const buildContent = await fs.readFile(buildFile, 'utf8');
        if (buildContent.includes('source="11"') && buildContent.includes('target="11"')) {
          result.javaVersion = '11';
        } else if (buildContent.includes('source="8"') || buildContent.includes('source="1.8"')) {
          result.javaVersion = '8';
          result.compatible = false;
          result.issue = 'Using Java 8 instead of recommended Java 11';
        }
      }

    } catch (error) {
      result.compatible = false;
      result.issue = `Java compatibility check failed: ${error.message}`;
    }

    return result;
  }

  /**
   * Check Android compatibility
   * @param {string} libsDir - Libraries directory path
   * @param {Array} jarFiles - JAR file names
   * @returns {Promise<Object>} - Android compatibility result
   */
  async checkAndroidCompatibility(libsDir, jarFiles) {
    const result = {
      compatible: true,
      issue: null,
      sdkVersion: null
    };

    try {
      // Check for Android dependencies
      const androidDeps = jarFiles.filter(file => 
        file.includes('android') || file.includes('support') || file.includes('material')
      );

      if (androidDeps.length > 0) {
        // Check android.jar version if present
        const androidJar = jarFiles.find(file => file === 'android.jar');
        if (androidJar) {
          // In a real implementation, this would check the actual Android SDK version
          result.sdkVersion = 'detected';
        } else {
          result.compatible = false;
          result.issue = 'Android dependencies found but no android.jar';
        }
      }

      // Check for incompatible Android libraries
      const incompatibleAndroidLibs = [
        'android-support-v4',
        'android-support-v7-appcompat'
      ];

      const incompatibleFound = incompatibleAndroidLibs.filter(lib => 
        jarFiles.some(file => file.includes(lib))
      );

      if (incompatibleFound.length > 0) {
        result.compatible = false;
        result.issue = `Incompatible Android libraries: ${incompatibleFound.join(', ')}`;
      }

    } catch (error) {
      result.compatible = false;
      result.issue = `Android compatibility check failed: ${error.message}`;
    }

    return result;
  }

  /**
   * Check App Inventor compatibility
   * @param {string} libsDir - Libraries directory path
   * @param {Array} jarFiles - JAR file names
   * @returns {Promise<Object>} - App Inventor compatibility result
   */
  async checkAppInventorCompatibility(libsDir, jarFiles) {
    const result = {
      compatible: true,
      issue: null,
      version: null
    };

    try {
      // Check for required App Inventor components
      const appInventorJar = jarFiles.find(file => file === 'appinventor-components.jar');
      if (!appInventorJar) {
        result.compatible = false;
        result.issue = 'Missing appinventor-components.jar';
        return result;
      }

      // Check for compatible version
      const appInventorVersion = this.extractVersion(appInventorJar);
      result.version = appInventorVersion;

      // Check for conflicting App Inventor libraries
      const conflictingLibs = jarFiles.filter(file => 
        file.includes('appinventor') && file !== 'appinventor-components.jar'
      );

      if (conflictingLibs.length > 0) {
        result.compatible = false;
        result.issue = `Conflicting App Inventor libraries: ${conflictingLibs.join(', ')}`;
      }

      // Check for outdated App Inventor version
      if (appInventorVersion && appInventorVersion.startsWith('1.')) {
        result.compatible = false;
        result.issue = `Outdated App Inventor version: ${appInventorVersion} (use version 2.x or later)`;
      }

    } catch (error) {
      result.compatible = false;
      result.issue = `App Inventor compatibility check failed: ${error.message}`;
    }

    return result;
  }

  /**
   * Check for security vulnerabilities
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Security check result
   */
  async checkSecurity(projectPath) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      vulnerabilities: [],
      scanned: 0
    };

    try {
      const libsDir = path.join(projectPath, 'libs');
      if (!await fs.pathExists(libsDir)) {
        return result;
      }

      const libFiles = await fs.readdir(libsDir);
      const jarFiles = libFiles.filter(file => file.endsWith('.jar'));
      
      result.scanned = jarFiles.length;

      // Check for known vulnerable libraries
      const vulnerabilities = await this.scanForVulnerabilities(libsDir, jarFiles);
      result.vulnerabilities = vulnerabilities;
      
      if (vulnerabilities.length > 0) {
        result.warnings.push(`Found ${vulnerabilities.length} security vulnerabilities`);
        vulnerabilities.forEach(vuln => {
          result.warnings.push(`Vulnerability: ${vuln.library} ${vuln.version} - ${vuln.description}`);
        });
      }

      // Check for unsigned JARs
      const unsignedJars = await this.checkUnsignedJars(libsDir, jarFiles);
      if (unsignedJars.length > 0) {
        result.warnings.push(`Found ${unsignedJars.length} unsigned JAR files`);
        unsignedJars.forEach(jar => {
          result.warnings.push(`Unsigned JAR: ${jar}`);
        });
      }

      // Check for outdated libraries
      const outdatedLibs = await this.checkOutdatedLibraries(libsDir, jarFiles);
      if (outdatedLibs.length > 0) {
        result.warnings.push(`Found ${outdatedLibs.length} potentially outdated libraries`);
        outdatedLibs.forEach(lib => {
          result.warnings.push(`Outdated library: ${lib.name} ${lib.current} (latest: ${lib.latest})`);
        });
      }

    } catch (error) {
      result.errors.push(`Security checking failed: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Scan for known vulnerable libraries
   * @param {string} libsDir - Libraries directory path
   * @param {Array} jarFiles - JAR file names
   * @returns {Promise<Array>} - Vulnerabilities found
   */
  async scanForVulnerabilities(libsDir, jarFiles) {
    const vulnerabilities = [];
    
    // Known vulnerable libraries (simplified database)
    const vulnerableLibs = {
      'commons-collections': {
        versions: ['3.2.1', '3.2.0', '3.1'],
        description: 'Deserialization vulnerability'
      },
      'commons-beanutils': {
        versions: ['1.9.2', '1.9.1', '1.9.0'],
        description: 'Deserialization vulnerability'
      }
    };

    for (const jarFile of jarFiles) {
      const artifactName = this.extractArtifactName(jarFile);
      const version = this.extractVersion(jarFile);
      
      if (vulnerableLibs[artifactName]) {
        const vulnInfo = vulnerableLibs[artifactName];
        if (vulnInfo.versions.includes(version)) {
          vulnerabilities.push({
            library: artifactName,
            version: version,
            description: vulnInfo.description
          });
        }
      }
    }

    return vulnerabilities;
  }

  /**
   * Check for unsigned JAR files
   * @param {string} libsDir - Libraries directory path
   * @param {Array} jarFiles - JAR file names
   * @returns {Promise<Array>} - Unsigned JAR files
   */
  async checkUnsignedJars(libsDir, jarFiles) {
    const unsignedJars = [];

    for (const jarFile of jarFiles) {
      const jarPath = path.join(libsDir, jarFile);
      try {
        // Check if JAR has manifest with signature information
        const manifestPath = path.join(jarPath, 'META-INF', 'MANIFEST.MF');
        if (await fs.pathExists(manifestPath)) {
          const manifest = await fs.readFile(manifestPath, 'utf8');
          if (!manifest.includes('Signature-Version') && !manifest.includes('SHA1-Digest')) {
            unsignedJars.push(jarFile);
          }
        } else {
          unsignedJars.push(jarFile);
        }
      } catch (error) {
        // Assume unsigned if we can't read manifest
        unsignedJars.push(jarFile);
      }
    }

    return unsignedJars;
  }

  /**
   * Check for outdated libraries
   * @param {string} libsDir - Libraries directory path
   * @param {Array} jarFiles - JAR file names
   * @returns {Promise<Array>} - Outdated libraries
   */
  async checkOutdatedLibraries(libsDir, jarFiles) {
    const outdated = [];

    // This would typically connect to a service like Maven Central
    // For this example, we'll use a simplified approach
    const latestVersions = {
      'gson': '2.10.1',
      'commons-lang3': '3.12.0',
      'retrofit': '2.9.0',
      'okhttp': '4.10.0'
    };

    for (const jarFile of jarFiles) {
      const artifactName = this.extractArtifactName(jarFile);
      const currentVersion = this.extractVersion(jarFile);
      const latestVersion = latestVersions[artifactName];
      
      if (latestVersion && currentVersion !== latestVersion) {
        // Simple version comparison (simplified)
        if (this.isOlderVersion(currentVersion, latestVersion)) {
          outdated.push({
            name: artifactName,
            current: currentVersion,
            latest: latestVersion
          });
        }
      }
    }

    return outdated;
  }

  /**
   * Check if version is older than latest
   * @param {string} current - Current version
   * @param {string} latest - Latest version
   * @returns {boolean} - True if current is older
   */
  isOlderVersion(current, latest) {
    // Simplified version comparison
    // In a real implementation, this would be more sophisticated
    try {
      const currentParts = current.split(/[.-]/).map(part => 
        isNaN(part) ? part : parseInt(part)
      );
      const latestParts = latest.split(/[.-]/).map(part => 
        isNaN(part) ? part : parseInt(part)
      );
      
      for (let i = 0; i < Math.min(currentParts.length, latestParts.length); i++) {
        if (currentParts[i] < latestParts[i]) {
          return true;
        } else if (currentParts[i] > latestParts[i]) {
          return false;
        }
      }
      
      return currentParts.length < latestParts.length;
    } catch (error) {
      return false; // If we can't compare, assume it's not older
    }
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
   * Validate dependency licenses
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - License validation result
   */
  async validateLicenses(projectPath) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      licenses: []
    };

    try {
      const libsDir = path.join(projectPath, 'libs');
      if (!await fs.pathExists(libsDir)) {
        return result;
      }

      const libFiles = await fs.readdir(libsDir);
      const jarFiles = libFiles.filter(file => file.endsWith('.jar'));

      // Check for license files
      const licenseFiles = await this.findLicenseFiles(projectPath);
      if (licenseFiles.length === 0) {
        result.warnings.push('No license files found in project');
      }

      // Check for third-party licenses
      const thirdPartyLicenses = await this.checkThirdPartyLicenses(libsDir, jarFiles);
      result.licenses = thirdPartyLicenses;
      
      const missingLicenses = thirdPartyLicenses.filter(license => 
        !license.hasLicense || license.licenseType === 'unknown'
      );
      
      if (missingLicenses.length > 0) {
        result.warnings.push(`Missing licenses for ${missingLicenses.length} dependencies`);
      }

      // Check for restrictive licenses
      const restrictiveLicenses = thirdPartyLicenses.filter(license => 
        license.licenseType === 'gpl' || license.licenseType === 'agpl'
      );
      
      if (restrictiveLicenses.length > 0) {
        result.warnings.push(`Restrictive licenses found: ${restrictiveLicenses.length} dependencies`);
      }

    } catch (error) {
      result.errors.push(`License validation failed: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Find license files in project
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Array>} - License file paths
   */
  async findLicenseFiles(projectPath) {
    const licenseNames = [
      'LICENSE', 'LICENSE.txt', 'LICENSE.md',
      'COPYING', 'COPYING.txt',
      'NOTICE', 'NOTICE.txt'
    ];
    
    const found = [];
    
    for (const licenseName of licenseNames) {
      const licensePath = path.join(projectPath, licenseName);
      if (await fs.pathExists(licensePath)) {
        found.push(licensePath);
      }
    }
    
    return found;
  }

  /**
   * Check third-party licenses
   * @param {string} libsDir - Libraries directory path
   * @param {Array} jarFiles - JAR file names
   * @returns {Promise<Array>} - License information
   */
  async checkThirdPartyLicenses(libsDir, jarFiles) {
    const licenses = [];

    for (const jarFile of jarFiles) {
      const jarPath = path.join(libsDir, jarFile);
      const licenseInfo = await this.extractLicenseInfo(jarPath);
      licenses.push({
        library: jarFile,
        ...licenseInfo
      });
    }

    return licenses;
  }

  /**
   * Extract license information from JAR file
   * @param {string} jarPath - JAR file path
   * @returns {Promise<Object>} - License information
   */
  async extractLicenseInfo(jarPath) {
    const result = {
      hasLicense: false,
      licenseType: 'unknown',
      licenseFile: null
    };

    try {
      // Check for license files in JAR
      const licensePaths = [
        'META-INF/LICENSE',
        'META-INF/LICENSE.txt',
        'META-INF/NOTICE',
        'META-INF/NOTICE.txt'
      ];

      // Simplified check - in a real implementation, you'd read the JAR contents
      const fileName = path.basename(jarPath);
      
      // Guess license based on naming conventions
      if (fileName.includes('apache')) {
        result.licenseType = 'apache';
        result.hasLicense = true;
      } else if (fileName.includes('mit')) {
        result.licenseType = 'mit';
        result.hasLicense = true;
      } else if (fileName.includes('gpl')) {
        result.licenseType = 'gpl';
        result.hasLicense = true;
      }

    } catch (error) {
      // Silently fail - license info is optional
    }

    return result;
  }

  /**
   * Generate dependency validation report
   * @param {Object} validation - Validation result
   * @param {string} format - Report format
   * @returns {string} - Formatted report
   */
  generateReport(validation, format = 'text') {
    switch (format) {
      case 'json':
        return JSON.stringify(validation, null, 2);
      
      case 'html':
        return this.generateHtmlReport(validation);
      
      default:
        return this.generateTextReport(validation);
    }
  }

  /**
   * Generate text validation report
   * @param {Object} validation - Validation result
   * @returns {string} - Text report
   */
  generateTextReport(validation) {
    let report = '=== AIX Studio Dependency Validation Report ===\n\n';
    
    report += `Status: ${validation.valid ? 'VALID' : 'INVALID'}\n`;
    report += `Timestamp: ${new Date().toISOString()}\n\n`;
    
    if (validation.errors.length > 0) {
      report += 'Errors:\n';
      validation.errors.forEach((error, index) => {
        report += `  ${index + 1}. ${error}\n`;
      });
      report += '\n';
    }
    
    if (validation.warnings.length > 0) {
      report += 'Warnings:\n';
      validation.warnings.forEach((warning, index) => {
        report += `  ${index + 1}. ${warning}\n`;
      });
      report += '\n';
    }
    
    // Add dependency statistics
    if (validation.dependencies) {
      report += 'Dependency Statistics:\n';
      report += `  JAR Files: ${validation.dependencies.jarFiles || 0}\n`;
      report += `  Total Size: ${this.formatFileSize(validation.dependencies.totalSize || 0)}\n`;
      report += `  Has Required Dependencies: ${validation.dependencies.hasRequiredDeps ? 'Yes' : 'No'}\n\n`;
    }
    
    // Add security information
    if (validation.security) {
      report += 'Security Information:\n';
      report += `  Scanned Dependencies: ${validation.security.scanned || 0}\n`;
      report += `  Vulnerabilities Found: ${validation.security.vulnerabilities?.length || 0}\n\n`;
    }
    
    return report;
  }

  /**
   * Generate HTML validation report
   * @param {Object} validation - Validation result
   * @returns {string} - HTML report
   */
  generateHtmlReport(validation) {
    let html = `<!DOCTYPE html>
<html>
<head>
    <title>AIX Studio Dependency Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2196F3; border-bottom: 2px solid #2196F3; padding-bottom: 10px; }
        h2 { color: #4CAF50; margin-top: 30px; }
        .status { padding: 10px; border-radius: 4px; margin: 20px 0; }
        .valid { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
        .invalid { background: #ffebee; color: #c62828; border: 1px solid #ffcdd2; }
        .error, .warning { padding: 8px; margin: 5px 0; border-radius: 4px; }
        .error { background: #ffebee; color: #c62828; border-left: 4px solid #f44336; }
        .warning { background: #fff8e1; color: #f57f17; border-left: 4px solid #ffc107; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-card { background: #f8f9fa; padding: 15px; border-radius: 4px; text-align: center; }
        .stat-number { font-size: 24px; font-weight: bold; color: #2196F3; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📦 AIX Studio Dependency Validation Report</h1>
        
        <div class="status ${validation.valid ? 'valid' : 'invalid'}">
            <strong>Status:</strong> ${validation.valid ? 'VALID' : 'INVALID'}
        </div>
        
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${validation.dependencies?.jarFiles || 0}</div>
                <div>JAR Files</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${this.formatFileSize(validation.dependencies?.totalSize || 0)}</div>
                <div>Total Size</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${validation.security?.scanned || 0}</div>
                <div>Scanned</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${validation.security?.vulnerabilities?.length || 0}</div>
                <div>Vulnerabilities</div>
            </div>
        </div>
`;
    
    if (validation.errors.length > 0) {
      html += `
        <div class="section">
            <h2>❌ Errors (${validation.errors.length})</h2>
`;
      validation.errors.forEach((error, index) => {
        html += `            <div class="error">${error}</div>\n`;
      });
      html += `        </div>\n`;
    }
    
    if (validation.warnings.length > 0) {
      html += `
        <div class="section">
            <h2>⚠️ Warnings (${validation.warnings.length})</h2>
`;
      validation.warnings.forEach((warning, index) => {
        html += `            <div class="warning">${warning}</div>\n`;
      });
      html += `        </div>\n`;
    }
    
    html += `
        <div class="footer">
            <p>Generated by AIX Studio Dependency Validator</p>
        </div>
    </div>
</body>
</html>`;
    
    return html;
  }

  /**
   * Suggest dependency improvements
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Improvement suggestions
   */
  async suggestImprovements(projectPath) {
    const suggestions = {
      upgrades: [],
      removals: [],
      additions: [],
      optimizations: []
    };

    try {
      const libsDir = path.join(projectPath, 'libs');
      if (!await fs.pathExists(libsDir)) {
        return suggestions;
      }

      const libFiles = await fs.readdir(libsDir);
      const jarFiles = libFiles.filter(file => file.endsWith('.jar'));

      // Suggest upgrades
      const outdated = await this.checkOutdatedLibraries(libsDir, jarFiles);
      suggestions.upgrades = outdated.map(lib => ({
        action: 'upgrade',
        library: lib.name,
        from: lib.current,
        to: lib.latest,
        reason: 'Newer version available'
      }));

      // Suggest removals for unused dependencies
      const unused = await this.findUnusedDependencies(projectPath, jarFiles);
      suggestions.removals = unused.map(dep => ({
        action: 'remove',
        library: dep,
        reason: 'Potentially unused dependency'
      }));

      // Suggest additions for missing common libraries
      const missing = await this.findMissingCommonLibraries(jarFiles);
      suggestions.additions = missing.map(lib => ({
        action: 'add',
        library: lib.name,
        reason: lib.reason
      }));

      // Suggest optimizations
      const largeFiles = jarFiles.filter(file => {
        const filePath = path.join(libsDir, file);
        return fs.statSync(filePath).size > 5 * 1024 * 1024; // 5MB
      });
      
      suggestions.optimizations = largeFiles.map(file => ({
        action: 'optimize',
        library: file,
        reason: 'Large file size'
      }));

    } catch (error) {
      console.warn(`Failed to generate suggestions: ${error.message}`);
    }

    return suggestions;
  }

  /**
   * Find unused dependencies
   * @param {string} projectPath - Project directory path
   * @param {Array} jarFiles - JAR file names
   * @returns {Promise<Array>} - Unused dependencies
   */
  async findUnusedDependencies(projectPath, jarFiles) {
    // This is a simplified implementation
    // In a real-world scenario, this would analyze the actual code usage
    return [];
  }

  /**
   * Find missing common libraries
   * @param {Array} jarFiles - JAR file names
   * @returns {Promise<Array>} - Missing libraries
   */
  async findMissingCommonLibraries(jarFiles) {
    const commonLibs = [
      { name: 'gson', reason: 'Popular JSON library for Android' },
      { name: 'commons-lang3', reason: 'Utility functions and helpers' },
      { name: 'retrofit', reason: 'Type-safe HTTP client' }
    ];
    
    const missing = [];
    const artifactNames = jarFiles.map(file => this.extractArtifactName(file));
    
    for (const lib of commonLibs) {
      if (!artifactNames.includes(lib.name)) {
        missing.push(lib);
      }
    }
    
    return missing;
  }

  /**
   * Validate dependency tree
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Dependency tree validation
   */
  async validateDependencyTree(projectPath) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      tree: {}
    };

    try {
      const libsDir = path.join(projectPath, 'libs');
      if (!await fs.pathExists(libsDir)) {
        return result;
      }

      const libFiles = await fs.readdir(libsDir);
      const jarFiles = libFiles.filter(file => file.endsWith('.jar'));

      // Build dependency tree
      result.tree = await this.buildDependencyTree(libsDir, jarFiles);
      
      // Validate tree structure
      const treeValidation = await this.validateTreeStructure(result.tree);
      result.errors.push(...treeValidation.errors);
      result.warnings.push(...treeValidation.warnings);
      
      result.valid = result.errors.length === 0;

    } catch (error) {
      result.errors.push(`Dependency tree validation failed: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Build dependency tree
   * @param {string} libsDir - Libraries directory path
   * @param {Array} jarFiles - JAR file names
   * @returns {Promise<Object>} - Dependency tree
   */
  async buildDependencyTree(libsDir, jarFiles) {
    const tree = {
      root: {
        name: 'Project Dependencies',
        children: []
      }
    };

    // This is a simplified implementation
    // In a real-world scenario, this would analyze actual dependency manifests
    for (const jarFile of jarFiles) {
      tree.root.children.push({
        name: jarFile,
        version: this.extractVersion(jarFile),
        size: await this.getFileSize(path.join(libsDir, jarFile)),
        dependencies: []
      });
    }

    return tree;
  }

  /**
   * Get file size
   * @param {string} filePath - File path
   * @returns {Promise<number>} - File size in bytes
   */
  async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Validate tree structure
   * @param {Object} tree - Dependency tree
   * @returns {Promise<Object>} - Tree validation result
   */
  async validateTreeStructure(tree) {
    const result = {
      errors: [],
      warnings: []
    };

    // This is a simplified implementation
    // In a real-world scenario, this would validate actual tree constraints
    if (!tree.root) {
      result.errors.push('Missing root node in dependency tree');
    }

    return result;
  }
}

module.exports = DependencyValidator;