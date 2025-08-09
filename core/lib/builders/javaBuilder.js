const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const FileUtils = require('../utils/fileUtils');

/**
 * Java Builder for App Inventor Extensions
 * Handles compilation and packaging of Java extensions
 */
class JavaBuilder {
  constructor(options = {}) {
    this.javaHome = options.javaHome || process.env.JAVA_HOME;
    this.antHome = options.antHome || process.env.ANT_HOME;
    this.verbose = options.verbose || false;
  }

  /**
   * Build Java extension
   * @param {string} projectPath - Path to project directory
   * @param {Object} options - Build options
   * @returns {Promise<Object>} - Build result
   */
  async build(projectPath, options = {}) {
    try {
      // Validate project structure
      await this.validateProject(projectPath);
      
      // Clean previous builds
      if (options.clean) {
        await this.clean(projectPath);
      }
      
      // Initialize build directories
      await this.initializeBuildDirs(projectPath);
      
      // Compile Java sources
      const compileResult = await this.compile(projectPath);
      
      // Package extension
      const packageResult = await this.package(projectPath, options);
      
      // Get final extension info
      const extensionInfo = await this.getExtensionInfo(projectPath);
      
      return {
        success: true,
        compile: compileResult,
        package: packageResult,
        extension: extensionInfo,
        message: 'Build completed successfully'
      };
    } catch (error) {
      throw new Error(`Java build failed: ${error.message}`);
    }
  }

  /**
   * Validate project structure
   * @param {string} projectPath - Path to project
   * @returns {Promise<boolean>} - True if valid
   */
  async validateProject(projectPath) {
    const requiredDirs = ['src', 'libs', 'assets'];
    for (const dir of requiredDirs) {
      const dirPath = path.join(projectPath, dir);
      if (!await fs.pathExists(dirPath)) {
        throw new Error(`Required directory missing: ${dir}`);
      }
    }
    
    const buildFile = path.join(projectPath, 'build.xml');
    if (!await fs.pathExists(buildFile)) {
      throw new Error('Build file (build.xml) not found');
    }
    
    return true;
  }

  /**
   * Clean build directories
   * @param {string} projectPath - Path to project
   * @returns {Promise<void>}
   */
  async clean(projectPath) {
    const buildDir = path.join(projectPath, 'build');
    const distDir = path.join(projectPath, 'dist');
    
    if (await fs.pathExists(buildDir)) {
      await fs.remove(buildDir);
    }
    
    if (await fs.pathExists(distDir)) {
      await fs.remove(distDir);
    }
  }

  /**
   * Initialize build directories
   * @param {string} projectPath - Path to project
   * @returns {Promise<void>}
   */
  async initializeBuildDirs(projectPath) {
    const buildDir = path.join(projectPath, 'build');
    const distDir = path.join(projectPath, 'dist');
    
    await fs.ensureDir(buildDir);
    await fs.ensureDir(distDir);
  }

  /**
   * Compile Java sources
   * @param {string} projectPath - Path to project
   * @returns {Promise<Object>} - Compilation result
   */
  async compile(projectPath) {
    return new Promise((resolve, reject) => {
      const ant = spawn('ant', ['compile'], {
        cwd: projectPath,
        shell: true,
        env: process.env
      });
      
      let output = '';
      let error = '';
      
      ant.stdout.on('data', (data) => {
        output += data.toString();
        if (this.verbose) {
          console.log(data.toString());
        }
      });
      
      ant.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      ant.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            output: output,
            time: new Date().toISOString()
          });
        } else {
          reject(new Error(`Compilation failed with exit code ${code}: ${error}`));
        }
      });
    });
  }

  /**
   * Package extension into .aix file
   * @param {string} projectPath - Path to project
   * @param {Object} options - Packaging options
   * @returns {Promise<Object>} - Packaging result
   */
  async package(projectPath, options = {}) {
    const target = options.target || 'package';
    
    return new Promise((resolve, reject) => {
      const ant = spawn('ant', [target], {
        cwd: projectPath,
        shell: true,
        env: process.env
      });
      
      let output = '';
      let error = '';
      
      ant.stdout.on('data', (data) => {
        output += data.toString();
        if (this.verbose) {
          console.log(data.toString());
        }
      });
      
      ant.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      ant.on('close', (code) => {
        if (code === 0) {
          // Extract extension path from output
          const extensionMatch = output.match(/Extension built: ([^\n]+)/);
          const extensionPath = extensionMatch ? extensionMatch[1].trim() : null;
          
          resolve({
            success: true,
            output: output,
            extensionPath: extensionPath,
            time: new Date().toISOString()
          });
        } else {
          reject(new Error(`Packaging failed with exit code ${code}: ${error}`));
        }
      });
    });
  }

  /**
   * Get extension information
   * @param {string} projectPath - Path to project
   * @returns {Promise<Object>} - Extension information
   */
  async getExtensionInfo(projectPath) {
    const distDir = path.join(projectPath, 'dist');
    if (!await fs.pathExists(distDir)) {
      return null;
    }
    
    const files = await fs.readdir(distDir);
    const aixFiles = files.filter(file => file.endsWith('.aix'));
    
    if (aixFiles.length === 0) {
      return null;
    }
    
    const extensionPath = path.join(distDir, aixFiles[0]);
    const stats = await fs.stat(extensionPath);
    
    return {
      name: aixFiles[0],
      path: extensionPath,
      size: stats.size,
      sizeFormatted: FileUtils.formatFileSize(stats.size),
      modified: stats.mtime
    };
  }

  /**
   * Run tests
   * @param {string} projectPath - Path to project
   * @param {Object} options - Test options
   * @returns {Promise<Object>} - Test result
   */
  async test(projectPath, options = {}) {
    const target = options.coverage ? 'test-coverage' : 'test';
    
    return new Promise((resolve, reject) => {
      const ant = spawn('ant', [target], {
        cwd: projectPath,
        shell: true,
        env: process.env
      });
      
      let output = '';
      let error = '';
      
      ant.stdout.on('data', (data) => {
        output += data.toString();
        if (this.verbose) {
          console.log(data.toString());
        }
      });
      
      ant.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      ant.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            output: output,
            passed: this.extractTestCount(output, 'passed'),
            failed: this.extractTestCount(output, 'failed'),
            time: new Date().toISOString()
          });
        } else {
          reject(new Error(`Tests failed with exit code ${code}: ${error}`));
        }
      });
    });
  }

  /**
   * Extract test count from output
   * @param {string} output - Test output
   * @param {string} type - Count type (passed/failed)
   * @returns {number} - Test count
   */
  extractTestCount(output, type) {
    const regex = new RegExp(`(\\d+)\\s+${type}`, 'i');
    const match = output.match(regex);
    return match ? parseInt(match[1]) : 0;
  }
}

module.exports = JavaBuilder;