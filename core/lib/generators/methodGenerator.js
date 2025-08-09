const fs = require('fs-extra');
const path = require('path');
const EventEmitter = require('events');

/**
 * Method Generator for App Inventor Extensions
 * Generates @SimpleFunction methods for extension classes
 */
class MethodGenerator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.verbose = options.verbose || false;
  }

  /**
   * Generate method from signature
   * @param {string} signature - Method signature (e.g., "CalculateSum:int,a:int,b:int")
   * @param {string} filePath - Java/Kotlin file path
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Generation result
   */
  async generate(signature, filePath, options = {}) {
    try {
      this.emit('start', { signature, filePath });
      
      // Parse signature
      const methodInfo = this.parseSignature(signature);
      
      // Determine language
      const isKotlin = filePath.endsWith('.kt');
      
      // Generate method code
      const methodCode = this.generateMethodCode(methodInfo, isKotlin, options);
      
      // Insert method into file
      const result = await this.insertMethod(filePath, methodCode, options);
      
      this.emit('complete', { signature, filePath, ...result });
      
      return {
        success: true,
        signature,
        filePath,
        methodInfo,
        code: methodCode,
        ...result,
        message: 'Method generated successfully'
      };
    } catch (error) {
      this.emit('error', { signature, filePath, error: error.message });
      throw new Error(`Failed to generate method: ${error.message}`);
    }
  }

  /**
   * Parse method signature
   * @param {string} signature - Method signature
   * @returns {Object} - Parsed method information
   */
  parseSignature(signature) {
    // Format: "MethodName:ReturnType,param1:Type,param2:Type"
    const [methodPart, ...paramParts] = signature.split(',');
    
    if (!methodPart) {
      throw new Error('Invalid method signature: missing method name');
    }
    
    const [methodName, returnType = 'void'] = methodPart.split(':');
    
    const params = paramParts.map(param => {
      const [name, type] = param.split(':');
      if (!name || !type) {
        throw new Error(`Invalid parameter format: ${param}`);
      }
      return { name: name.trim(), type: type.trim() };
    });
    
    return {
      name: methodName.trim(),
      returnType: returnType.trim(),
      parameters: params
    };
  }

  /**
   * Generate method code
   * @param {Object} methodInfo - Method information
   * @param {boolean} isKotlin - Whether to generate Kotlin code
   * @param {Object} options - Generation options
   * @returns {string} - Generated method code
   */
  generateMethodCode(methodInfo, isKotlin, options = {}) {
    const { name, returnType, parameters } = methodInfo;
    
    if (isKotlin) {
      return this.generateKotlinMethod(name, returnType, parameters, options);
    } else {
      return this.generateJavaMethod(name, returnType, parameters, options);
    }
  }

  /**
   * Generate Java method
   * @param {string} name - Method name
   * @param {string} returnType - Return type
   * @param {Array} parameters - Method parameters
   * @param {Object} options - Generation options
   * @returns {string} - Generated Java method
   */
  generateJavaMethod(name, returnType, parameters, options = {}) {
    const paramList = parameters.map(p => `${p.type} ${p.name}`).join(', ');
    const paramNames = parameters.map(p => p.name).join(', ');
    
    let method = '';
    
    // Add documentation comment
    if (options.documentation !== false) {
      method += `    /**\n`;
      method += `     * TODO: Add description for ${name}\n`;
      if (parameters.length > 0) {
        method += `     *\n`;
        parameters.forEach(param => {
          method += `     * @param ${param.name} TODO: Add description\n`;
        });
      }
      if (returnType !== 'void') {
        method += `     * @return TODO: Add description\n`;
      }
      method += `     */\n`;
    }
    
    // Add SimpleFunction annotation
    const description = options.description || `Performs ${name} operation`;
    method += `    @SimpleFunction(description = "${description}")\n`;
    
    // Add method signature
    method += `    public ${returnType} ${name}(${paramList}) {\n`;
    
    // Add method body
    if (returnType.toLowerCase() === 'void') {
      method += `        // TODO: Implement ${name}\n`;
      method += `        // Example: EventDispatcher.dispatchEvent(this, "${name}", ${paramNames});\n`;
    } else {
      method += `        // TODO: Implement ${name}\n`;
      if (returnType.toLowerCase() === 'string') {
        method += `        return "";\n`;
      } else if (returnType.toLowerCase() === 'int') {
        method += `        return 0;\n`;
      } else if (returnType.toLowerCase() === 'boolean') {
        method += `        return false;\n`;
      } else if (returnType.toLowerCase() === 'double') {
        method += `        return 0.0;\n`;
      } else {
        method += `        return null; // or appropriate default value\n`;
      }
    }
    
    method += `    }\n`;
    
    return method;
  }

  /**
   * Generate Kotlin method
   * @param {string} name - Method name
   * @param {string} returnType - Return type
   * @param {Array} parameters - Method parameters
   * @param {Object} options - Generation options
   * @returns {string} - Generated Kotlin method
   */
  generateKotlinMethod(name, returnType, parameters, options = {}) {
    const paramList = parameters.map(p => `${p.name}: ${p.type}`).join(', ');
    const paramNames = parameters.map(p => p.name).join(', ');
    
    let method = '';
    
    // Add documentation comment
    if (options.documentation !== false) {
      method += `    /**\n`;
      method += `     * TODO: Add description for ${name}\n`;
      if (parameters.length > 0) {
        method += `     *\n`;
        parameters.forEach(param => {
          method += `     * @param ${param.name} TODO: Add description\n`;
        });
      }
      if (returnType !== 'Unit') {
        method += `     * @return TODO: Add description\n`;
      }
      method += `     */\n`;
    }
    
    // Add SimpleFunction annotation
    const description = options.description || `Performs ${name} operation`;
    method += `    @SimpleFunction(description = "${description}")\n`;
    
    // Add method signature
    const returnAnnotation = returnType !== 'Unit' ? `: ${returnType}` : '';
    method += `    fun ${name}(${paramList})${returnAnnotation} {\n`;
    
    // Add method body
    if (returnType.toLowerCase() === 'unit' || returnType.toLowerCase() === 'void') {
      method += `        // TODO: Implement ${name}\n`;
      method += `        // Example: EventDispatcher.dispatchEvent(this, "${name}", ${paramNames})\n`;
    } else {
      method += `        // TODO: Implement ${name}\n`;
      if (returnType.toLowerCase() === 'string') {
        method += `        return ""\n`;
      } else if (returnType.toLowerCase() === 'int') {
        method += `        return 0\n`;
      } else if (returnType.toLowerCase() === 'boolean') {
        method += `        return false\n`;
      } else if (returnType.toLowerCase() === 'double') {
        method += `        return 0.0\n`;
      } else {
        method += `        return TODO("Implement ${name}")\n`;
      }
    }
    
    method += `    }\n`;
    
    return method;
  }

  /**
   * Insert method into file
   * @param {string} filePath - File path
   * @param {string} methodCode - Method code to insert
   * @param {Object} options - Insert options
   * @returns {Promise<Object>} - Insert result
   */
  async insertMethod(filePath, methodCode, options = {}) {
    if (!await fs.pathExists(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    let content = await fs.readFile(filePath, 'utf8');
    
    // Find insertion point (before last closing brace)
    const lastBraceIndex = content.lastIndexOf('}');
    const insertPosition = lastBraceIndex > 0 ? lastBraceIndex : content.length;
    
    // Insert method code
    const newContent = content.slice(0, insertPosition) + 
                      '\n' + methodCode + '\n' + 
                      content.slice(insertPosition);
    
    // Write updated content
    await fs.writeFile(filePath, newContent, 'utf8');
    
    return {
      inserted: true,
      position: insertPosition,
      linesAdded: methodCode.split('\n').length
    };
  }

  /**
   * Generate multiple methods
   * @param {Array} signatures - Array of method signatures
   * @param {string} filePath - Java/Kotlin file path
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Generation result
   */
  async generateMultiple(signatures, filePath, options = {}) {
    try {
      this.emit('batch-start', { count: signatures.length, filePath });
      
      const results = [];
      
      for (const signature of signatures) {
        try {
          const result = await this.generate(signature, filePath, options);
          results.push({ ...result, success: true });
        } catch (error) {
          results.push({ 
            signature, 
            success: false, 
            error: error.message 
          });
        }
      }
      
      const successful = results.filter(r => r.success).length;
      const failed = results.length - successful;
      
      this.emit('batch-complete', { successful, failed, filePath });
      
      return {
        success: true,
        results,
        successful,
        failed,
        total: results.length,
        message: `Generated ${successful} of ${results.length} methods`
      };
    } catch (error) {
      this.emit('batch-error', { error: error.message });
      throw new Error(`Failed to generate multiple methods: ${error.message}`);
    }
  }

  /**
   * List common method templates
   * @returns {Array} - Common method templates
   */
  listCommonTemplates() {
    return [
      {
        name: 'CalculateSum',
        signature: 'CalculateSum:int,a:int,b:int',
        description: 'Calculates sum of two integers'
      },
      {
        name: 'Multiply',
        signature: 'Multiply:int,a:int,b:int',
        description: 'Multiplies two integers'
      },
      {
        name: 'Greet',
        signature: 'Greet:String,name:String',
        description: 'Returns a greeting message'
      },
      {
        name: 'FormatText',
        signature: 'FormatText:String,text:String,format:String',
        description: 'Formats text with specified format'
      },
      {
        name: 'ValidateEmail',
        signature: 'ValidateEmail:boolean,email:String',
        description: 'Validates email address format'
      },
      {
        name: 'GenerateRandom',
        signature: 'GenerateRandom:int,min:int,max:int',
        description: 'Generates random number in range'
      },
      {
        name: 'ConvertToUppercase',
        signature: 'ConvertToUppercase:String,text:String',
        description: 'Converts text to uppercase'
      },
      {
        name: 'JoinStrings',
        signature: 'JoinStrings:String,strings:List<String>,separator:String',
        description: 'Joins list of strings with separator'
      }
    ];
  }

  /**
   * Generate method with custom template
   * @param {Object} template - Method template
   * @param {string} filePath - File path
   * @param {Object} variables - Template variables
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Generation result
   */
  async generateFromTemplate(template, filePath, variables = {}, options = {}) {
    try {
      // Process template with variables
      let signature = template.signature;
      for (const [key, value] of Object.entries(variables)) {
        signature = signature.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      }
      
      // Generate method
      const result = await this.generate(signature, filePath, {
        ...options,
        description: template.description
      });
      
      return {
        ...result,
        template: template.name
      };
    } catch (error) {
      throw new Error(`Failed to generate method from template: ${error.message}`);
    }
  }

  /**
   * Extract existing methods from file
   * @param {string} filePath - File path
   * @returns {Promise<Array>} - Extracted methods
   */
  async extractMethods(filePath) {
    if (!await fs.pathExists(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const content = await fs.readFile(filePath, 'utf8');
    const methods = [];
    
    // Simple regex to extract methods (this is a basic implementation)
    const methodRegex = /@SimpleFunction[^\n]*\n\s*(?:public\s+)?(?:fun\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*\w+\s*)?[{]/g;
    let match;
    
    while ((match = methodRegex.exec(content)) !== null) {
      methods.push({
        name: match[1],
        position: match.index
      });
    }
    
    return methods;
  }

  /**
   * Remove method from file
   * @param {string} filePath - File path
   * @param {string} methodName - Method name to remove
   * @returns {Promise<Object>} - Removal result
   */
  async removeMethod(filePath, methodName) {
    if (!await fs.pathExists(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    let content = await fs.readFile(filePath, 'utf8');
    
    // Find method (simple approach)
    const methodPattern = new RegExp(
      `\\s*@SimpleFunction[^}]*${methodName}\\s*\\([^}]*}\\s*`, 
      's'
    );
    
    const match = content.match(methodPattern);
    if (!match) {
      throw new Error(`Method '${methodName}' not found in file`);
    }
    
    const newContent = content.replace(methodPattern, '');
    
    await fs.writeFile(filePath, newContent, 'utf8');
    
    return {
      success: true,
      method: methodName,
      removed: true,
      charactersRemoved: match[0].length
    };
  }
}

module.exports = MethodGenerator;