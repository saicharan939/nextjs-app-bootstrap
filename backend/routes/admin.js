const express = require('express');
const { query, validationResult } = require('express-validator');
const News = require('../models/News');
const Video = require('../models/Video');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();

// Apply auth middleware to all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

// @route   GET /api/admin/dashboard
// @desc    Get dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get basic counts
    const [
      totalNews,
      totalVideos,
      totalUsers,
      publishedNews,
      publishedVideos,
      draftNews,
      draftVideos,
      activeUsers
    ] = await Promise.all([
      News.countDocuments(),
      Video.countDocuments(),
      User.countDocuments({ role: 'user' }),
      News.countDocuments({ status: 'published' }),
      Video.countDocuments({ status: 'published' }),
      News.countDocuments({ status: 'draft' }),
      Video.countDocuments({ status: 'draft' }),
      User.getActiveUsers(days).countDocuments()
    ]);

    // Get total views and shares
    const [newsStats, videoStats] = await Promise.all([
      News.aggregate([
        { $match: { status: 'published' } },
        {
          $group: {
            _id: null,
            totalViews: { $sum: '$views' },
            totalShares: { $sum: '$shares' }
          }
        }
      ]),
      Video.aggregate([
        { $match: { status: 'published' } },
        {
          $group: {
            _id: null,
            totalViews: { $sum: '$views' },
            totalShares: { $sum: '$shares' },
            totalLikes: { $sum: '$likes' }
          }
        }
      ])
    ]);

    // Get recent content
    const [recentNews, recentVideos] = await Promise.all([
      News.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title category status createdAt views shares')
        .lean(),
      Video.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title category status createdAt views shares likes duration')
        .lean()
    ]);

    // Get content by category
    const [newsByCategory, videosByCategory] = await Promise.all([
      News.aggregate([
        { $match: { status: 'published' } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalViews: { $sum: '$views' }
          }
        },
        { $sort: { count: -1 } }
      ]),
      Video.aggregate([
        { $match: { status: 'published' } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalViews: { $sum: '$views' }
          }
        },
        { $sort: { count: -1 } }
      ])
    ]);

    // Get trending content
    const [trendingNews, trendingVideos] = await Promise.all([
      News.find({ status: 'published' })
        .sort({ views: -1, shares: -1 })
        .limit(5)
        .select('title views shares createdAt')
        .lean(),
      Video.find({ status: 'published' })
        .sort({ views: -1, likes: -1 })
        .limit(5)
        .select('title views likes shares createdAt duration')
        .lean()
    ]);

    // Calculate growth metrics (mock data for demo)
    const growthMetrics = {
      newsGrowth: Math.floor(Math.random() * 20) + 5, // 5-25%
      videoGrowth: Math.floor(Math.random() * 15) + 8, // 8-23%
      userGrowth: Math.floor(Math.random() * 30) + 10, // 10-40%
      viewsGrowth: Math.floor(Math.random() * 25) + 15 // 15-40%
    };

    res.json({
      success: true,
      data: {
        overview: {
          totalNews,
          totalVideos,
          totalUsers,
          activeUsers,
          publishedNews,
          publishedVideos,
          draftNews,
          draftVideos,
          totalViews: (newsStats[0]?.totalViews || 0) + (videoStats[0]?.totalViews || 0),
          totalShares: (newsStats[0]?.totalShares || 0) + (videoStats[0]?.totalShares || 0),
          totalLikes: videoStats[0]?.totalLikes || 0
        },
        growth: growthMetrics,
        recentContent: {
          news: recentNews,
          videos: recentVideos
        },
        categoryStats: {
          news: newsByCategory,
          videos: videosByCategory
        },
        trending: {
          news: trendingNews,
          videos: trendingVideos
        },
        period: days
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get detailed analytics
// @access  Private (Admin only)
router.get('/analytics', [
  query('period').optional().isIn(['7', '30', '90', '365']).withMessage('Invalid period'),
  query('type').optional().isIn(['news', 'videos', 'users']).withMessage('Invalid type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { period = '30', type = 'all' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let analytics = {};

    if (type === 'news' || type === 'all') {
      // News analytics
      const newsAnalytics = await News.aggregate([
        {
          $facet: {
            totalStats: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  published: {
                    $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
                  },
                  totalViews: { $sum: '$views' },
                  totalShares: { $sum: '$shares' }
                }
              }
            ],
            categoryBreakdown: [
              { $match: { status: 'published' } },
              {
                $group: {
                  _id: '$category',
                  count: { $sum: 1 },
                  views: { $sum: '$views' },
                  shares: { $sum: '$shares' }
                }
              },
              { $sort: { count: -1 } }
            ],
            dailyStats: [
              { $match: { createdAt: { $gte: startDate } } },
              {
                $group: {
                  _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                  },
                  count: { $sum: 1 },
                  published: {
                    $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
                  }
                }
              },
              { $sort: { _id: 1 } }
            ]
          }
        }
      ]);

      analytics.news = newsAnalytics[0];
    }

    if (type === 'videos' || type === 'all') {
      // Video analytics
      const videoAnalytics = await Video.aggregate([
        {
          $facet: {
            totalStats: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  published: {
                    $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
                  },
                  totalViews: { $sum: '$views' },
                  totalShares: { $sum: '$shares' },
                  totalLikes: { $sum: '$likes' }
                }
              }
            ],
            categoryBreakdown: [
              { $match: { status: 'published' } },
              {
                $group: {
                  _id: '$category',
                  count: { $sum: 1 },
                  views: { $sum: '$views' },
                  shares: { $sum: '$shares' },
                  likes: { $sum: '$likes' }
                }
              },
              { $sort: { count: -1 } }
            ],
            dailyStats: [
              { $match: { createdAt: { $gte: startDate } } },
              {
                $group: {
                  _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                  },
                  count: { $sum: 1 },
                  published: {
                    $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
                  }
                }
              },
              { $sort: { _id: 1 } }
            ]
          }
        }
      ]);

      analytics.videos = videoAnalytics[0];
    }

    if (type === 'users' || type === 'all') {
      // User analytics
      const userAnalytics = await User.aggregate([
        {
          $facet: {
            totalStats: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  active: {
                    $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                  },
                  verified: {
                    $sum: { $cond: ['$emailVerified', 1, 0] }
                  }
                }
              }
            ],
            roleBreakdown: [
              {
                $group: {
                  _id: '$role',
                  count: { $sum: 1 }
                }
              }
            ],
            dailyRegistrations: [
              { $match: { createdAt: { $gte: startDate } } },
              {
                $group: {
                  _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                  },
                  count: { $sum: 1 }
                }
              },
              { $sort: { _id: 1 } }
            ]
          }
        }
      ]);

      analytics.users = userAnalytics[0];
    }

    res.json({
      success: true,
      data: {
        analytics,
        period: days,
        type,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Private (Admin only)
router.get('/users', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['user', 'admin', 'super_admin']).withMessage('Invalid role'),
  query('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      role,
      status,
      search,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build query
    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-password')
        .lean(),
      User.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers: total,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Update user status
// @access  Private (Admin only)
router.put('/users/:id/status', [
  query('status').isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/admin/content-stats
// @desc    Get content statistics
// @access  Private (Admin only)
router.get('/content-stats', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get top performing content
    const [topNews, topVideos] = await Promise.all([
      News.find({ status: 'published' })
        .sort({ views: -1, shares: -1 })
        .limit(10)
        .select('title views shares createdAt category')
        .lean(),
      Video.find({ status: 'published' })
        .sort({ views: -1, likes: -1 })
        .limit(10)
        .select('title views likes shares createdAt category duration')
        .lean()
    ]);

    // Get engagement metrics
    const engagementStats = await Promise.all([
      News.aggregate([
        { $match: { status: 'published', createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            avgViews: { $avg: '$views' },
            avgShares: { $avg: '$shares' },
            totalEngagement: { $sum: { $add: ['$views', '$shares'] } }
          }
        }
      ]),
      Video.aggregate([
        { $match: { status: 'published', createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            avgViews: { $avg: '$views' },
            avgLikes: { $avg: '$likes' },
            avgShares: { $avg: '$shares' },
            totalEngagement: { $sum: { $add: ['$views', '$likes', '$shares'] } }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        topPerforming: {
          news: topNews,
          videos: topVideos
        },
        engagement: {
          news: engagementStats[0][0] || {},
          videos: engagementStats[1][0] || {}
        },
        period: days
      }
    });

  } catch (error) {
    console.error('Content stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
