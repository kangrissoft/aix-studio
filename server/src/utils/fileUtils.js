const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

/**
 * File utility functions for AIX Studio
 * Provides helper methods for file operations, validation, and management
 */

class FileUtils {
  /**
   * Ensure directory exists and is writable
   * @param {string} dirPath - Directory path to check
   * @returns {Promise<boolean>} - True if directory is ready
   */
  static async ensureDirectory(dirPath) {
    try {
      await fs.ensureDir(dirPath);
      await fs.access(dirPath, fs.constants.W_OK);
      return true;
    } catch (error) {
      throw new Error(`Cannot access directory ${dirPath}: ${error.message}`);
    }
  }

  /**
   * Get file statistics
   * @param {string} filePath - Path to file
   * @returns {Promise<Object>} - File statistics
   */
  static async getFileStats(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        permissions: stats.mode
      };
    } catch (error) {
      throw new Error(`Cannot get file stats for ${filePath}: ${error.message}`);
    }
  }

  /**
   * Get human-readable file size
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted file size
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Calculate file checksum (SHA-256)
   * @param {string} filePath - Path to file
   * @returns {Promise<string>} - File checksum
   */
  static async getFileChecksum(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (error) => reject(error));
    });
  }

  /**
   * Find files matching pattern recursively
   * @param {string} dir - Directory to search
   * @param {RegExp|string} pattern - File pattern to match
   * @param {Array} exclude - Patterns to exclude
   * @returns {Promise<Array>} - Array of matching file paths
   */
  static async findFiles(dir, pattern, exclude = []) {
    const files = await fs.readdir(dir);
    let results = [];
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      
      // Check if file should be excluded
      if (exclude.some(ex => filePath.includes(ex))) {
        continue;
      }
      
      const stat = await fs.stat(filePath);
      
      if (stat.isDirectory()) {
        const subFiles = await this.findFiles(filePath, pattern, exclude);
        results = results.concat(subFiles);
      } else {
        if (pattern instanceof RegExp) {
          if (pattern.test(file)) {
            results.push(filePath);
          }
        } else if (typeof pattern === 'string') {
          if (file.endsWith(pattern)) {
            results.push(filePath);
          }
        }
      }
    }
    
    return results;
  }

  /**
   * Copy directory recursively with filtering
   * @param {string} src - Source directory
   * @param {string} dest - Destination directory
   * @param {Function} filter - Filter function for files
   * @returns {Promise<void>}
   */
  static async copyDirectory(src, dest, filter = null) {
    await fs.ensureDir(dest);
    
    const files = await fs.readdir(src);
    
    for (const file of files) {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      
      const stat = await fs.stat(srcPath);
      
      if (stat.isDirectory()) {
        await this.copyDirectory(srcPath, destPath, filter);
      } else {
        // Apply filter if provided
        if (!filter || filter(srcPath, destPath)) {
          await fs.copy(srcPath, destPath);
        }
      }
    }
  }

  /**
   * Create backup of file or directory
   * @param {string} sourcePath - Path to backup
   * @param {string} backupDir - Backup directory
   * @returns {Promise<string>} - Backup path
   */
  static async createBackup(sourcePath, backupDir = 'backups') {
    await this.ensureDirectory(backupDir);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const basename = path.basename(sourcePath);
    const backupPath = path.join(backupDir, `${basename}-backup-${timestamp}`);
    
    await fs.copy(sourcePath, backupPath);
    
    return backupPath;
  }

  /**
   * Clean directory (remove all contents)
   * @param {string} dirPath - Directory to clean
   * @param {Array} preserve - Files/directories to preserve
   * @returns {Promise<void>}
   */
  static async cleanDirectory(dirPath, preserve = []) {
    const files = await fs.readdir(dirPath);
    
    for (const file of files) {
      if (!preserve.includes(file)) {
        const filePath = path.join(dirPath, file);
        await fs.remove(filePath);
      }
    }
  }

  /**
   * Validate file path safety
   * @param {string} filePath - File path to validate
   * @param {string} baseDir - Base directory for validation
   * @returns {boolean} - True if path is safe
   */
  static isPathSafe(filePath, baseDir) {
    const resolvedPath = path.resolve(filePath);
    const resolvedBase = path.resolve(baseDir);
    
    return resolvedPath.startsWith(resolvedBase);
  }

  /**
   * Get project structure as tree
   * @param {string} dir - Directory to scan
   * @param {number} maxDepth - Maximum depth to scan
   * @param {number} currentDepth - Current recursion depth
   * @returns {Promise<Object>} - Tree structure
   */
  static async getDirectoryTree(dir, maxDepth = 5, currentDepth = 0) {
    if (currentDepth > maxDepth) {
      return { name: path.basename(dir), type: 'directory', truncated: true };
    }
    
    const stats = await fs.stat(dir);
    const name = path.basename(dir);
    
    if (stats.isFile()) {
      return {
        name,
        type: 'file',
        size: stats.size,
        modified: stats.mtime
      };
    }
    
    if (stats.isDirectory()) {
      const files = await fs.readdir(dir);
      const children = [];
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        try {
          const child = await this.getDirectoryTree(filePath, maxDepth, currentDepth + 1);
          children.push(child);
        } catch (error) {
          // Skip files that can't be accessed
          continue;
        }
      }
      
      return {
        name,
        type: 'directory',
        children,
        modified: stats.mtime
      };
    }
    
    return { name, type: 'unknown' };
  }

  /**
   * Read file with encoding detection
   * @param {string} filePath - Path to file
   * @returns {Promise<string>} - File content
   */
  static async readFileWithEncoding(filePath) {
    try {
      // Try UTF-8 first
      return await fs.readFile(filePath, 'utf8');
    } catch (utf8Error) {
      try {
        // Try with buffer and detect encoding
        const buffer = await fs.readFile(filePath);
        return buffer.toString('utf8');
      } catch (error) {
        throw new Error(`Cannot read file ${filePath}: ${error.message}`);
      }
    }
  }

  /**
   * Write file with backup
   * @param {string} filePath - Path to file
   * @param {string} content - File content
   * @param {boolean} backup - Create backup before writing
   * @returns {Promise<void>}
   */
  static async writeFileWithBackup(filePath, content, backup = true) {
    if (backup && await fs.pathExists(filePath)) {
      await this.createBackup(filePath);
    }
    
    await fs.writeFile(filePath, content, 'utf8');
  }

  /**
   * Get file extension
   * @param {string} filename - Filename
   * @returns {string} - File extension
   */
  static getFileExtension(filename) {
    return path.extname(filename).toLowerCase();
  }

  /**
   * Get MIME type from file extension
   * @param {string} extension - File extension
   * @returns {string} - MIME type
   */
  static getMimeType(extension) {
    const mimeTypes = {
      '.js': 'application/javascript',
      '.jsx': 'application/javascript',
      '.ts': 'application/typescript',
      '.tsx': 'application/typescript',
      '.java': 'text/x-java-source',
      '.kt': 'text/x-kotlin',
      '.xml': 'application/xml',
      '.json': 'application/json',
      '.html': 'text/html',
      '.css': 'text/css',
      '.md': 'text/markdown',
      '.txt': 'text/plain',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.jar': 'application/java-archive',
      '.aix': 'application/x-aix-extension'
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
  }

  /**
   * Extract version from filename
   * @param {string} filename - Filename
   * @returns {string|null} - Version string or null
   */
  static extractVersion(filename) {
    const versionRegex = /(\d+\.\d+\.\d+(?:[-.][\w.-]+)?)/;
    const match = filename.match(versionRegex);
    return match ? match[1] : null;
  }

  /**
   * Compare file modification times
   * @param {string} file1 - First file path
   * @param {string} file2 - Second file path
   * @returns {Promise<number>} - 1 if file1 newer, -1 if file2 newer, 0 if equal
   */
  static async compareFileTimes(file1, file2) {
    const stats1 = await fs.stat(file1);
    const stats2 = await fs.stat(file2);
    
    if (stats1.mtime > stats2.mtime) return 1;
    if (stats1.mtime < stats2.mtime) return -1;
    return 0;
  }

  /**
   * Create temporary file
   * @param {string} prefix - File prefix
   * @param {string} suffix - File suffix
   * @returns {Promise<string>} - Temporary file path
   */
  static async createTempFile(prefix = 'aix-', suffix = '.tmp') {
    const tempDir = process.env.TMPDIR || process.env.TEMP || '/tmp';
    const filename = `${prefix}${Date.now()}${suffix}`;
    const tempPath = path.join(tempDir, filename);
    
    await fs.writeFile(tempPath, '');
    return tempPath;
  }

  /**
   * Get project metadata from package files
   * @param {string} projectPath - Project directory
   * @returns {Promise<Object>} - Project metadata
   */
  static async getProjectMetadata(projectPath) {
    const metadata = {
      name: path.basename(projectPath),
      path: projectPath,
      created: null,
      modified: null,
      language: 'unknown',
      hasTests: false,
      hasDocs: false,
      dependencies: []
    };
    
    try {
      // Get project stats
      const stats = await fs.stat(projectPath);
      metadata.created = stats.birthtime;
      metadata.modified = stats.mtime;
      
      // Check for source files
      if (await fs.pathExists(path.join(projectPath, 'src'))) {
        const javaFiles = await this.findFiles(path.join(projectPath, 'src'), '.java');
        const ktFiles = await this.findFiles(path.join(projectPath, 'src'), '.kt');
        
        if (ktFiles.length > 0) {
          metadata.language = 'kotlin';
        } else if (javaFiles.length > 0) {
          metadata.language = 'java';
        }
      }
      
      // Check for tests
      metadata.hasTests = await fs.pathExists(path.join(projectPath, 'test'));
      
      // Check for docs
      metadata.hasDocs = await fs.pathExists(path.join(projectPath, 'docs'));
      
      // Check for dependencies
      if (await fs.pathExists(path.join(projectPath, 'libs'))) {
        const libFiles = await fs.readdir(path.join(projectPath, 'libs'));
        metadata.dependencies = libFiles.map(file => ({
          name: file.replace(/-\d+\.\d+\.\d+.*\.jar$/, ''),
          version: this.extractVersion(file),
          file: file
        }));
      }
      
    } catch (error) {
      // Silently handle errors to avoid breaking the application
      console.warn(`Could not get metadata for project ${projectPath}:`, error.message);
    }
    
    return metadata;
  }
}

module.exports = FileUtils;