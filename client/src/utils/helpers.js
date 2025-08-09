/**
 * Helper Utilities for AIX Studio Client
 * Provides utility functions for common operations in the web interface
 */

/**
 * Format file size to human readable format
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted file size
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Generate unique ID
 * @returns {string} - Unique ID
 */
export function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Trigger immediately
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait, immediate) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    
    const callNow = immediate && !timeout;
    
    clearTimeout(timeout);
    
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(this, args);
  };
}

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  
  return function(...args) {
    const context = this;
    
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Deep clone object
 * @param {Object} obj - Object to clone
 * @returns {Object} - Cloned object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (obj instanceof Object) {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

/**
 * Merge objects deeply
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} - Merged object
 */
export function deepMerge(target, source) {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}

/**
 * Check if value is object
 * @param {*} item - Value to check
 * @returns {boolean} - True if object
 */
export function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Validate email address
 * @param {string} email - Email address
 * @returns {boolean} - True if valid
 */
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.toLowerCase());
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid
 */
export function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Capitalize first letter of string
 * @param {string} str - Input string
 * @returns {string} - Capitalized string
 */
export function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert camelCase to kebab-case
 * @param {string} str - CamelCase string
 * @returns {string} - Kebab-case string
 */
export function camelToKebab(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Convert kebab-case to camelCase
 * @param {string} str - Kebab-case string
 * @returns {string} - CamelCase string
 */
export function kebabToCamel(str) {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Truncate string with ellipsis
 * @param {string} str - Input string
 * @param {number} length - Maximum length
 * @param {string} suffix - Suffix to append
 * @returns {string} - Truncated string
 */
export function truncate(str, length = 100, suffix = '...') {
  if (str.length <= length) return str;
  return str.substring(0, length - suffix.length) + suffix;
}

/**
 * Generate slug from string
 * @param {string} str - Input string
 * @returns {string} - Slug string
 */
export function generateSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type
 * @returns {string} - Formatted date
 */
export function formatDate(date, format = 'datetime') {
  const d = new Date(date);
  
  switch (format) {
    case 'date':
      return d.toLocaleDateString();
    case 'time':
      return d.toLocaleTimeString();
    case 'datetime':
      return d.toLocaleString();
    case 'iso':
      return d.toISOString();
    default:
      return d.toLocaleString();
  }
}

/**
 * Calculate time ago
 * @param {Date|string} date - Date to calculate from
 * @returns {string} - Time ago string
 */
export function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) + ' years ago';
  }
  
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + ' months ago';
  }
  
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + ' days ago';
  }
  
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + ' hours ago';
  }
  
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + ' minutes ago';
  }
  
  return Math.floor(seconds) + ' seconds ago';
}

/**
 * Generate random string
 * @param {number} length - String length
 * @param {string} chars - Character set
 * @returns {string} - Random string
 */
