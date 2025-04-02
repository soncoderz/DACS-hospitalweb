const { Log } = require('../models/logger');
const { checkPermission } = require('../middleware/auth');

/**
 * Get logs with pagination and filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getLogs = async (req, res) => {
  try {
    // Check if user has permission to view logs
    const hasPermission = checkPermission(req.user, 'view_logs');
    if (!hasPermission) {
      return res.status(403).json({ message: 'You do not have permission to view logs' });
    }

    // Pagination and filtering parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    // Apply level filter if provided
    if (req.query.level && ['info', 'warning', 'error', 'debug'].includes(req.query.level)) {
      filter.level = req.query.level;
    }

    // Apply user filter if provided
    if (req.query.user) {
      filter.user = req.query.user;
    }

    // Apply action filter if provided
    if (req.query.action) {
      filter.action = { $regex: req.query.action, $options: 'i' };
    }

    // Apply resource filter if provided
    if (req.query.resource) {
      filter.resource = { $regex: req.query.resource, $options: 'i' };
    }

    // Apply date range filter if provided
    if (req.query.startDate || req.query.endDate) {
      filter.timestamp = {};
      
      if (req.query.startDate) {
        filter.timestamp.$gte = new Date(req.query.startDate);
      }
      
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999); // Set to end of day
        filter.timestamp.$lte = endDate;
      }
    }

    // Apply search filter if provided
    if (req.query.search) {
      const search = { $regex: req.query.search, $options: 'i' };
      filter.$or = [
        { description: search },
        { resource: search },
        { action: search }
      ];
    }

    // Get total count of matching logs
    const total = await Log.countDocuments(filter);

    // Get logs with pagination
    const logs = await Log.find(filter)
      .populate('user', 'name email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error getting logs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get a single log by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getLogById = async (req, res) => {
  try {
    // Check if user has permission to view logs
    const hasPermission = checkPermission(req.user, 'view_logs');
    if (!hasPermission) {
      return res.status(403).json({ message: 'You do not have permission to view logs' });
    }

    const log = await Log.findById(req.params.id)
      .populate('user', 'name email role');

    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }

    res.json(log);
  } catch (error) {
    console.error('Error getting log:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Delete a log by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteLog = async (req, res) => {
  try {
    // Check if user has permission to manage logs
    const hasPermission = checkPermission(req.user, 'manage_settings');
    if (!hasPermission) {
      return res.status(403).json({ message: 'You do not have permission to delete logs' });
    }

    const log = await Log.findByIdAndDelete(req.params.id);

    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }

    res.json({ message: 'Log deleted successfully' });
  } catch (error) {
    console.error('Error deleting log:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Delete all logs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.clearAllLogs = async (req, res) => {
  try {
    // Check if user has permission to manage logs
    const hasPermission = checkPermission(req.user, 'manage_settings');
    if (!hasPermission) {
      return res.status(403).json({ message: 'You do not have permission to clear logs' });
    }

    // CAUTION: This will delete all logs
    await Log.deleteMany({});

    res.json({ message: 'All logs cleared successfully' });
  } catch (error) {
    console.error('Error clearing logs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get log statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getLogStats = async (req, res) => {
  try {
    // Check if user has permission to view logs
    const hasPermission = checkPermission(req.user, 'view_logs');
    if (!hasPermission) {
      return res.status(403).json({ message: 'You do not have permission to view log statistics' });
    }

    // Get count by level
    const levelStats = await Log.aggregate([
      { $group: { _id: '$level', count: { $sum: 1 } } }
    ]);

    // Format level stats
    const formattedLevelStats = {
      info: 0,
      warning: 0,
      error: 0,
      debug: 0
    };

    levelStats.forEach(stat => {
      formattedLevelStats[stat._id] = stat.count;
    });

    // Get count by action (top 5)
    const actionStats = await Log.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Get count by resource (top 5)
    const resourceStats = await Log.aggregate([
      { $group: { _id: '$resource', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Get logs count by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyStats = await Log.aggregate([
      { 
        $match: { 
          timestamp: { $gte: sevenDaysAgo } 
        } 
      },
      {
        $group: {
          _id: { 
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      levelStats: formattedLevelStats,
      actionStats,
      resourceStats,
      dailyStats
    });
  } catch (error) {
    console.error('Error getting log stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 