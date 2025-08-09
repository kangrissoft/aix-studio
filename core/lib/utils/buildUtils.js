const fs = require('fs-extra');
const path = require('path');
const { spawn, exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

/**
 * Build Utility Functions for AIX Studio
 * Provides helper methods for building App Inventor Extensions
 */
class BuildUtils {
  /**
   * Create build utilities instance
   * @param {Object} options - Build options
   */
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.timeout = options.timeout || 300000; // 5 minutes
    this.verbose = options.verbose || false;
  }

  /**
   * Build App Inventor Extension
   * @param {string} projectPath - Project directory path
   * @param {Object} options - Build options
   * @returns {Promise<Object>} - Build result
   */
  async buildExtension(projectPath, options = {}) {
    const startTime = Date.now();
    
    try {
      // Validate project path
      if (!await fs.pathExists(projectPath)) {
        throw new Error(`Project directory does not exist: ${projectPath}`);
      }
      
      // Validate build file
      const buildFile = path.join(projectPath, 'build.xml');
      if (!await fs.pathExists(buildFile)) {
        throw new Error(`Build file not found: ${buildFile}`);
      }
      
      // Clean previous builds if requested
      if (options.clean) {
        await this.cleanBuild(projectPath);
      }
      
      // Ensure build directories exist
      await this.ensureBuildDirectories(projectPath);
      
      // Execute build process
      const buildResult = await this.executeBuild(projectPath, options);
      
      // Get extension information
      const extensionInfo = await this.getExtensionInfo(projectPath);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      return {
        success: true,
        projectPath,
        extension: extensionInfo,
        duration,
        output: buildResult.output,
        error: buildResult.error,
        message: 'Extension built successfully'
      };
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  /**
   * Clean build directories
   * @param {string} projectPath - Project directory path
   * @returns {Promise<void>}
   */
  async cleanBuild(projectPath) {
    const buildDir = path.join(projectPath, 'build');
    const distDir = path.join(projectPath, 'dist');
    
    // Remove build directory
    if (await fs.pathExists(buildDir)) {
      await fs.remove(buildDir);
    }
    
    // Remove dist directory
    if (await fs.pathExists(distDir)) {
      await fs.remove(distDir);
    }
    
    this.logger.info('Cleaned build directories');
  }

  /**
   * Ensure build directories exist
   * @param {string} projectPath - Project directory path
   * @returns {Promise<void>}
   */
  async ensureBuildDirectories(projectPath) {
    const buildDir = path.join(projectPath, 'build');
    const distDir = path.join(projectPath, 'dist');
    
    await fs.ensureDir(buildDir);
    await fs.ensureDir(distDir);
    
    this.logger.info('Ensured build directories exist');
  }

  /**
   * Execute build process
   * @param {string} projectPath - Project directory path
   * @param {Object} options - Build options
   * @returns {Promise<Object>} - Build execution result
   */
  async executeBuild(projectPath, options = {}) {
    return new Promise((resolve, reject) => {
      const target = options.target || 'package';
      const antArgs = ['-Dbuild.compiler=javac1.8', target];
      
      if (this.verbose) {
        antArgs.unshift('-verbose');
      }
      
      const antProcess = spawn('ant', antArgs, {
        cwd: projectPath,
        shell: true,
        env: process.env
      });
      
      let output = '';
      let error = '';
      
      antProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        
        if (this.verbose) {
          console.log(chunk);
        }
        
        // Emit progress events
        this.emitBuildProgress(chunk, projectPath);
      });
      
      antProcess.stderr.on('data', (data) => {
        const chunk = data.toString();
        error += chunk;
        
        if (this.verbose) {
          console.error(chunk);
        }
      });
      
      antProcess.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            output: output,
            error: error,
            exitCode: code
          });
        } else {
          reject(new Error(`Build process failed with exit code ${code}: ${error}`));
        }
      });
      
      antProcess.on('error', (err) => {
        reject(new Error(`Failed to start build process: ${err.message}`));
      });
      
      // Set timeout
      setTimeout(() => {
        antProcess.kill();
        reject(new Error(`Build timed out after ${this.timeout}ms`));
      }, this.timeout);
    });
  }

  /**
   * Emit build progress events
   * @param {string} output - Build output chunk
   * @param {string} projectPath - Project directory path
   */
  emitBuildProgress(output, projectPath) {
    // Extract progress information from output
    const compilingMatch = output.match(/Compiling (\d+) source files/);
    if (compilingMatch) {
      this.logger.info(`Compiling ${compilingMatch[1]} source files`);
    }
    
    const jarMatch = output.match(/Building jar: (.+)/);
    if (jarMatch) {
      this.logger.info(`Building JAR: ${path.basename(jarMatch[1])}`);
    }
    
    const aixMatch = output.match(/Extension built: (.+)/);
    if (aixMatch) {
      this.logger.info(`Extension built: ${path.basename(aixMatch[1])}`);
    }
  }

  /**
   * Get extension information
   * @param {string} projectPath - Project directory path
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
      sizeFormatted: this.formatFileSize(stats.size),
      modified: stats.mtime,
      created: stats.birthtime
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
   * Validate build configuration
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Validation result
   */
  async validateBuildConfig(projectPath) {
    const errors = [];
    const warnings = [];
    
    try {
      const buildFile = path.join(projectPath, 'build.xml');
      if (!await fs.pathExists(buildFile)) {
        errors.push('Build file (build.xml) not found');
        return { valid: false, errors, warnings };
      }
      
      const content = await fs.readFile(buildFile, 'utf8');
      
      // Check for required properties
      const requiredProperties = [
        'src.dir',
        'build.dir', 
        'dist.dir',
        'libs.dir'
      ];
      
      for (const prop of requiredProperties) {
        if (!content.includes(`<property name="${prop}"`)) {
          warnings.push(`Missing required property: ${prop}`);
        }
      }
      
      // Check for required targets
      const requiredTargets = ['clean', 'compile', 'package'];
      for (const target of requiredTargets) {
        if (!content.includes(`<target name="${target}"`)) {
          errors.push(`Missing required target: ${target}`);
        }
      }
      
      // Check for classpath
      if (!content.includes('<classpath') && !content.includes('classpathref=')) {
        warnings.push('No classpath defined');
      }
      
      // Check Java version compatibility
      if (!content.includes('source="11"') || !content.includes('target="11"')) {
        warnings.push('Java source/target should be set to 11 for App Inventor compatibility');
      }
      
      // Check encoding
      if (!content.includes('encoding="UTF-8"')) {
        warnings.push('Source encoding should be UTF-8');
      }
      
    } catch (error) {
      errors.push(`Failed to validate build configuration: ${error.message}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Create default build file
   * @param {string} projectPath - Project directory path
   * @param {Object} options - Build file options
   * @returns {Promise<void>}
   */
  async createDefaultBuildFile(projectPath, options = {}) {
    const projectName = path.basename(projectPath);
    const isKotlin = options.language === 'kotlin';
    
    const buildXml = `<?xml version="1.0" encoding="UTF-8"?>
<project name="${projectName}" default="package">
  <property name="src.dir" value="src"/>
  <property name="build.dir" value="build"/>
  <property name="dist.dir" value="dist"/>
  <property name="libs.dir" value="libs"/>
  <property name="assets.dir" value="assets"/>
  ${isKotlin ? '<property name="kotlin.version" value="1.8.0"/>' : ''}

  ${isKotlin ? `
  <!-- Kotlin classpath -->
  <path id="kotlin.classpath">
    <fileset dir="${libs.dir}" includes="kotlin-*.jar"/>
    <fileset dir="${libs.dir}" includes="appinventor-components.jar"/>
    <fileset dir="${libs.dir}" includes="android.jar"/>
  </path>
  ` : `
  <!-- Java classpath -->
  <path id="classpath">
    <fileset dir="${libs.dir}" includes="**/*.jar"/>
  </path>
  `}

  <target name="clean">
    <delete dir="${build.dir}"/>
    <delete dir="${dist.dir}"/>
  </target>

  <target name="init">
    <mkdir dir="${build.dir}"/>
    <mkdir dir="${dist.dir}"/>
  </target>

  ${isKotlin ? `
  <target name="compile" depends="init">
    <taskdef resource="META-INF/services/org.jetbrains.kotlin.ant.KotlinAntTaskDef.xml" 
             classpathref="kotlin.classpath"/>
    <kotlinc src="${src.dir}" output="${build.dir}" classpathref="kotlin.classpath">
      <compilerarg value="-jvm-target"/>
      <compilerarg value="11"/>
    </kotlinc>
  </target>
  ` : `
  <target name="compile" depends="init">
    <javac srcdir="${src.dir}" destdir="${build.dir}" includeantruntime="false"
           source="11" target="11" encoding="UTF-8">
      <classpath refid="classpath"/>
    </javac>
  </target>
  `}

  <target name="package" depends="compile">
    <jar destfile="${dist.dir}/${ant.project.name}.aix" basedir="${build.dir}">
      <fileset dir="${assets.dir}" />
      <manifest>
        <attribute name="Built-By" value="AIX Studio"/>
        <attribute name="Created-By" value="AIX Studio"/>
        <attribute name="Version" value="1.0.0"/>
        ${isKotlin ? '<attribute name="Language" value="Kotlin"/>' : ''}
      </manifest>
    </jar>
    <echo message="Extension built: ${dist.dir}/${ant.project.name}.aix"/>
  </target>
</project>`;
    
    const buildFile = path.join(projectPath, 'build.xml');
    await fs.writeFile(buildFile, buildXml, 'utf8');
    
    this.logger.info(`Created default build file: ${buildFile}`);
  }

  /**
   * Run specific build target
   * @param {string} projectPath - Project directory path
   * @param {string} target - Build target name
   * @param {Object} options - Target execution options
   * @returns {Promise<Object>} - Target execution result
   */
  async runBuildTarget(projectPath, target, options = {}) {
    try {
      const buildFile = path.join(projectPath, 'build.xml');
      if (!await fs.pathExists(buildFile)) {
        throw new Error(`Build file not found: ${buildFile}`);
      }
      
      const antArgs = [target];
      if (options.properties) {
        Object.entries(options.properties).forEach(([key, value]) => {
          antArgs.push(`-D${key}=${value}`);
        });
      }
      
      const { stdout, stderr } = await execAsync(`ant ${antArgs.join(' ')}`, {
        cwd: projectPath,
        timeout: this.timeout
      });
      
      return {
        success: true,
        target,
        output: stdout,
        error: stderr,
        message: `Build target '${target}' executed successfully`
      };
    } catch (error) {
      throw new Error(`Failed to execute build target '${target}': ${error.message}`);
    }
  }

  /**
   * Get available build targets
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Array>} - Available targets
   */
  async getBuildTargets(projectPath) {
    try {
      const buildFile = path.join(projectPath, 'build.xml');
      if (!await fs.pathExists(buildFile)) {
        return [];
      }
      
      const content = await fs.readFile(buildFile, 'utf8');
      
      // Extract targets using regex
      const targetRegex = /<target\s+name=["']([^"']+)["']/g;
      const targets = [];
      let match;
      
      while ((match = targetRegex.exec(content)) !== null) {
        targets.push(match[1]);
      }
      
      return targets;
    } catch (error) {
      this.logger.warn(`Failed to get build targets: ${error.message}`);
      return [];
    }
  }

  /**
   * Build with coverage analysis
   * @param {string} projectPath - Project directory path
   * @param {Object} options - Coverage options
   * @returns {Promise<Object>} - Coverage build result
   */
  async buildWithCoverage(projectPath, options = {}) {
    try {
      // First, ensure JaCoCo is available
      const hasJacoco = await this.checkJacocoAvailability(projectPath);
      if (!hasJacoco) {
        throw new Error('JaCoCo not found. Please install JaCoCo for coverage analysis.');
      }
      
      // Run build with coverage
      const result = await this.runBuildTarget(projectPath, 'test-coverage', options);
      
      // Generate coverage report
      const coverageReport = await this.generateCoverageReport(projectPath);
      
      return {
        ...result,
        coverage: coverageReport,
        message: 'Build with coverage analysis completed successfully'
      };
    } catch (error) {
      throw new Error(`Coverage build failed: ${error.message}`);
    }
  }

  /**
   * Check JaCoCo availability
   * @param {string} projectPath - Project directory path
   * @returns {Promise<boolean>} - True if JaCoCo is available
   */
  async checkJacocoAvailability(projectPath) {
    try {
      const libsDir = path.join(projectPath, 'libs');
      if (!await fs.pathExists(libsDir)) {
        return false;
      }
      
      const libFiles = await fs.readdir(libsDir);
      return libFiles.some(file => file.includes('jacoco'));
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate coverage report
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Coverage report information
   */
  async generateCoverageReport(projectPath) {
    try {
      const coverageDir = path.join(projectPath, 'coverage');
      if (!await fs.pathExists(coverageDir)) {
        return null;
      }
      
      const reportFiles = await fs.readdir(coverageDir);
      const htmlReport = reportFiles.find(file => file === 'index.html');
      
      if (htmlReport) {
        return {
          path: path.join(coverageDir, htmlReport),
          url: `file://${path.join(coverageDir, htmlReport)}`,
          generated: new Date()
        };
      }
      
      return null;
    } catch (error) {
      this.logger.warn(`Failed to generate coverage report: ${error.message}`);
      return null;
    }
  }

  /**
   * Build optimized extension
   * @param {string} projectPath - Project directory path
   * @param {Object} options - Optimization options
   * @returns {Promise<Object>} - Optimized build result
   */
  async buildOptimized(projectPath, options = {}) {
    try {
      // Set optimization properties
      const optimizationProps = {
        'optimize.enabled': 'true',
        'optimize.level': options.level || 'aggressive',
        'optimize.obfuscate': options.obfuscate ? 'true' : 'false',
        'optimize.resources': options.shrinkResources ? 'true' : 'false'
      };
      
      // Run optimized build
      const result = await this.runBuildTarget(projectPath, 'package-optimized', {
        properties: optimizationProps
      });
      
      return {
        ...result,
        optimized: true,
        optimization: options,
        message: 'Optimized build completed successfully'
      };
    } catch (error) {
      throw new Error(`Optimized build failed: ${error.message}`);
    }
  }

  /**
   * Sign extension with keystore
   * @param {string} projectPath - Project directory path
   * @param {Object} signingOptions - Signing options
   * @returns {Promise<Object>} - Signed build result
   */
  async signExtension(projectPath, signingOptions) {
    try {
      if (!signingOptions.keystore || !signingOptions.alias) {
        throw new Error('Keystore and alias are required for signing');
      }
      
      // Set signing properties
      const signingProps = {
        'sign.enabled': 'true',
        'sign.keystore': signingOptions.keystore,
        'sign.alias': signingOptions.alias,
        'sign.password': signingOptions.password || ''
      };
      
      // Run signed build
      const result = await this.runBuildTarget(projectPath, 'package-signed', {
        properties: signingProps
      });
      
      return {
        ...result,
        signed: true,
        signing: signingOptions,
        message: 'Extension signed successfully'
      };
    } catch (error) {
      throw new Error(`Signing failed: ${error.message}`);
    }
  }

  /**
   * Get build statistics
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Build statistics
   */
  async getBuildStats(projectPath) {
    try {
      const stats = {
        project: path.basename(projectPath),
        lastBuild: null,
        buildCount: 0,
        averageBuildTime: 0,
        largestExtension: null,
        smallestExtension: null
      };
      
      // Get extension information
      const extensionInfo = await this.getExtensionInfo(projectPath);
      if (extensionInfo) {
        stats.lastBuild = extensionInfo;
      }
      
      // Get build history (if available)
      const buildHistoryFile = path.join(projectPath, '.aix-build-history.json');
      if (await fs.pathExists(buildHistoryFile)) {
        const history = await fs.readJson(buildHistoryFile);
        stats.buildCount = history.length;
        
        if (history.length > 0) {
          const totalDuration = history.reduce((sum, build) => sum + build.duration, 0);
          stats.averageBuildTime = totalDuration / history.length;
          
          // Find largest and smallest extensions
          const sortedBySize = history.sort((a, b) => a.extension?.size - b.extension?.size);
          stats.smallestExtension = sortedBySize[0]?.extension || null;
          stats.largestExtension = sortedBySize[sortedBySize.length - 1]?.extension || null;
        }
      }
      
      return stats;
    } catch (error) {
      this.logger.warn(`Failed to get build statistics: ${error.message}`);
      return {
        project: path.basename(projectPath),
        error: error.message
      };
    }
  }

  /**
   * Record build in history
   * @param {string} projectPath - Project directory path
   * @param {Object} buildResult - Build result
   * @returns {Promise<void>}
   */
  async recordBuildHistory(projectPath, buildResult) {
    try {
      const historyFile = path.join(projectPath, '.aix-build-history.json');
      let history = [];
      
      // Load existing history
      if (await fs.pathExists(historyFile)) {
        history = await fs.readJson(historyFile);
      }
      
      // Add new build record
      const buildRecord = {
        timestamp: new Date().toISOString(),
        duration: buildResult.duration,
        success: buildResult.success,
        extension: buildResult.extension,
        output: buildResult.output ? buildResult.output.substring(0, 1000) : ''
      };
      
      history.push(buildRecord);
      
      // Keep only last 50 builds
      if (history.length > 50) {
        history = history.slice(-50);
      }
      
      await fs.writeJson(historyFile, history, { spaces: 2 });
    } catch (error) {
      this.logger.warn(`Failed to record build history: ${error.message}`);
    }
  }

  /**
   * Get build dependencies
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Array>} - Build dependencies
   */
  async getBuildDependencies(projectPath) {
    try {
      const libsDir = path.join(projectPath, 'libs');
      if (!await fs.pathExists(libsDir)) {
        return [];
      }
      
      const libFiles = await fs.readdir(libsDir);
      const dependencies = [];
      
      for (const file of libFiles) {
        if (file.endsWith('.jar')) {
          const filePath = path.join(libsDir, file);
          const stats = await fs.stat(filePath);
          
          dependencies.push({
            name: file.replace(/-\d+\.\d+\.\d+.*\.jar$/, ''),
            version: this.extractVersion(file),
            file: file,
            size: stats.size,
            sizeFormatted: this.formatFileSize(stats.size),
            modified: stats.mtime
          });
        }
      }
      
      return dependencies;
    } catch (error) {
      this.logger.warn(`Failed to get build dependencies: ${error.message}`);
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
   * Validate build dependencies
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Dependency validation result
   */
  async validateDependencies(projectPath) {
    const errors = [];
    const warnings = [];
    
    try {
      const libsDir = path.join(projectPath, 'libs');
      if (!await fs.pathExists(libsDir)) {
        warnings.push('No libs/ directory found');
        return { valid: true, errors, warnings };
      }
      
      const libFiles = await fs.readdir(libsDir);
      const jarFiles = libFiles.filter(file => file.endsWith('.jar'));
      
      if (jarFiles.length === 0) {
        warnings.push('No JAR files found in libs/ directory');
      }
      
      // Check for required dependencies
      const requiredDeps = [
        'appinventor-components.jar',
        'android.jar'
      ];
      
      for (const dep of requiredDeps) {
        if (!jarFiles.includes(dep)) {
          errors.push(`Missing required dependency: ${dep}`);
        }
      }
      
      // Validate JAR files
      for (const jarFile of jarFiles) {
        const jarPath = path.join(libsDir, jarFile);
        try {
          const stats = await fs.stat(jarPath);
          if (stats.size === 0) {
            errors.push(`JAR file is empty: ${jarFile}`);
          }
        } catch (error) {
          errors.push(`Cannot access JAR file ${jarFile}: ${error.message}`);
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
   * Create build configuration file
   * @param {string} projectPath - Project directory path
   * @param {Object} config - Build configuration
   * @returns {Promise<void>}
   */
  async createBuildConfig(projectPath, config) {
    const configFile = path.join(projectPath, 'build.config.json');
    await fs.writeJson(configFile, config, { spaces: 2 });
    
    this.logger.info(`Created build configuration: ${configFile}`);
  }

  /**
   * Load build configuration
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Build configuration
   */
  async loadBuildConfig(projectPath) {
    const configFile = path.join(projectPath, 'build.config.json');
    
    if (await fs.pathExists(configFile)) {
      return await fs.readJson(configFile);
    }
    
    // Return default configuration
    return {
      java: {
        version: '11',
        target: '11',
        encoding: 'UTF-8'
      },
      kotlin: {
        version: '1.8.0',
        jvmTarget: '11'
      },
      optimization: {
        enabled: false,
        level: 'normal'
      },
      signing: {
        enabled: false
      }
    };
  }
}

module.exports = BuildUtils;