const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const JavaBuilder = require('./javaBuilder');

/**
 * Kotlin Builder for App Inventor Extensions
 * Handles compilation and packaging of Kotlin extensions
 */
class KotlinBuilder extends JavaBuilder {
  constructor(options = {}) {
    super(options);
    this.kotlinVersion = options.kotlinVersion || '1.8.0';
  }

  /**
   * Build Kotlin extension
   * @param {string} projectPath - Path to project directory
   * @param {Object} options - Build options
   * @returns {Promise<Object>} - Build result
   */
  async build(projectPath, options = {}) {
    try {
      // Validate Kotlin project structure
      await this.validateKotlinProject(projectPath);
      
      // Ensure Kotlin libraries are present
      await this.ensureKotlinLibraries(projectPath);
      
      // Clean previous builds
      if (options.clean) {
        await this.clean(projectPath);
      }
      
      // Initialize build directories
      await this.initializeBuildDirs(projectPath);
      
      // Compile Kotlin sources
      const compileResult = await this.compileKotlin(projectPath);
      
      // Package extension
      const packageResult = await this.package(projectPath, options);
      
      // Get final extension info
      const extensionInfo = await this.getExtensionInfo(projectPath);
      
      return {
        success: true,
        compile: compileResult,
        package: packageResult,
        extension: extensionInfo,
        message: 'Kotlin build completed successfully'
      };
    } catch (error) {
      throw new Error(`Kotlin build failed: ${error.message}`);
    }
  }

  /**
   * Validate Kotlin project structure
   * @param {string} projectPath - Path to project
   * @returns {Promise<boolean>} - True if valid
   */
  async validateKotlinProject(projectPath) {
    await this.validateProject(projectPath);
    
    // Check for Kotlin source files
    const ktFiles = await this.findKotlinFiles(projectPath);
    if (ktFiles.length === 0) {
      throw new Error('No Kotlin source files found in src/ directory');
    }
    
    return true;
  }

  /**
   * Find Kotlin files in project
   * @param {string} projectPath - Path to project
   * @returns {Promise<Array>} - Array of Kotlin file paths
   */
  async findKotlinFiles(projectPath) {
    const srcDir = path.join(projectPath, 'src');
    if (!await fs.pathExists(srcDir)) {
      return [];
    }
    
    const files = await fs.readdir(srcDir);
    const ktFiles = [];
    
    for (const file of files) {
      const filePath = path.join(srcDir, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isDirectory()) {
        const subFiles = await this.findKotlinFiles(filePath);
        ktFiles.push(...subFiles);
      } else if (file.endsWith('.kt')) {
        ktFiles.push(filePath);
      }
    }
    
    return ktFiles;
  }

  /**
   * Ensure Kotlin libraries are present
   * @param {string} projectPath - Path to project
   * @returns {Promise<void>}
   */
  async ensureKotlinLibraries(projectPath) {
    const libsDir = path.join(projectPath, 'libs');
    await fs.ensureDir(libsDir);
    
    // Check for required Kotlin libraries
    const requiredLibs = [
      `kotlin-stdlib-${this.kotlinVersion}.jar`,
      `kotlin-compiler-${this.kotlinVersion}.jar`
    ];
    
    for (const lib of requiredLibs) {
      const libPath = path.join(libsDir, lib);
      if (!await fs.pathExists(libPath)) {
        console.warn(`Warning: Kotlin library ${lib} not found in libs/ directory`);
        console.warn('Please download Kotlin libraries or use AIX Studio dependency manager');
      }
    }
  }

  /**
   * Compile Kotlin sources
   * @param {string} projectPath - Path to project
   * @returns {Promise<Object>} - Compilation result
   */
  async compileKotlin(projectPath) {
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
          reject(new Error(`Kotlin compilation failed with exit code ${code}: ${error}`));
        }
      });
    });
  }

  /**
   * Get Kotlin-specific extension information
   * @param {string} projectPath - Path to project
   * @returns {Promise<Object>} - Extension information
   */
  async getExtensionInfo(projectPath) {
    const info = await super.getExtensionInfo(projectPath);
    if (info) {
      info.language = 'Kotlin';
    }
    return info;
  }
}

module.exports = KotlinBuilder;