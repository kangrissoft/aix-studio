const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

/**
 * Build Validator for AIX Studio
 * Validates build configuration and processes for App Inventor Extensions
 */
class BuildValidator {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.timeout = options.timeout || 60000; // 60 seconds
  }

  /**
   * Validate build configuration
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Build validation result
   */
  async validate(projectPath) {
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      build: {},
      environment: {},
      targets: {},
      performance: {}
    };

    try {
      // Validate build file
      validation.build = await this.validateBuildFile(projectPath);
      
      // Validate build environment
      validation.environment = await this.validateEnvironment();
      
      // Validate build targets
      validation.targets = await this.validateTargets(projectPath);
      
      // Check performance aspects
      validation.performance = await this.checkPerformance(projectPath);
      
      // Aggregate results
      const allResults = [
        validation.build,
        validation.environment,
        validation.targets,
        validation.performance
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
      validation.errors.push(`Build validation failed: ${error.message}`);
    }

    return validation;
  }

  /**
   * Validate build.xml file structure and content
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Build file validation result
   */
  async validateBuildFile(projectPath) {
    const result = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      const buildFile = path.join(projectPath, 'build.xml');
      if (!await fs.pathExists(buildFile)) {
        result.errors.push('Build file (build.xml) not found');
        result.valid = false;
        return result;
      }

      const content = await fs.readFile(buildFile, 'utf8');

      // Check XML validity
      if (!content.trim().startsWith('<?xml')) {
        result.errors.push('Build file does not start with XML declaration');
      }

      // Check for project element
      if (!content.includes('<project')) {
        result.errors.push('Missing <project> element in build.xml');
        result.valid = false;
        return result;
      }

      // Check required properties
      const requiredProperties = [
        { name: 'src.dir', description: 'Source directory' },
        { name: 'build.dir', description: 'Build output directory' },
        { name: 'dist.dir', description: 'Distribution directory' },
        { name: 'libs.dir', description: 'Libraries directory' }
      ];

      for (const prop of requiredProperties) {
        const propPattern = new RegExp(`<property\\s+name="${prop.name}"[^>]*>`);
        if (!propPattern.test(content)) {
          result.warnings.push(`Missing required property: ${prop.name} (${prop.description})`);
        }
      }

      // Check for classpath
      const hasClasspath = content.includes('<classpath') || content.includes('classpathref=');
      if (!hasClasspath) {
        result.warnings.push('No classpath defined in build.xml');
      }

      // Validate Java compatibility
      const javaCompatibility = await this.validateJavaCompatibility(content);
      result.errors.push(...javaCompatibility.errors);
      result.warnings.push(...javaCompatibility.warnings);

      // Validate encoding
      const encodingValidation = this.validateEncoding(content);
      result.warnings.push(...encodingValidation.warnings);

      // Validate directory structure
      const dirValidation = await this.validateDirectoryStructure(projectPath, content);
      result.warnings.push(...dirValidation.warnings);

    } catch (error) {
      result.errors.push(`Build file validation failed: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate Java version compatibility
   * @param {string} content - Build file content
   * @returns {Object} - Java compatibility validation result
   */
  validateJavaCompatibility(content) {
    const result = {
      errors: [],
      warnings: []
    };

    // Check source and target compatibility
    const sourceMatch = content.match(/source="(\d+\.\d+|\d+)"/);
    const targetMatch = content.match(/target="(\d+\.\d+|\d+)"/);

    if (sourceMatch) {
      const sourceVersion = parseFloat(sourceMatch[1]);
      if (sourceVersion < 11) {
        result.warnings.push(`Java source version ${sourceVersion} is below recommended 11`);
      } else if (sourceVersion > 11) {
        result.warnings.push(`Java source version ${sourceVersion} may not be compatible with App Inventor`);
      }
    } else {
      result.warnings.push('Missing Java source version specification');
    }

    if (targetMatch) {
      const targetVersion = parseFloat(targetMatch[1]);
      if (targetVersion < 11) {
        result.warnings.push(`Java target version ${targetVersion} is below recommended 11`);
      } else if (targetVersion > 11) {
        result.warnings.push(`Java target version ${targetVersion} may not be compatible with App Inventor`);
      }
    } else {
      result.warnings.push('Missing Java target version specification');
    }

    return result;
  }

  /**
   * Validate encoding specification
   * @param {string} content - Build file content
   * @returns {Object} - Encoding validation result
   */
  validateEncoding(content) {
    const result = {
      warnings: []
    };

    // Check for UTF-8 encoding
    const encodingMatch = content.match(/encoding="([^"]+)"/);
    if (encodingMatch) {
      const encoding = encodingMatch[1].toLowerCase();
      if (encoding !== 'utf-8') {
        result.warnings.push(`Source encoding is ${encoding}, recommended is UTF-8`);
      }
    } else {
      result.warnings.push('Missing source encoding specification, recommended is UTF-8');
    }

    return result;
  }

  /**
   * Validate directory structure references
   * @param {string} projectPath - Project directory path
   * @param {string} content - Build file content
   * @returns {Promise<Object>} - Directory validation result
   */
  async validateDirectoryStructure(projectPath, content) {
    const result = {
      warnings: []
    };

    // Check if referenced directories exist
    const dirPatterns = [
      { pattern: /src\.dir["\s]*value=["']([^"']+)["']/, name: 'src.dir' },
      { pattern: /build\.dir["\s]*value=["']([^"']+)["']/, name: 'build.dir' },
      { pattern: /dist\.dir["\s]*value=["']([^"']+)["']/, name: 'dist.dir' },
      { pattern: /libs\.dir["\s]*value=["']([^"']+)["']/, name: 'libs.dir' }
    ];

    for (const { pattern, name } of dirPatterns) {
      const match = content.match(pattern);
      if (match) {
        const dirValue = match[1];
        // Skip if it's a property reference
        if (!dirValue.includes('${')) {
          const dirPath = path.join(projectPath, dirValue);
          if (await fs.pathExists(dirPath)) {
            const stat = await fs.stat(dirPath);
            if (!stat.isDirectory()) {
              result.warnings.push(`Referenced ${name} path exists but is not a directory: ${dirValue}`);
            }
          } else {
            result.warnings.push(`Referenced ${name} directory does not exist: ${dirValue}`);
          }
        }
      }
    }

    return result;
  }

  /**
   * Validate build environment
   * @returns {Promise<Object>} - Environment validation result
   */
  async validateEnvironment() {
    const result = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      // Check Java installation
      const javaValidation = await this.validateJava();
      result.errors.push(...javaValidation.errors);
      result.warnings.push(...javaValidation.warnings);

      // Check Ant installation
      const antValidation = await this.validateAnt();
      result.errors.push(...antValidation.errors);
      result.warnings.push(...antValidation.warnings);

      // Check environment variables
      const envValidation = this.validateEnvironmentVariables();
      result.warnings.push(...envValidation.warnings);

    } catch (error) {
      result.errors.push(`Environment validation failed: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate Java installation
   * @returns {Promise<Object>} - Java validation result
   */
  async validateJava() {
    const result = {
      errors: [],
      warnings: []
    };

    try {
      const { stdout, stderr } = await execAsync('java -version', { timeout: 5000 });
      const output = stdout + stderr;

      // Check Java version
      const versionMatch = output.match(/version "(\d+\.\d+)/) || 
                           output.match(/openjdk version "(\d+\.\d+)/);
      
      if (versionMatch) {
        const version = parseFloat(versionMatch[1]);
        if (version < 11) {
          result.errors.push(`Java version ${version} is not supported. Please use Java 11 or higher.`);
        } else if (version > 11) {
          result.warnings.push(`Java version ${version} detected. App Inventor recommends Java 11.`);
        }
      } else {
        result.warnings.push('Could not determine Java version');
      }

      // Check JAVA_HOME
      if (!process.env.JAVA_HOME) {
        result.warnings.push('JAVA_HOME environment variable is not set');
      }

    } catch (error) {
      result.errors.push('Java is not installed or not in PATH');
    }

    return result;
  }

  /**
   * Validate Ant installation
   * @returns {Promise<Object>} - Ant validation result
   */
  async validateAnt() {
    const result = {
      errors: [],
      warnings: []
    };

    try {
      const { stdout } = await execAsync('ant -version', { timeout: 5000 });

      // Check Ant version
      if (!stdout.includes('Apache Ant')) {
        result.warnings.push('Could not determine Ant version');
      }

      // Check ANT_HOME
      if (!process.env.ANT_HOME) {
        result.warnings.push('ANT_HOME environment variable is not set');
      }

    } catch (error) {
      result.errors.push('Apache Ant is not installed or not in PATH');
    }

    return result;
  }

  /**
   * Validate environment variables
   * @returns {Object} - Environment variables validation result
   */
  validateEnvironmentVariables() {
    const result = {
      warnings: []
    };

    const importantVars = [
      { name: 'JAVA_HOME', description: 'Java installation directory' },
      { name: 'ANT_HOME', description: 'Ant installation directory' },
      { name: 'PATH', description: 'Executable search paths' }
    ];

    for (const { name, description } of importantVars) {
      if (!process.env[name]) {
        result.warnings.push(`Environment variable ${name} (${description}) is not set`);
      }
    }

    return result;
  }

  /**
   * Validate build targets
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Targets validation result
   */
  async validateTargets(projectPath) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      availableTargets: []
    };

    try {
      const buildFile = path.join(projectPath, 'build.xml');
      if (!await fs.pathExists(buildFile)) {
        result.errors.push('Build file not found');
        result.valid = false;
        return result;
      }

      const content = await fs.readFile(buildFile, 'utf8');

      // Check for required targets
      const requiredTargets = [
        { name: 'clean', description: 'Clean build directories' },
        { name: 'compile', description: 'Compile source code' },
        { name: 'package', description: 'Package extension' }
      ];

      for (const target of requiredTargets) {
        const targetPattern = new RegExp(`<target\\s+name="${target.name}"[^>]*>`);
        if (!targetPattern.test(content)) {
          result.errors.push(`Missing required target: ${target.name} (${target.description})`);
          result.valid = false;
        }
      }

      // Extract available targets
      const targetRegex = /<target\s+name=["']([^"']+)["']/g;
      let match;
      while ((match = targetRegex.exec(content)) !== null) {
        result.availableTargets.push(match[1]);
      }

      // Validate target dependencies
      const depValidation = this.validateTargetDependencies(content);
      result.warnings.push(...depValidation.warnings);

    } catch (error) {
      result.errors.push(`Target validation failed: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate target dependencies
   * @param {string} content - Build file content
   * @returns {Object} - Dependencies validation result
   */
  validateTargetDependencies(content) {
    const result = {
      warnings: []
    };

    // Check for circular dependencies
    const targetDeps = {};
    const targetRegex = /<target\s+name=["']([^"']+)["'](?:\s+depends=["']([^"']+)["'])?/g;
    let match;
    
    while ((match = targetRegex.exec(content)) !== null) {
      const targetName = match[1];
      const dependencies = match[2] ? match[2].split(',').map(d => d.trim()) : [];
      targetDeps[targetName] = dependencies;
    }

    // Simple circular dependency check (basic implementation)
    for (const [target, deps] of Object.entries(targetDeps)) {
      for (const dep of deps) {
        if (targetDeps[dep] && targetDeps[dep].includes(target)) {
          result.warnings.push(`Potential circular dependency between targets: ${target} <-> ${dep}`);
        }
      }
    }

    return result;
  }

  /**
   * Check build performance aspects
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Performance validation result
   */
  async checkPerformance(projectPath) {
    const result = {
      warnings: []
    };

    try {
      // Check project size
      const projectSize = await this.getProjectSize(projectPath);
      if (projectSize > 100 * 1024 * 1024) { // 100MB
        result.warnings.push(`Project is very large (${this.formatFileSize(projectSize)}). Consider optimizing.`);
      }

      // Check number of source files
      const srcDir = path.join(projectPath, 'src');
      if (await fs.pathExists(srcDir)) {
        const sourceFiles = await this.countSourceFiles(srcDir);
        if (sourceFiles > 100) {
          result.warnings.push(`Project has ${sourceFiles} source files. Consider modularization.`);
        }
      }

      // Check dependency size
      const libsDir = path.join(projectPath, 'libs');
      if (await fs.pathExists(libsDir)) {
        const libSize = await this.getDirectorySize(libsDir);
        if (libSize > 50 * 1024 * 1024) { // 50MB
          result.warnings.push(`Dependencies are very large (${this.formatFileSize(libSize)}). Consider trimming.`);
        }
      }

    } catch (error) {
      result.warnings.push(`Performance check failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Get project directory size
   * @param {string} projectPath - Project directory path
   * @returns {Promise<number>} - Directory size in bytes
   */
  async getProjectSize(projectPath) {
    return this.getDirectorySize(projectPath);
  }

  /**
   * Get directory size recursively
   * @param {string} dirPath - Directory path
   * @returns {Promise<number>} - Directory size in bytes
   */
  async getDirectorySize(dirPath) {
    const files = await fs.readdir(dirPath);
    let totalSize = 0;

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        totalSize += await this.getDirectorySize(filePath);
      } else {
        totalSize += stat.size;
      }
    }

    return totalSize;
  }

  /**
   * Count source files in directory
   * @param {string} srcDir - Source directory path
   * @returns {Promise<number>} - Number of source files
   */
  async countSourceFiles(srcDir) {
    const javaFiles = await this.findFiles(srcDir, '.java');
    const kotlinFiles = await this.findFiles(srcDir, '.kt');
    return javaFiles.length + kotlinFiles.length;
  }

  /**
   * Find files with specific extension
   * @param {string} dir - Directory to search
   * @param {string} extension - File extension
   * @returns {Promise<Array>} - File paths
   */
  async findFiles(dir, extension) {
    const files = await fs.readdir(dir);
    let results = [];
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isDirectory()) {
        const subFiles = await this.findFiles(filePath, extension);
        results = results.concat(subFiles);
      } else if (file.endsWith(extension)) {
        results.push(filePath);
      }
    }
    
    return results;
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
   * Test build process
   * @param {string} projectPath - Project directory path
   * @param {Object} options - Test options
   * @returns {Promise<Object>} - Build test result
   */
  async testBuild(projectPath, options = {}) {
    const result = {
      success: true,
      errors: [],
      warnings: [],
      duration: 0,
      targetsTested: []
    };

    try {
      const startTime = Date.now();

      // Test clean target
      await this.testBuildTarget(projectPath, 'clean');
      result.targetsTested.push('clean');

      // Test compile target
      await this.testBuildTarget(projectPath, 'compile');
      result.targetsTested.push('compile');

      // Test package target
      const packageResult = await this.testBuildTarget(projectPath, 'package');
      result.targetsTested.push('package');

      // Check if .aix file was created
      if (packageResult.output && packageResult.output.includes('Extension built:')) {
        const aixMatch = packageResult.output.match(/Extension built: ([^\n]+)/);
        if (aixMatch) {
          const aixPath = aixMatch[1].trim();
          if (!await fs.pathExists(aixPath)) {
            result.errors.push(`Expected .aix file not found: ${aixPath}`);
          }
        }
      }

      const endTime = Date.now();
      result.duration = endTime - startTime;

    } catch (error) {
      result.success = false;
      result.errors.push(`Build test failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Test specific build target
   * @param {string} projectPath - Project directory path
   * @param {string} target - Build target name
   * @returns {Promise<Object>} - Target test result
   */
  async testBuildTarget(projectPath, target) {
    return new Promise((resolve, reject) => {
      const antProcess = exec(`ant ${target}`, {
        cwd: projectPath,
        timeout: this.timeout
      });

      let output = '';
      let error = '';

      antProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      antProcess.stderr.on('data', (data) => {
        error += data.toString();
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
          reject(new Error(`Build target '${target}' failed with exit code ${code}: ${error}`));
        }
      });

      antProcess.on('error', (err) => {
        reject(new Error(`Failed to start build target '${target}': ${err.message}`));
      });
    });
  }

  /**
   * Generate build validation report
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
    let report = '=== AIX Studio Build Validation Report ===\n\n';
    
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
    <title>AIX Studio Build Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2196F3; border-bottom: 2px solid #2196F3; padding-bottom: 10px; }
        h2 { color: #4CAF50; margin-top: 30px; }
        .status { padding: 10px; border-radius: 4px; margin: 20px 0; }
        .valid { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
        .invalid { background: #ffebee; color: #c62828; border: 1px solid #ffcdd2; }
        .section { margin: 20px 0; }
        .error, .warning { padding: 8px; margin: 5px 0; border-radius: 4px; }
        .error { background: #ffebee; color: #c62828; border-left: 4px solid #f44336; }
        .warning { background: #fff8e1; color: #f57f17; border-left: 4px solid #ffc107; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏗️ AIX Studio Build Validation Report</h1>
        
        <div class="status ${validation.valid ? 'valid' : 'invalid'}">
            <strong>Status:</strong> ${validation.valid ? 'VALID' : 'INVALID'}
        </div>
        
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
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
            <p>Generated by AIX Studio Build Validator</p>
        </div>
    </div>
</body>
</html>`;
    
    return html;
  }
}

module.exports = BuildValidator;