const fs = require('fs-extra');
const path = require('path');
const os = require('os');

/**
 * Configuration Utility Functions for AIX Studio
 * Provides helper methods for configuration management
 */
class ConfigUtils {
  /**
   * Get user home directory
   * @returns {string} - User home directory
   */
  static getUserHome() {
    return os.homedir();
  }

  /**
   * Get AIX Studio config directory
   * @returns {string} - Config directory path
   */
  static getConfigDir() {
    const home = this.getUserHome();
    return path.join(home, '.aix-studio');
  }

  /**
   * Get config file path
   * @param {string} filename - Config filename
   * @returns {string} - Full config file path
   */
  static getConfigPath(filename) {
    return path.join(this.getConfigDir(), filename);
  }

  /**
   * Load configuration from file
   * @param {string} configFile - Config filename
   * @param {Object} defaults - Default configuration
   * @returns {Promise<Object>} - Configuration object
   */
  static async loadConfig(configFile, defaults = {}) {
    const configPath = this.getConfigPath(configFile);
    
    try {
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        return { ...defaults, ...config };
      } else {
        // Create config file with defaults
        await this.saveConfig(configFile, defaults);
        return defaults;
      }
    } catch (error) {
      console.warn(`Failed to load config ${configFile}:`, error.message);
      return defaults;
    }
  }

  /**
   * Save configuration to file
   * @param {string} configFile - Config filename
   * @param {Object} config - Configuration object
   * @returns {Promise<void>}
   */
  static async saveConfig(configFile, config) {
    const configPath = this.getConfigPath(configFile);
    
    try {
      await fs.ensureDir(path.dirname(configPath));
      await fs.writeJson(configPath, config, { spaces: 2 });
    } catch (error) {
      throw new Error(`Failed to save config ${configFile}: ${error.message}`);
    }
  }

  /**
   * Get user configuration
   * @returns {Promise<Object>} - User configuration
   */
  static async getUserConfig() {
    const defaults = {
      theme: 'light',
      language: 'en',
      editor: {
        fontSize: 14,
        fontFamily: 'monospace',
        tabSize: 2,
        wordWrap: true
      },
      build: {
        javaHome: process.env.JAVA_HOME || '',
        antHome: process.env.ANT_HOME || '',
        kotlinHome: process.env.KOTLIN_HOME || ''
      },
      projects: {
        defaultDir: path.join(this.getUserHome(), 'AIX-Projects')
      },
      notifications: {
        enabled: true,
        sound: true
      },
      autoSave: {
        enabled: true,
        interval: 30000 // 30 seconds
      }
    };
    
    return await this.loadConfig('user.json', defaults);
  }

  /**
   * Save user configuration
   * @param {Object} config - User configuration
   * @returns {Promise<void>}
   */
  static async saveUserConfig(config) {
    await this.saveConfig('user.json', config);
  }

  /**
   * Get project configuration
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Project configuration
   */
  static async getProjectConfig(projectPath) {
    const configPath = path.join(projectPath, 'aix.config.json');
    const defaults = {
      name: path.basename(projectPath),
      version: '1.0.0',
      description: '',
      author: '',
      language: 'java',
      build: {
        targetSdk: 28,
        minSdk: 16,
        optimize: true
      },
      dependencies: [],
      test: {
        enabled: true,
        coverage: true
      }
    };
    
    try {
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        return { ...defaults, ...config };
      } else {
        return defaults;
      }
    } catch (error) {
      console.warn(`Failed to load project config:`, error.message);
      return defaults;
    }
  }

  /**
   * Save project configuration
   * @param {string} projectPath - Project directory path
   * @param {Object} config - Project configuration
   * @returns {Promise<void>}
   */
  static async saveProjectConfig(projectPath, config) {
    const configPath = path.join(projectPath, 'aix.config.json');
    
    try {
      await fs.writeJson(configPath, config, { spaces: 2 });
    } catch (error) {
      throw new Error(`Failed to save project config: ${error.message}`);
    }
  }

  /**
   * Get template configuration
   * @param {string} templatePath - Template directory path
   * @returns {Promise<Object>} - Template configuration
   */
  static async getTemplateConfig(templatePath) {
    const configPath = path.join(templatePath, 'template.json');
    const defaults = {
      name: path.basename(templatePath),
      description: 'AIX Studio Template',
      author: 'AIX Studio Team',
      version: '1.0.0',
      language: 'java',
      category: 'general',
      files: [],
      dependencies: [],
      variables: {}
    };
    
    try {
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        return { ...defaults, ...config };
      } else {
        return defaults;
      }
    } catch (error) {
      console.warn(`Failed to load template config:`, error.message);
      return defaults;
    }
  }

  /**
   * Save template configuration
   * @param {string} templatePath - Template directory path
   * @param {Object} config - Template configuration
   * @returns {Promise<void>}
   */
  static async saveTemplateConfig(templatePath, config) {
    const configPath = path.join(templatePath, 'template.json');
    
    try {
      await fs.writeJson(configPath, config, { spaces: 2 });
    } catch (error) {
      throw new Error(`Failed to save template config: ${error.message}`);
    }
  }

  /**
   * Get build configuration
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Build configuration
   */
  static async getBuildConfig(projectPath) {
    const configPath = path.join(projectPath, 'build.config.json');
    const defaults = {
      java: {
        version: '11',
        target: '11',
        encoding: 'UTF-8'
      },
      kotlin: {
        version: '1.8.0',
        jvmTarget: '11'
      },
      ant: {
        parallel: true,
        maxThreads: 4
      },
      optimization: {
        enabled: true,
        obfuscate: false,
        shrinkResources: false
      },
      signing: {
        enabled: false,
        keystore: '',
        alias: '',
        password: ''
      }
    };
    
    try {
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        return { ...defaults, ...config };
      } else {
        return defaults;
      }
    } catch (error) {
      console.warn(`Failed to load build config:`, error.message);
      return defaults;
    }
  }

  /**
   * Save build configuration
   * @param {string} projectPath - Project directory path
   * @param {Object} config - Build configuration
   * @returns {Promise<void>}
   */
  static async saveBuildConfig(projectPath, config) {
    const configPath = path.join(projectPath, 'build.config.json');
    
    try {
      await fs.writeJson(configPath, config, { spaces: 2 });
    } catch (error) {
      throw new Error(`Failed to save build config: ${error.message}`);
    }
  }

  /**
   * Get test configuration
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} - Test configuration
   */
  static async getTestConfig(projectPath) {
    const configPath = path.join(projectPath, 'test.config.json');
    const defaults = {
      framework: 'junit',
      version: '4.13.2',
      coverage: {
        enabled: true,
        tool: 'jacoco',
        threshold: 80
      },
      parallel: {
        enabled: false,
        threads: 2
      },
      reports: {
        html: true,
        xml: true,
        json: false
      },
      timeout: 30000 // 30 seconds
    };
    
    try {
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        return { ...defaults, ...config };
      } else {
        return defaults;
      }
    } catch (error) {
      console.warn(`Failed to load test config:`, error.message);
      return defaults;
    }
  }

  /**
   * Save test configuration
   * @param {string} projectPath - Project directory path
   * @param {Object} config - Test configuration
   * @returns {Promise<void>}
   */
  static async saveTestConfig(projectPath, config) {
    const configPath = path.join(projectPath, 'test.config.json');
    
    try {
      await fs.writeJson(configPath, config, { spaces: 2 });
    } catch (error) {
      throw new Error(`Failed to save test config: ${error.message}`);
    }
  }

  /**
   * Validate configuration
   * @param {Object} config - Configuration to validate
   * @param {Array} requiredFields - Required fields
   * @returns {Object} - Validation result
   */
  static validateConfig(config, requiredFields = []) {
    const errors = [];
    
    for (const field of requiredFields) {
      if (!config[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Merge configurations with priority
   * @param {Array} configs - Array of configurations (highest priority first)
   * @returns {Object} - Merged configuration
   */
  static mergeConfigs(configs) {
    const merged = {};
    
    for (const config of configs.reverse()) {
      Object.assign(merged, config);
    }
    
    return merged;
  }

  /**
   * Get environment-specific configuration
   * @param {Object} config - Base configuration
   * @param {string} environment - Environment name
   * @returns {Object} - Environment-specific configuration
   */
  static getEnvironmentConfig(config, environment) {
    if (config.environments && config.environments[environment]) {
      return { ...config, ...config.environments[environment] };
    }
    return config;
  }

  /**
   * Set configuration value
   * @param {Object} config - Configuration object
   * @param {string} key - Configuration key (dot notation)
   * @param {*} value - Configuration value
   * @returns {Object} - Updated configuration
   */
  static setConfigValue(config, key, value) {
    const keys = key.split('.');
    let current = config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    return config;
  }

  /**
   * Get configuration value
   * @param {Object} config - Configuration object
   * @param {string} key - Configuration key (dot notation)
   * @param {*} defaultValue - Default value
   * @returns {*} - Configuration value
   */
  static getConfigValue(config, key, defaultValue = null) {
    const keys = key.split('.');
    let current = config;
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return defaultValue;
      }
    }
    
    return current;
  }

  /**
   * Remove configuration value
   * @param {Object} config - Configuration object
   * @param {string} key - Configuration key (dot notation)
   * @returns {Object} - Updated configuration
   */
  static removeConfigValue(config, key) {
    const keys = key.split('.');
    let current = config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        return config;
      }
      current = current[keys[i]];
    }
    
    delete current[keys[keys.length - 1]];
    return config;
  }

  /**
   * Backup configuration file
   * @param {string} configFile - Config filename
   * @returns {Promise<string>} - Backup file path
   */
  static async backupConfig(configFile) {
    const configPath = this.getConfigPath(configFile);
    const backupPath = this.getConfigPath(`${configFile}.backup.${Date.now()}`);
    
    if (await fs.pathExists(configPath)) {
      await fs.copy(configPath, backupPath);
    }
    
    return backupPath;
  }

  /**
   * Restore configuration from backup
   * @param {string} configFile - Config filename
   * @param {string} backupPath - Backup file path
   * @returns {Promise<void>}
   */
  static async restoreConfig(configFile, backupPath) {
    const configPath = this.getConfigPath(configFile);
    
    if (await fs.pathExists(backupPath)) {
      await fs.copy(backupPath, configPath);
    }
  }
}

module.exports = ConfigUtils;