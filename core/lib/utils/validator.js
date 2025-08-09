const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

/**
 * Validator Utility for AIX Studio
 * Provides validation for projects, builds, dependencies, and configurations
 */
class Validator {
  /**
   * Create validator instance
   * @param {Object} options - Validator options
   */
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.strict = options.strict !== false;
  }

  /**
   * Validate project structure
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Validation result
   */
  async validateProject(projectPath) {
    const errors = [];
    const warnings = [];
    
    try {
      // Check if project directory exists
      if (!await fs.pathExists(projectPath)) {
        errors.push(`Project directory does not exist: ${projectPath}`);
        return { valid: false, errors, warnings };
      }
      
      // Check required files and directories
      const requiredItems = [
        { path: 'src', type: 'directory' },
        { path: 'build.xml', type: 'file' },
        { path: 'assets', type: 'directory' },
        { path: 'libs', type: 'directory' }
      ];
      
      for (const item of requiredItems) {
        const fullPath = path.join(projectPath, item.path);
        const exists = await fs.pathExists(fullPath);
        
        if (!exists) {
          if (item.type === 'directory') {
            warnings.push(`Missing recommended directory: ${item.path}`);
          } else {
            errors.push(`Missing required file: ${item.path}`);
          }
        } else {
          const stat = await fs.stat(fullPath);
          const isDirectory = stat.isDirectory();
          
          if (item.type === 'directory' && !isDirectory) {
            errors.push(`Expected directory but found file: ${item.path}`);
          } else if (item.type === 'file' && isDirectory) {
            errors.push(`Expected file but found directory: ${item.path}`);
          }
        }
      }
      
      // Validate source files
      const srcDir = path.join(projectPath, 'src');
      if (await fs.pathExists(srcDir)) {
        const javaFiles = await this.findFiles(srcDir, '.java');
        const ktFiles = await this.findFiles(srcDir, '.kt');
        
        if (javaFiles.length === 0 && ktFiles.length === 0) {
          warnings.push('No source files found in src/ directory');
        }
        
        // Check for main extension class
        const hasMainClass = await this.hasMainExtensionClass(srcDir);
        if (!hasMainClass) {
          warnings.push('No main extension class found in src/ directory');
        }
      }
      
      // Validate build file
      const buildFile = path.join(projectPath, 'build.xml');
      if (await fs.pathExists(buildFile)) {
        const buildValidation = await this.validateBuildFile(buildFile);
        errors.push(...buildValidation.errors);
        warnings.push(...buildValidation.warnings);
      }
      
      // Validate configuration files
      const configValidation = await this.validateConfigFiles(projectPath);
      errors.push(...configValidation.errors);
      warnings.push(...configValidation.warnings);
      
    } catch (error) {
      errors.push(`Validation failed: ${error.message}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
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
   * Check if directory contains main extension class
   * @param {string} srcDir - Source directory
   * @returns {Promise<boolean>} - True if main class found
   */
  async hasMainExtensionClass(srcDir) {
    const javaFiles = await this.findFiles(srcDir, '.java');
    const ktFiles = await this.findFiles(srcDir, '.kt');
    const allFiles = [...javaFiles, ...ktFiles];
    
    for (const file of allFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        if (/@DesignerComponent/.test(content)) {
          return true;
        }
      } catch (error) {
        // Continue checking other files
      }
    }
    
    return false;
  }

  /**
   * Validate build file
   * @param {string} buildFile - Build file path
   * @returns {Promise<Object>} - Validation result
   */
  async validateBuildFile(buildFile) {
    const errors = [];
    const warnings = [];
    
    try {
      const content = await fs.readFile(buildFile, 'utf8');
      
      // Check for required targets
      const requiredTargets = ['clean', 'compile', 'package'];
      for (const target of requiredTargets) {
        if (!content.includes(`<target name="${target}"`)) {
          errors.push(`Missing required target in build.xml: ${target}`);
        }
      }
      
      // Check for classpath
      if (!content.includes('<classpath') && !content.includes('classpathref=')) {
        warnings.push('No classpath defined in build.xml');
      }
      
      // Check for source and target compatibility
      if (!content.includes('source="11"') || !content.includes('target="11"')) {
        warnings.push('Java source/target should be set to 11 for App Inventor compatibility');
      }
      
      // Check for encoding
      if (!content.includes('encoding="UTF-8"')) {
        warnings.push('Source encoding should be UTF-8');
      }
      
    } catch (error) {
      errors.push(`Failed to validate build file: ${error.message}`);
    }
    
    return { errors, warnings };
  }

  /**
   * Validate configuration files
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Validation result
   */
  async validateConfigFiles(projectPath) {
    const errors = [];
    const warnings = [];
    
    // Check for package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      try {
        const packageJson = await fs.readJson(packageJsonPath);
        
        // Validate required fields
        const requiredFields = ['name', 'version'];
        for (const field of requiredFields) {
          if (!packageJson[field]) {
            warnings.push(`Missing required field in package.json: ${field}`);
          }
        }
      } catch (error) {
        errors.push(`Invalid package.json: ${error.message}`);
      }
    }
    
    // Check for README.md
    const readmePath = path.join(projectPath, 'README.md');
    if (!await fs.pathExists(readmePath)) {
      warnings.push('Missing README.md file');
    }
    
    // Check for .gitignore
    const gitignorePath = path.join(projectPath, '.gitignore');
    if (!await fs.pathExists(gitignorePath)) {
      warnings.push('Missing .gitignore file');
    }
    
    return { errors, warnings };
  }

  /**
   * Validate build environment
   * @param {Object} options - Environment options
   * @returns {Promise<Object>} - Validation result
   */
  async validateEnvironment(options = {}) {
    const errors = [];
    const warnings = [];
    
    try {
      // Check Java installation
      const javaValidation = await this.validateJava();
      errors.push(...javaValidation.errors);
      warnings.push(...javaValidation.warnings);
      
      // Check Ant installation
      const antValidation = await this.validateAnt();
      errors.push(...antValidation.errors);
      warnings.push(...antValidation.warnings);
      
      // Check Kotlin installation (if needed)
      if (options.kotlin) {
        const kotlinValidation = await this.validateKotlin();
        errors.push(...kotlinValidation.errors);
        warnings.push(...kotlin.validation.warnings);
      }
      
    } catch (error) {
      errors.push(`Environment validation failed: ${error.message}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate Java installation
   * @returns {Promise<Object>} - Validation result
   */
  async validateJava() {
    const errors = [];
    const warnings = [];
    
    try {
      const { stdout } = await execAsync('java -version', { timeout: 5000 });
      
      // Check Java version
      const versionMatch = stdout.match(/version "(\d+\.\d+)/) || 
                           stdout.match(/openjdk version "(\d+\.\d+)/);
      
      if (versionMatch) {
        const version = parseFloat(versionMatch[1]);
        if (version < 11) {
          errors.push(`Java version ${version} is not supported. Please use Java 11 or higher.`);
        }
      } else {
        warnings.push('Could not determine Java version');
      }
      
      // Check JAVA_HOME
      if (!process.env.JAVA_HOME) {
        warnings.push('JAVA_HOME environment variable is not set');
      }
      
    } catch (error) {
      errors.push('Java is not installed or not in PATH');
    }
    
    return { errors, warnings };
  }

  /**
   * Validate Ant installation
   * @returns {Promise<Object>} - Validation result
   */
  async validateAnt() {
    const errors = [];
    const warnings = [];
    
    try {
      const { stdout } = await execAsync('ant -version', { timeout: 5000 });
      
      // Check Ant version
      if (!stdout.includes('Apache Ant')) {
        warnings.push('Could not determine Ant version');
      }
      
      // Check ANT_HOME
      if (!process.env.ANT_HOME) {
        warnings.push('ANT_HOME environment variable is not set');
      }
      
    } catch (error) {
      errors.push('Apache Ant is not installed or not in PATH');
    }
    
    return { errors, warnings };
  }

  /**
   * Validate Kotlin installation
   * @returns {Promise<Object>} - Validation result
   */
  async validateKotlin() {
    const errors = [];
    const warnings = [];
    
    try {
      const { stdout } = await execAsync('kotlinc -version', { timeout: 5000 });
      
      // Check Kotlin version
      if (!stdout.includes('Kotlin compiler')) {
        warnings.push('Could not determine Kotlin compiler version');
      }
      
    } catch (error) {
      warnings.push('Kotlin compiler is not installed or not in PATH');
    }
    
    return { errors, warnings };
  }

  /**
   * Validate dependencies
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Validation result
   */
  async validateDependencies(projectPath) {
    const errors = [];
    const warnings = [];
    
    try {
      const libsDir = path.join(projectPath, 'libs');
      if (!await fs.pathExists(libsDir)) {
        warnings.push('No libs/ directory found');
        return { errors, warnings };
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
          warnings.push(`Missing required dependency: ${dep}`);
        }
      }
      
      // Validate JAR files
      for (const jarFile of jarFiles) {
        const jarPath = path.join(libsDir, jarFile);
        const validation = await this.validateJarFile(jarPath);
        errors.push(...validation.errors);
        warnings.push(...validation.warnings);
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
   * Validate JAR file
   * @param {string} jarPath - JAR file path
   * @returns {Promise<Object>} - Validation result
   */
  async validateJarFile(jarPath) {
    const errors = [];
    const warnings = [];
    
    try {
      // Check if file exists and is readable
      await fs.access(jarPath, fs.constants.R_OK);
      
      // Check file size
      const stats = await fs.stat(jarPath);
      if (stats.size === 0) {
        errors.push(`JAR file is empty: ${path.basename(jarPath)}`);
      } else if (stats.size > 100 * 1024 * 1024) { // 100MB
        warnings.push(`JAR file is very large (${this.formatFileSize(stats.size)}): ${path.basename(jarPath)}`);
      }
      
    } catch (error) {
      errors.push(`Cannot access JAR file ${path.basename(jarPath)}: ${error.message}`);
    }
    
    return { errors, warnings };
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
   * Validate build process
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Validation result
   */
  async validateBuild(projectPath) {
    const errors = [];
    const warnings = [];
    
    try {
      // Validate project structure first
      const projectValidation = await this.validateProject(projectPath);
      errors.push(...projectValidation.errors);
      warnings.push(...projectValidation.warnings);
      
      if (errors.length > 0) {
        return { valid: false, errors, warnings };
      }
      
      // Test build process
      const buildTest = await this.testBuild(projectPath);
      errors.push(...buildTest.errors);
      warnings.push(...buildTest.warnings);
      
    } catch (error) {
      errors.push(`Build validation failed: ${error.message}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Test build process
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Test result
   */
  async testBuild(projectPath) {
    const errors = [];
    const warnings = [];
    
    try {
      // Test clean target
      await execAsync('ant clean', { cwd: projectPath, timeout: 30000 });
      
      // Test compile target
      await execAsync('ant compile', { cwd: projectPath, timeout: 60000 });
      
      // Test package target
      const { stdout } = await execAsync('ant package', { cwd: projectPath, timeout: 60000 });
      
      // Check if .aix file was created
      if (stdout.includes('Extension built:')) {
        const aixMatch = stdout.match(/Extension built: ([^\n]+)/);
        if (aixMatch) {
          const aixPath = aixMatch[1].trim();
          if (!await fs.pathExists(aixPath)) {
            errors.push(`Expected .aix file not found: ${aixPath}`);
          }
        }
      } else {
        warnings.push('Build completed but no .aix file path found in output');
      }
      
    } catch (error) {
      errors.push(`Build test failed: ${error.message}`);
    }
    
    return { errors, warnings };
  }

  /**
   * Validate code quality
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Validation result
   */
  async validateCodeQuality(projectPath) {
    const errors = [];
    const warnings = [];
    
    try {
      const srcDir = path.join(projectPath, 'src');
      if (!await fs.pathExists(srcDir)) {
        return { valid: true, errors, warnings };
      }
      
      // Check for source files
      const javaFiles = await this.findFiles(srcDir, '.java');
      const ktFiles = await this.findFiles(srcDir, '.kt');
      
      // Validate Java files
      for (const javaFile of javaFiles) {
        const validation = await this.validateJavaFile(javaFile);
        errors.push(...validation.errors);
        warnings.push(...validation.warnings);
      }
      
      // Validate Kotlin files
      for (const ktFile of ktFiles) {
        const validation = await this.validateKotlinFile(ktFile);
        errors.push(...validation.errors);
        warnings.push(...validation.warnings);
      }
      
    } catch (error) {
      errors.push(`Code quality validation failed: ${error.message}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate Java file
   * @param {string} javaFile - Java file path
   * @returns {Promise<Object>} - Validation result
   */
  async validateJavaFile(javaFile) {
    const errors = [];
    const warnings = [];
    
    try {
      const content = await fs.readFile(javaFile, 'utf8');
      
      // Check for required imports
      if (!content.includes('com.google.appinventor.components.annotations')) {
        warnings.push(`Missing App Inventor annotations import in ${path.basename(javaFile)}`);
      }
      
      if (!content.includes('com.google.appinventor.components.runtime')) {
        warnings.push(`Missing App Inventor runtime import in ${path.basename(javaFile)}`);
      }
      
      // Check for @DesignerComponent annotation
      if (content.includes('class') && !content.includes('@DesignerComponent')) {
        warnings.push(`Class ${path.basename(javaFile)} may be missing @DesignerComponent annotation`);
      }
      
      // Check for proper method annotations
      const methodRegex = /public\s+\w+\s+(\w+)\s*\([^)]*\)/g;
      let match;
      while ((match = methodRegex.exec(content)) !== null) {
        const methodName = match[1];
        const methodStart = content.lastIndexOf('public', match.index);
        const methodBlock = content.substring(methodStart, match.index + match[0].length);
        
        if (!methodBlock.includes('@SimpleFunction') && 
            !methodBlock.includes('@SimpleProperty') && 
            !methodBlock.includes('@SimpleEvent')) {
          warnings.push(`Method ${methodName} in ${path.basename(javaFile)} may be missing annotation`);
        }
      }
      
    } catch (error) {
      errors.push(`Failed to validate Java file ${path.basename(javaFile)}: ${error.message}`);
    }
    
    return { errors, warnings };
  }

  /**
   * Validate Kotlin file
   * @param {string} ktFile - Kotlin file path
   * @returns {Promise<Object>} - Validation result
   */
  async validateKotlinFile(ktFile) {
    const errors = [];
    const warnings = [];
    
    try {
      const content = await fs.readFile(ktFile, 'utf8');
      
      // Check for required imports
      if (!content.includes('com.google.appinventor.components.annotations')) {
        warnings.push(`Missing App Inventor annotations import in ${path.basename(ktFile)}`);
      }
      
      if (!content.includes('com.google.appinventor.components.runtime')) {
        warnings.push(`Missing App Inventor runtime import in ${path.basename(ktFile)}`);
      }
      
      // Check for @DesignerComponent annotation
      if (content.includes('class') && !content.includes('@DesignerComponent')) {
        warnings.push(`Class ${path.basename(ktFile)} may be missing @DesignerComponent annotation`);
      }
      
      // Check for proper method annotations
      const methodRegex = /fun\s+(\w+)\s*\([^)]*\)/g;
      let match;
      while ((match = methodRegex.exec(content)) !== null) {
        const methodName = match[1];
        const methodStart = content.lastIndexOf('fun', match.index);
        const methodBlock = content.substring(methodStart, match.index + match[0].length);
        
        if (!methodBlock.includes('@SimpleFunction') && 
            !methodBlock.includes('@SimpleProperty') && 
            !methodBlock.includes('@SimpleEvent')) {
          warnings.push(`Method ${methodName} in ${path.basename(ktFile)} may be missing annotation`);
        }
      }
      
    } catch (error) {
      errors.push(`Failed to validate Kotlin file ${path.basename(ktFile)}: ${error.message}`);
    }
    
    return { errors, warnings };
  }

  /**
   * Run comprehensive validation
   * @param {string} projectPath - Project directory path
   * @param {Object} options - Validation options
   * @returns {Promise<Object>} - Comprehensive validation result
   */
  async validateAll(projectPath, options = {}) {
    const results = {
      project: null,
      environment: null,
      dependencies: null,
      build: null,
      codeQuality: null,
      valid: true,
      errors: [],
      warnings: []
    };
    
    try {
      // Validate project structure
      results.project = await this.validateProject(projectPath);
      
      // Validate environment
      results.environment = await this.validateEnvironment(options);
      
      // Validate dependencies
      results.dependencies = await this.validateDependencies(projectPath);
      
      // Validate build (if requested)
      if (options.build) {
        results.build = await this.validateBuild(projectPath);
      }
      
      // Validate code quality (if requested)
      if (options.codeQuality) {
        results.codeQuality = await this.validateCodeQuality(projectPath);
      }
      
      // Aggregate results
      const allResults = [
        results.project,
        results.environment,
        results.dependencies,
        results.build,
        results.codeQuality
      ].filter(result => result !== null);
      
      for (const result of allResults) {
        results.errors.push(...result.errors);
        results.warnings.push(...result.warnings);
      }
      
      results.valid = results.errors.length === 0;
      
    } catch (error) {
      results.valid = false;
      results.errors.push(`Comprehensive validation failed: ${error.message}`);
    }
    
    return results;
  }

  /**
   * Generate validation report
   * @param {Object} validationResult - Validation result
   * @param {string} format - Report format (text, json, html)
   * @returns {string} - Formatted report
   */
  generateReport(validationResult, format = 'text') {
    switch (format) {
      case 'json':
        return JSON.stringify(validationResult, null, 2);
      
      case 'html':
        return this.generateHtmlReport(validationResult);
      
      default:
        return this.generateTextReport(validationResult);
    }
  }

  /**
   * Generate text validation report
   * @param {Object} validationResult - Validation result
   * @returns {string} - Text report
   */
  generateTextReport(validationResult) {
    let report = '=== AIX Studio Validation Report ===\n\n';
    
    report += `Validation Status: ${validationResult.valid ? 'PASSED' : 'FAILED'}\n`;
    report += `Timestamp: ${new Date().toISOString()}\n\n`;
    
    if (validationResult.errors.length > 0) {
      report += 'Errors:\n';
      validationResult.errors.forEach((error, index) => {
        report += `  ${index + 1}. ${error}\n`;
      });
      report += '\n';
    }
    
    if (validationResult.warnings.length > 0) {
      report += 'Warnings:\n';
      validationResult.warnings.forEach((warning, index) => {
        report += `  ${index + 1}. ${warning}\n`;
      });
      report += '\n';
    }
    
    return report;
  }

  /**
   * Generate HTML validation report
   * @param {Object} validationResult - Validation result
   * @returns {string} - HTML report
   */
  generateHtmlReport(validationResult) {
    let html = `<!DOCTYPE html>
<html>
<head>
    <title>AIX Studio Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2196F3; border-bottom: 2px solid #2196F3; padding-bottom: 10px; }
        .status { padding: 10px; border-radius: 4px; margin: 20px 0; }
        .passed { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
        .failed { background: #ffebee; color: #c62828; border: 1px solid #ffcdd2; }
        .section { margin: 20px 0; }
        .section h2 { color: #4CAF50; margin-top: 30px; }
        .error, .warning { padding: 8px; margin: 5px 0; border-radius: 4px; }
        .error { background: #ffebee; color: #c62828; border-left: 4px solid #f44336; }
        .warning { background: #fff8e1; color: #f57f17; border-left: 4px solid #ffc107; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📝 AIX Studio Validation Report</h1>
        
        <div class="status ${validationResult.valid ? 'passed' : 'failed'}">
            <strong>Status:</strong> ${validationResult.valid ? 'PASSED' : 'FAILED'}
        </div>
        
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
`;
    
    if (validationResult.errors.length > 0) {
      html += `
        <div class="section">
            <h2>❌ Errors (${validationResult.errors.length})</h2>
`;
      validationResult.errors.forEach((error, index) => {
        html += `            <div class="error">${error}</div>\n`;
      });
      html += `        </div>\n`;
    }
    
    if (validationResult.warnings.length > 0) {
      html += `
        <div class="section">
            <h2>⚠️ Warnings (${validationResult.warnings.length})</h2>
`;
      validationResult.warnings.forEach((warning, index) => {
        html += `            <div class="warning">${warning}</div>\n`;
      });
      html += `        </div>\n`;
    }
    
    html += `
        <div class="footer">
            <p>Generated by AIX Studio Validator</p>
        </div>
    </div>
</body>
</html>`;
    
    return html;
  }
}

module.exports = Validator;