/**
 * String Utility Functions for AIX Studio
 * Provides helper methods for string manipulation and formatting
 */
class StringUtils {
  /**
   * Convert string to camelCase
   * @param {string} str - Input string
   * @returns {string} - CamelCase string
   */
  static toCamelCase(str) {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      })
      .replace(/\s+/g, '');
  }

  /**
   * Convert string to PascalCase
   * @param {string} str - Input string
   * @returns {string} - PascalCase string
   */
  static toPascalCase(str) {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
      .replace(/\s+/g, '');
  }

  /**
   * Convert string to snake_case
   * @param {string} str - Input string
   * @returns {string} - Snake case string
   */
  static toSnakeCase(str) {
    return str
      .replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('_');
  }

  /**
   * Convert string to kebab-case
   * @param {string} str - Input string
   * @returns {string} - Kebab case string
   */
  static toKebabCase(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  /**
   * Capitalize first letter of string
   * @param {string} str - Input string
   * @returns {string} - String with capitalized first letter
   */
  static capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Decapitalize first letter of string
   * @param {string} str - Input string
   * @returns {string} - String with decapitalized first letter
   */
  static decapitalizeFirst(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  /**
   * Convert to title case
   * @param {string} str - Input string
   * @returns {string} - Title case string
   */
  static toTitleCase(str) {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => this.capitalizeFirst(word))
      .join(' ');
  }

  /**
   * Generate slug from string
   * @param {string} str - Input string
   * @returns {string} - Slug string
   */
  static generateSlug(str) {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Truncate string with ellipsis
   * @param {string} str - Input string
   * @param {number} length - Maximum length
   * @param {string} suffix - Suffix to append
   * @returns {string} - Truncated string
   */
  static truncate(str, length = 100, suffix = '...') {
    if (str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
  }

  /**
   * Wrap text at specified width
   * @param {string} str - Input string
   * @param {number} width - Wrap width
   * @returns {string} - Wrapped text
   */
  static wrapText(str, width = 80) {
    const words = str.split(' ');
    let lines = [];
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine + word).length <= width) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    
    if (currentLine) lines.push(currentLine);
    
    return lines.join('\n');
  }

  /**
   * Strip HTML tags from string
   * @param {string} str - Input string
   * @returns {string} - String without HTML tags
   */
  static stripHtml(str) {
    return str.replace(/<[^>]*>/g, '');
  }

  /**
   * Escape HTML entities
   * @param {string} str - Input string
   * @returns {string} - Escaped string
   */
  static escapeHtml(str) {
    const map = {
      '&': '&amp;',
      '<': '<',
      '>': '>',
      '"': '&quot;',
      "'": '&#039;'
    };
    
    return str.replace(/[&<>"']/g, (char) => map[char]);
  }

  /**
   * Unescape HTML entities
   * @param {string} str - Input string
   * @returns {string} - Unescaped string
   */
  static unescapeHtml(str) {
    const map = {
      '&amp;': '&',
      '<': '<',
      '>': '>',
      '&quot;': '"',
      '&#039;': "'"
    };
    
    return str.replace(/&(?:amp|lt|gt|quot|#039);/g, (entity) => map[entity]);
  }

  /**
   * Generate random string
   * @param {number} length - String length
   * @param {string} chars - Character set
   * @returns {string} - Random string
   */
  static randomString(length = 16, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate UUID
   * @returns {string} - UUID string
   */
  static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Pluralize word based on count
   * @param {string} word - Word to pluralize
   * @param {number} count - Count
   * @returns {string} - Pluralized word
   */
  static pluralize(word, count) {
    if (count === 1) return word;
    
    // Simple pluralization rules
    if (word.endsWith('y')) {
      return word.slice(0, -1) + 'ies';
    } else if (word.endsWith('s') || word.endsWith('sh') || word.endsWith('ch') || word.endsWith('x') || word.endsWith('z')) {
      return word + 'es';
    } else {
      return word + 's';
    }
  }

  /**
   * Format bytes to human readable
   * @param {number} bytes - Byte count
   * @param {number} decimals - Decimal places
   * @returns {string} - Formatted bytes
   */
  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Mask sensitive data
   * @param {string} str - Input string
   * @param {number} visibleChars - Visible characters at start/end
   * @returns {string} - Masked string
   */
  static maskString(str, visibleChars = 4) {
    if (str.length <= visibleChars * 2) {
      return '*'.repeat(str.length);
    }
    
    const start = str.substring(0, visibleChars);
    const end = str.substring(str.length - visibleChars);
    const masked = '*'.repeat(str.length - (visibleChars * 2));
    
    return start + masked + end;
  }

  /**
   * Normalize whitespace in string
   * @param {string} str - Input string
   * @returns {string} - Normalized string
   */
  static normalizeWhitespace(str) {
    return str.replace(/\s+/g, ' ').trim();
  }

  /**
   * Convert newlines to <br> tags
   * @param {string} str - Input string
   * @returns {string} - String with <br> tags
   */
  static nl2br(str) {
    return str.replace(/\n/g, '<br>');
  }

  /**
   * Convert <br> tags to newlines
   * @param {string} str - Input string
   * @returns {string} - String with newlines
   */
  static br2nl(str) {
    return str.replace(/<br\s*\/?>/gi, '\n');
  }

  /**
   * Check if string contains only letters
   * @param {string} str - Input string
   * @returns {boolean} - True if only letters
   */
  static isAlpha(str) {
    return /^[a-zA-Z]+$/.test(str);
  }

  /**
   * Check if string contains only alphanumeric characters
   * @param {string} str - Input string
   * @returns {boolean} - True if alphanumeric
   */
  static isAlphanumeric(str) {
    return /^[a-zA-Z0-9]+$/.test(str);
  }

  /**
   * Check if string is numeric
   * @param {string} str - Input string
   * @returns {boolean} - True if numeric
   */
  static isNumeric(str) {
    return /^-?\d+$/.test(str);
  }

  /**
   * Check if string is decimal
   * @param {string} str - Input string
   * @returns {boolean} - True if decimal
   */
  static isDecimal(str) {
    return /^-?\d*\.?\d+$/.test(str);
  }

  /**
   * Check if string is email
   * @param {string} str - Input string
   * @returns {boolean} - True if email
   */
  static isEmail(str) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(str);
  }

  /**
   * Check if string is URL
   * @param {string} str - Input string
   * @returns {boolean} - True if URL
   */
  static isUrl(str) {
    try {
      new URL(str);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Interpolate template string with variables
   * @param {string} template - Template string
   * @param {Object} variables - Variables object
   * @returns {string} - Interpolated string
   */
  static interpolate(template, variables) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }

  /**
   * Convert camelCase to human readable
   * @param {string} str - CamelCase string
   * @returns {string} - Human readable string
   */
  static camelCaseToHuman(str) {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (match) => match.toUpperCase());
  }

  /**
   * Convert snake_case to human readable
   * @param {string} str - Snake case string
   * @returns {string} - Human readable string
   */
  static snakeCaseToHuman(str) {
    return str
      .replace(/_/g, ' ')
      .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }
}

module.exports = StringUtils;