export function randomString(length = 16, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Shuffle array
 * @param {Array} array - Array to shuffle
 * @returns {Array} - Shuffled array
 */
export function shuffle(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Get file extension
 * @param {string} filename - Filename
 * @returns {string} - File extension
 */
export function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
}

/**
 * Get file icon based on extension
 * @param {string} filename - Filename
 * @returns {string} - Icon class
 */
export function getFileIcon(filename) {
  const ext = getFileExtension(filename);
  
  const iconMap = {
    'java': 'file-java',
    'kt': 'file-kotlin',
    'xml': 'file-xml',
    'json': 'file-json',
    'md': 'file-markdown',
    'txt': 'file-text',
    'png': 'file-image',
    'jpg': 'file-image',
    'jpeg': 'file-image',
    'gif': 'file-image',
    'svg': 'file-image',
    'jar': 'file-archive',
    'aix': 'file-extension',
    'zip': 'file-archive',
    'tar': 'file-archive',
    'gz': 'file-archive'
  };
  
  return iconMap[ext] || 'file';
}

/**
 * Get MIME type from extension
 * @param {string} extension - File extension
 * @returns {string} - MIME type
 */
export function getMimeType(extension) {
  const mimeTypes = {
    '.js': 'application/javascript',
    '.jsx': 'application/javascript',
    '.ts': 'application/typescript',
    '.tsx': 'application/typescript',
    '.java': 'text/x-java-source',
    '.kt': 'text/x-kotlin',
    '.xml': 'application/xml',
    '.json': 'application/json',
    '.html': 'text/html',
    '.css': 'text/css',
    '.md': 'text/markdown',
    '.txt': 'text/plain',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.jar': 'application/java-archive',
    '.aix': 'application/x-aix-extension'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Extract version from filename
 * @param {string} filename - Filename
 * @returns {string|null} - Version string or null
 */
export function extractVersion(filename) {
  const versionRegex = /(\d+\.\d+\.\d+(?:[-.][\w.-]+)?)/;
  const match = filename.match(versionRegex);
  return match ? match[1] : null;
}

/**
 * Compare versions
 * @param {string} v1 - First version
 * @param {string} v2 - Second version
 * @returns {number} - Comparison result (-1, 0, 1)
 */
export function compareVersions(v1, v2) {
  const parts1 = v1.split(/[.-]/).map(part => isNaN(part) ? part : parseInt(part));
  const parts2 = v2.split(/[.-]/).map(part => isNaN(part) ? part : parseInt(part));
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = i < parts1.length ? parts1[i] : 0;
    const part2 = i < parts2.length ? parts2[i] : 0;
    
    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }
  
  return 0;
}

/**
 * Check if version is newer
 * @param {string} current - Current version
 * @param {string} latest - Latest version
 * @returns {boolean} - True if newer
 */
export function isVersionNewer(current, latest) {
  return compareVersions(current, latest) < 0;
}

/**
 * Parse query string
 * @param {string} queryString - Query string
 * @returns {Object} - Parsed query parameters
 */
export function parseQueryString(queryString) {
  const params = {};
  const pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
  
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].split('=');
    params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  
  return params;
}

/**
 * Build query string
 * @param {Object} params - Query parameters
 * @returns {string} - Query string
 */
export function buildQueryString(params) {
  const esc = encodeURIComponent;
  return Object.keys(params)
    .map(k => esc(k) + '=' + esc(params[k]))
    .join('&');
}

/**
 * Get cookie value
 * @param {string} name - Cookie name
 * @returns {string|null} - Cookie value or null
 */
export function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

/**
 * Set cookie
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Days until expiration
 * @returns {void}
 */
export function setCookie(name, value, days = 30) {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

/**
 * Remove cookie
 * @param {string} name - Cookie name
 * @returns {void}
 */
export function removeCookie(name) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

/**
 * Local storage wrapper with fallback
 * @param {string} key - Storage key
 * @param {*} value - Value to store (optional)
 * @returns {*} - Stored value or null
 */
export function localStorage(key, value) {
  try {
    if (value === undefined) {
      // Get value
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } else if (value === null) {
      // Remove value
      window.localStorage.removeItem(key);
      return null;
    } else {
      // Set value
      window.localStorage.setItem(key, JSON.stringify(value));
      return value;
    }
  } catch (error) {
    console.warn('localStorage not available:', error.message);
    return value === undefined ? null : value;
  }
}

/**
 * Session storage wrapper with fallback
 * @param {string} key - Storage key
 * @param {*} value - Value to store (optional)
 * @returns {*} - Stored value or null
 */
export function sessionStorage(key, value) {
  try {
    if (value === undefined) {
      // Get value
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } else if (value === null) {
      // Remove value
      window.sessionStorage.removeItem(key);
      return null;
    } else {
      // Set value
      window.sessionStorage.setItem(key, JSON.stringify(value));
      return value;
    }
  } catch (error) {
    console.warn('sessionStorage not available:', error.message);
    return value === undefined ? null : value;
  }
}

/**
 * Get viewport dimensions
 * @returns {Object} - Viewport dimensions
 */
export function getViewportDimensions() {
  return {
    width: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
  };
}

/**
 * Check if element is in viewport
 * @param {Element} element - DOM element
 * @returns {boolean} - True if in viewport
 */
export function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  const viewport = getViewportDimensions();
  
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= viewport.height &&
    rect.right <= viewport.width
  );
}

