const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const EventEmitter = require('events');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

/**
 * Template Downloader for AIX Studio
 * Downloads templates from GitHub and other sources
 */
class TemplateDownloader extends EventEmitter {
  constructor(options = {}) {
    super();
    this.timeout = options.timeout || 30000;
    this.retries = options.retries || 3;
    this.userAgent = options.userAgent || 'AIX-Studio/1.0';
    this.templatesDir = options.templatesDir || path.join(__dirname, '../../templates');
    this.verbose = options.verbose || false;
  }

  /**
   * Download template from GitHub repository
   * @param {string} repo - GitHub repository (username/repo)
   * @param {string} destination - Destination directory
   * @param {Object} options - Download options
   * @returns {Promise<Object>} - Download result
   */
  async downloadFromGitHub(repo, destination, options = {}) {
    const startTime = Date.now();
    
    try {
      // Ensure destination directory exists
      await fs.ensureDir(destination);
      
      this.emit('start', { repo, destination });
      
      // Clone repository
      const result = await this.cloneGitHubRepo(repo, destination, options);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.emit('complete', { 
        repo, 
        destination, 
        duration,
        ...result 
      });
      
      return {
        success: true,
        repo,
        destination,
        duration,
        message: 'Template downloaded successfully'
      };
    } catch (error) {
      this.emit('error', { repo, destination, error: error.message });
      
      throw new Error(`Failed to download template from ${repo}: ${error.message}`);
    }
  }

  /**
   * Clone GitHub repository
   * @param {string} repo - GitHub repository
   * @param {string} destination - Destination directory
   * @param {Object} options - Clone options
   * @returns {Promise<Object>} - Clone result
   */
  async cloneGitHubRepo(repo, destination, options = {}) {
    const branch = options.branch || 'main';
    const depth = options.depth || 1; // Shallow clone
    
    const cloneUrl = `https://github.com/${repo}.git`;
    const cmd = `git clone --depth=${depth} --branch=${branch} ${cloneUrl} "${destination}"`;
    
    try {
      this.emit('cloning', { repo, destination });
      
      const { stdout, stderr } = await execAsync(cmd, { 
        timeout: this.timeout,
        cwd: path.dirname(destination)
      });
      
      if (stderr && this.verbose) {
        console.warn('Git clone stderr:', stderr);
      }
      
      // Clean up .git directory to save space
      const gitDir = path.join(destination, '.git');
      if (await fs.pathExists(gitDir)) {
        await fs.remove(gitDir);
      }
      
      return {
        stdout,
        stderr
      };
    } catch (error) {
      throw new Error(`Git clone failed: ${error.message}`);
    }
  }

