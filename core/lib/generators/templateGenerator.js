const fs = require('fs-extra');
const path = require('path');
const EventEmitter = require('events');

/**
 * Template Generator for AIX Studio
 * Creates and manages custom templates for extension projects
 */
class TemplateGenerator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.templatesDir = options.templatesDir || path.join(__dirname, '../../templates');
    this.verbose = options.verbose || false;
  }

  /**
   * Create new template from project
   * @param {string} projectPath - Source project path
   * @param {string} templateName - Template name
   * @param {string} destination - Destination template directory
   * @param {Object} options - Template creation options
   * @returns {Promise<Object>} - Creation result
   */
  async createFromProject(projectPath, templateName, destination, options = {}) {
    try {
      this.emit('create-start', { projectPath, templateName, destination });
      
      // Validate project path
      if (!await fs.pathExists(projectPath)) {
        throw new Error(`Project path does not exist: ${projectPath}`);
      }
      
      // Ensure destination directory exists
      await fs.ensureDir(destination);
      
      // Copy project files with filtering
      await this.copyProjectFiles(projectPath, destination, options);
      
      // Process template variables
      const variables = await this.extractTemplateVariables(destination);
      
      // Create template configuration
      const templateConfig = this.createTemplateConfig(templateName, variables, options);
      
      // Write template configuration
      await fs.writeJson(path.join(destination, 'template.json'), templateConfig, { spaces: 2 });
      
      // Create README if it doesn't exist
      await this.createTemplateReadme(destination, templateConfig);
      
      this.emit('create-complete', { templateName, destination });
      
      return {
        success: true,
        templateName,
        destination,
        config: templateConfig,
        message: 'Template created successfully'
      };
    } catch (error) {
      this.emit('create-error', { projectPath, templateName, destination, error: error.message });
      throw new Error(`Failed to create template: ${error.message}`);
    }
  }

  /**
   * Copy project files with filtering
   * @param {string} source - Source project path
   * @param {string} destination - Destination template directory
   * @param {Object} options - Copy options
   * @returns {Promise<void>}
   */
  async copyProjectFiles(source, destination, options = {}) {
    this.emit('copy-start', { source, destination });
    
    const excludePatterns = options.exclude || [
      'build/',
      'dist/',
      'test-reports/',
      'coverage/',
      '.git/',
      'node_modules/',
      '*.class',
      '*.jar',
      '*.aix',
      '.DS_Store',
      'Thumbs.db'
    ];
    
    await fs.copy(source, destination, {
      filter: (src) => {
        const relativePath = path.relative(source, src);
        
        // Always include essential files
        const essentialFiles = [
          'build.xml',
          'src/',
          'assets/',
          'libs/',
          'README.md',
          'package.json'
        ];
        
        if (essentialFiles.some(essential => 
          relativePath === essential || relativePath.startsWith(essential))) {
          return true;
        }
        
        // Exclude patterns
        return !excludePatterns.some(pattern => 
          relativePath.includes(pattern.replace('/', path.sep))
        );
      }
    });
    
    this.emit('copy-complete', { source, destination });
  }

  /**
   * Extract template variables from files
   * @param {string} templatePath - Template directory path
   * @returns {Promise<Object>} - Template variables
   */
  async extractTemplateVariables(templatePath) {
    const variables = {
      projectName: '{{projectName}}',
      package: '{{package}}',
      packagePath: '{{packagePath}}',
      className: '{{className}}',
      description: '{{description}}',
      author: '{{author}}',
      year: '{{year}}'
    };
    
    // Try to extract from existing files
    const srcDir = path.join(templatePath, 'src');
    if (await fs.pathExists(srcDir)) {
      const javaFiles = await this.findFiles(srcDir, '.java');
      const ktFiles = await this.findFiles(srcDir, '.kt');
      
      const sourceFiles = [...javaFiles, ...ktFiles];
      
      for (const file of sourceFiles) {
        const content = await fs.readFile(file, 'utf8');
        
        // Extract package name
        const packageMatch = content.match(/package\s+([^\s;]+)/);
        if (packageMatch) {
          const packageName = packageMatch[1];
          // Convert to template variable format
          variables.package = packageName
            .replace(/com\.example\.[^.]*/, 'com.example.{{projectName}}')
            .replace(/com\/example\/[^/]*/, 'com/example/{{projectName}}');
        }
        
        // Extract class name
        const classMatch = content.match(/(?:class|interface)\s+(\w+)/);
        if (classMatch) {
          variables.className = classMatch[1].replace(
            new RegExp(path.basename(file, path.extname(file)), 'g'), 
            '{{className}}'
          );
        }
      }
    }
    
    return variables;
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
   * Create template configuration
   * @param {string} templateName - Template name
   * @param {Object} variables - Template variables
   * @param {Object} options - Configuration options
   * @returns {Object} - Template configuration
   */
  createTemplateConfig(templateName, variables, options = {}) {
    const now = new Date();
    
    return {
      name: templateName,
      description: options.description || `${templateName} Template`,
      author: options.author || 'AIX Studio User',
      version: options.version || '1.0.0',
      language: options.language || this.detectLanguage(variables),
      category: options.category || 'custom',
      files: [], // Will be populated after file processing
      dependencies: options.dependencies || [],
      variables: variables,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
  }

  /**
   * Detect language from variables
   * @param {Object} variables - Template variables
   * @returns {string} - Detected language
   */
  detectLanguage(variables) {
    // This would be more sophisticated in a real implementation
    return 'java';
  }

  /**
   * Create template README
   * @param {string} templatePath - Template directory path
   * @param {Object} config - Template configuration
   * @returns {Promise<void>}
   */
  async createTemplateReadme(templatePath, config) {
    const readmePath = path.join(templatePath, 'README.md');
    
    // Don't overwrite existing README
    if (await fs.pathExists(readmePath)) {
      return;
    }
    
    const readmeContent = `# ${config.name}

${config.description}

## 📋 Overview

This template provides a starting point for creating App Inventor Extensions.

## 🚀 Getting Started

\`\`\`bash
# Create new project from template
aix init my-project --template ${config.name}

# Navigate to project
cd my-project

# Build extension
aix build
\`\`\`

## 🎯 Template Variables

| Variable | Description | Default Value |
|----------|-------------|---------------|
| \`{{projectName}}\` | Project name | Your project name |
| \`{{package}}\` | Package name | com.example.\`{{projectName}}\` |
| \`{{className}}\` | Main class name | \`{{projectName}}\` |
| \`{{description}}\` | Project description | Your project description |
| \`{{author}}\` | Author name | Your name |

## 📄 License

${config.license || 'MIT License'}
`;
    
    await fs.writeFile(readmePath, readmeContent);
  }

  /**
   * List available templates
   * @param {string} templatesDir - Templates directory (optional)
   * @returns {Promise<Array>} - Available templates
   */
  async listTemplates(templatesDir = null) {
    const dir = templatesDir || this.templatesDir;
    
    if (!await fs.pathExists(dir)) {
      return [];
    }
    
    const templates = [];
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = await fs.stat(itemPath);
      
      if (stat.isDirectory()) {
        // Check if it's a template directory
        const configPath = path.join(itemPath, 'template.json');
        if (await fs.pathExists(configPath)) {
          try {
            const config = await fs.readJson(configPath);
            templates.push({
              name: item,
              path: itemPath,
              ...config
            });
          } catch (error) {
            // Skip invalid template configurations
            continue;
          }
        } else {
          // Check subdirectories for templates
          const subTemplates = await this.listTemplates(itemPath);
          templates.push(...subTemplates);
        }
      }
    }
    
    return templates;
  }

  /**
   * Validate template structure
   * @param {string} templatePath - Template directory path
   * @returns {Promise<Object>} - Validation result
   */
  async validateTemplate(templatePath) {
    const requiredFiles = [
      'template.json',
      'build.xml'
    ];
    
    const requiredDirs = [
      'src',
      'assets'
    ];
    
    const errors = [];
    const warnings = [];
    
    // Check required files
    for (const file of requiredFiles) {
      const filePath = path.join(templatePath, file);
      if (!await fs.pathExists(filePath)) {
        errors.push(`Missing required file: ${file}`);
      }
    }
    
    // Check required directories
    for (const dir of requiredDirs) {
      const dirPath = path.join(templatePath, dir);
      if (!await fs.pathExists(dirPath)) {
        errors.push(`Missing required directory: ${dir}`);
      }
    }
    
    // Validate template.json
    try {
      const configPath = path.join(templatePath, 'template.json');
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        
        // Check required fields
        const requiredFields = ['name', 'description', 'author', 'version'];
        for (const field of requiredFields) {
          if (!config[field]) {
            errors.push(`Missing required field in template.json: ${field}`);
          }
        }
        
        // Validate variables
        if (config.variables) {
          const standardVariables = ['projectName', 'package', 'className'];
          for (const variable of standardVariables) {
            if (!config.variables[variable]) {
              warnings.push(`Missing standard variable: ${variable}`);
            }
          }
        }
      }
    } catch (error) {
      errors.push(`Invalid template.json: ${error.message}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      path: templatePath
    };
  }

  /**
   * Package template as ZIP file
   * @param {string} templatePath - Template directory path
   * @param {string} outputPath - Output ZIP file path
   * @returns {Promise<Object>} - Package result
   */
  async packageTemplate(templatePath, outputPath) {
    // Validate template first
    const validation = await this.validateTemplate(templatePath);
    if (!validation.valid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Create ZIP package
    try {
      const AdmZip = require('adm-zip');
      const zip = new AdmZip();
      
      // Add template files to ZIP
      zip.addLocalFolder(templatePath, path.basename(templatePath));
      
      // Write ZIP file
      await fs.ensureDir(path.dirname(outputPath));
      zip.writeZip(outputPath);
      
      const stats = await fs.stat(outputPath);
      
      return {
        success: true,
        path: outputPath,
        size: stats.size,
        message: 'Template package created successfully'
      };
    } catch (error) {
      throw new Error(`Failed to create template package: ${error.message}`);
    }
  }

  /**
   * Install template from ZIP file
   * @param {string} zipPath - ZIP file path
   * @param {string} destination - Destination directory
   * @returns {Promise<Object>} - Installation result
   */
  async installTemplate(zipPath, destination) {
    try {
      this.emit('install-start', { zipPath, destination });
      
      // Ensure destination directory exists
      await fs.ensureDir(destination);
      
      // Extract ZIP file
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(destination, true);
      
      // Validate installed template
      const validation = await this.validateTemplate(destination);
      if (!validation.valid) {
        throw new Error(`Invalid template: ${validation.errors.join(', ')}`);
      }
      
      this.emit('install-complete', { destination });
      
      return {
        success: true,
        destination,
        validation,
        message: 'Template installed successfully'
      };
    } catch (error) {
      this.emit('install-error', { zipPath, destination, error: error.message });
      throw new Error(`Failed to install template: ${error.message}`);
    }
  }

  /**
   * Update template configuration
   * @param {string} templatePath - Template directory path
   * @param {Object} updates - Configuration updates
   * @returns {Promise<Object>} - Update result
   */
  async updateTemplate(templatePath, updates) {
    try {
      const configPath = path.join(templatePath, 'template.json');
      
      if (!await fs.pathExists(configPath)) {
        throw new Error('Template configuration not found');
      }
      
      const config = await fs.readJson(configPath);
      
      // Update configuration
      const updatedConfig = {
        ...config,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // Write updated configuration
      await fs.writeJson(configPath, updatedConfig, { spaces: 2 });
      
      return {
        success: true,
        config: updatedConfig,
        message: 'Template configuration updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update template: ${error.message}`);
    }
  }

  /**
   * Create template from scratch
   * @param {string} templateName - Template name
   * @param {string} destination - Destination directory
   * @param {Object} options - Template options
   * @returns {Promise<Object>} - Creation result
   */
  async createFromScratch(templateName, destination, options = {}) {
    try {
      this.emit('scratch-start', { templateName, destination });
      
      // Ensure destination directory exists
      await fs.ensureDir(destination);
      
      // Create basic template structure
      await this.createBasicStructure(destination, options);
      
      // Create template configuration
      const variables = {
        projectName: '{{projectName}}',
        package: 'com.example.{{projectName}}',
        packagePath: 'com/example/{{projectName}}',
        className: '{{className}}',
        description: '{{description}}',
        author: '{{author}}',
        year: '{{year}}'
      };
      
      const templateConfig = this.createTemplateConfig(templateName, variables, options);
      
      // Write template configuration
      await fs.writeJson(path.join(destination, 'template.json'), templateConfig, { spaces: 2 });
      
      // Create README
      await this.createTemplateReadme(destination, templateConfig);
      
      this.emit('scratch-complete', { templateName, destination });
      
      return {
        success: true,
        templateName,
        destination,
        config: templateConfig,
        message: 'Template created from scratch successfully'
      };
    } catch (error) {
      this.emit('scratch-error', { templateName, destination, error: error.message });
      throw new Error(`Failed to create template from scratch: ${error.message}`);
    }
  }

  /**
   * Create basic template structure
   * @param {string} destination - Destination directory
   * @param {Object} options - Structure options
   * @returns {Promise<void>}
   */
  async createBasicStructure(destination, options = {}) {
    // Create directories
    await fs.ensureDir(path.join(destination, 'src'));
    await fs.ensureDir(path.join(destination, 'assets', 'images'));
    await fs.ensureDir(path.join(destination, 'libs'));
    
    // Create basic build.xml
    const buildXml = `<?xml version="1.0" encoding="UTF-8"?>
<project name="{{projectName}}" default="package">
  <property name="src.dir" value="src"/>
  <property name="build.dir" value="build"/>
  <property name="dist.dir" value="dist"/>
  <property name="libs.dir" value="libs"/>
  <property name="assets.dir" value="assets"/>

  <path id="classpath">
    <fileset dir="\${libs.dir}" includes="**/*.jar"/>
  </path>

  <target name="clean">
    <delete dir="\${build.dir}"/>
    <delete dir="\${dist.dir}"/>
  </target>

  <target name="init">
    <mkdir dir="\${build.dir}"/>
    <mkdir dir="\${dist.dir}"/>
  </target>

  <target name="compile" depends="init">
    <javac srcdir="\${src.dir}" destdir="\${build.dir}" includeantruntime="false"
           source="11" target="11" encoding="UTF-8">
      <classpath refid="classpath"/>
    </javac>
  </target>

  <target name="package" depends="compile">
    <jar destfile="\${dist.dir}/\${ant.project.name}.aix" basedir="\${build.dir}">
      <fileset dir="\${assets.dir}" />
      <manifest>
        <attribute name="Built-By" value="{{author}}"/>
        <attribute name="Created-By" value="AIX Studio"/>
        <attribute name="Version" value="1.0.0"/>
      </manifest>
    </jar>
    <echo message="Extension built: \${dist.dir}/\${ant.project.name}.aix"/>
  </target>
</project>`;
    
    await fs.writeFile(path.join(destination, 'build.xml'), buildXml);
    
    // Create .gitignore
    const gitignore = `# Build outputs
build/
dist/
*.aix
*.jar
*.class

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db`;
    
    await fs.writeFile(path.join(destination, '.gitignore'), gitignore);
  }
}

module.exports = TemplateGenerator;