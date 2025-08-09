const fs = require('fs-extra');
const path = require('path');
const EventEmitter = require('events');

/**
 * Project Generator for App Inventor Extensions
 * Creates new extension projects from templates
 */
class ProjectGenerator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.templatesDir = options.templatesDir || path.join(__dirname, '../../templates');
    this.verbose = options.verbose || false;
  }

  /**
   * Generate new project from template
   * @param {string} projectName - Project name
   * @param {string} templateName - Template name
   * @param {string} destination - Destination directory
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Generation result
   */
  async generate(projectName, templateName, destination, options = {}) {
    const startTime = Date.now();
    
    try {
      this.emit('start', { projectName, templateName, destination });
      
      // Validate inputs
      await this.validateInputs(projectName, templateName, destination);
      
      // Ensure destination directory exists
      await fs.ensureDir(destination);
      
      // Check if destination is empty
      const files = await fs.readdir(destination);
      if (files.length > 0 && !options.force) {
        throw new Error(`Destination directory is not empty: ${destination}`);
      }
      
      // Find template
      const templatePath = await this.findTemplate(templateName);
      if (!templatePath) {
        throw new Error(`Template '${templateName}' not found`);
      }
      
      // Load template configuration
      const templateConfig = await this.loadTemplateConfig(templatePath);
      
      // Process template variables
      const variables = this.processVariables(projectName, templateConfig, options);
      
      // Copy and process template files
      await this.copyTemplateFiles(templatePath, destination, variables);
      
      // Create additional files
      await this.createAdditionalFiles(destination, variables);
      
      // Update project configuration
      await this.updateProjectConfig(destination, variables);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.emit('complete', { 
        projectName, 
        templateName, 
        destination, 
        duration 
      });
      
      return {
        success: true,
        projectName,
        templateName,
        destination,
        duration,
        files: await this.getProjectFiles(destination),
        message: 'Project generated successfully'
      };
    } catch (error) {
      this.emit('error', { projectName, templateName, destination, error: error.message });
      throw new Error(`Failed to generate project: ${error.message}`);
    }
  }

  /**
   * Validate generation inputs
   * @param {string} projectName - Project name
   * @param {string} templateName - Template name
   * @param {string} destination - Destination directory
   * @returns {Promise<void>}
   */
  async validateInputs(projectName, templateName, destination) {
    if (!projectName || typeof projectName !== 'string') {
      throw new Error('Project name is required and must be a string');
    }
    
    if (!templateName || typeof templateName !== 'string') {
      throw new Error('Template name is required and must be a string');
    }
    
    if (!destination || typeof destination !== 'string') {
      throw new Error('Destination directory is required and must be a string');
    }
    
    // Validate project name (alphanumeric, dash, underscore only)
    if (!/^[a-zA-Z0-9_-]+$/.test(projectName)) {
      throw new Error('Project name must contain only alphanumeric characters, dashes, and underscores');
    }
  }

  /**
   * Find template directory
   * @param {string} templateName - Template name
   * @returns {Promise<string|null>} - Template path or null
   */
  async findTemplate(templateName) {
    // Check in templates directory
    const templatePath = path.join(this.templatesDir, templateName);
    if (await fs.pathExists(templatePath)) {
      return templatePath;
    }
    
    // Check in language-specific directories
    const javaTemplatePath = path.join(this.templatesDir, 'java', templateName);
    if (await fs.pathExists(javaTemplatePath)) {
      return javaTemplatePath;
    }
    
    const kotlinTemplatePath = path.join(this.templatesDir, 'kotlin', templateName);
    if (await fs.pathExists(kotlinTemplatePath)) {
      return kotlinTemplatePath;
    }
    
    return null;
  }

  /**
   * Load template configuration
   * @param {string} templatePath - Template directory path
   * @returns {Promise<Object>} - Template configuration
   */
  async loadTemplateConfig(templatePath) {
    const configPath = path.join(templatePath, 'template.json');
    
    if (await fs.pathExists(configPath)) {
      return await fs.readJson(configPath);
    }
    
    // Default configuration if no template.json exists
    return {
      name: path.basename(templatePath),
      description: 'App Inventor Extension',
      author: 'Generated by AIX Studio',
      version: '1.0.0',
      language: 'java',
      variables: {}
    };
  }

  /**
   * Process template variables
   * @param {string} projectName - Project name
   * @param {Object} templateConfig - Template configuration
   * @param {Object} options - Generation options
   * @returns {Object} - Processed variables
   */
  processVariables(projectName, templateConfig, options = {}) {
    const defaultVariables = {
      projectName: projectName,
      package: `com.example.${projectName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')}`,
      packagePath: `com/example/${projectName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')}`,
      className: projectName.charAt(0).toUpperCase() + projectName.slice(1).replace(/[^a-zA-Z0-9]/g, ''),
      description: options.description || `${projectName} Extension`,
      author: options.author || 'AIX Studio User',
      year: new Date().getFullYear()
    };
    
    // Merge with template variables
    const templateVariables = templateConfig.variables || {};
    
    return {
      ...defaultVariables,
      ...templateVariables,
      ...options.variables // Override with user-provided variables
    };
  }

  /**
   * Copy and process template files
   * @param {string} templatePath - Template directory path
   * @param {string} destination - Destination directory
   * @param {Object} variables - Template variables
   * @returns {Promise<void>}
   */
  async copyTemplateFiles(templatePath, destination, variables) {
    this.emit('copy-start', { templatePath, destination });
    
    // Get all files in template directory
    const files = await this.getTemplateFiles(templatePath);
    
    for (const file of files) {
      const relativePath = path.relative(templatePath, file);
      const destinationPath = path.join(destination, relativePath);
      
      // Process file path with variables
      const processedPath = this.processTemplateString(destinationPath, variables);
      
      // Ensure destination directory exists
      await fs.ensureDir(path.dirname(processedPath));
      
      // Check if it's a file that needs processing
      if (await fs.stat(file).then(stat => stat.isFile())) {
        // Read file content
        let content = await fs.readFile(file, 'utf8');
        
        // Process content with variables
        content = this.processTemplateString(content, variables);
        
        // Write processed content
        await fs.writeFile(processedPath, content, 'utf8');
        
        this.emit('file-copied', { source: file, destination: processedPath });
      } else {
        // It's a directory, ensure it exists
        await fs.ensureDir(processedPath);
      }
    }
    
    this.emit('copy-complete', { templatePath, destination, count: files.length });
  }

  /**
   * Get all files in template directory
   * @param {string} templatePath - Template directory path
   * @returns {Promise<Array>} - File paths
   */
  async getTemplateFiles(templatePath) {
    const files = await fs.readdir(templatePath);
    const filePaths = [];
    
    for (const file of files) {
      // Skip hidden files and template.json
      if (file.startsWith('.') || file === 'template.json') {
        continue;
      }
      
      const fullPath = path.join(templatePath, file);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        const subFiles = await this.getTemplateFiles(fullPath);
        filePaths.push(...subFiles);
      } else {
        filePaths.push(fullPath);
      }
    }
    
    return filePaths;
  }

  /**
   * Process template string with variables
   * @param {string} template - Template string
   * @param {Object} variables - Variables
   * @returns {string} - Processed string
   */
  processTemplateString(template, variables) {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return result;
  }

  /**
   * Create additional files not in template
   * @param {string} destination - Destination directory
   * @param {Object} variables - Template variables
   * @returns {Promise<void>}
   */
  async createAdditionalFiles(destination, variables) {
    this.emit('additional-start', { destination });
    
    // Create .gitignore
    const gitignoreContent = `# Build outputs
build/
dist/
*.aix
*.jar
*.class

# Test outputs
test-reports/
coverage/
.nyc_output/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Backup
backup-*/

# Logs
*.log

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Temp files
tmp/
temp/

# Uploads
uploads/
`;
    
    await fs.writeFile(path.join(destination, '.gitignore'), gitignoreContent);
    
    // Create basic package.json for npm integration
    const packageJson = {
      name: variables.projectName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-'),
      version: '1.0.0',
      description: variables.description,
      main: 'index.js',
      scripts: {
        "build": "ant package",
        "test": "ant test",
        "clean": "ant clean"
      },
      keywords: ["appinventor", "extension", variables.projectName.toLowerCase()],
      author: variables.author,
      license: "MIT"
    };
    
    await fs.writeJson(path.join(destination, 'package.json'), packageJson, { spaces: 2 });
    
    this.emit('additional-complete', { destination });
  }

  /**
   * Update project configuration
   * @param {string} destination - Destination directory
   * @param {Object} variables - Template variables
   * @returns {Promise<void>}
   */
  async updateProjectConfig(destination, variables) {
    this.emit('config-update-start', { destination });
    
    // Create project config file
    const projectConfig = {
      name: variables.projectName,
      description: variables.description,
      author: variables.author,
      created: new Date().toISOString(),
      language: variables.language || 'java',
      version: '1.0.0',
      aix: {
        version: '1.0.0',
        generator: 'AIX Studio'
      }
    };
    
    await fs.writeJson(path.join(destination, 'aix.config.json'), projectConfig, { spaces: 2 });
    
    this.emit('config-update-complete', { destination });
  }

  /**
   * Get project files list
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Array>} - File paths
   */
  async getProjectFiles(projectPath) {
    const files = [];
    
    const walk = async (dir) => {
      const items = await fs.readdir(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          await walk(fullPath);
        } else {
          files.push(path.relative(projectPath, fullPath));
        }
      }
    };
    
    await walk(projectPath);
    return files.sort();
  }

  /**
   * List available templates
   * @returns {Promise<Array>} - Available templates
   */
  async listTemplates() {
    try {
      const templates = [];
      
      // Check templates directory
      if (await fs.pathExists(this.templatesDir)) {
        const items = await fs.readdir(this.templatesDir);
        
        for (const item of items) {
          const itemPath = path.join(this.templatesDir, item);
          const stat = await fs.stat(itemPath);
          
          if (stat.isDirectory()) {
            // Check if it's a template directory
            const configPath = path.join(itemPath, 'template.json');
            if (await fs.pathExists(configPath)) {
              const config = await fs.readJson(configPath);
              templates.push({
                name: item,
                ...config,
                path: itemPath
              });
            } else {
              // Check subdirectories for templates
              const subItems = await fs.readdir(itemPath);
              for (const subItem of subItems) {
                const subItemPath = path.join(itemPath, subItem);
                const subStat = await fs.stat(subItemPath);
                
                if (subStat.isDirectory()) {
                  const subConfigPath = path.join(subItemPath, 'template.json');
                  if (await fs.pathExists(subConfigPath)) {
                    const config = await fs.readJson(subConfigPath);
                    templates.push({
                      name: `${item}/${subItem}`,
                      ...config,
                      path: subItemPath
                    });
                  }
                }
              }
            }
          }
        }
      }
      
      return templates;
    } catch (error) {
      throw new Error(`Failed to list templates: ${error.message}`);
    }
  }

  /**
   * Create custom template from existing project
   * @param {string} projectPath - Project directory path
   * @param {string} templateName - Template name
   * @param {string} destination - Destination template directory
   * @param {Object} options - Template creation options
   * @returns {Promise<Object>} - Creation result
   */
  async createTemplate(projectPath, templateName, destination, options = {}) {
    try {
      this.emit('template-create-start', { projectPath, templateName, destination });
      
      // Validate project path
      if (!await fs.pathExists(projectPath)) {
        throw new Error(`Project path does not exist: ${projectPath}`);
      }
      
      // Ensure destination directory exists
      await fs.ensureDir(destination);
      
      // Copy project files
      await fs.copy(projectPath, destination, {
        filter: (src) => {
          // Exclude build outputs and temporary files
          const excludePatterns = [
            'build/',
            'dist/',
            'test-reports/',
            'coverage/',
            '.git/',
            'node_modules/',
            '*.class',
            '*.jar',
            '*.aix'
          ];
          
          return !excludePatterns.some(pattern => 
            src.includes(pattern.replace('/', path.sep))
          );
        }
      });
      
      // Create template.json
      const templateConfig = {
        name: templateName,
        description: options.description || 'Custom template',
        author: options.author || 'AIX Studio User',
        version: options.version || '1.0.0',
        language: options.language || 'java',
        files: await this.getProjectFiles(destination),
        variables: {
          projectName: '{{projectName}}',
          package: '{{package}}',
          packagePath: '{{packagePath}}',
          className: '{{className}}',
          description: '{{description}}',
          author: '{{author}}'
        }
      };
      
      await fs.writeJson(path.join(destination, 'template.json'), templateConfig, { spaces: 2 });
      
      this.emit('template-create-complete', { templateName, destination });
      
      return {
        success: true,
        templateName,
        destination,
        message: 'Template created successfully'
      };
    } catch (error) {
      this.emit('template-create-error', { projectPath, templateName, destination, error: error.message });
      throw new Error(`Failed to create template: ${error.message}`);
    }
  }

  /**
   * Validate project structure
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Validation result
   */
  async validateProject(projectPath) {
    const requiredFiles = [
      'build.xml',
      'src'
    ];
    
    const recommendedFiles = [
      'README.md',
      'package.json',
      'aix.config.json'
    ];
    
    const errors = [];
    const warnings = [];
    
    // Check required files
    for (const file of requiredFiles) {
      const filePath = path.join(projectPath, file);
      if (!await fs.pathExists(filePath)) {
        errors.push(`Missing required file/directory: ${file}`);
      }
    }
    
    // Check recommended files
    for (const file of recommendedFiles) {
      const filePath = path.join(projectPath, file);
      if (!await fs.pathExists(filePath)) {
        warnings.push(`Missing recommended file: ${file}`);
      }
    }
    
    // Check for source files
    const srcDir = path.join(projectPath, 'src');
    if (await fs.pathExists(srcDir)) {
      const srcFiles = await this.getProjectFiles(srcDir);
      if (srcFiles.length === 0) {
        warnings.push('No source files found in src/ directory');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      path: projectPath
    };
  }
}

module.exports = ProjectGenerator;