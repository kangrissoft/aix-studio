const fs = require('fs-extra');
const path = require('path');
const EventEmitter = require('events');

/**
 * Event Generator for App Inventor Extensions
 * Generates @SimpleEvent methods for extension classes
 */
class EventGenerator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.verbose = options.verbose || false;
  }

  /**
   * Generate event from signature
   * @param {string} signature - Event signature (e.g., "OnDataReceived:String,data:String,timestamp:long")
   * @param {string} filePath - Java/Kotlin file path
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Generation result
   */
  async generate(signature, filePath, options = {}) {
    try {
      this.emit('start', { signature, filePath });
      
      // Parse signature
      const eventInfo = this.parseSignature(signature);
      
      // Determine language
      const isKotlin = filePath.endsWith('.kt');
      
      // Generate event code
      const eventCode = this.generateEventCode(eventInfo, isKotlin, options);
      
      // Insert event into file
      const result = await this.insertEvent(filePath, eventCode, options);
      
      this.emit('complete', { signature, filePath, ...result });
      
      return {
        success: true,
        signature,
        filePath,
        eventInfo,
        code: eventCode,
        ...result,
        message: 'Event generated successfully'
      };
    } catch (error) {
      this.emit('error', { signature, filePath, error: error.message });
      throw new Error(`Failed to generate event: ${error.message}`);
    }
  }

  /**
   * Parse event signature
   * @param {string} signature - Event signature
   * @returns {Object} - Parsed event information
   */
  parseSignature(signature) {
    // Format: "EventName:param1:Type,param2:Type"
    const [eventName, ...paramParts] = signature.split(',');
    
    if (!eventName) {
      throw new Error('Invalid event signature: missing event name');
    }
    
    const params = paramParts.map(param => {
      const [name, type] = param.split(':');
      if (!name || !type) {
        throw new Error(`Invalid parameter format: ${param}`);
      }
      return { name: name.trim(), type: type.trim() };
    });
    
    return {
      name: eventName.trim(),
      parameters: params
    };
  }

  /**
   * Generate event code
   * @param {Object} eventInfo - Event information
   * @param {boolean} isKotlin - Whether to generate Kotlin code
   * @param {Object} options - Generation options
   * @returns {string} - Generated event code
   */
  generateEventCode(eventInfo, isKotlin, options = {}) {
    const { name, parameters } = eventInfo;
    
    if (isKotlin) {
      return this.generateKotlinEvent(name, parameters, options);
    } else {
      return this.generateJavaEvent(name, parameters, options);
    }
  }

  /**
   * Generate Java event
   * @param {string} name - Event name
   * @param {Array} parameters - Event parameters
   * @param {Object} options - Generation options
   * @returns {string} - Generated Java event
   */
  generateJavaEvent(name, parameters, options = {}) {
    const paramList = parameters.map(p => `${p.type} ${p.name}`).join(', ');
    const paramNames = parameters.map(p => p.name).join(', ');
    
    let event = '';
    
    // Add documentation comment
    if (options.documentation !== false) {
      event += `    /**\n`;
      event += `     * Triggered when ${this.humanizeEventName(name)}.\n`;
      if (parameters.length > 0) {
        event += `     *\n`;
        parameters.forEach(param => {
          event += `     * @param ${param.name} ${this.humanizeParameterName(param.name)}\n`;
        });
      }
      event += `     */\n`;
    }
    
    // Add SimpleEvent annotation
    const description = options.description || `Triggered when ${this.humanizeEventName(name)}`;
    event += `    @SimpleEvent(description = "${description}")\n`;
    
    // Add event method signature
    event += `    public void ${name}(${paramList}) {\n`;
    
    // Add event dispatching
    if (parameters.length > 0) {
      event += `        EventDispatcher.dispatchEvent(this, "${name}", ${paramNames});\n`;
    } else {
      event += `        EventDispatcher.dispatchEvent(this, "${name}");\n`;
    }
    
    event += `    }\n`;
    
    return event;
  }

  /**
   * Generate Kotlin event
   * @param {string} name - Event name
   * @param {Array} parameters - Event parameters
   * @param {Object} options - Generation options
   * @returns {string} - Generated Kotlin event
   */
  generateKotlinEvent(name, parameters, options = {}) {
    const paramList = parameters.map(p => `${p.name}: ${p.type}`).join(', ');
    const paramNames = parameters.map(p => p.name).join(', ');
    
    let event = '';
    
    // Add documentation comment
    if (options.documentation !== false) {
      event += `    /**\n`;
      event += `     * Triggered when ${this.humanizeEventName(name)}.\n`;
      if (parameters.length > 0) {
        event += `     *\n`;
        parameters.forEach(param => {
          event += `     * @param ${param.name} ${this.humanizeParameterName(param.name)}\n`;
        });
      }
      event += `     */\n`;
    }
    
    // Add SimpleEvent annotation
    const description = options.description || `Triggered when ${this.humanizeEventName(name)}`;
    event += `    @SimpleEvent(description = "${description}")\n`;
    
    // Add event method signature
    event += `    fun ${name}(${paramList}) {\n`;
    
    // Add event dispatching
    if (parameters.length > 0) {
      event += `        EventDispatcher.dispatchEvent(this, "${name}", ${paramNames})\n`;
    } else {
      event += `        EventDispatcher.dispatchEvent(this, "${name}")\n`;
    }
    
    event += `    }\n`;
    
    return event;
  }

  /**
   * Insert event into file
   * @param {string} filePath - File path
   * @param {string} eventCode - Event code to insert
   * @param {Object} options - Insert options
   * @returns {Promise<Object>} - Insert result
   */
  async insertEvent(filePath, eventCode, options = {}) {
    if (!await fs.pathExists(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    let content = await fs.readFile(filePath, 'utf8');
    
    // Find insertion point (before last closing brace)
    const lastBraceIndex = content.lastIndexOf('}');
    const insertPosition = lastBraceIndex > 0 ? lastBraceIndex : content.length;
    
    // Insert event code
    const newContent = content.slice(0, insertPosition) + 
                      '\n' + eventCode + '\n' + 
                      content.slice(insertPosition);
    
    // Write updated content
    await fs.writeFile(filePath, newContent, 'utf8');
    
    return {
      inserted: true,
      position: insertPosition,
      linesAdded: eventCode.split('\n').length
    };
  }

  /**
   * Generate multiple events
   * @param {Array} signatures - Array of event signatures
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
        message: `Generated ${successful} of ${results.length} events`
      };
    } catch (error) {
      this.emit('batch-error', { error: error.message });
      throw new Error(`Failed to generate multiple events: ${error.message}`);
    }
  }

  /**
   * List common event templates
   * @returns {Array} - Common event templates
   */
  listCommonTemplates() {
    return [
      {
        name: 'OnComplete',
        signature: 'OnComplete',
        description: 'Triggered when operation completes'
      },
      {
        name: 'OnError',
        signature: 'OnError:String,message:String,int:code',
        description: 'Triggered when an error occurs'
      },
      {
        name: 'OnDataReceived',
        signature: 'OnDataReceived:String,data:String,long:timestamp',
        description: 'Triggered when data is received'
      },
      {
        name: 'OnProgress',
        signature: 'OnProgress:int:progress:int:total',
        description: 'Triggered during progress updates'
      },
      {
        name: 'OnSuccess',
        signature: 'OnSuccess:String:result',
        description: 'Triggered when operation succeeds'
      },
      {
        name: 'OnTimeout',
        signature: 'OnTimeout',
        description: 'Triggered when operation times out'
      },
      {
        name: 'OnStateChanged',
        signature: 'OnStateChanged:String:state',
        description: 'Triggered when state changes'
      },
      {
        name: 'OnValueChanged',
        signature: 'OnValueChanged:String:oldValue,String:newValue',
        description: 'Triggered when value changes'
      }
    ];
  }

  /**
   * Generate event with custom template
   * @param {Object} template - Event template
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
      
      // Generate event
      const result = await this.generate(signature, filePath, {
        ...options,
        description: template.description
      });
      
      return {
        ...result,
        template: template.name
      };
    } catch (error) {
      throw new Error(`Failed to generate event from template: ${error.message}`);
    }
  }

  /**
   * Humanize event name for documentation
   * @param {string} eventName - Event name
   * @returns {string} - Humanized event name
   */
  humanizeEventName(eventName) {
    // Convert camelCase to human readable
    return eventName
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .replace(/^on /, '');
  }

  /**
   * Humanize parameter name for documentation
   * @param {string} paramName - Parameter name
   * @returns {string} - Humanized parameter name
   */
  humanizeParameterName(paramName) {
    // Convert camelCase to human readable
    return paramName
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase();
  }

  /**
   * Extract existing events from file
   * @param {string} filePath - File path
   * @returns {Promise<Array>} - Extracted events
   */
  async extractEvents(filePath) {
    if (!await fs.pathExists(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const content = await fs.readFile(filePath, 'utf8');
    const events = [];
    
    // Simple regex to extract events
    const eventRegex = /@SimpleEvent[^\n]*\n\s*(?:public\s+)?(?:fun\s+)?(\w+)\s*\([^)]*\)/g;
    let match;
    
    while ((match = eventRegex.exec(content)) !== null) {
      events.push({
        name: match[1],
        position: match.index
      });
    }
    
    return events;
  }

  /**
   * Remove event from file
   * @param {string} filePath - File path
   * @param {string} eventName - Event name to remove
   * @returns {Promise<Object>} - Removal result
   */
  async removeEvent(filePath, eventName) {
    if (!await fs.pathExists(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    let content = await fs.readFile(filePath, 'utf8');
    
    // Find event (simple approach)
    const eventPattern = new RegExp(
      `\\s*@SimpleEvent[^}]*${eventName}\\s*\\([^}]*}\\s*`, 
      's'
    );
    
    const match = content.match(eventPattern);
    if (!match) {
      throw new Error(`Event '${eventName}' not found in file`);
    }
    
    const newContent = content.replace(eventPattern, '');
    
    await fs.writeFile(filePath, newContent, 'utf8');
    
    return {
      success: true,
      event: eventName,
      removed: true,
      charactersRemoved: match[0].length
    };
  }
}

module.exports = EventGenerator;