/**
 * Scroll to element smoothly
 * @param {string|Element} selector - Element selector or element
 * @param {Object} options - Scroll options
 * @returns {void}
 */
export function scrollToElement(selector, options = {}) {
  const element = typeof selector === 'string' 
    ? document.querySelector(selector) 
    : selector;
    
  if (element) {
    element.scrollIntoView({
      behavior: options.behavior || 'smooth',
      block: options.block || 'start',
      inline: options.inline || 'nearest'
    });
  }
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Copy success
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy text:', error);
    return false;
  }
}

/**
 * Generate password
 * @param {number} length - Password length
 * @param {Object} options - Password options
 * @returns {string} - Generated password
 */
export function generatePassword(length = 12, options = {}) {
  const {
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = false
  } = options;
  
  let charset = '';
  if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (includeNumbers) charset += '0123456789';
  if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  if (charset === '') {
    throw new Error('At least one character type must be included');
  }
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
}

/**
 * Calculate password strength
 * @param {string} password - Password to check
 * @returns {Object} - Strength analysis
 */
export function calculatePasswordStrength(password) {
  let score = 0;
  const feedback = [];
  
  // Length check
  if (password.length >= 8) score += 1;
  else feedback.push('Password should be at least 8 characters long');
  
  if (password.length >= 12) score += 1;
  
  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Include lowercase letters');
  
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Include uppercase letters');
  
  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Include numbers');
  
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push('Include special characters');
  
  // Complexity bonus
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= password.length * 0.75) score += 1;
  
  // Strength levels
  let strength = 'Very Weak';
  let color = 'red';
  
  if (score >= 6) {
    strength = 'Very Strong';
    color = 'green';
  } else if (score >= 5) {
    strength = 'Strong';
    color = 'lightgreen';
  } else if (score >= 4) {
    strength = 'Moderate';
    color = 'orange';
  } else if (score >= 3) {
    strength = 'Weak';
    color = 'orangered';
  }
  
  return {
    score,
    strength,
    color,
    feedback,
    maxScore: 7
  };
}

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @param {string} locale - Locale
 * @returns {string} - Formatted currency
 */
export function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
}

/**
 * Format number
 * @param {number} number - Number to format
 * @param {string} locale - Locale
 * @param {Object} options - Format options
 * @returns {string} - Formatted number
 */
export function formatNumber(number, locale = 'en-US', options = {}) {
  return new Intl.NumberFormat(locale, options).format(number);
}

/**
 * Format percentage
 * @param {number} value - Percentage value
 * @param {number} decimals - Decimal places
 * @param {string} locale - Locale
 * @returns {string} - Formatted percentage
 */
export function formatPercentage(value, decimals = 2, locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Validate form data
 * @param {Object} data - Form data
 * @param {Object} rules - Validation rules
 * @returns {Object} - Validation result
 */
export function validateForm(data, rules) {
  const errors = {};
  let isValid = true;
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    const fieldName = rule.name || field;
    
    // Required field
    if (rule.required && (!value || value.toString().trim() === '')) {
      errors[field] = `${fieldName} is required`;
      isValid = false;
      continue;
    }
    
    // Skip validation for empty optional fields
    if (!value || value.toString().trim() === '') {
      continue;
    }
    
    // Email validation
    if (rule.email && !validateEmail(value)) {
      errors[field] = `${fieldName} must be a valid email address`;
      isValid = false;
    }
    
    // URL validation
    if (rule.url && !validateUrl(value)) {
      errors[field] = `${fieldName} must be a valid URL`;
      isValid = false;
    }
    
    // Min length validation
    if (rule.minLength && value.toString().length < rule.minLength) {
      errors[field] = `${fieldName} must be at least ${rule.minLength} characters`;
      isValid = false;
    }
    
    // Max length validation
    if (rule.maxLength && value.toString().length > rule.maxLength) {
      errors[field] = `${fieldName} must be no more than ${rule.maxLength} characters`;
      isValid = false;
    }
    
    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      errors[field] = rule.patternMessage || `${fieldName} format is invalid`;
      isValid = false;
    }
    
    // Custom validation
    if (rule.validator && typeof rule.validator === 'function') {
      const customError = rule.validator(value, data);
      if (customError) {
        errors[field] = customError;
        isValid = false;
      }
    }
  }
  
  return {
    isValid,
    errors
  };
}

