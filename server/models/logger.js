const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDirectory = path.join(__dirname, '../logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true });
    }
    
    this.requestLogFile = path.join(this.logDirectory, 'requests.log');
    this.errorLogFile = path.join(this.logDirectory, 'errors.log');
  }
  
  log(type, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type}] ${message}\n`;
    
    // Determine which file to write to
    const logFile = type === 'ERROR' ? this.errorLogFile : this.requestLogFile;
    
    // Append to log file
    fs.appendFileSync(logFile, logEntry);
    
    // Also log to console
    console.log(logEntry);
  }
  
  createRequestLogger() {
    return (req, res, next) => {
      const startTime = new Date().getTime();
      
      // Log when the request is finished
      res.on('finish', () => {
        const duration = new Date().getTime() - startTime;
        this.log('INFO', `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
      });
      
      next();
    };
  }
  
  createErrorLogger() {
    return (err, req, res, next) => {
      this.log('ERROR', `${req.method} ${req.originalUrl} ${err.stack}`);
      next(err);
    };
  }
}

module.exports = { Logger }; 