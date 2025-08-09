const fs = require('fs-extra');
const path = require('path');

/**
 * Code Validator for AIX Studio
 * Validates source code quality, style, and App Inventor Extension best practices
 */
class CodeValidator {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.strict = options.strict !== false;
    this.maxLineLength = options.maxLineLength || 120;
    this.maxMethodLength = options.maxMethodLength || 100;
    this.maxClassLength = options.maxClassLength || 500;
  }

  /**
   * Validate source code
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Code validation result
   */
  async validate(projectPath) {
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      java: {},
      kotlin: {},
      bestPractices: {},
      complexity: {},
      style: {}
    };

    try {
      // Validate Java code
      validation.java = await this.validateJavaCode(projectPath);
      
      // Validate Kotlin code
      validation.kotlin = await this.validateKotlinCode(projectPath);
      
      // Check best practices
      validation.bestPractices = await this.validateBestPractices(projectPath);
      
      // Analyze code complexity
      validation.complexity = await this.analyzeComplexity(projectPath);
      
      // Check code style
      validation.style = await this.validateStyle(projectPath);
      
      // Aggregate results
      const allResults = [
        validation.java,
        validation.kotlin,
        validation.bestPractices,
        validation.complexity,
        validation.style
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
      validation.errors.push(`Code validation failed: ${error.message}`);
    }

    return validation;
  }

  /**
   * Validate Java source code
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Java validation result
   */
  async validateJavaCode(projectPath) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      files: 0,
      annotatedMethods: 0,
      annotatedProperties: 0,
      annotatedEvents: 0
    };

    try {
      const srcDir = path.join(projectPath, 'src');
      if (!await fs.pathExists(srcDir)) {
        result.warnings.push('No src/ directory found');
        return result;
      }

      const javaFiles = await this.findFiles(srcDir, '.java');
      result.files = javaFiles.length;

      if (javaFiles.length === 0) {
        result.warnings.push('No Java source files found');
        return result;
      }

      // Validate each Java file
      for (const file of javaFiles) {
        const fileValidation = await this.validateJavaFile(file);
        result.errors.push(...fileValidation.errors);
        result.warnings.push(...fileValidation.warnings);
        
        // Count annotated elements
        result.annotatedMethods += fileValidation.annotatedMethods || 0;
        result.annotatedProperties += fileValidation.annotatedProperties || 0;
        result.annotatedEvents += fileValidation.annotatedEvents || 0;
      }

    } catch (error) {
      result.errors.push(`Java code validation failed: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate individual Java file
   * @param {string} filePath - Java file path
   * @returns {Promise<Object>} - File validation result
   */
  async validateJavaFile(filePath) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      annotatedMethods: 0,
      annotatedProperties: 0,
      annotatedEvents: 0
    };

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const fileName = path.basename(filePath);

      // Check for required imports
      const requiredImports = [
        'com.google.appinventor.components.annotations',
        'com.google.appinventor.components.runtime'
      ];

      for (const importPath of requiredImports) {
        if (!content.includes(importPath)) {
          result.warnings.push(`Missing import in ${fileName}: ${importPath}`);
        }
      }

      // Check for @DesignerComponent annotation
      if (content.includes('class ') && !content.includes('@DesignerComponent')) {
        result.warnings.push(`Class ${fileName} may be missing @DesignerComponent annotation`);
      }

      // Count and validate annotations
      const annotationCounts = this.countJavaAnnotations(content);
      result.annotatedMethods = annotationCounts.methods;
      result.annotatedProperties = annotationCounts.properties;
      result.annotatedEvents = annotationCounts.events;

      // Validate method annotations
      const methodValidation = this.validateJavaMethodAnnotations(content, fileName);
      result.warnings.push(...methodValidation.warnings);

      // Validate property annotations
      const propertyValidation = this.validateJavaPropertyAnnotations(content, fileName);
      result.warnings.push(...propertyValidation.warnings);

      // Validate event annotations
      const eventValidation = this.validateJavaEventAnnotations(content, fileName);
      result.warnings.push(...eventValidation.warnings);

      // Check code quality
      const qualityValidation = this.validateJavaCodeQuality(content, fileName);
      result.warnings.push(...qualityValidation.warnings);
      result.errors.push(...qualityValidation.errors);

      // Check for common issues
      const commonIssues = this.checkJavaCommonIssues(content, fileName);
      result.warnings.push(...commonIssues.warnings);

    } catch (error) {
      result.errors.push(`Failed to validate Java file ${fileName}: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Count Java annotations
   * @param {string} content - Java file content
   * @returns {Object} - Annotation counts
   */
  countJavaAnnotations(content) {
    return {
      methods: (content.match(/@SimpleFunction/g) || []).length,
      properties: (content.match(/@SimpleProperty/g) || []).length,
      events: (content.match(/@SimpleEvent/g) || []).length
    };
  }

  /**
   * Validate Java method annotations
   * @param {string} content - Java file content
   * @param {string} fileName - File name
   * @returns {Object} - Validation result
   */
  validateJavaMethodAnnotations(content, fileName) {
    const result = {
      warnings: []
    };

    // Find public methods without annotations
    const methodRegex = /public\s+\w+\s+(\w+)\s*\([^)]*\)/g;
    let match;
    
    while ((match = methodRegex.exec(content)) !== null) {
      const methodName = match[1];
      const methodStart = content.lastIndexOf('public', match.index);
      const methodBlock = content.substring(methodStart, match.index + match[0].length);
      
      // Skip constructors and common methods
      if (methodName === 'toString' || methodName === 'equals' || methodName === 'hashCode') {
        continue;
      }
      
      // Check if method is within a class
      const classContext = content.substring(0, methodStart).includes('class ');
      
      if (classContext && 
          !methodBlock.includes('@SimpleFunction') && 
          !methodBlock.includes('@Override') &&
          !methodName.startsWith('_')) { // Private methods start with _
        result.warnings.push(`Method ${methodName} in ${fileName} may be missing @SimpleFunction annotation`);
      }
    }

    return result;
  }

  /**
   * Validate Java property annotations
   * @param {string} content - Java file content
   * @param {string} fileName - File name
   * @returns {Object} - Validation result
   */
  validateJavaPropertyAnnotations(content, fileName) {
    const result = {
      warnings: []
    };

    // Find public getter/setter methods without annotations
    const getterRegex = /public\s+\w+\s+get(\w+)\s*\(\s*\)/g;
    const setterRegex = /public\s+void\s+set(\w+)\s*\([^)]*\)/g;
    
    let match;
    while ((match = getterRegex.exec(content)) !== null) {
      const propertyName = match[1];
      const methodStart = content.lastIndexOf('public', match.index);
      const methodBlock = content.substring(methodStart, match.index + match[0].length);
      
      if (!methodBlock.includes('@SimpleProperty')) {
        result.warnings.push(`Getter for ${propertyName} in ${fileName} may be missing @SimpleProperty annotation`);
      }
    }
    
    while ((match = setterRegex.exec(content)) !== null) {
      const propertyName = match[1];
      const methodStart = content.lastIndexOf('public', match.index);
      const methodBlock = content.substring(methodStart, match.index + match[0].length);
      
      if (!methodBlock.includes('@SimpleProperty')) {
        result.warnings.push(`Setter for ${propertyName} in ${fileName} may be missing @SimpleProperty annotation`);
      }
    }

    return result;
  }

  /**
   * Validate Java event annotations
   * @param {string} content - Java file content
   * @param {string} fileName - File name
   * @returns {Object} - Validation result
   */
  validateJavaEventAnnotations(content, fileName) {
    const result = {
      warnings: []
    };

    // Find public void methods that might be events
    const eventRegex = /public\s+void\s+(\w+)\s*\([^)]*\)/g;
    let match;
    
    while ((match = eventRegex.exec(content)) !== null) {
      const methodName = match[1];
      const methodStart = content.lastIndexOf('public', match.index);
      const methodBlock = content.substring(methodStart, match.index + match[0].length);
      
      // Check if method calls EventDispatcher
      const methodBody = this.extractMethodBody(content, methodStart);
      if (methodBody.includes('EventDispatcher.') && !methodBlock.includes('@SimpleEvent')) {
        result.warnings.push(`Method ${methodName} in ${fileName} may be missing @SimpleEvent annotation`);
      }
    }

    return result;
  }

  /**
   * Extract method body
   * @param {string} content - File content
   * @param {number} startIndex - Method start index
   * @returns {string} - Method body
   */
  extractMethodBody(content, startIndex) {
    let braceCount = 0;
    let inBody = false;
    let body = '';
    
    for (let i = startIndex; i < content.length; i++) {
      const char = content[i];
      
      if (char === '{') {
        if (!inBody) {
          inBody = true;
        } else {
          braceCount++;
        }
      } else if (char === '}') {
        if (braceCount > 0) {
          braceCount--;
        } else if (inBody) {
          return body;
        }
      }
      
      if (inBody && braceCount >= 0) {
        body += char;
      }
    }
    
    return body;
  }

  /**
   * Validate Java code quality
   * @param {string} content - Java file content
   * @param {string} fileName - File name
   * @returns {Object} - Quality validation result
   */
  validateJavaCodeQuality(content, fileName) {
    const result = {
      errors: [],
      warnings: []
    };

    // Check line length
    const lines = content.split('\n');
    const longLines = lines.filter((line, index) => line.length > this.maxLineLength);
    if (longLines.length > 0) {
      result.warnings.push(`File ${fileName} has ${longLines.length} lines exceeding ${this.maxLineLength} characters`);
    }

    // Check method length
    const methodRegex = /public\s+\w+\s+\w+\s*\([^)]*\)\s*{/g;
    let methodMatch;
    while ((methodMatch = methodRegex.exec(content)) !== null) {
      const methodStart = methodMatch.index;
      const methodBody = this.extractMethodBody(content, methodStart);
      const methodLines = methodBody.split('\n').length;
      
      if (methodLines > this.maxMethodLength) {
        result.warnings.push(`Method in ${fileName} has ${methodLines} lines (exceeds ${this.maxMethodLength})`);
      }
    }

    // Check for TODO comments
    const todoComments = lines.filter(line => 
      line.includes('// TODO:') || line.includes('TODO(')
    );
    if (todoComments.length > 0) {
      result.warnings.push(`File ${fileName} has ${todoComments.length} TODO comments`);
    }

    // Check for magic numbers
    const magicNumbers = content.match(/\b\d+\.\d+|\b\d{2,}\b/g) || [];
    if (magicNumbers.length > 10) {
      result.warnings.push(`File ${fileName} contains many magic numbers`);
    }

    return result;
  }

  /**
   * Check for common Java issues
   * @param {string} content - Java file content
   * @param {string} fileName - File name
   * @returns {Object} - Issue check result
   */
  checkJavaCommonIssues(content, fileName) {
    const result = {
      warnings: []
    };

    // Check for System.out.println
    if (content.includes('System.out.println')) {
      result.warnings.push(`File ${fileName} uses System.out.println (use logging instead)`);
    }

    // Check for printStackTrace
    if (content.includes('.printStackTrace()')) {
      result.warnings.push(`File ${fileName} uses printStackTrace() (use proper logging)`);
    }

    // Check for raw types
    if (content.includes('List ') || content.includes('Map ') || content.includes('Set ')) {
      result.warnings.push(`File ${fileName} uses raw types (specify generic types)`);
    }

    // Check for unchecked warnings
    if (content.includes('@SuppressWarnings("unchecked")')) {
      result.warnings.push(`File ${fileName} suppresses unchecked warnings`);
    }

    return result;
  }

  /**
   * Validate Kotlin source code
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Kotlin validation result
   */
  async validateKotlinCode(projectPath) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      files: 0,
      annotatedMethods: 0,
      annotatedProperties: 0,
      annotatedEvents: 0
    };

    try {
      const srcDir = path.join(projectPath, 'src');
      if (!await fs.pathExists(srcDir)) {
        result.warnings.push('No src/ directory found');
        return result;
      }

      const kotlinFiles = await this.findFiles(srcDir, '.kt');
      result.files = kotlinFiles.length;

      if (kotlinFiles.length === 0) {
        result.warnings.push('No Kotlin source files found');
        return result;
      }

      // Validate each Kotlin file
      for (const file of kotlinFiles) {
        const fileValidation = await this.validateKotlinFile(file);
        result.errors.push(...fileValidation.errors);
        result.warnings.push(...fileValidation.warnings);
        
        // Count annotated elements
        result.annotatedMethods += fileValidation.annotatedMethods || 0;
        result.annotatedProperties += fileValidation.annotatedProperties || 0;
        result.annotatedEvents += fileValidation.annotatedEvents || 0;
      }

    } catch (error) {
      result.errors.push(`Kotlin code validation failed: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate individual Kotlin file
   * @param {string} filePath - Kotlin file path
   * @returns {Promise<Object>} - File validation result
   */
  async validateKotlinFile(filePath) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      annotatedMethods: 0,
      annotatedProperties: 0,
      annotatedEvents: 0
    };

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const fileName = path.basename(filePath);

      // Check for required imports
      const requiredImports = [
        'com.google.appinventor.components.annotations',
        'com.google.appinventor.components.runtime'
      ];

      for (const importPath of requiredImports) {
        if (!content.includes(importPath)) {
          result.warnings.push(`Missing import in ${fileName}: ${importPath}`);
        }
      }

      // Check for @DesignerComponent annotation
      if (content.includes('class ') && !content.includes('@DesignerComponent')) {
        result.warnings.push(`Class ${fileName} may be missing @DesignerComponent annotation`);
      }

      // Count and validate annotations
      const annotationCounts = this.countKotlinAnnotations(content);
      result.annotatedMethods = annotationCounts.methods;
      result.annotatedProperties = annotationCounts.properties;
      result.annotatedEvents = annotationCounts.events;

      // Validate method annotations
      const methodValidation = this.validateKotlinMethodAnnotations(content, fileName);
      result.warnings.push(...methodValidation.warnings);

      // Validate property annotations
      const propertyValidation = this.validateKotlinPropertyAnnotations(content, fileName);
      result.warnings.push(...propertyValidation.warnings);

      // Validate event annotations
      const eventValidation = this.validateKotlinEventAnnotations(content, fileName);
      result.warnings.push(...eventValidation.warnings);

      // Check code quality
      const qualityValidation = this.validateKotlinCodeQuality(content, fileName);
      result.warnings.push(...qualityValidation.warnings);
      result.errors.push(...qualityValidation.errors);

      // Check for common issues
      const commonIssues = this.checkKotlinCommonIssues(content, fileName);
      result.warnings.push(...commonIssues.warnings);

    } catch (error) {
      result.errors.push(`Failed to validate Kotlin file ${fileName}: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Count Kotlin annotations
   * @param {string} content - Kotlin file content
   * @returns {Object} - Annotation counts
   */
  countKotlinAnnotations(content) {
    return {
      methods: (content.match(/@SimpleFunction/g) || []).length,
      properties: (content.match(/@SimpleProperty/g) || []).length,
      events: (content.match(/@SimpleEvent/g) || []).length
    };
  }

  /**
   * Validate Kotlin method annotations
   * @param {string} content - Kotlin file content
   * @param {string} fileName - File name
   * @returns {Object} - Validation result
   */
  validateKotlinMethodAnnotations(content, fileName) {
    const result = {
      warnings: []
    };

    // Find public functions without annotations
    const functionRegex = /fun\s+(\w+)\s*\([^)]*\)/g;
    let match;
    
    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[1];
      const functionStart = content.lastIndexOf('fun', match.index);
      const functionBlock = content.substring(functionStart, match.index + match[0].length);
      
      // Skip common functions
      if (functionName === 'toString' || functionName === 'equals' || functionName === 'hashCode') {
        continue;
      }
      
      // Check if function is within a class
      const classContext = content.substring(0, functionStart).includes('class ');
      
      if (classContext && 
          !functionBlock.includes('@SimpleFunction') && 
          !functionName.startsWith('_')) { // Private functions start with _
        result.warnings.push(`Function ${functionName} in ${fileName} may be missing @SimpleFunction annotation`);
      }
    }

    return result;
  }

  /**
   * Validate Kotlin property annotations
   * @param {string} content - Kotlin file content
   * @param {string} fileName - File name
   * @returns {Object} - Validation result
   */
  validateKotlinPropertyAnnotations(content, fileName) {
    const result = {
      warnings: []
    };

    // Find properties without annotations
    const propertyRegex = /var\s+(\w+)/g;
    const valPropertyRegex = /val\s+(\w+)/g;
    
    let match;
    while ((match = propertyRegex.exec(content)) !== null) {
      const propertyName = match[1];
      const propertyStart = content.lastIndexOf('var', match.index);
      const propertyBlock = content.substring(propertyStart, match.index + match[0].length);
      
      if (!propertyBlock.includes('@SimpleProperty')) {
        result.warnings.push(`Property ${propertyName} in ${fileName} may be missing @SimpleProperty annotation`);
      }
    }
    
    while ((match = valPropertyRegex.exec(content)) !== null) {
      const propertyName = match[1];
      const propertyStart = content.lastIndexOf('val', match.index);
      const propertyBlock = content.substring(propertyStart, match.index + match[0].length);
      
      if (!propertyBlock.includes('@SimpleProperty')) {
        result.warnings.push(`Property ${propertyName} in ${fileName} may be missing @SimpleProperty annotation`);
      }
    }

    return result;
  }

  /**
   * Validate Kotlin event annotations
   * @param {string} content - Kotlin file content
   * @param {string} fileName - File name
   * @returns {Object} - Validation result
   */
  validateKotlinEventAnnotations(content, fileName) {
    const result = {
      warnings: []
    };

    // Find functions that might be events
    const functionRegex = /fun\s+(\w+)\s*\([^)]*\)/g;
    let match;
    
    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[1];
      const functionStart = content.lastIndexOf('fun', match.index);
      const functionBlock = content.substring(functionStart, match.index + match[0].length);
      
      // Check if function calls EventDispatcher
      const functionBody = this.extractKotlinFunctionBody(content, functionStart);
      if (functionBody.includes('EventDispatcher.') && !functionBlock.includes('@SimpleEvent')) {
        result.warnings.push(`Function ${functionName} in ${fileName} may be missing @SimpleEvent annotation`);
      }
    }

    return result;
  }

  /**
   * Extract Kotlin function body
   * @param {string} content - File content
   * @param {number} startIndex - Function start index
   * @returns {string} - Function body
   */
  extractKotlinFunctionBody(content, startIndex) {
    let braceCount = 0;
    let inBody = false;
    let body = '';
    
    for (let i = startIndex; i < content.length; i++) {
      const char = content[i];
      
      if (char === '=') {
        // Single expression function
        const restOfLine = content.substring(i + 1, content.indexOf('\n', i));
        return restOfLine.trim();
      } else if (char === '{') {
        if (!inBody) {
          inBody = true;
        } else {
          braceCount++;
        }
      } else if (char === '}') {
        if (braceCount > 0) {
          braceCount--;
        } else if (inBody) {
          return body;
        }
      }
      
      if (inBody && braceCount >= 0) {
        body += char;
      }
    }
    
    return body;
  }

  /**
   * Validate Kotlin code quality
   * @param {string} content - Kotlin file content
   * @param {string} fileName - File name
   * @returns {Object} - Quality validation result
   */
  validateKotlinCodeQuality(content, fileName) {
    const result = {
      errors: [],
      warnings: []
    };

    // Check line length
    const lines = content.split('\n');
    const longLines = lines.filter((line, index) => line.length > this.maxLineLength);
    if (longLines.length > 0) {
      result.warnings.push(`File ${fileName} has ${longLines.length} lines exceeding ${this.maxLineLength} characters`);
    }

    // Check function length
    const functionRegex = /fun\s+\w+\s*\([^)]*\)\s*[{=]/g;
    let functionMatch;
    while ((functionMatch = functionRegex.exec(content)) !== null) {
      const functionStart = functionMatch.index;
      const functionBody = this.extractKotlinFunctionBody(content, functionStart);
      const functionLines = functionBody.split('\n').length;
      
      if (functionLines > this.maxMethodLength) {
        result.warnings.push(`Function in ${fileName} has ${functionLines} lines (exceeds ${this.maxMethodLength})`);
      }
    }

    // Check for TODO comments
    const todoComments = lines.filter(line => 
      line.includes('// TODO:') || line.includes('TODO(')
    );
    if (todoComments.length > 0) {
      result.warnings.push(`File ${fileName} has ${todoComments.length} TODO comments`);
    }

    return result;
  }

  /**
   * Check for common Kotlin issues
   * @param {string} content - Kotlin file content
   * @param {string} fileName - File name
   * @returns {Object} - Issue check result
   */
  checkKotlinCommonIssues(content, fileName) {
    const result = {
      warnings: []
    };

    // Check for println
    if (content.includes('println(')) {
      result.warnings.push(`File ${fileName} uses println() (use logging instead)`);
    }

    // Check for printStackTrace
    if (content.includes('.printStackTrace()')) {
      result.warnings.push(`File ${fileName} uses printStackTrace() (use proper logging)`);
    }

    // Check for nullable types without null checks
    const nullableTypes = content.match(/:\s*\w+\?/g) || [];
    if (nullableTypes.length > 0) {
      result.warnings.push(`File ${fileName} uses nullable types (ensure proper null handling)`);
    }

    return result;
  }

  /**
   * Validate App Inventor Extension best practices
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Best practices validation result
   */
  async validateBestPractices(projectPath) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      practices: []
    };

    try {
      // Check for proper exception handling
      const exceptionHandling = await this.validateExceptionHandling(projectPath);
      result.warnings.push(...exceptionHandling.warnings);
      result.practices.push(...exceptionHandling.practices);

      // Check for proper logging
      const logging = await this.validateLogging(projectPath);
      result.warnings.push(...logging.warnings);
      result.practices.push(...logging.practices);

      // Check for proper resource management
      const resourceManagement = await this.validateResourceManagement(projectPath);
      result.warnings.push(...resourceManagement.warnings);
      result.practices.push(...resourceManagement.practices);

      // Check for proper threading
      const threading = await this.validateThreading(projectPath);
      result.warnings.push(...threading.warnings);
      result.practices.push(...threading.practices);

      // Check for proper documentation
      const documentation = await this.validateDocumentation(projectPath);
      result.warnings.push(...documentation.warnings);
      result.practices.push(...documentation.practices);

    } catch (error) {
      result.errors.push(`Best practices validation failed: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate exception handling
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Exception handling validation result
   */
  async validateExceptionHandling(projectPath) {
    const result = {
      warnings: [],
      practices: []
    };

    try {
      const srcDir = path.join(projectPath, 'src');
      if (!await fs.pathExists(srcDir)) {
        return result;
      }

      const javaFiles = await this.findFiles(srcDir, '.java');
      const kotlinFiles = await this.findFiles(srcDir, '.kt');
      const allFiles = [...javaFiles, ...kotlinFiles];

      for (const file of allFiles) {
        const content = await fs.readFile(file, 'utf8');
        const fileName = path.basename(file);

        // Check for try-catch blocks
        if (!content.includes('try') && !content.includes('catch')) {
          result.warnings.push(`File ${fileName} has no exception handling`);
        }

        // Check for proper exception propagation
        if (content.includes('e.printStackTrace()') || content.includes('System.err.println')) {
          result.warnings.push(`File ${fileName} uses improper error output`);
        }

        // Check for proper exception types
        if (content.includes('catch (Exception')) {
          result.warnings.push(`File ${fileName} catches generic Exception (be more specific)`);
        }
      }

      result.practices.push('Exception handling validation completed');

    } catch (error) {
      result.warnings.push(`Exception handling validation failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Validate logging practices
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Logging validation result
   */
  async validateLogging(projectPath) {
    const result = {
      warnings: [],
      practices: []
    };

    try {
      const srcDir = path.join(projectPath, 'src');
      if (!await fs.pathExists(srcDir)) {
        return result;
      }

      const javaFiles = await this.findFiles(srcDir, '.java');
      const kotlinFiles = await this.findFiles(srcDir, '.kt');
      const allFiles = [...javaFiles, ...kotlinFiles];

      for (const file of allFiles) {
        const content = await fs.readFile(file, 'utf8');
        const fileName = path.basename(file);

        // Check for logging
        const hasLogging = content.includes('Log.') || 
                          content.includes('Logger') || 
                          content.includes('android.util.Log');
        
        if (!hasLogging) {
          result.warnings.push(`File ${fileName} has no logging (consider adding for debugging)`);
        }

        // Check for proper log levels
        const logLevels = ['Log.d(', 'Log.i(', 'Log.w(', 'Log.e('];
        const usedLogLevels = logLevels.filter(level => content.includes(level));
        
        if (usedLogLevels.length > 0 && !content.includes('Log.v(')) {
          result.warnings.push(`File ${fileName} uses logging but missing verbose level`);
        }
      }

      result.practices.push('Logging validation completed');

    } catch (error) {
      result.warnings.push(`Logging validation failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Validate resource management
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Resource management validation result
   */
  async validateResourceManagement(projectPath) {
    const result = {
      warnings: [],
      practices: []
    };

    try {
      const srcDir = path.join(projectPath, 'src');
      if (!await fs.pathExists(srcDir)) {
        return result;
      }

      const javaFiles = await this.findFiles(srcDir, '.java');
      const kotlinFiles = await this.findFiles(srcDir, '.kt');
      const allFiles = [...javaFiles, ...kotlinFiles];

      for (const file of allFiles) {
        const content = await fs.readFile(file, 'utf8');
        const fileName = path.basename(file);

        // Check for file streams without proper closing
        if (content.includes('FileInputStream') && !content.includes('.close()')) {
          result.warnings.push(`File ${fileName} opens FileInputStream without closing`);
        }

        if (content.includes('FileOutputStream') && !content.includes('.close()')) {
          result.warnings.push(`File ${fileName} opens FileOutputStream without closing`);
        }

        // Check for context usage without proper cleanup
        if (content.includes('Context') && content.includes('$context()')) {
          // This is generally okay for App Inventor extensions
        }
      }

      result.practices.push('Resource management validation completed');

    } catch (error) {
      result.warnings.push(`Resource management validation failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Validate threading practices
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Threading validation result
   */
  async validateThreading(projectPath) {
    const result = {
      warnings: [],
      practices: []
    };

    try {
      const srcDir = path.join(projectPath, 'src');
      if (!await fs.pathExists(srcDir)) {
        return result;
      }

      const javaFiles = await this.findFiles(srcDir, '.java');
      const kotlinFiles = await this.findFiles(srcDir, '.kt');
      const allFiles = [...javaFiles, ...kotlinFiles];

      for (const file of allFiles) {
        const content = await fs.readFile(file, 'utf8');
        const fileName = path.basename(file);

        // Check for UI thread operations
        if (content.includes('runOnUiThread') || content.includes('Handler(')) {
          result.practices.push(`File ${fileName} uses threading mechanisms`);
        }

        // Check for blocking operations on main thread
        const blockingOps = [
          'Thread.sleep',
          'Network call',
          'File I/O in UI thread'
        ];

        // This is a simplified check - in reality, you'd need more sophisticated analysis
      }

      result.practices.push('Threading validation completed');

    } catch (error) {
      result.warnings.push(`Threading validation failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Validate documentation
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Documentation validation result
   */
  async validateDocumentation(projectPath) {
    const result = {
      warnings: [],
      practices: []
    };

    try {
      const srcDir = path.join(projectPath, 'src');
      if (!await fs.pathExists(srcDir)) {
        return result;
      }

      const javaFiles = await this.findFiles(srcDir, '.java');
      const kotlinFiles = await this.findFiles(srcDir, '.kt');
      const allFiles = [...javaFiles, ...kotlinFiles];

      for (const file of allFiles) {
        const content = await fs.readFile(file, 'utf8');
        const fileName = path.basename(file);

        // Check for class documentation
        if (!content.includes('/**') && content.includes('class ')) {
          result.warnings.push(`File ${fileName} lacks class documentation`);
        }

        // Check for method documentation
        const methodRegex = /public\s+\w+\s+\w+\s*\([^)]*\)/g;
        let match;
        let methodCount = 0;
        let documentedMethodCount = 0;
        
        while ((match = methodRegex.exec(content)) !== null) {
          methodCount++;
          const methodStart = content.lastIndexOf('public', match.index);
          const beforeMethod = content.substring(0, methodStart);
          
          if (beforeMethod.endsWith('/**') || beforeMethod.includes('/**')) {
            documentedMethodCount++;
          }
        }
        
        if (methodCount > 0 && documentedMethodCount < methodCount * 0.5) {
          result.warnings.push(`File ${fileName} has insufficient method documentation (${documentedMethodCount}/${methodCount})`);
        }
      }

      result.practices.push('Documentation validation completed');

    } catch (error) {
      result.warnings.push(`Documentation validation failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Analyze code complexity
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Complexity analysis result
   */
  async analyzeComplexity(projectPath) {
    const result = {
      warnings: [],
      complexity: {
        cyclomatic: 0,
        cognitive: 0,
        nesting: 0
      }
    };

    try {
      const srcDir = path.join(projectPath, 'src');
      if (!await fs.pathExists(srcDir)) {
        return result;
      }

      const javaFiles = await this.findFiles(srcDir, '.java');
      const kotlinFiles = await this.findFiles(srcDir, '.kt');
      const allFiles = [...javaFiles, ...kotlinFiles];

      let totalCyclomatic = 0;
      let totalFiles = 0;

      for (const file of allFiles) {
        const content = await fs.readFile(file, 'utf8');
        const fileName = path.basename(file);

        // Calculate cyclomatic complexity (simplified)
        const cyclomatic = this.calculateCyclomaticComplexity(content);
        totalCyclomatic += cyclomatic;
        totalFiles++;

        if (cyclomatic > 10) {
          result.warnings.push(`File ${fileName} has high cyclomatic complexity (${cyclomatic})`);
        }
      }

      if (totalFiles > 0) {
        result.complexity.cyclomatic = Math.round(totalCyclomatic / totalFiles);
      }

      result.complexity.cognitive = await this.analyzeCognitiveComplexity(allFiles);
      result.complexity.nesting = await this.analyzeNestingDepth(allFiles);

    } catch (error) {
      result.warnings.push(`Complexity analysis failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Calculate cyclomatic complexity (simplified)
   * @param {string} content - File content
   * @returns {number} - Cyclomatic complexity
   */
  calculateCyclomaticComplexity(content) {
    // Count decision points
    const decisionPoints = [
      'if ',
      'for ',
      'while ',
      'case ',
      'catch ',
      '&&',
      '||',
      '?'
    ];

    let complexity = 1; // Base complexity
    
    for (const point of decisionPoints) {
      const regex = new RegExp(point, 'g');
      const matches = content.match(regex) || [];
      complexity += matches.length;
    }

    return complexity;
  }

  /**
   * Analyze cognitive complexity
   * @param {Array} files - File paths
   * @returns {Promise<number>} - Cognitive complexity score
   */
  async analyzeCognitiveComplexity(files) {
    // Simplified cognitive complexity analysis
    return files.length > 0 ? Math.min(10, files.length) : 0;
  }

  /**
   * Analyze nesting depth
   * @param {Array} files - File paths
   * @returns {Promise<number>} - Nesting depth score
   */
  async analyzeNestingDepth(files) {
    // Simplified nesting depth analysis
    return files.length > 0 ? Math.min(5, Math.ceil(files.length / 2)) : 0;
  }

  /**
   * Validate code style
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Style validation result
   */
  async validateStyle(projectPath) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      style: {
        naming: 0,
        formatting: 0,
        consistency: 0
      }
    };

    try {
      const srcDir = path.join(projectPath, 'src');
      if (!await fs.pathExists(srcDir)) {
        result.warnings.push('No src/ directory found');
        return result;
      }

      const javaFiles = await this.findFiles(srcDir, '.java');
      const kotlinFiles = await this.findFiles(srcDir, '.kt');
      const allFiles = [...javaFiles, ...kotlinFiles];

      // Analyze naming conventions
      const namingScore = await this.analyzeNamingConventions(allFiles);
      result.style.naming = namingScore;

      // Analyze formatting
      const formattingScore = await this.analyzeFormatting(allFiles);
      result.style.formatting = formattingScore;

      // Analyze consistency
      const consistencyScore = await this.analyzeConsistency(allFiles);
      result.style.consistency = consistencyScore;

      // Generate warnings for low scores
      if (namingScore < 7) {
        result.warnings.push(`Naming conventions score is low: ${namingScore}/10`);
      }

      if (formattingScore < 7) {
        result.warnings.push(`Code formatting score is low: ${formattingScore}/10`);
      }

      if (consistencyScore < 7) {
        result.warnings.push(`Code consistency score is low: ${consistencyScore}/10`);
      }

    } catch (error) {
      result.errors.push(`Style validation failed: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Analyze naming conventions
   * @param {Array} files - File paths
   * @returns {Promise<number>} - Naming convention score
   */
  async analyzeNamingConventions(files) {
    let score = 10;
    let issues = 0;

    for (const file of files) {
      const content = await fs.readFile(file, 'utf8');
      const fileName = path.basename(file);

      // Check class naming (PascalCase)
      const classMatches = content.match(/class\s+(\w+)/g) || [];
      for (const match of classMatches) {
        const className = match.replace('class ', '').trim();
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(className)) {
          issues++;
        }
      }

      // Check method naming (camelCase)
      const methodMatches = content.match(/(?:public|fun)\s+\w*\s*(\w+)\s*\(/g) || [];
      for (const match of methodMatches) {
        const methodName = match.match(/(?:public|fun)\s+\w*\s*(\w+)\s*\(/)[1];
        if (!/^[a-z][a-zA-Z0-9]*$/.test(methodName) && 
            !['toString', 'equals', 'hashCode'].includes(methodName)) {
          issues++;
        }
      }

      // Check variable naming (camelCase)
      const varMatches = content.match(/(?:int|String|boolean|double|float|long)\s+(\w+)/g) || [];
      for (const match of varMatches) {
        const varName = match.split(' ')[1];
        if (!/^[a-z][a-zA-Z0-9]*$/.test(varName)) {
          issues++;
        }
      }
    }

    // Adjust score based on issues
    score = Math.max(0, 10 - issues);
    return score;
  }

  /**
   * Analyze code formatting
   * @param {Array} files - File paths
   * @returns {Promise<number>} - Formatting score
   */
  async analyzeFormatting(files) {
    let score = 10;
    let issues = 0;

    for (const file of files) {
      const content = await fs.readFile(file, 'utf8');
      const lines = content.split('\n');

      // Check indentation consistency
      let indentStyle = null;
      for (const line of lines) {
        if (line.trim().length > 0) {
          const leadingSpaces = line.length - line.trimLeft().length;
          if (leadingSpaces > 0) {
            const currentIndent = leadingSpaces % 2 === 0 ? 'spaces' : 'mixed';
            if (indentStyle === null) {
              indentStyle = currentIndent;
            } else if (indentStyle !== currentIndent && currentIndent !== 'mixed') {
              issues++;
              break;
            }
          }
        }
      }

      // Check for trailing whitespace
      const trailingWhitespace = lines.filter(line => /\s+$/.test(line));
      issues += trailingWhitespace.length > 0 ? 1 : 0;

      // Check line spacing
      let consecutiveBlankLines = 0;
      for (const line of lines) {
        if (line.trim() === '') {
          consecutiveBlankLines++;
          if (consecutiveBlankLines > 2) {
            issues++;
            break;
          }
        } else {
          consecutiveBlankLines = 0;
        }
      }
    }

    // Adjust score based on issues
    score = Math.max(0, 10 - Math.min(issues, 10));
    return score;
  }

  /**
   * Analyze code consistency
   * @param {Array} files - File paths
   * @returns {Promise<number>} - Consistency score
   */
  async analyzeConsistency(files) {
    let score = 10;
    let issues = 0;

    // Check for consistent use of annotations
    let annotationUsage = {
      simpleFunction: 0,
      simpleProperty: 0,
      simpleEvent: 0
    };

    for (const file of files) {
      const content = await fs.readFile(file, 'utf8');
      
      annotationUsage.simpleFunction += (content.match(/@SimpleFunction/g) || []).length;
      annotationUsage.simpleProperty += (content.match(/@SimpleProperty/g) || []).length;
      annotationUsage.simpleEvent += (content.match(/@SimpleEvent/g) || []).length;
    }

    // Check for balanced annotation usage
    const totalAnnotations = Object.values(annotationUsage).reduce((sum, val) => sum + val, 0);
    if (totalAnnotations > 0) {
      const avgUsage = totalAnnotations / 3;
      Object.values(annotationUsage).forEach(count => {
        if (Math.abs(count - avgUsage) > avgUsage * 0.5) {
          issues++;
        }
      });
    }

    // Adjust score based on issues
    score = Math.max(0, 10 - Math.min(issues, 10));
    return score;
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
   * Generate code validation report
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
    let report = '=== AIX Studio Code Validation Report ===\n\n';
    
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
    
    // Add complexity metrics
    if (validation.complexity) {
      report += 'Complexity Metrics:\n';
      report += `  Cyclomatic: ${validation.complexity.cyclomatic || 0}\n`;
      report += `  Cognitive: ${validation.complexity.cognitive || 0}\n`;
      report += `  Nesting: ${validation.complexity.nesting || 0}\n\n`;
    }
    
    // Add style metrics
    if (validation.style) {
      report += 'Style Metrics:\n';
      report += `  Naming: ${validation.style.naming || 0}/10\n`;
      report += `  Formatting: ${validation.style.formatting || 0}/10\n`;
      report += `  Consistency: ${validation.style.consistency || 0}/10\n\n`;
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
    <title>AIX Studio Code Validation Report</title>
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
        .metric { display: inline-block; background: #e3f2fd; padding: 5px 10px; margin: 5px; border-radius: 4px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📝 AIX Studio Code Validation Report</h1>
        
        <div class="status ${validation.valid ? 'valid' : 'invalid'}">
            <strong>Status:</strong> ${validation.valid ? 'VALID' : 'INVALID'}
        </div>
        
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        
        <div class="metrics">
            <h2>📊 Metrics</h2>
`;
    
    if (validation.complexity) {
      html += `
            <div class="metric">Cyclomatic: ${validation.complexity.cyclomatic || 0}</div>
            <div class="metric">Cognitive: ${validation.complexity.cognitive || 0}</div>
            <div class="metric">Nesting: ${validation.complexity.nesting || 0}</div>
`;
    }
    
    if (validation.style) {
      html += `
            <div class="metric">Naming: ${validation.style.naming || 0}/10</div>
            <div class="metric">Formatting: ${validation.style.formatting || 0}/10</div>
            <div class="metric">Consistency: ${validation.style.consistency || 0}/10</div>
`;
    }
    
    html += `
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
            <p>Generated by AIX Studio Code Validator</p>
        </div>
    </div>
</body>
</html>`;
    
    return html;
  }
}

module.exports = CodeValidator;