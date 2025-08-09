const fs = require('fs-extra');
const path = require('path');
const EventEmitter = require('events');

/**
 * Property Generator for App Inventor Extensions
 * Generates @SimpleProperty getters and setters for extension classes
 */
class PropertyGenerator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.verbose = options.verbose || false;
  }

  /**
   * Generate property from signature
   * @param {string} signature - Property signature (e.g., "MyText:String")
   * @param {string} filePath - Java/Kotlin file path
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Generation result
   */
  async generate(signature, filePath, options = {}) {
    try {
      this.emit('start', { signature, filePath });
      
      // Parse signature
      const propertyInfo = this.parseSignature(signature);
      
      // Determine language
      const isKotlin = filePath.endsWith('.kt');
      
      // Generate property code
      const propertyCode = this.generatePropertyCode(propertyInfo, isKotlin, options);
      
      // Insert property into file
      const result = await this.insertProperty(filePath, propertyCode, options);
      
      this.emit('complete', { signature, filePath, ...result });
      
      return {
        success: true,
        signature,
        filePath,
        propertyInfo,
        code: propertyCode,
        ...result,
        message: 'Property generated successfully'
      };
    } catch (error) {
      this.emit('error', { signature, filePath, error: error.message });
      throw new Error(`Failed to generate property: ${error.message}`);
    }
  }

  /**
   * Parse property signature
   * @param {string} signature - Property signature
   * @returns {Object} - Parsed property information
   */
  parseSignature(signature) {
    // Format: "PropertyName:Type" or "PropertyName" (defaults to String)
    const [name, type = 'String'] = signature.split(':');
    
    if (!name) {
      throw new Error('Invalid property signature: missing property name');
    }
    
    return {
      name: name.trim(),
      type: type.trim()
    };
  }

  /**
   * Generate property code
   * @param {Object} propertyInfo - Property information
   * @param {boolean} isKotlin - Whether to generate Kotlin code
   * @param {Object} options - Generation options
   * @returns {string} - Generated property code
   */
  generatePropertyCode(propertyInfo, isKotlin, options = {}) {
    const { name, type } = propertyInfo;
    
    if (isKotlin) {
      return this.generateKotlinProperty(name, type, options);
    } else {
      return this.generateJavaProperty(name, type, options);
    }
  }

  /**
   * Generate Java property
   * @param {string} name - Property name
   * @param {string} type - Property type
   * @param {Object} options - Generation options
   * @returns {string} - Generated Java property
   */
  generateJavaProperty(name, type, options = {}) {
    const fieldName = this.toCamelCase(name);
    const capitalizedFieldName = this.capitalizeFirstLetter(fieldName);
    
    let property = '';
    
    // Add field declaration
    const defaultValue = this.getDefaultValue(type);
    property += `    private ${type} ${fieldName} = ${defaultValue};\n\n`;
    
    // Add documentation comment for getter
    if (options.documentation !== false) {
      property += `    /**\n`;
      property += `     * Gets the ${name} property.\n`;
      property += `     *\n`;
      property += `     * @return the current ${name} value\n`;
      property += `     */\n`;
    }
    
    // Add SimpleProperty getter
    const description = options.description || `The ${name} property`;
    property += `    @SimpleProperty(description = "${description}")\n`;
    property += `    public ${type} ${name}() {\n`;
    property += `        return ${fieldName};\n`;
    property += `    }\n\n`;
    
    // Add documentation comment for setter
    if (options.documentation !== false) {
      property += `    /**\n`;
      property += `     * Sets the ${name} property.\n`;
      property += `     *\n`;
      property += `     * @param ${fieldName} the new ${name} value\n`;
      property += `     */\n`;
    }
    
    // Add SimpleProperty setter
    property += `    @SimpleProperty\n`;
    property += `    public void ${name}(${type} ${fieldName}) {\n`;
    property += `        this.${fieldName} = ${fieldName};\n`;
    property += `    }\n`;
    
    return property;
  }

  /**
   * Generate Kotlin property
   * @param {string} name - Property name
   * @param {string} type - Property type
   * @param {Object} options - Generation options
   * @returns {string} - Generated Kotlin property
   */
  generateKotlinProperty(name, type, options = {}) {
    let property = '';
    
    // Add documentation comment
    if (options.documentation !== false) {
      property += `    /**\n`;
      property += `     * The ${name} property.\n`;
      property += `     */\n`;
    }
    
    // Add SimpleProperty annotation
    const description = options.description || `The ${name} property`;
    property += `    @SimpleProperty(description = "${description}")\n`;
    
    // Add Kotlin property with getter and setter
    const defaultValue = this.getDefaultValue(type);
    property += `    var ${name}: ${type} = ${defaultValue}\n`;
    property += `        get() = field\n`;
    property += `        set(value) { field = value }\n`;
    
    return property;
  }

  /**
   * Insert property into file
   * @param {string} filePath - File path
   * @param {string} propertyCode - Property code to insert
   * @param {Object} options - Insert options
   * @returns {Promise<Object>} - Insert result
   */
  async insertProperty(filePath, propertyCode, options = {}) {
    if (!await fs.pathExists(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    let content = await fs.readFile(filePath, 'utf8');
    
    // Find insertion point (after class declaration but before first method)
    const classMatch = content.match(/class\s+\w+[^{]*\{/);
    if (!classMatch) {
      throw new Error('Could not find class declaration');
    }
    
    const classEndIndex = classMatch.index + classMatch[0].length;
    
    // Find first method or end of class
    const methodMatch = content.slice(classEndIndex).match(/@SimpleFunction|@SimpleProperty/);
    const insertPosition = methodMatch 
      ? classEndIndex + methodMatch.index 
      : content.lastIndexOf('}');
    
    // Insert property code
    const newContent = content.slice(0, insertPosition) + 
                      '\n' + propertyCode + '\n' + 
                      content.slice(insertPosition);
    
    // Write updated content
    await fs.writeFile(filePath, newContent, 'utf8');
    
    return {
      inserted: true,
      position: insertPosition,
      linesAdded: propertyCode.split('\n').length
    };
  }

  /**
   * Generate multiple properties
   * @param {Array} signatures - Array of property signatures
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
        message: `Generated ${successful} of ${results.length} properties`
      };
    } catch (error) {
      this.emit('batch-error', { error: error.message });
      throw new Error(`Failed to generate multiple properties: ${error.message}`);
    }
  }

  /**
   * List common property templates
   * @returns {Array} - Common property templates
   */
  listCommonTemplates() {
    return [
      {
        name: 'Text',
        signature: 'Text:String',
        description: 'A text property'
      },
      {
        name: 'Number',
        signature: 'Number:int',
        description: 'A number property'
      },
      {
        name: 'Enabled',
        signature: 'Enabled:boolean',
        description: 'An enabled/disabled flag'
      },
      {
        name: 'Color',
        signature: 'Color:int',
        description: 'A color property'
      },
      {
        name: 'Size',
        signature: 'Size:double',
        description: 'A size property'
      },
      {
        name: 'Visible',
        signature: 'Visible:boolean',
        description: 'A visibility flag'
      },
      {
        name: 'Title',
        signature: 'Title:String',
        description: 'A title property'
      },
      {
        name: 'Description',
        signature: 'Description:String',
        description: 'A description property'
      }
    ];
  }

  /**
   * Generate property with custom template
   * @param {Object} template - Property template
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
      
      // Generate property
      const result = await this.generate(signature, filePath, {
        ...options,
        description: template.description
      });
      
      return {
        ...result,
        template: template.name
      };
    } catch (error) {
      throw new Error(`Failed to generate property from template: ${error.message}`);
    }
  }

  /**
   * Get default value for type
   * @param {string} type - Property type
   * @returns {string} - Default value
   */
  getDefaultValue(type) {
    switch (type.toLowerCase()) {
      case 'string':
        return '""';
      case 'int':
      case 'integer':
        return '0';
      case 'boolean':
        return 'false';
      case 'double':
      case 'float':
        return '0.0';
      case 'long':
        return '0L';
      default:
        return 'null';
    }
  }

  /**
   * Convert string to camelCase
   * @param {string} str - Input string
   * @returns {string} - CamelCase string
   */
  toCamelCase(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  /**
   * Capitalize first letter
   * @param {string} str - Input string
   * @returns {string} - String with capitalized first letter
   */
  capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Extract existing properties from file
   * @param {string} filePath - File path
   * @returns {Promise<Array>} - Extracted properties
   */
  async extractProperties(filePath) {
    if (!await fs.pathExists(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const content = await fs.readFile(filePath, 'utf8');
    const properties = [];
    
    // Simple regex to extract properties
    const propertyRegex = /@SimpleProperty[^\n]*\n\s*(?:public\s+)?(?:var\s+)?(\w+)\s*[(:]/g;
    let match;
    
    while ((match = propertyRegex.exec(content)) !== null) {
      properties.push({
        name: match[1],
        position: match.index
      });
    }
    
    return properties;
  }

  /**
   * Remove property from file
   * @param {string} filePath - File path
   * @param {string} propertyName - Property name to remove
   * @returns {Promise<Object>} - Removal result
   */
  async removeProperty(filePath, propertyName) {
    if (!await fs.pathExists(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    let content = await fs.readFile(filePath, 'utf8');
    
    // Find property (simple approach)
    const propertyPattern = new RegExp(
      `\\s*(?:private\\s+\\w+\\s+${this.toCamelCase(propertyName)}\\s*=\\s*[^;]+;\\s*)?` +
      `@SimpleProperty[^}]*${propertyName}\\s*[(][^}]*}\\s*` +
      `(?:@SimpleProperty[^}]*${propertyName}\\s*[^}]*}\\s*)?`, 
      's'
    );
    
    const match = content.match(propertyPattern);
    if (!match) {
      throw new Error(`Property '${propertyName}' not found in file`);
    }
    
    const newContent = content.replace(propertyPattern, '');
    
    await fs.writeFile(filePath, newContent, 'utf8');
    
    return {
      success: true,
      property: propertyName,
      removed: true,
      charactersRemoved: match[0].length
    };
  }
}

module.exports = PropertyGenerator;