  /**
   * Download template from URL (ZIP archive)
   * @param {string} url - Template ZIP URL
   * @param {string} destination - Destination directory
   * @param {Object} options - Download options
   * @returns {Promise<Object>} - Download result
   */
  async downloadFromUrl(url, destination, options = {}) {
    const startTime = Date.now();
    
    try {
      this.emit('start', { url, destination });
      
      // Download ZIP file
      const tempZip = path.join(destination, 'temp-template.zip');
      await fs.ensureDir(destination);
      
      const writer = fs.createWriteStream(tempZip);
      
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        timeout: this.timeout,
        headers: {
          'User-Agent': this.userAgent
        },
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            this.emit('progress', { 
              url, 
              loaded: progressEvent.loaded, 
              total: progressEvent.total, 
              percent 
            });
          }
        }
      });
      
      response.data.pipe(writer);
      
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      
      // Extract ZIP file
      await this.extractZip(tempZip, destination);
      
      // Clean up temporary ZIP file
      await fs.remove(tempZip);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.emit('complete', { 
        url, 
        destination, 
        duration
      });
      
      return {
        success: true,
        url,
        destination,
        duration,
        message: 'Template downloaded and extracted successfully'
      };
    } catch (error) {
      this.emit('error', { url, destination, error: error.message });
      
      throw new Error(`Failed to download template from ${url}: ${error.message}`);
    }
  }

  /**
   * Extract ZIP file
   * @param {string} zipPath - Path to ZIP file
   * @param {string} destination - Destination directory
   * @returns {Promise<void>}
   */
  async extractZip(zipPath, destination) {
    // Try to use system unzip command first
    try {
      const cmd = `unzip -q "${zipPath}" -d "${destination}"`;
      await execAsync(cmd, { timeout: this.timeout });
      return;
    } catch (error) {
      // Fall back to node implementation if unzip fails
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(destination, true);
    }
  }

  /**
   * Install official template
   * @param {string} templateName - Template name
   * @param {string} destination - Destination directory
   * @returns {Promise<Object>} - Installation result
   */
  async installOfficialTemplate(templateName, destination) {
    // Load template registry
    const templatesConfig = require('../../templates/config/templates.json');
    const template = templatesConfig.templates.official[templateName];
    
    if (!template) {
      throw new Error(`Official template '${templateName}' not found`);
    }
    
    // For now, we'll copy from local templates
    // In a real implementation, this would download from a remote registry
    const sourceTemplateDir = path.join(this.templatesDir, template.path);
    
    if (!await fs.pathExists(sourceTemplateDir)) {
      throw new Error(`Template source not found: ${sourceTemplateDir}`);
    }
    
    // Copy template files
    await fs.copy(sourceTemplateDir, destination);
    
    return {
      success: true,
      template: templateName,
      destination,
      message: 'Official template installed successfully'
    };
  }

  /**
   * List available templates
   * @returns {Promise<Object>} - Available templates
   */
  async listAvailableTemplates() {
    try {
      // Load template registry
      const templatesConfig = require('../../templates/config/templates.json');
      
      return {
        success: true,
        templates: templatesConfig.templates,
        message: 'Templates loaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        templates: { official: {}, community: {} },
        error: error.message
      };
    }
  }

  /**
   * Search templates by keyword
   * @param {string} keyword - Search keyword
   * @returns {Promise<Array>} - Matching templates
   */
  async searchTemplates(keyword) {
    const templates = await this.listAvailableTemplates();
    const results = [];
    
    if (!templates.success) {
      throw new Error('Failed to load templates');
    }
    
    // Search in official templates
    for (const [key, template] of Object.entries(templates.templates.official)) {
      if (this.templateMatches(template, keyword)) {
        results.push({
          id: key,
          ...template,
          source: 'official'
        });
      }
    }
    
    // Search in community templates
    for (const [key, template] of Object.entries(templates.templates.community)) {
      if (this.templateMatches(template, keyword)) {
        results.push({
          id: key,
          ...template,
          source: 'community'
        });
      }
    }
    
    return results;
  }

  /**
   * Check if template matches keyword
   * @param {Object} template - Template object
   * @param {string} keyword - Search keyword
   * @returns {boolean} - True if matches
   */
  templateMatches(template, keyword) {
    const searchString = `${template.name} ${template.description} ${template.category}`.toLowerCase();
    return searchString.includes(keyword.toLowerCase());
  }

  /**
   * Validate template structure
   * @param {string} templatePath - Template directory path
   * @returns {Promise<Object>} - Validation result
   */
  async validateTemplate(templatePath) {
    const requiredFiles = [
      'template.json',
      'build.xml',
      'README.md'
    ];
    
    const requiredDirs = [
      'src',
      'assets'
    ];
    
    const errors = [];
    
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
      const templateJsonPath = path.join(templatePath, 'template.json');
      if (await fs.pathExists(templateJsonPath)) {
        const templateJson = await fs.readJson(templateJsonPath);
        
        // Check required fields
        const requiredFields = ['name', 'description', 'author', 'version'];
        for (const field of requiredFields) {
          if (!templateJson[field]) {
            errors.push(`Missing required field in template.json: ${field}`);
          }
        }
      }
    } catch (error) {
      errors.push(`Invalid template.json: ${error.message}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      path: templatePath
    };
  }

  /**
   * Create template package (ZIP)
   * @param {string} templatePath - Template directory path
   * @param {string} outputPath - Output ZIP file path
   * @returns {Promise<Object>} - Package result
   */
  async createTemplatePackage(templatePath, outputPath) {
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
   * Publish template to registry
   * @param {string} templatePath - Template directory path
   * @param {Object} options - Publish options
   * @returns {Promise<Object>} - Publish result
   */
  async publishTemplate(templatePath, options = {}) {
    // Validate template
    const validation = await this.validateTemplate(templatePath);
    if (!validation.valid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Load template metadata
    const templateJsonPath = path.join(templatePath, 'template.json');
    const templateMetadata = await fs.readJson(templateJsonPath);
    
    // In a real implementation, this would:
    // 1. Create ZIP package
    // 2. Upload to template registry
    // 3. Update registry index
    // 4. Return publish information
    
    return {
      success: true,
      template: templateMetadata.name,
      version: templateMetadata.version,
      message: 'Template published successfully (simulated)'
    };
  }
}

module.exports = TemplateDownloader;