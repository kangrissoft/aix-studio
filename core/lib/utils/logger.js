const fs = require('fs-extra');
const path = require('path');
const { format } = require('date-fns');

/**
 * Logger Utility for AIX Studio
 * Provides structured logging with different levels and output options
 */
class Logger {
  /**
   * Create logger instance
   * @param {Object} options - Logger options
   */
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.file = options.file || null;
    this.console = options.console !== false;
    this.timestamp = options.timestamp !== false;
    this.colors = options.colors !== false;
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 5;
    
    // Log levels in order of severity
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };
    
    // Colors for console output
    this.colorsMap = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m',  // Yellow
      info: '\x1b[36m',  // Cyan
      debug: '\x1b[90m', // Gray
      trace: '\x1b[90m'  // Gray
    };
    
    this.resetColor = '\x1b[0m';
  }

  /**
   * Log error message
   * @param {...*} args - Log arguments
   */
  error(...args) {
    this.log('error', ...args);
  }

  /**
   * Log warning message
   * @param {...*} args - Log arguments
   */
  warn(...args) {
    this.log('warn', ...args);
  }

  /**
   * Log info message
   * @param {...*} args - Log arguments
   */
  info(...args) {
    this.log('info', ...args);
  }

  /**
   * Log debug message
   * @param {...*} args - Log arguments
   */
  debug(...args) {
    this.log('debug', ...args);
  }

  /**
   * Log trace message
   * @param {...*} args - Log arguments
   */
  trace(...args) {
    this.log('trace', ...args);
  }

  /**
   * Generic log method
   * @param {string} level - Log level
   * @param {...*} args - Log arguments
   */
  log(level, ...args) {
    // Check if level should be logged
    if (this.levels[level] > this.levels[this.level]) {
      return;
    }
    
    // Format message
    const timestamp = this.timestamp ? `[${new Date().toISOString()}]` : '';
    const levelStr = `[${level.toUpperCase()}]`;
    const message = this.formatMessage(...args);
    
    // Console output
    if (this.console) {
      const color = this.colors ? this.colorsMap[level] : '';
      const reset = this.colors ? this.resetColor : '';
      console.log(`${color}${timestamp} ${levelStr} ${message}${reset}`);
    }
    
    // File output
    if (this.file) {
      this.writeToFile(`${timestamp} ${levelStr} ${message}\n`);
    }
  }

  /**
   * Format log message
   * @param {...*} args - Message arguments
   * @returns {string} - Formatted message
   */
  formatMessage(...args) {
    return args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (error) {
          return '[Circular]';
        }
      }
      return String(arg);
    }).join(' ');
  }

  /**
   * Write log to file
   * @param {string} message - Log message
   */
  async writeToFile(message) {
    try {
      // Ensure log directory exists
      const logDir = path.dirname(this.file);
      await fs.ensureDir(logDir);
      
      // Check file size and rotate if necessary
      if (await fs.pathExists(this.file)) {
        const stats = await fs.stat(this.file);
        if (stats.size > this.maxFileSize) {
          await this.rotateLogFile();
        }
      }
      
      // Append to log file
      await fs.appendFile(this.file, message);
    } catch (error) {
      // Silently fail to avoid infinite logging loop
    }
  }

  /**
   * Rotate log file
   */
  async rotateLogFile() {
    try {
      // Rename current log file
      const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
      const rotatedName = `${this.file}.${timestamp}`;
      await fs.rename(this.file, rotatedName);
      
      // Remove oldest files if we exceed maxFiles
      const logDir = path.dirname(this.file);
      const logFiles = (await fs.readdir(logDir))
        .filter(file => file.startsWith(path.basename(this.file)))
        .sort()
        .reverse();
      
      // Remove excess files
      for (let i = this.maxFiles; i < logFiles.length; i++) {
        const filePath = path.join(logDir, logFiles[i]);
        await fs.remove(filePath);
      }
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Create child logger with prefix
   * @param {string} prefix - Log prefix
   * @returns {Logger} - Child logger
   */
  child(prefix) {
    const childLogger = new Logger({
      level: this.level,
      file: this.file,
      console: this.console,
      timestamp: this.timestamp,
      colors: this.colors,
      maxFileSize: this.maxFileSize,
      maxFiles: this.maxFiles
    });
    
    // Override log method to add prefix
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level, ...args) => {
      originalLog(level, `[${prefix}]`, ...args);
    };
    
    return childLogger;
  }

  /**
   * Set log level
   * @param {string} level - New log level
   */
  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.level = level;
    }
  }

  /**
   * Enable/disable console output
   * @param {boolean} enabled - Enable console output
   */
  setConsole(enabled) {
    this.console = enabled;
  }

  /**
   * Enable/disable file output
   * @param {string|null} file - Log file path or null to disable
   */
  setFile(file) {
    this.file = file;
  }

  /**
   * Create logger with default configuration
   * @param {string} name - Logger name
   * @param {Object} options - Logger options
   * @returns {Logger} - Configured logger
   */
  static createLogger(name, options = {}) {
    const config = {
      level: process.env.LOG_LEVEL || 'info',
      file: process.env.LOG_FILE || null,
      console: process.env.LOG_CONSOLE !== 'false',
      timestamp: process.env.LOG_TIMESTAMP !== 'false',
      colors: process.env.LOG_COLORS !== 'false',
      maxFileSize: parseInt(process.env.LOG_MAX_FILE_SIZE) || 10 * 1024 * 1024,
      maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
      ...options
    };
    
    return new Logger(config);
  }

  /**
   * Create application logger
   * @param {Object} options - Logger options
   * @returns {Logger} - Application logger
   */
  static createAppLogger(options = {}) {
    const appName = 'AIX-Studio';
    const logDir = path.join(
      process.env.HOME || process.env.USERPROFILE || '.',
      '.aix-studio',
      'logs'
    );
    
    const config = {
      level: process.env.AIX_LOG_LEVEL || 'info',
      file: path.join(logDir, 'aix-studio.log'),
      console: true,
      timestamp: true,
      colors: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      ...options
    };
    
    return new Logger(config);
  }

  /**
   * Create silent logger (no output)
   * @returns {Logger} - Silent logger
   */
  static createSilentLogger() {
    return new Logger({
      level: 'silent',
      console: false,
      file: null
    });
  }

  /**
   * Log performance metrics
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {Object} metadata - Additional metadata
   */
  performance(operation, duration, metadata = {}) {
    const level = duration > 1000 ? 'warn' : 'debug';
    this.log(level, 'PERFORMANCE', operation, `${duration}ms`, metadata);
  }

  /**
   * Log HTTP request
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {number} statusCode - HTTP status code
   * @param {number} duration - Request duration
   * @param {Object} metadata - Additional metadata
   */
  httpRequest(method, url, statusCode, duration, metadata = {}) {
    const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';
    this.log(level, 'HTTP', `${method} ${url}`, statusCode, `${duration}ms`, metadata);
  }

  /**
   * Log database operation
   * @param {string} operation - Database operation
   * @param {string} table - Table name
   * @param {number} duration - Operation duration
   * @param {Object} metadata - Additional metadata
   */
  database(operation, table, duration, metadata = {}) {
    const level = duration > 1000 ? 'warn' : 'debug';
    this.log(level, 'DATABASE', operation, table, `${duration}ms`, metadata);
  }

  /**
   * Log cache operation
   * @param {string} operation - Cache operation
   * @param {string} key - Cache key
   * @param {boolean} hit - Cache hit/miss
   * @param {Object} metadata - Additional metadata
   */
  cache(operation, key, hit, metadata = {}) {
    const level = hit ? 'debug' : 'warn';
    this.log(level, 'CACHE', operation, key, hit ? 'HIT' : 'MISS', metadata);
  }

  /**
   * Log security event
   * @param {string} event - Security event
   * @param {string} user - User identifier
   * @param {string} ip - IP address
   * @param {Object} metadata - Additional metadata
   */
  security(event, user, ip, metadata = {}) {
    const level = event.includes('failed') ? 'warn' : 'info';
    this.log(level, 'SECURITY', event, user, ip, metadata);
  }

  /**
   * Log system event
   * @param {string} event - System event
   * @param {Object} metadata - Additional metadata
   */
  system(event, metadata = {}) {
    this.log('info', 'SYSTEM', event, metadata);
  }

  /**
   * Log error with stack trace
   * @param {Error} error - Error object
   * @param {Object} metadata - Additional metadata
   */
  errorWithStack(error, metadata = {}) {
    this.error('ERROR', error.message, error.stack, metadata);
  }

  /**
   * Measure execution time
   * @param {string} operation - Operation name
   * @param {Function} fn - Function to measure
   * @param {Object} metadata - Additional metadata
   * @returns {*} - Function result
   */
  async measure(operation, fn, metadata = {}) {
    const start = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.performance(operation, duration, metadata);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.performance(operation, duration, { ...metadata, error: error.message });
      throw error;
    }
  }

  /**
   * Create timing logger
   * @param {string} operation - Operation name
   * @param {Object} metadata - Additional metadata
   * @returns {Function} - Timing completion function
   */
  time(operation, metadata = {}) {
    const start = Date.now();
    
    return (additionalMetadata = {}) => {
      const duration = Date.now() - start;
      this.performance(operation, duration, { ...metadata, ...additionalMetadata });
    };
  }

  /**
   * Log memory usage
   * @param {string} context - Context description
   */
  logMemoryUsage(context = '') {
    const usage = process.memoryUsage();
    this.debug('MEMORY', context, {
      rss: this.formatBytes(usage.rss),
      heapTotal: this.formatBytes(usage.heapTotal),
      heapUsed: this.formatBytes(usage.heapUsed),
      external: this.formatBytes(usage.external)
    });
  }

  /**
   * Format bytes to human readable
   * @param {number} bytes - Byte count
   * @returns {string} - Formatted bytes
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = Logger;