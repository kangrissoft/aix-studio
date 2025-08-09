const fs = require('fs-extra');
const path = require('path');

/**
 * Template Validator for AIX Studio
 * Validates template structure, configuration, and compatibility
 */
class TemplateValidator {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.strict = options.strict !== false;
  }

  /**
   * Validate template
   * @param {string} templatePath - Template directory path
   * @returns {Promise<Object>} - Template validation result
   */
  async validate(templatePath) {
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      template: {
        path: templatePath,
        name: path.basename(templatePath)
      },
      structure: {},
      configuration: {},
      compatibility: {},
      content: {}
    };

    try {
      // Validate template structure
      validation.structure = await this.validateStructure(templatePath);
      
      // Validate template configuration
      validation.configuration = await this.validateConfiguration(templatePath);
      
      // Validate compatibility
      validation.compatibility = await this.validateCompatibility(templatePath);
      
      // Validate content
      validation.content = await this.validateContent(templatePath);
      
      // Aggregate results
      const allResults = [
        validation.structure,
        validation.configuration,
        validation.compatibility,
        validation.content
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
      validation.errors.push(`Template validation failed: ${error.message}`);
    }

    return validation;
  }

  /**
   * Validate template directory structure
   * @param {string} templatePath - Template directory path
   * @returns {Promise<Object>} - Structure validation result
   */
  async validateStructure(templatePath) {
    const result = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      // Check if template directory exists
      if (!await fs.pathExists(templatePath)) {
        result.errors.push(`Template directory does not exist: ${templatePath}`);
        result.valid = false;
        return result;
      }

      // Check required files and directories
      const requiredItems = [
        { path: 'template.json', type: 'file' },
        { path: 'build.xml', type: 'file' },
        { path: 'src', type: 'directory' },
        { path: 'assets', type: 'directory' },
        { path: 'README.md', type: 'file' }
      ];

      for (const item of requiredItems) {
        const itemPath = path.join(templatePath, item.path);
        if (!await fs.pathExists(itemPath)) {
          result.errors.push(`Missing required ${item.type}: ${item.path}`);
          result.valid = false;
        } else {
          const stat = await fs.stat(itemPath);
          const isDirectory = stat.isDirectory();
          
          if (item.type === 'directory' && !isDirectory) {
            result.errors.push(`Expected directory but found file: ${item.path}`);
            result.valid = false;
          } else if (item.type === 'file' && isDirectory) {
            result.errors.push(`Expected file but found directory: ${item.path}`);
            result.valid = false;
          }
        }
      }

      // Check for recommended items
      const recommendedItems = [
        { path: 'libs', type: 'directory' },
        { path: 'test', type: 'directory' },
        { path: 'docs', type: 'directory' },
        { path: '.gitignore', type: 'file' },
        { path: 'package.json', type: 'file' }
      ];

      for (const item of recommendedItems) {
        const itemPath = path.join(templatePath, item.path);
        if (!await fs.pathExists(itemPath)) {
          result.warnings.push(`Missing recommended ${item.type}: ${item.path}`);
        }
      }

      // Validate directory structure
      const structureValidation = await this.validateDirectoryStructure(templatePath);
      result.warnings.push(...structureValidation.warnings);

    } catch (error) {
      result.errors.push(`Structure validation failed: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate directory structure
   * @param {string} templatePath - Template directory path
   * @returns {Promise<Object>} - Directory structure validation result
   */
  async validateDirectoryStructure(templatePath) {
    const result = {
      warnings: []
    };

    try {
      // Check for empty directories
      const isEmpty = await this.isEmptyDirectory(templatePath);
      if (isEmpty) {
        result.warnings.push('Template directory is empty');
        return result;
      }

      // Check for excessive nesting
      const maxDepth = await this.getMaxDirectoryDepth(templatePath);
      if (maxDepth > 10) {
        result.warnings.push(`Template has excessive directory nesting (${maxDepth} levels)`);
      }

      // Check for large files
      const largeFiles = await this.findLargeFiles(templatePath);
      if (largeFiles.length > 0) {
        result.warnings.push(`Template contains ${largeFiles.length} large files (>10MB)`);
      }

      // Check for binary files without proper extensions
      const suspiciousFiles = await this.findSuspiciousFiles(templatePath);
      if (suspiciousFiles.length > 0) {
        result.warnings.push(`Template contains ${suspiciousFiles.length} suspicious files`);
      }

    } catch (error) {
      result.warnings.push(`Directory structure validation failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Check if directory is empty
   * @param {string} dirPath - Directory path
   * @returns {Promise<boolean>} - True if empty
   */
  async isEmptyDirectory(dirPath) {
    const files = await fs.readdir(dirPath);
    return files.length === 0;
  }

  /**
   * Get maximum directory depth
   * @param {string} dirPath - Directory path
   * @param {number} currentDepth - Current depth
   * @param {number} maxDepth - Maximum depth found
   * @returns {Promise<number>} - Maximum depth
   */
  async getMaxDirectoryDepth(dirPath, currentDepth = 0, maxDepth = 0) {
    const files = await fs.readdir(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isDirectory()) {
        const depth = await this.getMaxDirectoryDepth(filePath, currentDepth + 1, Math.max(maxDepth, currentDepth + 1));
        maxDepth = Math.max(maxDepth, depth);
      }
    }
    
    return maxDepth;
  }

  /**
   * Find large files
   * @param {string} dirPath - Directory path
   * @returns {Promise<Array>} - Large file paths
   */
  async findLargeFiles(dirPath) {
    const largeFiles = [];
    
    const walk = async (currentPath) => {
      const files = await fs.readdir(currentPath);
      
      for (const file of files) {
        const filePath = path.join(currentPath, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isDirectory()) {
          await walk(filePath);
        } else if (stat.size > 10 * 1024 * 1024) { // 10MB
          largeFiles.push(filePath);
        }
      }
    };
    
    await walk(dirPath);
    return largeFiles;
  }

  /**
   * Find suspicious files
   * @param {string} dirPath - Directory path
   * @returns {Promise<Array>} - Suspicious file paths
   */
  async findSuspiciousFiles(dirPath) {
    const suspiciousFiles = [];
    const suspiciousExtensions = ['.exe', '.dll', '.so', '.dylib'];
    
    const walk = async (currentPath) => {
      const files = await fs.readdir(currentPath);
      
      for (const file of files) {
        const filePath = path.join(currentPath, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isDirectory()) {
          await walk(filePath);
        } else {
          const ext = path.extname(file).toLowerCase();
          if (suspiciousExtensions.includes(ext)) {
            suspiciousFiles.push(filePath);
          }
        }
      }
    };
    
    await walk(dirPath);
    return suspiciousFiles;
  }

  /**
   * Validate template configuration
   * @param {string} templatePath - Template directory path
   * @returns {Promise<Object>} - Configuration validation result
   */
  async validateConfiguration(templatePath) {
    const result = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      const templateJsonPath = path.join(templatePath, 'template.json');
      if (!await fs.pathExists(templateJsonPath)) {
        result.errors.push('Missing template.json configuration file');
        result.valid = false;
        return result;
      }

      const templateConfig = await fs.readJson(templateJsonPath);
      
      // Validate required fields
      const requiredFields = ['name', 'description', 'author', 'version'];
      for (const field of requiredFields) {
        if (!templateConfig[field]) {
          result.errors.push(`Missing required field in template.json: ${field}`);
          result.valid = false;
        }
      }

      // Validate field formats
      const formatValidation = this.validateFieldFormats(templateConfig);
      result.errors.push(...formatValidation.errors);
      result.warnings.push(...formatValidation.warnings);

      // Validate variables
      if (templateConfig.variables) {
        const variableValidation = this.validateVariables(templateConfig.variables);
        result.warnings.push(...variableValidation.warnings);
      }

      // Validate dependencies
      if (templateConfig.dependencies) {
        const dependencyValidation = this.validateDependencies(templateConfig.dependencies);
        result.warnings.push(...dependencyValidation.warnings);
      }

      // Validate files list
      if (templateConfig.files) {
        const filesValidation = await this.validateFilesList(templatePath, templateConfig.files);
        result.warnings.push(...filesValidation.warnings);
      }

    } catch (error) {
      result.errors.push(`Invalid template.json: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate field formats
   * @param {Object} config - Template configuration
   * @returns {Object} - Format validation result
   */
  validateFieldFormats(config) {
    const result = {
      errors: [],
      warnings: []
    };

    // Validate version format
    if (config.version && !/^\d+\.\d+\.\d+(?:[-.][\w.-]+)?$/.test(config.version)) {
      result.warnings.push('Version should follow semantic versioning (e.g., 1.0.0)');
    }

    // Validate name format
    if (config.name && !/^[a-zA-Z0-9\s-]+$/.test(config.name)) {
      result.warnings.push('Template name should contain only letters, numbers, spaces, and hyphens');
    }

    // Validate author format
    if (config.author && config.author.length > 100) {
      result.warnings.push('Author name is unusually long');
    }

    return result;
  }

  /**
   * Validate template variables
   * @param {Object} variables - Template variables
   * @returns {Object} - Variable validation result
   */
  validateVariables(variables) {
    const result = {
      warnings: []
    };

    // Check for standard variables
    const standardVariables = ['projectName', 'package', 'className', 'description'];
    for (const variable of standardVariables) {
      if (!variables[variable]) {
        result.warnings.push(`Missing standard variable: ${variable}`);
      }
    }

    // Check variable format
    for (const [key, value] of Object.entries(variables)) {
      if (typeof value !== 'string') {
        result.warnings.push(`Variable ${key} should be a string`);
      }
    }

    return result;
  }

  /**
   * Validate dependencies
   * @param {Array} dependencies - Template dependencies
   * @returns {Object} - Dependency validation result
   */
  validateDependencies(dependencies) {
    const result = {
      warnings: []
    };

    if (!Array.isArray(dependencies)) {
      result.warnings.push('Dependencies should be an array');
      return result;
    }

    for (const dep of dependencies) {
      if (typeof dep !== 'string' && typeof dep !== 'object') {
        result.warnings.push('Each dependency should be a string or object');
      }
    }

    return result;
  }

  /**
   * Validate files list
   * @param {string} templatePath - Template directory path
   * @param {Array} files - Files list
   * @returns {Promise<Object>} - Files validation result
   */
  async validateFilesList(templatePath, files) {
    const result = {
      warnings: []
    };

    if (!Array.isArray(files)) {
      result.warnings.push('Files should be an array');
      return result;
    }

    for (const file of files) {
      const filePath = path.join(templatePath, file);
      if (!await fs.pathExists(filePath)) {
        result.warnings.push(`Declared file does not exist: ${file}`);
      }
    }

    return result;
  }

  /**
   * Validate template compatibility
   * @param {string} templatePath - Template directory path
   * @returns {Promise<Object>} - Compatibility validation result
   */
  async validateCompatibility(templatePath) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      compatibility: {
        java: null,
        kotlin: null,
        appinventor: null
      }
    };

    try {
      // Check Java compatibility
      result.compatibility.java = await this.checkJavaCompatibility(templatePath);
      if (!result.compatibility.java.compatible) {
        result.warnings.push(`Java compatibility issue: ${result.compatibility.java.issue}`);
      }

      // Check Kotlin compatibility
      result.compatibility.kotlin = await this.checkKotlinCompatibility(templatePath);
      if (!result.compatibility.kotlin.compatible) {
        result.warnings.push(`Kotlin compatibility issue: ${result.compatibility.kotlin.issue}`);
      }

      // Check App Inventor compatibility
      result.compatibility.appinventor = await this.checkAppInventorCompatibility(templatePath);
      if (!result.compatibility.appinventor.compatible) {
        result.errors.push(`App Inventor compatibility issue: ${result.compatibility.appinventor.issue}`);
        result.valid = false;
      }

    } catch (error) {
      result.errors.push(`Compatibility validation failed: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Check Java compatibility
   * @param {string} templatePath - Template directory path
   * @returns {Promise<Object>} - Java compatibility result
   */
  async checkJavaCompatibility(templatePath) {
    const result = {
      compatible: true,
      issue: null,
      version: null
    };

    try {
      const buildFile = path.join(templatePath, 'build.xml');
      if (await fs.pathExists(buildFile)) {
        const buildContent = await fs.readFile(buildFile, 'utf8');
        
        // Check for Java version
        const sourceMatch = buildContent.match(/source="(\d+\.\d+|\d+)"/);
        const targetMatch = buildContent.match(/target="(\d+\.\d+|\d+)"/);
        
        if (sourceMatch) {
          result.version = sourceMatch[1];
          const version = parseFloat(sourceMatch[1]);
          if (version < 11) {
            result.compatible = false;
            result.issue = `Java version ${version} is below required 11`;
          } else if (version > 11) {
            result.compatible = false;
            result.issue = `Java version ${version} may not be compatible with App Inventor`;
          }
        }
      }

    } catch (error) {
      result.compatible = false;
      result.issue = `Java compatibility check failed: ${error.message}`;
    }

    return result;
  }

  /**
   * Check Kotlin compatibility
   * @param {string} templatePath - Template directory path
   * @returns {Promise<Object>} - Kotlin compatibility result
   */
  async checkKotlinCompatibility(templatePath) {
    const result = {
      compatible: true,
      issue: null,
      version: null
    };

    try {
      const buildFile = path.join(templatePath, 'build.xml');
      if (await fs.pathExists(buildFile)) {
        const buildContent = await fs.readFile(buildFile, 'utf8');
        
        // Check for Kotlin version
        const kotlinMatch = buildContent.match(/kotlin\.version.*value="([^"]+)"/);
        if (kotlinMatch) {
          result.version = kotlinMatch[1];
          // Add Kotlin version validation logic here
        }
      }

      // Check for Kotlin source files
      const hasKotlinFiles = await this.hasKotlinFiles(templatePath);
      if (hasKotlinFiles && !result.version) {
        result.compatible = false;
        result.issue = 'Kotlin files found but no Kotlin version specified';
      }

    } catch (error) {
      result.compatible = false;
      result.issue = `Kotlin compatibility check failed: ${error.message}`;
    }

    return result;
  }

  /**
   * Check for Kotlin files
   * @param {string} templatePath - Template directory path
   * @returns {Promise<boolean>} - True if Kotlin files found
   */
  async hasKotlinFiles(templatePath) {
    const srcDir = path.join(templatePath, 'src');
    if (!await fs.pathExists(srcDir)) {
      return false;
    }
    
    const kotlinFiles = await this.findFiles(srcDir, '.kt');
    return kotlinFiles.length > 0;
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
   * Check App Inventor compatibility
   * @param {string} templatePath - Template directory path
   * @returns {Promise<Object>} - App Inventor compatibility result
   */
  async checkAppInventorCompatibility(templatePath) {
    const result = {
      compatible: true,
      issue: null,
      version: null
    };

    try {
      // Check for App Inventor components
      const hasAppInventorComponents = await this.hasAppInventorComponents(templatePath);
      if (!hasAppInventorComponents) {
        result.compatible = false;
        result.issue = 'No App Inventor components found';
        return result;
      }

      // Check for @DesignerComponent annotation
      const hasDesignerComponent = await this.hasDesignerComponent(templatePath);
      if (!hasDesignerComponent) {
        result.compatible = false;
        result.issue = 'Missing @DesignerComponent annotation';
      }

      // Check for required imports
      const missingImports = await this.checkRequiredImports(templatePath);
      if (missingImports.length > 0) {
        result.compatible = false;
        result.issue = `Missing required imports: ${missingImports.join(', ')}`;
      }

    } catch (error) {
      result.compatible = false;
      result.issue = `App Inventor compatibility check failed: ${error.message}`;
    }

    return result;
  }

  /**
   * Check for App Inventor components
   * @param {string} templatePath - Template directory path
   * @returns {Promise<boolean>} - True if components found
   */
  async hasAppInventorComponents(templatePath) {
    const srcDir = path.join(templatePath, 'src');
    if (!await fs.pathExists(srcDir)) {
      return false;
    }
    
    const javaFiles = await this.findFiles(srcDir, '.java');
    const ktFiles = await this.findFiles(srcDir, '.kt');
    const allFiles = [...javaFiles, ...ktFiles];
    
    for (const file of allFiles) {
      const content = await fs.readFile(file, 'utf8');
      if (content.includes('com.google.appinventor.components')) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check for @DesignerComponent annotation
   * @param {string} templatePath - Template directory path
   * @returns {Promise<boolean>} - True if annotation found
   */
  async hasDesignerComponent(templatePath) {
    const srcDir = path.join(templatePath, 'src');
    if (!await fs.pathExists(srcDir)) {
      return false;
    }
    
    const javaFiles = await this.findFiles(srcDir, '.java');
    const ktFiles = await this.findFiles(srcDir, '.kt');
    const allFiles = [...javaFiles, ...ktFiles];
    
    for (const file of allFiles) {
      const content = await fs.readFile(file, 'utf8');
      if (content.includes('@DesignerComponent')) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check for required imports
   * @param {string} templatePath - Template directory path
   * @returns {Promise<Array>} - Missing imports
   */
  async checkRequiredImports(templatePath) {
    const missingImports = [];
    const requiredImports = [
      'com.google.appinventor.components.annotations',
      'com.google.appinventor.components.runtime'
    ];
    
    const srcDir = path.join(templatePath, 'src');
    if (!await fs.pathExists(srcDir)) {
      return missingImports;
    }
    
    const javaFiles = await this.findFiles(srcDir, '.java');
    const ktFiles = await this.findFiles(srcDir, '.kt');
    const allFiles = [...javaFiles, ...ktFiles];
    
    for (const file of allFiles) {
      const content = await fs.readFile(file, 'utf8');
      for (const importPath of requiredImports) {
        if (!content.includes(importPath)) {
          missingImports.push(importPath);
        }
      }
    }
    
    return [...new Set(missingImports)]; // Remove duplicates
  }

  /**
   * Validate template content
   * @param {string} templatePath - Template directory path
   * @returns {Promise<Object>} - Content validation result
   */
  async validateContent(templatePath) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      content: {
        variables: 0,
        placeholders: 0,
        documentation: false
      }
    };

    try {
      // Validate template variables
      const variableValidation = await this.validateTemplateVariables(templatePath);
      result.errors.push(...variableValidation.errors);
      result.warnings.push(...variableValidation.warnings);
      result.content.variables = variableValidation.variables || 0;

      // Validate placeholders
      const placeholderValidation = await this.validatePlaceholders(templatePath);
      result.content.placeholders = placeholderValidation.placeholders || 0;
      result.warnings.push(...placeholderValidation.warnings);

      // Validate documentation
      result.content.documentation = await this.validateDocumentation(templatePath);

      // Validate example files
      const exampleValidation = await this.validateExamples(templatePath);
      result.warnings.push(...exampleValidation.warnings);

    } catch (error) {
      result.errors.push(`Content validation failed: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate template variables
   * @param {string} templatePath - Template directory path
   * @returns {Promise<Object>} - Variable validation result
   */
  async validateTemplateVariables(templatePath) {
    const result = {
      errors: [],
      warnings: [],
      variables: 0
    };

    try {
      const templateJsonPath = path.join(templatePath, 'template.json');
      if (!await fs.pathExists(templateJsonPath)) {
        return result;
      }

      const templateConfig = await fs.readJson(templateJsonPath);
      const variables = templateConfig.variables || {};
      result.variables = Object.keys(variables).length;

      // Check for standard variables
      const standardVariables = ['projectName', 'package', 'className', 'description'];
      const missingStandard = standardVariables.filter(varName => !variables[varName]);
      if (missingStandard.length > 0) {
        result.warnings.push(`Missing standard variables: ${missingStandard.join(', ')}`);
      }

      // Check variable usage in files
      const variableUsage = await this.checkVariableUsage(templatePath, variables);
      result.warnings.push(...variableUsage.warnings);

    } catch (error) {
      result.errors.push(`Variable validation failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Check variable usage in template files
   * @param {string} templatePath - Template directory path
   * @param {Object} variables - Template variables
   * @returns {Promise<Object>} - Variable usage result
   */
  async checkVariableUsage(templatePath, variables) {
    const result = {
      warnings: []
    };

    const variableNames = Object.keys(variables);
    if (variableNames.length === 0) {
      return result;
    }

    // Check usage in all template files
    const templateFiles = await this.getAllTemplateFiles(templatePath);
    const unusedVariables = [...variableNames];
    const undefinedVariables = [];

    for (const file of templateFiles) {
      const filePath = path.join(templatePath, file);
      if (await fs.pathExists(filePath)) {
        const content = await fs.readFile(filePath, 'utf8');
        
        // Check for variable usage
        for (const variable of variableNames) {
          const placeholder = `{{${variable}}}`;
          if (content.includes(placeholder)) {
            // Remove from unused list
            const index = unusedVariables.indexOf(variable);
            if (index > -1) {
              unusedVariables.splice(index, 1);
            }
          }
        }
        
        // Check for undefined placeholders
        const undefinedMatches = content.match(/{{[^}]+}}/g) || [];
        for (const match of undefinedMatches) {
          const varName = match.replace(/[{}]/g, '');
          if (!variableNames.includes(varName)) {
            undefinedVariables.push({ file, variable: varName });
          }
        }
      }
    }

    if (unusedVariables.length > 0) {
      result.warnings.push(`Unused template variables: ${unusedVariables.join(', ')}`);
    }

    if (undefinedVariables.length > 0) {
      const uniqueUndefined = [...new Set(undefinedVariables.map(u => u.variable))];
      result.warnings.push(`Undefined template variables: ${uniqueUndefined.join(', ')}`);
    }

    return result;
  }

  /**
   * Get all template files
   * @param {string} templatePath - Template directory path
   * @returns {Promise<Array>} - Template file paths
   */
  async getAllTemplateFiles(templatePath) {
    const files = [];
    
    const walk = async (currentPath) => {
      const items = await fs.readdir(currentPath);
      
      for (const item of items) {
        // Skip hidden files and template.json
        if (item.startsWith('.') || item === 'template.json') {
          continue;
        }
        
        const itemPath = path.join(currentPath, item);
        const stat = await fs.stat(itemPath);
        
        if (stat.isDirectory()) {
          await walk(itemPath);
        } else {
          files.push(path.relative(templatePath, itemPath));
        }
      }
    };
    
    await walk(templatePath);
    return files;
  }

  /**
   * Validate placeholders in template
   * @param {string} templatePath - Template directory path
   * @returns {Promise<Object>} - Placeholder validation result
   */
  async validatePlaceholders(templatePath) {
    const result = {
      warnings: [],
      placeholders: 0
    };

    try {
      const templateFiles = await this.getAllTemplateFiles(templatePath);
      
      for (const file of templateFiles) {
        const filePath = path.join(templatePath, file);
        if (await fs.pathExists(filePath)) {
          const content = await fs.readFile(filePath, 'utf8');
          
          // Count placeholders
          const placeholderMatches = content.match(/{{[^}]+}}/g) || [];
          result.placeholders += placeholderMatches.length;
          
          // Check for malformed placeholders
          const malformed = placeholderMatches.filter(match => 
            !/^\{\{[a-zA-Z0-9_]+\}\}$/.test(match)
          );
          
          if (malformed.length > 0) {
            result.warnings.push(`Malformed placeholders in ${file}: ${malformed.join(', ')}`);
          }
        }
      }

    } catch (error) {
      result.warnings.push(`Placeholder validation failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Validate documentation
   * @param {string} templatePath - Template directory path
   * @returns {Promise<boolean>} - True if documentation is adequate
   */
  async validateDocumentation(templatePath) {
    try {
      // Check for README.md
      const readmePath = path.join(templatePath, 'README.md');
      if (!await fs.pathExists(readmePath)) {
        return false;
      }

      const readmeContent = await fs.readFile(readmePath, 'utf8');
      
      // Check for required sections
      const requiredSections = ['Overview', 'Usage', 'Installation'];
      const missingSections = requiredSections.filter(section => 
        !readmeContent.includes(`# ${section}`) && 
        !readmeContent.includes(`## ${section}`)
      );
      
      return missingSections.length === 0;

    } catch (error) {
      return false;
    }
  }

  /**
   * Validate example files
   * @param {string} templatePath - Template directory path
   * @returns {Promise<Object>} - Example validation result
   */
  async validateExamples(templatePath) {
    const result = {
      warnings: []
    };

    try {
      const examplesDir = path.join(templatePath, 'examples');
      if (await fs.pathExists(examplesDir)) {
        const exampleFiles = await fs.readdir(examplesDir);
        if (exampleFiles.length === 0) {
          result.warnings.push('Examples directory is empty');
        }
      } else {
        result.warnings.push('No examples directory found');
      }

    } catch (error) {
      result.warnings.push(`Example validation failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Generate template validation report
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
    let report = '=== AIX Studio Template Validation Report ===\n\n';
    
    report += `Template: ${validation.template.name}\n`;
    report += `Path: ${validation.template.path}\n`;
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
    
    // Add content statistics
    if (validation.content) {
      report += 'Content Statistics:\n';
      report += `  Variables: ${validation.content.variables || 0}\n`;
      report += `  Placeholders: ${validation.content.placeholders || 0}\n`;
      report += `  Documentation: ${validation.content.documentation ? 'Yes' : 'No'}\n\n`;
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
    <title>AIX Studio Template Validation Report</title>
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
        <h1>📋 AIX Studio Template Validation Report</h1>
        
        <div class="status ${validation.valid ? 'valid' : 'invalid'}">
            <strong>Status:</strong> ${validation.valid ? 'VALID' : 'INVALID'}
        </div>
        
        <p><strong>Template:</strong> ${validation.template.name}</p>
        <p><strong>Path:</strong> ${validation.template.path}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${validation.content?.variables || 0}</div>
                <div>Variables</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${validation.content?.placeholders || 0}</div>
                <div>Placeholders</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${validation.errors.length}</div>
                <div>Errors</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${validation.warnings.length}</div>
                <div>Warnings</div>
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
            <p>Generated by AIX Studio Template Validator</p>
        </div>
    </div>
</body>
</html>`;
    
    return html;
  }

  /**
   * Suggest template improvements
   * @param {string} templatePath - Template directory path
   * @returns {Promise<Object>} - Improvement suggestions
   */
  async suggestImprovements(templatePath) {
    const suggestions = {
      structure: [],
      content: [],
      documentation: [],
      compatibility: []
    };

    try {
      // Structure improvements
      const structureSuggestions = await this.suggestStructureImprovements(templatePath);
      suggestions.structure.push(...structureSuggestions);

      // Content improvements
      const contentSuggestions = await this.suggestContentImprovements(templatePath);
      suggestions.content.push(...contentSuggestions);

      // Documentation improvements
      const documentationSuggestions = await this.suggestDocumentationImprovements(templatePath);
      suggestions.documentation.push(...documentationSuggestions);

      // Compatibility improvements
      const compatibilitySuggestions = await this.suggestCompatibilityImprovements(templatePath);
      suggestions.compatibility.push(...compatibilitySuggestions);

    } catch (error) {
      console.warn(`Failed to generate suggestions: ${error.message}`);
    }

    return suggestions;
  }

  /**
   * Suggest structure improvements
   * @param {string} templatePath - Template directory path
   * @returns {Promise<Array>} - Structure suggestions
   */
  async suggestStructureImprovements(templatePath) {
    const suggestions = [];

    try {
      // Check for missing recommended directories
      const recommendedDirs = ['test', 'docs', 'examples'];
      for (const dir of recommendedDirs) {
        const dirPath = path.join(templatePath, dir);
        if (!await fs.pathExists(dirPath)) {
          suggestions.push(`Add ${dir}/ directory for ${dir} files`);
        }
      }

      // Check for .gitignore
      const gitignorePath = path.join(templatePath, '.gitignore');
      if (!await fs.pathExists(gitignorePath)) {
        suggestions.push('Add .gitignore file to exclude build artifacts');
      }

      // Check for package.json
      const packageJsonPath = path.join(templatePath, 'package.json');
      if (!await fs.pathExists(packageJsonPath)) {
        suggestions.push('Add package.json for npm integration');
      }

    } catch (error) {
      suggestions.push(`Structure suggestion failed: ${error.message}`);
    }

    return suggestions;
  }

  /**
   * Suggest content improvements
   * @param {string} templatePath - Template directory path
   * @returns {Promise<Array>} - Content suggestions
   */
  async suggestContentImprovements(templatePath) {
    const suggestions = [];

    try {
      // Check for test files
      const testDir = path.join(templatePath, 'test');
      if (await fs.pathExists(testDir)) {
        const testFiles = await this.findFiles(testDir, '.java');
        if (testFiles.length === 0) {
          suggestions.push('Add unit tests in test/ directory');
        }
      } else {
        suggestions.push('Add test/ directory with unit tests');
      }

      // Check for documentation files
      const docsDir = path.join(templatePath, 'docs');
      if (await fs.pathExists(docsDir)) {
        const docFiles = await fs.readdir(docsDir);
        if (docFiles.length === 0) {
          suggestions.push('Add documentation files in docs/ directory');
        }
      } else {
        suggestions.push('Add docs/ directory with API documentation');
      }

      // Check for example files
      const examplesDir = path.join(templatePath, 'examples');
      if (await fs.pathExists(examplesDir)) {
        const exampleFiles = await fs.readdir(examplesDir);
        if (exampleFiles.length === 0) {
          suggestions.push('Add example projects in examples/ directory');
        }
      } else {
        suggestions.push('Add examples/ directory with sample projects');
      }

    } catch (error) {
      suggestions.push(`Content suggestion failed: ${error.message}`);
    }

    return suggestions;
  }

  /**
   * Suggest documentation improvements
   * @param {string} templatePath - Template directory path
   * @returns {Promise<Array>} - Documentation suggestions
   */
  async suggestDocumentationImprovements(templatePath) {
    const suggestions = [];

    try {
      const readmePath = path.join(templatePath, 'README.md');
      if (await fs.pathExists(readmePath)) {
        const readmeContent = await fs.readFile(readmePath, 'utf8');
        
        // Check for required sections
        const requiredSections = ['Installation', 'Usage', 'API Reference'];
        for (const section of requiredSections) {
          if (!readmeContent.includes(`# ${section}`) && !readmeContent.includes(`## ${section}`)) {
            suggestions.push(`Add ${section} section to README.md`);
          }
        }
      } else {
        suggestions.push('Create README.md with project documentation');
      }

      // Check for license file
      const licenseFiles = ['LICENSE', 'LICENSE.md', 'LICENSE.txt'];
      const hasLicense = await Promise.all(
        licenseFiles.map(file => fs.pathExists(path.join(templatePath, file)))
      );
      
      if (!hasLicense.includes(true)) {
        suggestions.push('Add LICENSE file with appropriate license');
      }

    } catch (error) {
      suggestions.push(`Documentation suggestion failed: ${error.message}`);
    }

    return suggestions;
  }

  /**
   * Suggest compatibility improvements
   * @param {string} templatePath - Template directory path
   * @returns {Promise<Array>} - Compatibility suggestions
   */
  async suggestCompatibilityImprovements(templatePath) {
    const suggestions = [];

    try {
      // Check for multiple language support
      const srcDir = path.join(templatePath, 'src');
      if (await fs.pathExists(srcDir)) {
        const javaFiles = await this.findFiles(srcDir, '.java');
        const ktFiles = await this.findFiles(srcDir, '.kt');
        
        if (javaFiles.length > 0 && ktFiles.length === 0) {
          suggestions.push('Consider adding Kotlin support');
        } else if (ktFiles.length > 0 && javaFiles.length === 0) {
          suggestions.push('Consider adding Java support for broader compatibility');
        }
      }

      // Check for modern build system
      const buildFile = path.join(templatePath, 'build.xml');
      if (await fs.pathExists(buildFile)) {
        const buildContent = await fs.readFile(buildFile, 'utf8');
        if (!buildContent.includes('kotlin')) {
          suggestions.push('Consider adding Kotlin build support');
        }
      }

    } catch (error) {
      suggestions.push(`Compatibility suggestion failed: ${error.message}`);
    }

    return suggestions;
  }

  /**
   * Validate template for publishing
   * @param {string} templatePath - Template directory path
   * @returns {Promise<Object>} - Publishing validation result
   */
  async validateForPublishing(templatePath) {
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      publishing: {
        license: false,
        documentation: false,
        examples: false,
        tests: false
      }
    };

    try {
      // Check for license
      const licenseFiles = ['LICENSE', 'LICENSE.md', 'LICENSE.txt'];
      const hasLicense = await Promise.all(
        licenseFiles.map(file => fs.pathExists(path.join(templatePath, file)))
      );
      validation.publishing.license = hasLicense.includes(true);
      if (!validation.publishing.license) {
        validation.errors.push('Missing license file (required for publishing)');
        validation.valid = false;
      }

      // Check for documentation
      const docsDir = path.join(templatePath, 'docs');
      validation.publishing.documentation = await fs.pathExists(docsDir);
      if (!validation.publishing.documentation) {
        validation.warnings.push('Missing documentation directory');
      }

      // Check for examples
      const examplesDir = path.join(templatePath, 'examples');
      validation.publishing.examples = await fs.pathExists(examplesDir);
      if (!validation.publishing.examples) {
        validation.warnings.push('Missing examples directory');
      }

      // Check for tests
      const testDir = path.join(templatePath, 'test');
      validation.publishing.tests = await fs.pathExists(testDir);
      if (!validation.publishing.tests) {
        validation.warnings.push('Missing test directory');
      }

      // Validate template.json for publishing
      const templateJsonPath = path.join(templatePath, 'template.json');
      if (await fs.pathExists(templateJsonPath)) {
        const templateConfig = await fs.readJson(templateJsonPath);
        
        // Check for required publishing fields
        const requiredFields = ['name', 'description', 'author', 'version', 'category'];
        for (const field of requiredFields) {
          if (!templateConfig[field]) {
            validation.errors.push(`Missing required field for publishing: ${field}`);
            validation.valid = false;
          }
        }
      } else {
        validation.errors.push('Missing template.json (required for publishing)');
        validation.valid = false;
      }

    } catch (error) {
      validation.errors.push(`Publishing validation failed: ${error.message}`);
      validation.valid = false;
    }

    return validation;
  }
}

module.exports = TemplateValidator;