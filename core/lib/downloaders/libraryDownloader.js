const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const EventEmitter = require('events');

/**
 * Library Downloader for App Inventor Extensions
 * Downloads libraries from various sources including Maven Central and GitHub
 */
class LibraryDownloader extends EventEmitter {
  constructor(options = {}) {
    super();
    this.timeout = options.timeout || 30000;
    this.retries = options.retries || 3;
    this.userAgent = options.userAgent || 'AIX-Studio/1.0';
    this.verbose = options.verbose || false;
  }

  /**
   * Download library from URL
   * @param {string} url - Library URL
   * @param {string} destination - Destination path
   * @param {Object} options - Download options
   * @returns {Promise<Object>} - Download result
   */
  async download(url, destination, options = {}) {
    const startTime = Date.now();
    
    try {
      // Ensure destination directory exists
      await fs.ensureDir(path.dirname(destination));
      
      this.emit('start', { url, destination });
      
      // Download with retries
      const result = await this.downloadWithRetries(url, destination, options);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.emit('complete', { 
        url, 
        destination, 
        size: result.size,
        duration,
        ...result 
      });
      
      return {
        success: true,
        url,
        destination,
        size: result.size,
        duration,
        checksum: result.checksum,
        message: 'Library downloaded successfully'
      };
    } catch (error) {
      this.emit('error', { url, destination, error: error.message });
      
      throw new Error(`Failed to download library from ${url}: ${error.message}`);
    }
  }

  /**
   * Download with retry logic
   * @param {string} url - Library URL
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
   * @param {string} url - Library URL
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
   * Download App Inventor libraries
   * @param {string} libsDir - Libraries directory
   * @param {Array} libraries - Libraries to download
   * @returns {Promise<Array>} - Download results
   */
  async downloadAppInventorLibs(libsDir, libraries = []) {
    const defaultLibs = [
      {
        name: 'appinventor-components.jar',
        url: 'https://github.com/mit-cml/appinventor-sources/raw/master/appinventor/components/lib/appinventor-components.jar',
        description: 'Core App Inventor components library'
      },
      {
        name: 'acra-4.4.0.jar',
        url: 'https://github.com/mit-cml/appinventor-sources/raw/master/appinventor/components/lib/acra-4.4.0.jar',
        description: 'Application crash reporting library'
      },
      {
        name: 'android.jar',
        url: 'https://github.com/mit-cml/appinventor-sources/raw/master/appinventor/components/lib/android.jar',
        description: 'Android SDK library'
      }
    ];
    
    const libsToDownload = libraries.length > 0 ? libraries : defaultLibs;
    const results = [];
    
    for (const lib of libsToDownload) {
      try {
        const destination = path.join(libsDir, lib.name);
        const result = await this.download(lib.url, destination);
        results.push({ ...lib, ...result });
      } catch (error) {
        results.push({ 
          ...lib, 
          success: false, 
          error: error.message 
        });
      }
    }
    
    return results;
  }

  /**
   * Download common libraries
   * @param {string} libsDir - Libraries directory
   * @param {Array} libraries - Libraries to download
   * @returns {Promise<Array>} - Download results
   */
  async downloadCommonLibs(libsDir, libraries = []) {
    const commonLibs = [
      {
        name: 'gson-2.8.9.jar',
        url: 'https://repo1.maven.org/maven2/com/google/code/gson/gson/2.8.9/gson-2.8.9.jar',
        description: 'Google JSON library'
      },
      {
        name: 'commons-lang3-3.12.0.jar',
        url: 'https://repo1.maven.org/maven2/org/apache/commons/commons-lang3/3.12.0/commons-lang3-3.12.0.jar',
        description: 'Apache Commons Lang library'
      },
      {
        name: 'retrofit-2.9.0.jar',
        url: 'https://repo1.maven.org/maven2/com/squareup/retrofit2/retrofit/2.9.0/retrofit-2.9.0.jar',
        description: 'Type-safe HTTP client'
      },
      {
        name: 'okhttp-4.10.0.jar',
        url: 'https://repo1.maven.org/maven2/com/squareup/okhttp3/okhttp/4.10.0/okhttp-4.10.0.jar',
        description: 'HTTP client'
      }
    ];
    
    const libsToDownload = libraries.length > 0 ? libraries : commonLibs;
    const results = [];
    
    for (const lib of libsToDownload) {
      try {
        const destination = path.join(libsDir, lib.name);
        const result = await this.download(lib.url, destination);
        results.push({ ...lib, ...result });
      } catch (error) {
        results.push({ 
          ...lib, 
          success: false, 
          error: error.message 
        });
      }
    }
    
    return results;
  }

