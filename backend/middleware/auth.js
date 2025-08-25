const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Handle guest users
    if (decoded.isGuest) {
      req.user = {
        userId: decoded.userId,
        role: 'guest',
        isGuest: true
      };
      return next();
    }

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid. User not found.'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active. Please contact support.'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked.'
      });
    }

    // Add user to request object
    req.user = {
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      preferences: user.preferences
    };

    // Update last active time (optional, can be resource intensive)
    // Uncomment if you want to track user activity
    // user.analytics.lastActiveAt = new Date();
    // await user.save();

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error in authentication.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin middleware (requires authMiddleware to be called first)
const adminMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Check if user is admin or super_admin
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authorization.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Super admin middleware (requires authMiddleware to be called first)
const superAdminMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Check if user is super_admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    next();
  } catch (error) {
    console.error('Super admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authorization.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      // No token provided, continue without user
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Handle guest users
    if (decoded.isGuest) {
      req.user = {
        userId: decoded.userId,
        role: 'guest',
        isGuest: true
      };
      return next();
    }

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    if (user && user.status === 'active' && !user.isLocked) {
      req.user = {
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        preferences: user.preferences
      };
    }

    next();
  } catch (error) {
    // If token is invalid, continue without user (don't fail the request)
    console.warn('Optional auth middleware warning:', error.message);
    next();
  }
};

// Rate limiting middleware for sensitive operations
const rateLimitMiddleware = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Clean old entries
    for (const [ip, data] of attempts.entries()) {
      if (now - data.firstAttempt > windowMs) {
        attempts.delete(ip);
      }
    }

    // Check current attempts
    const userAttempts = attempts.get(key);
    if (!userAttempts) {
      attempts.set(key, { count: 1, firstAttempt: now });
      return next();
    }

    if (userAttempts.count >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: 'Too many attempts. Please try again later.',
        retryAfter: Math.ceil((windowMs - (now - userAttempts.firstAttempt)) / 1000)
      });
    }

    userAttempts.count++;
    next();
  };
};

// Middleware to check if user owns the resource
const ownershipMiddleware = (resourceModel, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      // Admins can access any resource
      if (['admin', 'super_admin'].includes(req.user.role)) {
        return next();
      }

      const resourceId = req.params[resourceIdParam];
      const resource = await resourceModel.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found.'
        });
      }

      // Check if user owns the resource
      if (resource.createdBy && resource.createdBy.toString() !== req.user.userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own resources.'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error in ownership check.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

// Middleware to validate API key (for external integrations)
const apiKeyMiddleware = (req, res, next) => {
  try {
    const apiKey = req.header('X-API-Key');
    const validApiKey = process.env.API_KEY;

    if (!validApiKey) {
      return res.status(500).json({
        success: false,
        message: 'API key validation not configured.'
      });
    }

    if (!apiKey || apiKey !== validApiKey) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or missing API key.'
      });
    }

    next();
  } catch (error) {
    console.error('API key middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in API key validation.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  superAdminMiddleware,
  optionalAuthMiddleware,
  rateLimitMiddleware,
  ownershipMiddleware,
  apiKeyMiddleware
};