/**
 * Debounce promise
 * @param {Function} func - Async function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced async function
 */
export function debouncePromise(func, wait) {
  let timeout;
  
  return function(...args) {
    return new Promise((resolve, reject) => {
      clearTimeout(timeout);
      
      timeout = setTimeout(async () => {
        try {
          const result = await func.apply(this, args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, wait);
    });
  };
}

/**
 * Retry promise
 * @param {Function} func - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} delay - Delay between retries (ms)
 * @returns {Promise} - Promise with retry logic
 */
export async function retryPromise(func, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await func();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
}

/**
 * Timeout promise
 * @param {Promise} promise - Promise to timeout
 * @param {number} ms - Timeout in milliseconds
 * @param {string} message - Timeout message
 * @returns {Promise} - Promise with timeout
 */
export function timeoutPromise(promise, ms, message = 'Operation timed out') {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(message)), ms)
    )
  ]);
}

/**
 * Sleep function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Sleep promise
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate UUID
 * @returns {string} - UUID string
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Check if running in browser
 * @returns {boolean} - True if in browser
 */
export function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Check if running in Node.js
 * @returns {boolean} - True if in Node.js
 */
export function isNode() {
  return typeof process !== 'undefined' && process.versions && process.versions.node;
}

/**
 * Get user agent
 * @returns {string} - User agent string
 */
export function getUserAgent() {
  return isBrowser() ? navigator.userAgent : 'Node.js';
}

/**
 * Check if mobile device
 * @returns {boolean} - True if mobile
 */
export function isMobile() {
  if (!isBrowser()) return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Get device type
 * @returns {string} - Device type
 */
export function getDeviceType() {
  if (!isBrowser()) return 'server';
  
  if (isMobile()) return 'mobile';
  if (window.innerWidth <= 768) return 'tablet';
  return 'desktop';
}

/**
 * Create event emitter
 * @returns {Object} - Event emitter object
 */
export function createEventEmitter() {
  const events = {};
  
  return {
    on(event, callback) {
      if (!events[event]) {
        events[event] = [];
      }
      events[event].push(callback);
    },
    
    off(event, callback) {
      if (events[event]) {
        events[event] = events[event].filter(cb => cb !== callback);
      }
    },
    
    emit(event, data) {
      if (events[event]) {
        events[event].forEach(callback => callback(data));
      }
    }
  };
}

/**
 * Create observable
 * @param {*} initialValue - Initial value
 * @returns {Object} - Observable object
 */
export function createObservable(initialValue) {
  let value = initialValue;
  const emitter = createEventEmitter();
  
  return {
    get() {
      return value;
    },
    
    set(newValue) {
      const oldValue = value;
      value = newValue;
      emitter.emit('change', { oldValue, newValue });
    },
    
    subscribe(callback) {
      emitter.on('change', callback);
      return () => emitter.off('change', callback);
    },
    
    getValue() {
      return value;
    },
    
    setValue(newValue) {
      this.set(newValue);
    }
  };
}

export default {
  formatFileSize,
  generateId,
  debounce,
  throttle,
  deepClone,
  deepMerge,
  isObject,
  validateEmail,
  validateUrl,
  capitalizeFirst,
  camelToKebab,
  kebabToCamel,
  truncate,
  generateSlug,
  formatDate,
  timeAgo,
  randomString,
  shuffle,
  getFileExtension,
  getFileIcon,
  getMimeType,
  extractVersion,
  compareVersions,
  isVersionNewer,
  parseQueryString,
  buildQueryString,
  getCookie,
  setCookie,
  removeCookie,
  localStorage,
  sessionStorage,
  getViewportDimensions,
  isInViewport,
  scrollToElement,
  copyToClipboard,
  generatePassword,
  calculatePasswordStrength,
  formatCurrency,
  formatNumber,
  formatPercentage,
  validateForm,
  debouncePromise,
  retryPromise,
  timeoutPromise,
  sleep,
  generateUUID,
  isBrowser,
  isNode,
  getUserAgent,
  isMobile,
  getDeviceType,
  createEventEmitter,
  createObservable
};