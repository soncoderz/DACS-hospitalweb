const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ['info', 'warning', 'error', 'debug'],
    required: true,
    default: 'info'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  action: {
    type: String,
    required: true
  },
  resource: {
    type: String,
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  description: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  requestMethod: {
    type: String
  },
  requestUrl: {
    type: String
  },
  requestBody: {
    type: mongoose.Schema.Types.Mixed
  },
  responseStatus: {
    type: Number
  },
  errorStack: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes for faster querying
logSchema.index({ level: 1 });
logSchema.index({ user: 1 });
logSchema.index({ action: 1 });
logSchema.index({ resource: 1 });
logSchema.index({ timestamp: -1 });
logSchema.index({ 'metadata.category': 1 });

const Log = mongoose.model('Log', logSchema);

// Helper class to standardize logging
class Logger {
  constructor() {
    this.Log = Log;
  }

  /**
   * Log an info message
   * @param {Object} logData - Log data
   * @returns {Promise} - Created log entry
   */
  async info(logData) {
    return this.createLog({ ...logData, level: 'info' });
  }

  /**
   * Log a warning message
   * @param {Object} logData - Log data
   * @returns {Promise} - Created log entry
   */
  async warning(logData) {
    return this.createLog({ ...logData, level: 'warning' });
  }

  /**
   * Log an error message
   * @param {Object} logData - Log data
   * @returns {Promise} - Created log entry
   */
  async error(logData) {
    return this.createLog({ ...logData, level: 'error' });
  }

  /**
   * Log a debug message
   * @param {Object} logData - Log data
   * @returns {Promise} - Created log entry
   */
  async debug(logData) {
    return this.createLog({ ...logData, level: 'debug' });
  }

  /**
   * Create a log entry
   * @param {Object} logData - Log data
   * @returns {Promise} - Created log entry
   */
  async createLog(logData) {
    try {
      const log = new this.Log(logData);
      await log.save();
      return log;
    } catch (error) {
      console.error('Error creating log:', error);
      // Still attempt to log something, even if there's an error
      try {
        const errorLog = new this.Log({
          level: 'error',
          action: 'log_error',
          resource: 'logger',
          description: `Error creating log: ${error.message}`,
          errorStack: error.stack,
          metadata: { originalLog: logData }
        });
        return await errorLog.save();
      } catch (secondaryError) {
        console.error('Failed to create error log:', secondaryError);
        return null;
      }
    }
  }

  /**
   * Create a middleware to log HTTP requests
   * @returns {Function} Express middleware function
   */
  createRequestLogger() {
    return async (req, res, next) => {
      // Store original end method
      const originalEnd = res.end;
      
      // Create response body holder
      let responseBody = '';
      
      // Override end method to capture response
      res.end = function (chunk) {
        if (chunk) {
          responseBody += chunk.toString('utf8');
        }
        
        // Get response status
        const responseStatus = res.statusCode;
        
        // Create log entry
        const logData = {
          level: responseStatus >= 400 ? 'error' : 'info',
          user: req.user ? req.user._id : undefined,
          action: `${req.method}_request`,
          resource: req.originalUrl.split('?')[0],
          description: `${req.method} ${req.originalUrl}`,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          requestMethod: req.method,
          requestUrl: req.originalUrl,
          requestBody: req.body,
          responseStatus,
          metadata: {
            params: req.params,
            query: req.query
          }
        };
        
        // If error occurred, add error info
        if (responseStatus >= 400 && res.locals.error) {
          logData.errorStack = res.locals.error.stack;
          logData.description = `Error: ${res.locals.error.message}`;
        }
        
        // Log asynchronously - don't wait for completion
        new Logger().createLog(logData).catch(err => {
          console.error('Failed to log request:', err);
        });
        
        // Call original end method
        originalEnd.apply(res, arguments);
      };
      
      next();
    };
  }

  /**
   * Create a middleware to handle and log errors
   * @returns {Function} Express error middleware function
   */
  createErrorLogger() {
    return (err, req, res, next) => {
      // Store error for request logger
      res.locals.error = err;
      
      // Log error
      const logData = {
        level: 'error',
        user: req.user ? req.user._id : undefined,
        action: 'server_error',
        resource: req.originalUrl.split('?')[0],
        description: err.message || 'Internal Server Error',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        requestMethod: req.method,
        requestUrl: req.originalUrl,
        requestBody: req.body,
        responseStatus: err.statusCode || 500,
        errorStack: err.stack,
        metadata: {
          params: req.params,
          query: req.query
        }
      };
      
      // Log asynchronously - don't wait for completion
      new Logger().createLog(logData).catch(logErr => {
        console.error('Failed to log error:', logErr);
      });
      
      next(err);
    };
  }
}

module.exports = {
  Log,
  Logger
}; 