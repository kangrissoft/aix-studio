const jwt = require('jsonwebtoken');
const fs = require('fs-extra');
const path = require('path');

/**
 * Authentication and authorization middleware for AIX Studio
 * Handles JWT validation, API key verification, and access control
 */

class AuthMiddleware {
  /**
   * Initialize authentication middleware
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.secret = options.secret || process.env.JWT_SECRET || 'aix-studio-default-secret';
    this.sessionTimeout = options.sessionTimeout || '24h';
    this.apiKeyHeader = options.apiKeyHeader || 'x-api-key';
    this.usersFile = options.usersFile || path.join(__dirname, '../../data/users.json');
    this.apiKeysFile = options.apiKeysFile || path.join(__dirname, '../../data/api-keys.json');
    
    // Ensure data directories exist
    this.initializeDataFiles();
  }

  /**
   * Initialize data files if they don't exist
   */
  async initializeDataFiles() {
    try {
      const dataDir = path.dirname(this.usersFile);
      await fs.ensureDir(dataDir);
      
      // Create default users file if it doesn't exist
      if (!await fs.pathExists(this.usersFile)) {
        await fs.writeJson(this.usersFile, {
          users: [],
          createdAt: new Date().toISOString()
        });
      }
      
      // Create default API keys file if it doesn't exist
      if (!await fs.pathExists(this.apiKeysFile)) {
        await fs.writeJson(this.apiKeysFile, {
          keys: [],
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.warn('Warning: Could not initialize auth data files:', error.message);
    }
  }

  /**
   * JWT Authentication Middleware
   * Validates JWT tokens from Authorization header
   */
  jwtAuth() {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required',
            code: 'AUTH_REQUIRED'
          });
        }
        
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        // Verify JWT token
        const decoded = jwt.verify(token, this.secret);
        
        // Add user info to request
        req.user = decoded;
        req.userId = decoded.id;
        
        next();
      } catch (error) {
        if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({
            success: false,
            message: 'Invalid token',
            code: 'INVALID_TOKEN'
          });
        }
        
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Token expired',
            code: 'TOKEN_EXPIRED'
          });
        }
        
        return res.status(500).json({
          success: false,
          message: 'Authentication error',
          code: 'AUTH_ERROR'
        });
      }
    };
  }

  /**
   * API Key Authentication Middleware
   * Validates API keys from custom header
   */
  apiKeyAuth() {
    return async (req, res, next) => {
      try {
        const apiKey = req.headers[this.apiKeyHeader.toLowerCase()];
        
        if (!apiKey) {
          return res.status(401).json({
            success: false,
            message: 'API key required',
            code: 'API_KEY_REQUIRED'
          });
        }
        
        // Validate API key
        const isValid = await this.validateApiKey(apiKey);
        
        if (!isValid) {
          return res.status(401).json({
            success: false,
            message: 'Invalid API key',
            code: 'INVALID_API_KEY'
          });
        }
        
        // Get API key info
        const keyInfo = await this.getApiKeyInfo(apiKey);
        req.apiKey = keyInfo;
        
        next();
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'API key validation error',
          code: 'API_KEY_ERROR'
        });
      }
    };
  }

  /**
   * Optional Authentication Middleware
   * Allows requests with or without authentication
   */
  optionalAuth() {
    return async (req, res, next) => {
      try {
        // Try JWT auth first
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          const decoded = jwt.verify(token, this.secret);
          req.user = decoded;
          req.userId = decoded.id;
        }
        
        // Try API key auth
        const apiKey = req.headers[this.apiKeyHeader.toLowerCase()];
        if (apiKey) {
          const isValid = await this.validateApiKey(apiKey);
          if (isValid) {
            const keyInfo = await this.getApiKeyInfo(apiKey);
            req.apiKey = keyInfo;
          }
        }
        
        next();
      } catch (error) {
        // Ignore auth errors for optional auth
        next();
      }
    };
  }

  /**
   * Role-based Access Control Middleware
   * @param {Array|string} roles - Required roles
   */
  requireRole(roles) {
    return async (req, res, next) => {
      // If no user or API key, require authentication first
      if (!req.user && !req.apiKey) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required for this operation',
          code: 'AUTH_REQUIRED'
        });
      }
      
      // Check user roles
      const userRoles = req.user ? req.user.roles : (req.apiKey ? req.apiKey.roles : []);
      const requiredRoles = Array.isArray(roles) ? roles : [roles];
      
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
      
      if (!hasRequiredRole) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
      
      next();
    };
  }

  /**
   * Project Ownership Middleware
   * Ensures user has access to specific project
   */
  requireProjectAccess() {
    return async (req, res, next) => {
      try {
        const projectId = req.params.projectId || req.query.projectId;
        
        if (!projectId) {
          return res.status(400).json({
            success: false,
            message: 'Project ID required',
            code: 'PROJECT_ID_REQUIRED'
          });
        }
        
        // Admin users can access all projects
        if (req.user && req.user.roles.includes('admin')) {
          next();
          return;
        }
        
        // Check if user owns the project or has access
        const hasAccess = await this.checkProjectAccess(
          projectId, 
          req.user ? req.user.id : null,
          req.apiKey ? req.apiKey.id : null
        );
        
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this project',
            code: 'PROJECT_ACCESS_DENIED'
          });
        }
        
        next();
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Project access validation error',
          code: 'PROJECT_ACCESS_ERROR'
        });
      }
    };
  }

  /**
   * Rate Limiting Middleware
   * @param {Object} options - Rate limiting options
   */
  rateLimit(options = {}) {
    const maxRequests = options.max || 100;
    const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    const message = options.message || 'Too many requests, please try again later';
    
    // Simple in-memory store (use Redis in production)
    const requestCounts = new Map();
    
    return async (req, res, next) => {
      try {
        // Use IP + user ID as key
        const clientId = req.user ? 
          `${req.ip}-${req.user.id}` : 
          `${req.ip}-${req.apiKey ? req.apiKey.id : 'anonymous'}`;
        
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // Get or create request count for client
        let clientRequests = requestCounts.get(clientId) || [];
        
        // Filter out old requests
        clientRequests = clientRequests.filter(timestamp => timestamp > windowStart);
        
        // Check if limit exceeded
        if (clientRequests.length >= maxRequests) {
          return res.status(429).json({
            success: false,
            message,
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil((clientRequests[0] + windowMs - now) / 1000)
          });
        }
        
        // Add current request
        clientRequests.push(now);
        requestCounts.set(clientId, clientRequests);
        
        // Set rate limit headers
        res.set({
          'X-RateLimit-Limit': maxRequests,
          'X-RateLimit-Remaining': maxRequests - clientRequests.length,
          'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
        });
        
        next();
      } catch (error) {
        next(); // Continue without rate limiting on error
      }
    };
  }

  /**
   * Create JWT token for user
   * @param {Object} user - User object
   * @returns {string} - JWT token
   */
  createToken(user) {
    const payload = {
      id: user.id,
      username: user.username,
      roles: user.roles || ['user'],
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    
    return jwt.sign(payload, this.secret);
  }

  /**
   * Validate API key
   * @param {string} apiKey - API key to validate
   * @returns {Promise<boolean>} - True if valid
   */
  async validateApiKey(apiKey) {
    try {
      if (!await fs.pathExists(this.apiKeysFile)) {
        return false;
      }
      
      const data = await fs.readJson(this.apiKeysFile);
      const keyRecord = data.keys.find(key => key.key === apiKey);
      
      if (!keyRecord) {
        return false;
      }
      
      // Check if key is expired
      if (keyRecord.expiresAt) {
        const expiresAt = new Date(keyRecord.expiresAt);
        if (expiresAt < new Date()) {
          return false;
        }
      }
      
      // Check if key is disabled
      if (keyRecord.disabled) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('API key validation error:', error.message);
      return false;
    }
  }

  /**
   * Get API key information
   * @param {string} apiKey - API key
   * @returns {Promise<Object|null>} - API key info or null
   */
  async getApiKeyInfo(apiKey) {
    try {
      if (!await fs.pathExists(this.apiKeysFile)) {
        return null;
      }
      
      const data = await fs.readJson(this.apiKeysFile);
      const keyRecord = data.keys.find(key => key.key === apiKey);
      
      if (!keyRecord) {
        return null;
      }
      
      // Return info without the actual key
      const { key, ...info } = keyRecord;
      return info;
    } catch (error) {
      console.error('Error getting API key info:', error.message);
      return null;
    }
  }

  /**
   * Check project access for user/API key
   * @param {string} projectId - Project ID
   * @param {string} userId - User ID (optional)
   * @param {string} apiKeyId - API Key ID (optional)
   * @returns {Promise<boolean>} - True if access granted
   */
  async checkProjectAccess(projectId, userId = null, apiKeyId = null) {
    try {
      // Public projects are accessible to everyone
      const projectsDir = path.join(__dirname, '../../projects');
      const projectPath = path.join(projectsDir, projectId);
      
      if (await fs.pathExists(projectPath)) {
        const projectConfigPath = path.join(projectPath, 'aix.config.json');
        if (await fs.pathExists(projectConfigPath)) {
          const config = await fs.readJson(projectConfigPath);
          if (config.visibility === 'public') {
            return true;
          }
        }
      }
      
      // Owner access
      if (userId) {
        const projectOwnerPath = path.join(projectPath, 'owner');
        if (await fs.pathExists(projectOwnerPath)) {
          const owner = await fs.readFile(projectOwnerPath, 'utf8');
          if (owner.trim() === userId) {
            return true;
          }
        }
      }
      
      // Shared access
      if (userId || apiKeyId) {
        const sharedAccessPath = path.join(projectPath, 'shared-access.json');
        if (await fs.pathExists(sharedAccessPath)) {
          const shared = await fs.readJson(sharedAccessPath);
          if (userId && shared.users.includes(userId)) {
            return true;
          }
          if (apiKeyId && shared.apiKeys.includes(apiKeyId)) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Project access check error:', error.message);
      return false;
    }
  }

  /**
   * Generate API key
   * @param {Object} options - Key options
   * @returns {Promise<Object>} - Generated API key info
   */
  async generateApiKey(options = {}) {
    try {
      const key = require('crypto').randomBytes(32).toString('hex');
      const keyInfo = {
        id: require('crypto').randomBytes(16).toString('hex'),
        key,
        name: options.name || 'Generated API Key',
        description: options.description || '',
        createdAt: new Date().toISOString(),
        expiresAt: options.expiresAt,
        roles: options.roles || ['read'],
        disabled: false,
        userId: options.userId
      };
      
      // Load existing keys
      let data = { keys: [] };
      if (await fs.pathExists(this.apiKeysFile)) {
        data = await fs.readJson(this.apiKeysFile);
      }
      
      // Add new key
      data.keys.push(keyInfo);
      await fs.writeJson(this.apiKeysFile, data, { spaces: 2 });
      
      // Return key info without the actual key for security
      const { key: k, ...info } = keyInfo;
      return info;
    } catch (error) {
      throw new Error(`Failed to generate API key: ${error.message}`);
    }
  }

  /**
   * Revoke API key
   * @param {string} keyId - API key ID
   * @returns {Promise<boolean>} - True if revoked
   */
  async revokeApiKey(keyId) {
    try {
      if (!await fs.pathExists(this.apiKeysFile)) {
        return false;
      }
      
      const data = await fs.readJson(this.apiKeysFile);
      const keyIndex = data.keys.findIndex(key => key.id === keyId);
      
      if (keyIndex === -1) {
        return false;
      }
      
      // Mark as disabled instead of removing
      data.keys[keyIndex].disabled = true;
      data.keys[keyIndex].revokedAt = new Date().toISOString();
      
      await fs.writeJson(this.apiKeysFile, data, { spaces: 2 });
      return true;
    } catch (error) {
      throw new Error(`Failed to revoke API key: ${error.message}`);
    }
  }

  /**
   * Get user authentication status
   * @param {Object} req - Request object
   * @returns {Object} - Authentication status
   */
  getAuthStatus(req) {
    return {
      authenticated: !!(req.user || req.apiKey),
      userType: req.user ? 'user' : (req.apiKey ? 'api' : 'anonymous'),
      userId: req.user ? req.user.id : null,
      apiKeyId: req.apiKey ? req.apiKey.id : null,
      roles: req.user ? req.user.roles : (req.apiKey ? req.apiKey.roles : []),
      permissions: this.getUserPermissions(req.user, req.apiKey)
    };
  }

  /**
   * Get user permissions based on roles
   * @param {Object} user - User object
   * @param {Object} apiKey - API key object
   * @returns {Array} - Array of permissions
   */
  getUserPermissions(user, apiKey) {
    const roles = user ? user.roles : (apiKey ? apiKey.roles : []);
    const permissions = new Set();
    
    roles.forEach(role => {
      switch (role) {
        case 'admin':
          permissions.add('read');
          permissions.add('write');
          permissions.add('delete');
          permissions.add('admin');
          permissions.add('manage-users');
          permissions.add('manage-projects');
          break;
        case 'developer':
          permissions.add('read');
          permissions.add('write');
          permissions.add('delete');
          permissions.add('manage-projects');
          break;
        case 'user':
          permissions.add('read');
          permissions.add('write');
          break;
        case 'read':
          permissions.add('read');
          break;
      }
    });
    
    return Array.from(permissions);
  }
}

// Create singleton instance
const authMiddleware = new AuthMiddleware();

// Export middleware functions
module.exports = {
  jwtAuth: () => authMiddleware.jwtAuth(),
  apiKeyAuth: () => authMiddleware.apiKeyAuth(),
  optionalAuth: () => authMiddleware.optionalAuth(),
  requireRole: (roles) => authMiddleware.requireRole(roles),
  requireProjectAccess: () => authMiddleware.requireProjectAccess(),
  rateLimit: (options) => authMiddleware.rateLimit(options),
  createToken: (user) => authMiddleware.createToken(user),
  generateApiKey: (options) => authMiddleware.generateApiKey(options),
  revokeApiKey: (keyId) => authMiddleware.revokeApiKey(keyId),
  getAuthStatus: (req) => authMiddleware.getAuthStatus(req)
};