const fs = require('fs-extra');
const path = require('path');

/**
 * Project Validator for AIX Studio
 * Validates App Inventor Extension project structure and configuration
 */
class ProjectValidator {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.strict = options.strict !== false;
  }

  /**
   * Validate entire project
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Validation result
   */
  async validate(projectPath) {
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      project: {
        path: projectPath,
        name: path.basename(projectPath)
      },
      structure: {},
      configuration: {},
      source: {},
      build: {},
      dependencies: {}
    };

    try {
      // Validate project structure
      validation.structure = await this.validateStructure(projectPath);
      
      // Validate project configuration
      validation.configuration = await this.validateConfiguration(projectPath);
      
      // Validate source files
      validation.source = await this.validateSource(projectPath);
      
      // Validate build configuration
      validation.build = await this.validateBuild(projectPath);
      
      // Validate dependencies
      validation.dependencies = await this.validateDependencies(projectPath);
      
      // Aggregate results
      const allResults = [
        validation.structure,
        validation.configuration,
        validation.source,
        validation.build,
        validation.dependencies
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
      validation.errors.push(`Project validation failed: ${error.message}`);
    }

    return validation;
  }

  /**
   * Validate project directory structure
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Structure validation result
   */
  async validateStructure(projectPath) {
    const result = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      // Check if project directory exists
      if (!await fs.pathExists(projectPath)) {
        result.errors.push(`Project directory does not exist: ${projectPath}`);
        result.valid = false;
        return result;
      }

      // Check required directories
      const requiredDirs = ['src', 'assets', 'libs'];
      for (const dir of requiredDirs) {
        const dirPath = path.join(projectPath, dir);
        if (!await fs.pathExists(dirPath)) {
          result.warnings.push(`Missing recommended directory: ${dir}`);
        } else {
          const stat = await fs.stat(dirPath);
          if (!stat.isDirectory()) {
            result.errors.push(`Expected directory but found file: ${dir}`);
          }
        }
      }

      // Check required files
      const requiredFiles = ['build.xml'];
      for (const file of requiredFiles) {
        const filePath = path.join(projectPath, file);
        if (!await fs.pathExists(filePath)) {
          result.errors.push(`Missing required file: ${file}`);
          result.valid = false;
        } else {
          const stat = await fs.stat(filePath);
          if (!stat.isFile()) {
            result.errors.push(`Expected file but found directory: ${file}`);
            result.valid = false;
          }
        }
      }

      // Check for build and dist directories (should not exist in clean state)
      const buildDirs = ['build', 'dist'];
      for (const dir of buildDirs) {
        const dirPath = path.join(projectPath, dir);
        if (await fs.pathExists(dirPath)) {
          result.warnings.push(`Build directory found: ${dir} (consider cleaning)`);
        }
      }

    } catch (error) {
      result.errors.push(`Structure validation failed: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate project configuration files
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Configuration validation result
   */
  async validateConfiguration(projectPath) {
    const result = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      // Check for package.json
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        try {
          const pkg = await fs.readJson(packageJsonPath);
          
          // Validate required fields
          const requiredFields = ['name', 'version'];
          for (const field of requiredFields) {
            if (!pkg[field]) {
              result.warnings.push(`Missing field in package.json: ${field}`);
            }
          }
          
          // Validate scripts
          if (pkg.scripts) {
            const requiredScripts = ['build', 'test'];
            for (const script of requiredScripts) {
              if (!pkg.scripts[script]) {
                result.warnings.push(`Missing script in package.json: ${script}`);
              }
            }
          }
          
        } catch (error) {
          result.errors.push(`Invalid package.json: ${error.message}`);
        }
      }

      // Check for README.md
      const readmePath = path.join(projectPath, 'README.md');
      if (!await fs.pathExists(readmePath)) {
        result.warnings.push('Missing README.md file');
      }

      // Check for .gitignore
      const gitignorePath = path.join(projectPath, '.gitignore');
      if (!await fs.pathExists(gitignorePath)) {
        result.warnings.push('Missing .gitignore file');
      }

      // Check for project config
      const projectConfigPath = path.join(projectPath, 'aix.config.json');
      if (await fs.pathExists(projectConfigPath)) {
        try {
          const config = await fs.readJson(projectConfigPath);
          
          // Validate project config structure
          const requiredConfigFields = ['name', 'version'];
          for (const field of requiredConfigFields) {
            if (!config[field]) {
              result.warnings.push(`Missing field in aix.config.json: ${field}`);
            }
          }
          
        } catch (error) {
          result.errors.push(`Invalid aix.config.json: ${error.message}`);
        }
      }

    } catch (error) {
      result.errors.push(`Configuration validation failed: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate source code structure
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Source validation result
   */
  async validateSource(projectPath) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      javaFiles: 0,
      kotlinFiles: 0,
      hasMainClass: false
    };

    try {
      const srcDir = path.join(projectPath, 'src');
      if (!await fs.pathExists(srcDir)) {
        result.warnings.push('No src/ directory found');
        return result;
      }

      // Find source files
      const javaFiles = await this.findFiles(srcDir, '.java');
      const kotlinFiles = await this.findFiles(srcDir, '.kt');
      
      result.javaFiles = javaFiles.length;
      result.kotlinFiles = kotlinFiles.length;

      // Check for source files
      if (javaFiles.length === 0 && kotlinFiles.length === 0) {
        result.warnings.push('No source files found in src/ directory');
      }

      // Check for mixed languages
      if (javaFiles.length > 0 && kotlinFiles.length > 0) {
        result.warnings.push('Mixed Java and Kotlin files detected');
      }

      // Check for main extension class
      const allSourceFiles = [...javaFiles, ...kotlinFiles];
      result.hasMainClass = await this.hasMainExtensionClass(allSourceFiles);
      
      if (!result.hasMainClass) {
        result.warnings.push('No main extension class found (missing @DesignerComponent annotation)');
      }

      // Validate individual source files
      for (const file of allSourceFiles) {
        const fileValidation = await this.validateSourceFile(file);
        result.errors.push(...fileValidation.errors);
        result.warnings.push(...fileValidation.warnings);
      }

    } catch (error) {
      result.errors.push(`Source validation failed: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate individual source file
   * @param {string} filePath - Source file path
   * @returns {Promise<Object>} - File validation result
   */
  async validateSourceFile(filePath) {
    const result = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const fileName = path.basename(filePath);
      const isJava = fileName.endsWith('.java');
      const isKotlin = fileName.endsWith('.kt');

      // Check file encoding
      if (!content.startsWith('\ufeff') && content.includes('\u0000')) {
        result.warnings.push(`File may have encoding issues: ${fileName}`);
      }

      // Check for required imports
      if (isJava || isKotlin) {
        const requiredImports = [
          'com.google.appinventor.components.annotations',
          'com.google.appinventor.components.runtime'
        ];
        
        for (const importPath of requiredImports) {
          if (!content.includes(importPath)) {
            result.warnings.push(`Missing import in ${fileName}: ${importPath}`);
          }
        }
      }

      // Check for proper class structure
      if (isJava) {
        if (!content.includes('class ') && !content.includes('interface ')) {
          result.warnings.push(`No class or interface found in ${fileName}`);
        }
      } else if (isKotlin) {
        if (!content.includes('class ') && !content.includes('object ')) {
          result.warnings.push(`No class or object found in ${fileName}`);
        }
      }

      // Check for excessive line length
      const lines = content.split('\n');
      const longLines = lines.filter(line => line.length > 120);
      if (longLines.length > 0) {
        result.warnings.push(`File ${fileName} has ${longLines.length} lines exceeding 120 characters`);
      }

      // Check for TODO comments
      const todoComments = lines.filter(line => 
        line.includes('// TODO:') || line.includes('TODO(')
      );
      if (todoComments.length > 0) {
        result.warnings.push(`File ${fileName} has ${todoComments.length} TODO comments`);
      }

    } catch (error) {
      result.errors.push(`Failed to validate source file ${fileName}: ${error.message}`);
    }

    return result;
  }

  /**
   * Check if directory contains main extension class
   * @param {Array} sourceFiles - Array of source file paths
   * @returns {Promise<boolean>} - True if main class found
   */
  async hasMainExtensionClass(sourceFiles) {
    for (const file of sourceFiles) {
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
   * Validate build configuration
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Build validation result
   */
  async validateBuild(projectPath) {
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

      // Check for required targets
      const requiredTargets = ['clean', 'compile', 'package'];
      for (const target of requiredTargets) {
        if (!content.includes(`<target name="${target}"`)) {
          result.errors.push(`Missing required target in build.xml: ${target}`);
          result.valid = false;
        }
      }

      // Check for classpath
      if (!content.includes('<classpath') && !content.includes('classpathref=')) {
        result.warnings.push('No classpath defined in build.xml');
      }

      // Check Java version compatibility
      if (!content.includes('source="11"') || !content.includes('target="11"')) {
        result.warnings.push('Java source/target should be set to 11 for App Inventor compatibility');
      }

      // Check for encoding
      if (!content.includes('encoding="UTF-8"')) {
        result.warnings.push('Source encoding should be UTF-8');
      }

      // Check for proper directory properties
      const requiredProperties = ['src.dir', 'build.dir', 'dist.dir', 'libs.dir'];
      for (const prop of requiredProperties) {
        if (!content.includes(`<property name="${prop}"`)) {
          result.warnings.push(`Missing required property in build.xml: ${prop}`);
        }
      }

    } catch (error) {
      result.errors.push(`Build validation failed: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate project dependencies
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Dependency validation result
   */
  async validateDependencies(projectPath) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      jarFiles: 0,
      hasRequiredDeps: false
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

      if (jarFiles.length === 0) {
        result.warnings.push('No JAR files found in libs/ directory');
      }

      // Check for required dependencies
      const requiredDeps = [
        'appinventor-components.jar',
        'android.jar'
      ];
      
      const missingDeps = requiredDeps.filter(dep => 
        !jarFiles.includes(dep)
      );
      
      result.hasRequiredDeps = missingDeps.length === 0;
      
      if (missingDeps.length > 0) {
        result.warnings.push(`Missing required dependencies: ${missingDeps.join(', ')}`);
      }

      // Validate JAR files
      for (const jarFile of jarFiles) {
        const jarPath = path.join(libsDir, jarFile);
        const jarValidation = await this.validateJarFile(jarPath);
        result.errors.push(...jarValidation.errors);
        result.warnings.push(...jarValidation.warnings);
      }

    } catch (error) {
      result.errors.push(`Dependency validation failed: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate JAR file
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
      // Check if file exists and is readable
      await fs.access(jarPath, fs.constants.R_OK);
      
      // Check file size
      const stats = await fs.stat(jarPath);
      const fileName = path.basename(jarPath);
      
      if (stats.size === 0) {
        result.errors.push(`JAR file is empty: ${fileName}`);
        result.valid = false;
      } else if (stats.size > 100 * 1024 * 1024) { // 100MB
        result.warnings.push(`JAR file is very large (${this.formatFileSize(stats.size)}): ${fileName}`);
      }
      
      // Check for version in filename
      if (!/\d+\.\d+\.\d+/.test(fileName) && !fileName.includes('android.jar')) {
        result.warnings.push(`JAR file name should include version: ${fileName}`);
      }

    } catch (error) {
      result.errors.push(`Cannot access JAR file ${path.basename(jarPath)}: ${error.message}`);
      result.valid = false;
    }

    return result;
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
   * Generate validation report
   * @param {Object} validation - Validation result
   * @param {string} format - Report format (text, json, html)
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
    let report = '=== AIX Studio Project Validation Report ===\n\n';
    
    report += `Project: ${validation.project.name}\n`;
    report += `Path: ${validation.project.path}\n`;
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
    
    // Add section summaries
    const sections = ['structure', 'configuration', 'source', 'build', 'dependencies'];
    sections.forEach(section => {
      if (validation[section] && (validation[section].errors.length > 0 || validation[section].warnings.length > 0)) {
        report += `${section.charAt(0).toUpperCase() + section.slice(1)} Summary:\n`;
        if (validation[section].errors) {
          report += `  Errors: ${validation[section].errors.length}\n`;
        }
        if (validation[section].warnings) {
          report += `  Warnings: ${validation[section].warnings.length}\n`;
        }
        report += '\n';
      }
    });
    
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
    <title>AIX Studio Project Validation Report</title>
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
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-card { background: #f8f9fa; padding: 15px; border-radius: 4px; text-align: center; }
        .stat-number { font-size: 24px; font-weight: bold; color: #2196F3; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📝 AIX Studio Project Validation Report</h1>
        
        <div class="status ${validation.valid ? 'valid' : 'invalid'}">
            <strong>Status:</strong> ${validation.valid ? 'VALID' : 'INVALID'}
        </div>
        
        <p><strong>Project:</strong> ${validation.project.name}</p>
        <p><strong>Path:</strong> ${validation.project.path}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${validation.errors.length}</div>
                <div>Errors</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${validation.warnings.length}</div>
                <div>Warnings</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${validation.source.javaFiles}</div>
                <div>Java Files</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${validation.source.kotlinFiles}</div>
                <div>Kotlin Files</div>
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
            <p>Generated by AIX Studio Project Validator</p>
        </div>
    </div>
</body>
</html>`;
    
    return html;
  }
}

module.exports = ProjectValidator;