const fs = require('fs-extra');
const path = require('path');

/**
 * Documentation Builder for App Inventor Extensions
 * Generates API documentation from source code
 */
class DocBuilder {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.outputFormat = options.format || 'html';
  }

  /**
   * Generate documentation for extension
   * @param {string} projectPath - Path to project directory
   * @param {Object} options - Documentation options
   * @returns {Promise<Object>} - Documentation result
   */
  async generateDocs(projectPath, options = {}) {
    try {
      // Validate project structure
      await this.validateProject(projectPath);
      
      // Parse source code
      const apiInfo = await this.parseSourceCode(projectPath);
      
      // Generate documentation
      const docResult = await this.createDocumentation(apiInfo, projectPath, options);
      
      return {
        success: true,
        api: apiInfo,
        documentation: docResult,
        message: 'Documentation generated successfully'
      };
    } catch (error) {
      throw new Error(`Documentation generation failed: ${error.message}`);
    }
  }

  /**
   * Validate project structure for documentation
   * @param {string} projectPath - Path to project
   * @returns {Promise<boolean>} - True if valid
   */
  async validateProject(projectPath) {
    const srcDir = path.join(projectPath, 'src');
    if (!await fs.pathExists(srcDir)) {
      throw new Error('Source directory (src/) not found');
    }
    
    // Check for source files
    const javaFiles = await this.findFiles(srcDir, '.java');
    const ktFiles = await this.findFiles(srcDir, '.kt');
    
    if (javaFiles.length === 0 && ktFiles.length === 0) {
      throw new Error('No source files found in src/ directory');
    }
    
    return true;
  }

  /**
   * Find files matching extension recursively
   * @param {string} dir - Directory to search
   * @param {string} extension - File extension to match
   * @returns {Promise<Array>} - Array of matching file paths
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
   * Parse source code to extract API information
   * @param {string} projectPath - Path to project
   * @returns {Promise<Object>} - API information
   */
  async parseSourceCode(projectPath) {
    const srcDir = path.join(projectPath, 'src');
    const javaFiles = await this.findFiles(srcDir, '.java');
    const ktFiles = await this.findFiles(srcDir, '.kt');
    
    const apiInfo = {
      classes: [],
      methods: [],
      properties: [],
      events: [],
      project: {
        name: path.basename(projectPath),
        path: projectPath,
        language: ktFiles.length > 0 ? 'Kotlin' : 'Java'
      }
    };
    
    // Parse Java files
    for (const file of javaFiles) {
      const content = await fs.readFile(file, 'utf8');
      const classInfo = this.parseJavaFile(content, file);
      if (classInfo) {
        apiInfo.classes.push(classInfo);
        apiInfo.methods.push(...classInfo.methods);
        apiInfo.properties.push(...classInfo.properties);
        apiInfo.events.push(...classInfo.events);
      }
    }
    
    // Parse Kotlin files
    for (const file of ktFiles) {
      const content = await fs.readFile(file, 'utf8');
      const classInfo = this.parseKotlinFile(content, file);
      if (classInfo) {
        apiInfo.classes.push(classInfo);
        apiInfo.methods.push(...classInfo.methods);
        apiInfo.properties.push(...classInfo.properties);
        apiInfo.events.push(...classInfo.events);
      }
    }
    
    return apiInfo;
  }

  /**
   * Parse Java file to extract API information
   * @param {string} content - File content
   * @param {string} filePath - File path
   * @returns {Object|null} - Class information or null
   */
  parseJavaFile(content, filePath) {
    const lines = content.split('\n');
    const classInfo = {
      name: path.basename(filePath, '.java'),
      package: '',
      description: '',
      methods: [],
      properties: [],
      events: [],
      filePath: filePath
    };
    
    // Extract package name
    const packageMatch = content.match(/package\s+([^\s;]+)/);
    if (packageMatch) {
      classInfo.package = packageMatch[1];
    }
    
    // Extract class description (from comments)
    const classCommentMatch = content.match(/\/\*\*([\s\S]*?)\*\//);
    if (classCommentMatch) {
      classInfo.description = classCommentMatch[1]
        .replace(/\*/g, '')
        .replace(/\n\s+/g, ' ')
        .trim();
    }
    
    // Extract SimpleFunction methods
    const functionRegex = /@SimpleFunction(?:\([^)]*\))?\s+public\s+\w+\s+(\w+)\s*\([^)]*\)/g;
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      classInfo.methods.push({
        name: match[1],
        type: 'function',
        className: classInfo.name,
        description: this.extractMethodDescription(content, match[1])
      });
    }
    
    // Extract SimpleProperty methods
    const propertyRegex = /@SimpleProperty(?:\([^)]*\))?\s+public\s+\w+\s+(\w+)/g;
    while ((match = propertyRegex.exec(content)) !== null) {
      classInfo.properties.push({
        name: match[1],
        type: 'property',
        className: classInfo.name,
        description: this.extractPropertyDescription(content, match[1])
      });
    }
    
    // Extract SimpleEvent methods
    const eventRegex = /@SimpleEvent(?:\([^)]*\))?\s+public\s+void\s+(\w+)\s*\([^)]*\)/g;
    while ((match = eventRegex.exec(content)) !== null) {
      classInfo.events.push({
        name: match[1],
        type: 'event',
        className: classInfo.name,
        description: this.extractEventDescription(content, match[1])
      });
    }
    
    return classInfo.methods.length > 0 || classInfo.properties.length > 0 || classInfo.events.length > 0 ? classInfo : null;
  }

  /**
   * Parse Kotlin file to extract API information
   * @param {string} content - File content
   * @param {string} filePath - File path
   * @returns {Object|null} - Class information or null
   */
  parseKotlinFile(content, filePath) {
    const lines = content.split('\n');
    const classInfo = {
      name: path.basename(filePath, '.kt'),
      package: '',
      description: '',
      methods: [],
      properties: [],
      events: [],
      filePath: filePath
    };
    
    // Extract package name
    const packageMatch = content.match(/package\s+([^\s]+)/);
    if (packageMatch) {
      classInfo.package = packageMatch[1];
    }
    
    // Extract class description (from comments)
    const classCommentMatch = content.match(/\/\*\*([\s\S]*?)\*\//);
    if (classCommentMatch) {
      classInfo.description = classCommentMatch[1]
        .replace(/\*/g, '')
        .replace(/\n\s+/g, ' ')
        .trim();
    }
    
    // Extract SimpleFunction methods
    const functionRegex = /@SimpleFunction(?:\([^)]*\))?\s+fun\s+(\w+)\s*\([^)]*\)/g;
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      classInfo.methods.push({
        name: match[1],
        type: 'function',
        className: classInfo.name,
        description: this.extractMethodDescription(content, match[1])
      });
    }
    
    // Extract SimpleProperty properties
    const propertyRegex = /@SimpleProperty(?:\([^)]*\))?\s+var\s+(\w+)/g;
    while ((match = propertyRegex.exec(content)) !== null) {
      classInfo.properties.push({
        name: match[1],
        type: 'property',
        className: classInfo.name,
        description: this.extractPropertyDescription(content, match[1])
      });
    }
    
    // Extract SimpleEvent methods
    const eventRegex = /@SimpleEvent(?:\([^)]*\))?\s+fun\s+(\w+)\s*\([^)]*\)/g;
    while ((match = eventRegex.exec(content)) !== null) {
      classInfo.events.push({
        name: match[1],
        type: 'event',
        className: classInfo.name,
        description: this.extractEventDescription(content, match[1])
      });
    }
    
    return classInfo.methods.length > 0 || classInfo.properties.length > 0 || classInfo.events.length > 0 ? classInfo : null;
  }

  /**
   * Extract method description from source
   * @param {string} content - Source content
   * @param {string} methodName - Method name
   * @returns {string} - Method description
   */
  extractMethodDescription(content, methodName) {
    // Find method and extract preceding comment
    const methodPattern = new RegExp(`\\/\\*\\*([\\s\\S]*?)\\*\\/\\s*@SimpleFunction[\\s\\S]*?${methodName}\\s*\\(`);
    const match = content.match(methodPattern);
    
    if (match && match[1]) {
      return match[1]
        .replace(/\*/g, '')
        .replace(/\n\s+/g, ' ')
        .trim();
    }
    
    return 'No description available';
  }

  /**
   * Extract property description from source
   * @param {string} content - Source content
   * @param {string} propertyName - Property name
   * @returns {string} - Property description
   */
  extractPropertyDescription(content, propertyName) {
    // Find property and extract preceding comment
    const propertyPattern = new RegExp(`\\/\\*\\*([\\s\\S]*?)\\*\\/\\s*@SimpleProperty[\\s\\S]*?${propertyName}`);
    const match = content.match(propertyPattern);
    
    if (match && match[1]) {
      return match[1]
        .replace(/\*/g, '')
        .replace(/\n\s+/g, ' ')
        .trim();
    }
    
    return 'No description available';
  }

  /**
   * Extract event description from source
   * @param {string} content - Source content
   * @param {string} eventName - Event name
   * @returns {string} - Event description
   */
  extractEventDescription(content, eventName) {
    // Find event and extract preceding comment
    const eventPattern = new RegExp(`\\/\\*\\*([\\s\\S]*?)\\*\\/\\s*@SimpleEvent[\\s\\S]*?${eventName}\\s*\\(`);
    const match = content.match(eventPattern);
    
    if (match && match[1]) {
      return match[1]
        .replace(/\*/g, '')
        .replace(/\n\s+/g, ' ')
        .trim();
    }
    
    return 'No description available';
  }

  /**
   * Create documentation from API information
   * @param {Object} apiInfo - API information
   * @param {string} projectPath - Project path
   * @param {Object} options - Documentation options
   * @returns {Promise<Object>} - Documentation result
   */
  async createDocumentation(apiInfo, projectPath, options = {}) {
    const docsDir = path.join(projectPath, 'docs');
    await fs.ensureDir(docsDir);
    
    const format = options.format || this.outputFormat;
    
    switch (format) {
      case 'html':
        return await this.createHtmlDocumentation(apiInfo, docsDir);
      case 'markdown':
        return await this.createMarkdownDocumentation(apiInfo, docsDir);
      case 'json':
        return await this.createJsonDocumentation(apiInfo, docsDir);
      default:
        throw new Error(`Unsupported documentation format: ${format}`);
    }
  }

  /**
   * Create HTML documentation
   * @param {Object} apiInfo - API information
   * @param {string} docsDir - Documentation directory
   * @returns {Promise<Object>} - HTML documentation result
   */
  async createHtmlDocumentation(apiInfo, docsDir) {
    const indexPath = path.join(docsDir, 'index.html');
    const apiPath = path.join(docsDir, `${apiInfo.project.name}.html`);
    
    // Create index page
    const indexContent = this.generateHtmlIndex(apiInfo);
    await fs.writeFile(indexPath, indexContent);
    
    // Create API documentation page
    const apiContent = this.generateHtmlApiDocs(apiInfo);
    await fs.writeFile(apiPath, apiContent);
    
    return {
      format: 'html',
      indexPath: indexPath,
      apiPath: apiPath,
      files: [indexPath, apiPath]
    };
  }

  /**
   * Create Markdown documentation
   * @param {Object} apiInfo - API information
   * @param {string} docsDir - Documentation directory
   * @returns {Promise<Object>} - Markdown documentation result
   */
  async createMarkdownDocumentation(apiInfo, docsDir) {
    const mdPath = path.join(docsDir, 'API.md');
    const mdContent = this.generateMarkdownDocs(apiInfo);
    await fs.writeFile(mdPath, mdContent);
    
    return {
      format: 'markdown',
      path: mdPath,
      files: [mdPath]
    };
  }

  /**
   * Create JSON documentation
   * @param {Object} apiInfo - API information
   * @param {string} docsDir - Documentation directory
   * @returns {Promise<Object>} - JSON documentation result
   */
  async createJsonDocumentation(apiInfo, docsDir) {
    const jsonPath = path.join(docsDir, 'api.json');
    const jsonContent = JSON.stringify(apiInfo, null, 2);
    await fs.writeFile(jsonPath, jsonContent);
    
    return {
      format: 'json',
      path: jsonPath,
      files: [jsonPath]
    };
  }

  /**
   * Generate HTML index page
   * @param {Object} apiInfo - API information
   * @returns {string} - HTML content
   */
  generateHtmlIndex(apiInfo) {
    return `<!DOCTYPE html>
<html>
<head>
    <title>${apiInfo.project.name} API Documentation</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2196F3; border-bottom: 2px solid #2196F3; padding-bottom: 10px; }
        h2 { color: #4CAF50; margin-top: 30px; }
        .nav { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .nav a { display: block; margin: 5px 0; color: #1976D2; text-decoration: none; }
        .nav a:hover { text-decoration: underline; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📚 ${apiInfo.project.name} API Documentation</h1>
        <p><em>Generated on ${new Date().toLocaleString()}</em></p>
        
        <div class="nav">
            <h2>Navigation</h2>
            <a href="${apiInfo.project.name}.html">📖 API Reference</a>
        </div>
        
        <h2>Overview</h2>
        <p>This documentation provides API reference for the ${apiInfo.project.name} App Inventor Extension.</p>
        
        <h2>Statistics</h2>
        <ul>
            <li><strong>Classes:</strong> ${apiInfo.classes.length}</li>
            <li><strong>Methods:</strong> ${apiInfo.methods.length}</li>
            <li><strong>Properties:</strong> ${apiInfo.properties.length}</li>
            <li><strong>Events:</strong> ${apiInfo.events.length}</li>
        </ul>
        
        <div class="footer">
            <p>Generated by AIX Studio - App Inventor Extension Tool</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate HTML API documentation
   * @param {Object} apiInfo - API information
   * @returns {string} - HTML content
   */
  generateHtmlApiDocs(apiInfo) {
    let html = `<!DOCTYPE html>
<html>
<head>
    <title>${apiInfo.project.name} API Reference</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2196F3; border-bottom: 2px solid #2196F3; padding-bottom: 10px; }
        h2 { color: #4CAF50; margin-top: 30px; }
        h3 { color: #FF9800; }
        .class-info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .method, .property, .event { background: #f9f9f9; border-left: 4px solid #4CAF50; padding: 10px; margin: 10px 0; }
        .property { border-left-color: #FF9800; }
        .event { border-left-color: #2196F3; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📚 ${apiInfo.project.name} API Reference</h1>
        <p><em>Generated on ${new Date().toLocaleString()}</em></p>`;

    // Generate class documentation
    apiInfo.classes.forEach(cls => {
      html += `
        <div class="class-info">
            <h2>${cls.name}</h2>
            <p><strong>Package:</strong> ${cls.package}</p>
            <p><strong>Description:</strong> ${cls.description || 'No description available'}</p>
        </div>
        
        <h3>Methods (${cls.methods.length})</h3>`;
      
      if (cls.methods.length > 0) {
        cls.methods.forEach(method => {
          html += `<div class="method">
            <strong>${method.name}</strong>() - Function<br>
            <p>${method.description || 'No description available'}</p>
          </div>`;
        });
      } else {
        html += '<p>No methods found</p>';
      }
      
      html += `<h3>Properties (${cls.properties.length})</h3>`;
      
      if (cls.properties.length > 0) {
        cls.properties.forEach(prop => {
          html += `<div class="property">
            <strong>${prop.name}</strong> - Property<br>
            <p>${prop.description || 'No description available'}</p>
          </div>`;
        });
      } else {
        html += '<p>No properties found</p>';
      }
      
      html += `<h3>Events (${cls.events.length})</h3>`;
      
      if (cls.events.length > 0) {
        cls.events.forEach(event => {
          html += `<div class="event">
            <strong>${event.name}</strong> - Event<br>
            <p>${event.description || 'No description available'}</p>
          </div>`;
        });
      } else {
        html += '<p>No events found</p>';
      }
    });
    
    html += `
        <div class="footer">
            <p>Generated by AIX Studio - App Inventor Extension Tool</p>
        </div>
    </div>
</body>
</html>`;
    
    return html;
  }

  /**
   * Generate Markdown documentation
   * @param {Object} apiInfo - API information
   * @returns {string} - Markdown content
   */
  generateMarkdownDocs(apiInfo) {
    let md = `# ${apiInfo.project.name} API Documentation

*Generated on ${new Date().toLocaleString()}*

## Overview

This documentation provides API reference for the ${apiInfo.project.name} App Inventor Extension.

## Statistics

- **Classes:** ${apiInfo.classes.length}
- **Methods:** ${apiInfo.methods.length}
- **Properties:** ${apiInfo.properties.length}
- **Events:** ${apiInfo.events.length}

`;

    // Generate class documentation
    apiInfo.classes.forEach(cls => {
      md += `## ${cls.name}

**Package:** ${cls.package}

**Description:** ${cls.description || 'No description available'}

### Methods (${cls.methods.length})

`;
      
      if (cls.methods.length > 0) {
        cls.methods.forEach(method => {
          md += `- **${method.name}()** - Function\n  ${method.description || 'No description available'}\n\n`;
        });
      } else {
        md += 'No methods found\n\n';
      }
      
      md += `### Properties (${cls.properties.length})

`;
      
      if (cls.properties.length > 0) {
        cls.properties.forEach(prop => {
          md += `- **${prop.name}** - Property\n  ${prop.description || 'No description available'}\n\n`;
        });
      } else {
        md += 'No properties found\n\n';
      }
      
      md += `### Events (${cls.events.length})

`;
      
      if (cls.events.length > 0) {
        cls.events.forEach(event => {
          md += `- **${event.name}** - Event\n  ${event.description || 'No description available'}\n\n`;
        });
      } else {
        md += 'No events found\n\n';
      }
    });
    
    md += `---
*Generated by AIX Studio - App Inventor Extension Tool*`;
    
    return md;
  }
}

module.exports = DocBuilder;