  /**
   * Download Kotlin libraries
   * @param {string} libsDir - Libraries directory
   * @param {string} version - Kotlin version
   * @returns {Promise<Array>} - Download results
   */
  async downloadKotlinLibs(libsDir, version = '1.8.0') {
    const kotlinLibs = [
      {
        name: `kotlin-stdlib-${version}.jar`,
        url: `https://repo1.maven.org/maven2/org/jetbrains/kotlin/kotlin-stdlib/${version}/kotlin-stdlib-${version}.jar`,
        description: 'Kotlin Standard Library'
      },
      {
        name: `kotlin-compiler-${version}.jar`,
        url: `https://repo1.maven.org/maven2/org/jetbrains/kotlin/kotlin-compiler/${version}/kotlin-compiler-${version}.jar`,
        description: 'Kotlin Compiler for Ant integration'
      },
      {
        name: `kotlin-reflect-${version}.jar`,
        url: `https://repo1.maven.org/maven2/org/jetbrains/kotlin/kotlin-reflect/${version}/kotlin-reflect-${version}.jar`,
        description: 'Kotlin Reflection Library'
      }
    ];
    
    const results = [];
    
    for (const lib of kotlinLibs) {
      try {
        const destination = path.join(libsDir, lib.name);
        const result = await this.download(lib.url, destination);
        results.push({ ...lib, ...result });
      } catch (error) {
        results.push({ 
          ...lib, 
          success: false, 
          error: error.message 
        });
      }
    }
    
    return results;
  }

  /**
   * Download testing libraries
   * @param {string} libsDir - Libraries directory
   * @returns {Promise<Array>} - Download results
   */
  async downloadTestLibs(libsDir) {
    const testLibs = [
      {
        name: 'junit-4.13.2.jar',
        url: 'https://repo1.maven.org/maven2/junit/junit/4.13.2/junit-4.13.2.jar',
        description: 'JUnit testing framework'
      },
      {
        name: 'hamcrest-core-1.3.jar',
        url: 'https://repo1.maven.org/maven2/org/hamcrest/hamcrest-core/1.3/hamcrest-core-1.3.jar',
        description: 'Hamcrest matchers'
      },
      {
        name: 'mockito-core-4.11.0.jar',
        url: 'https://repo1.maven.org/maven2/org/mockito/mockito-core/4.11.0/mockito-core-4.11.0.jar',
        description: 'Mockito mocking framework'
      }
    ];
    
    const results = [];
    
    for (const lib of testLibs) {
      try {
        const destination = path.join(libsDir, lib.name);
        const result = await this.download(lib.url, destination);
        results.push({ ...lib, ...result });
      } catch (error) {
        results.push({ 
          ...lib, 
          success: false, 
          error: error.message 
        });
      }
    }
    
    return results;
  }

  /**
   * List available library categories
   * @returns {Object} - Library categories
   */
  listCategories() {
    return {
      'appinventor': {
        name: 'App Inventor Core Libraries',
        description: 'Essential libraries for App Inventor extensions'
      },
      'common': {
        name: 'Common Libraries',
        description: 'Popular utility and framework libraries'
      },
      'kotlin': {
        name: 'Kotlin Libraries',
        description: 'Kotlin runtime and compiler libraries'
      },
      'testing': {
        name: 'Testing Libraries',
        description: 'Libraries for unit testing and mocking'
      }
    };
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

module.exports = LibraryDownloader;