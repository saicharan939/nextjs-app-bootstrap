const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Video = require('../models/Video');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();

// Validation middleware
const validateVideo = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('youtubeUrl')
    .isURL()
    .matches(/^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/)
    .withMessage('Please provide a valid YouTube URL'),
  body('category')
    .isIn(['News', 'Analysis', 'Interview', 'Documentary', 'Live', 'Entertainment'])
    .withMessage('Invalid category'),
  body('thumbnailUrl')
    .optional()
    .isURL()
    .withMessage('Thumbnail URL must be a valid URL'),
  body('status')
    .optional()
    .isIn(['published', 'draft'])
    .withMessage('Status must be either published or draft'),
  body('duration')
    .optional()
    .matches(/^(\d{1,2}:)?\d{1,2}:\d{2}$/)
    .withMessage('Duration must be in format MM:SS or HH:MM:SS'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean')
];

const validateQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('category')
    .optional()
    .isIn(['News', 'Analysis', 'Interview', 'Documentary', 'Live', 'Entertainment'])
    .withMessage('Invalid category'),
  query('status')
    .optional()
    .isIn(['published', 'draft'])
    .withMessage('Invalid status'),
  query('search')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Search term must be at least 2 characters')
];

// Helper function to extract YouTube ID from URL
const extractYouTubeId = (url) => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// @route   GET /api/videos
// @desc    Get all videos
// @access  Public
router.get('/', validateQuery, async (req, res) => {
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
      limit = 10,
      category,
      status = 'published',
      search,
      featured,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    // Only show published videos for public access
    if (!req.user || req.user.role !== 'admin') {
      query.status = 'published';
    } else if (status) {
      query.status = status;
    }

    if (category) query.category = category;
    if (featured !== undefined) query.featured = featured === 'true';

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    // Execute query
    const [videos, total] = await Promise.all([
      Video.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name email')
        .lean(),
      Video.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      data: {
        videos,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalVideos: total,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch videos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/videos/featured
// @desc    Get featured videos
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const videos = await Video.getFeatured()
      .limit(parseInt(limit))
      .populate('createdBy', 'name email')
      .lean();

    res.json({
      success: true,
      data: { videos }
    });

  } catch (error) {
    console.error('Get featured videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured videos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/videos/trending
// @desc    Get trending videos
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const videos = await Video.getTrending(parseInt(limit))
      .populate('createdBy', 'name email')
      .lean();

    res.json({
      success: true,
      data: { videos }
    });

  } catch (error) {
    console.error('Get trending videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending videos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/videos/search
// @desc    Search videos
// @access  Public
router.get('/search', [
  query('q').isLength({ min: 2 }).withMessage('Search query must be at least 2 characters')
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

    const { q, limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const videos = await Video.searchVideos(q)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email')
      .lean();

    res.json({
      success: true,
      data: { 
        videos,
        query: q,
        total: videos.length
      }
    });

  } catch (error) {
    console.error('Search videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search videos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/videos/:id
// @desc    Get single video
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { increment_view = 'true' } = req.query;

    const video = await Video.findById(id)
      .populate('createdBy', 'name email')
      .lean();

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check if user can access draft videos
    if (video.status === 'draft' && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Increment view count if requested
    if (increment_view === 'true' && video.status === 'published') {
      await Video.findByIdAndUpdate(id, { $inc: { views: 1 } });
      video.views += 1;
    }

    // Get related videos
    const relatedVideos = await Video.find({
      _id: { $ne: id },
      category: video.category,
      status: 'published'
    })
      .limit(5)
      .sort({ createdAt: -1 })
      .select('title thumbnailUrl youtubeId duration createdAt views')
      .lean();

    res.json({
      success: true,
      data: {
        video,
        relatedVideos
      }
    });

  } catch (error) {
    console.error('Get single video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch video',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/videos/fetch-youtube-data
// @desc    Fetch video data from YouTube URL
// @access  Private (Admin only)
router.post('/fetch-youtube-data', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { youtubeUrl } = req.body;

    if (!youtubeUrl) {
      return res.status(400).json({
        success: false,
        message: 'YouTube URL is required'
      });
    }

    const youtubeId = extractYouTubeId(youtubeUrl);
    if (!youtubeId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid YouTube URL'
      });
    }

    // Mock YouTube API response (replace with real YouTube Data API)
    const mockVideoData = {
      title: `Sample Video Title - ${youtubeId}`,
      description: 'This is a sample description fetched from YouTube API. In real implementation, this would contain the actual video description from YouTube.',
      thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
      duration: '12:34',
      youtubeData: {
        channelTitle: 'Sample Channel',
        publishedAt: new Date().toISOString(),
        viewCount: Math.floor(Math.random() * 100000),
        likeCount: Math.floor(Math.random() * 5000),
        commentCount: Math.floor(Math.random() * 1000)
      }
    };

    // In production, integrate with YouTube Data API:
    // const youtube = google.youtube({ version: 'v3', auth: API_KEY });
    // const response = await youtube.videos.list({
    //   part: 'snippet,statistics,contentDetails',
    //   id: youtubeId
    // });

    res.json({
      success: true,
      message: 'Video data fetched successfully',
      data: {
        youtubeId,
        youtubeUrl,
        ...mockVideoData
      }
    });

  } catch (error) {
    console.error('Fetch YouTube data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch video data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/videos
// @desc    Create new video
// @access  Private (Admin only)
router.post('/', [authMiddleware, adminMiddleware, ...validateVideo], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Extract YouTube ID from URL
    const youtubeId = extractYouTubeId(req.body.youtubeUrl);
    if (!youtubeId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid YouTube URL'
      });
    }

    // Check if video already exists
    const existingVideo = await Video.findOne({ youtubeId });
    if (existingVideo) {
      return res.status(400).json({
        success: false,
        message: 'Video with this YouTube ID already exists'
      });
    }

    const videoData = {
      ...req.body,
      youtubeId,
      createdBy: req.user.userId
    };

    const video = new Video(videoData);
    await video.save();

    // Populate created by field
    await video.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Video created successfully',
      data: { video }
    });

  } catch (error) {
    console.error('Create video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create video',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/videos/:id
// @desc    Update video
// @access  Private (Admin only)
router.put('/:id', [authMiddleware, adminMiddleware, ...validateVideo], async (req, res) => {
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
    const updateData = req.body;

    // If YouTube URL is being updated, extract new ID
    if (updateData.youtubeUrl) {
      const youtubeId = extractYouTubeId(updateData.youtubeUrl);
      if (!youtubeId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid YouTube URL'
        });
      }
      updateData.youtubeId = youtubeId;
    }

    const video = await Video.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    res.json({
      success: true,
      message: 'Video updated successfully',
      data: { video }
    });

  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update video',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/videos/:id
// @desc    Delete video
// @access  Private (Admin only)
router.delete('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { id } = req.params;

    const video = await Video.findByIdAndDelete(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    res.json({
      success: true,
      message: 'Video deleted successfully',
      data: { deletedId: id }
    });

  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete video',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/videos/:id/share
// @desc    Increment share count
// @access  Public
router.post('/:id/share', async (req, res) => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    if (video.status !== 'published') {
      return res.status(403).json({
        success: false,
        message: 'Cannot share unpublished video'
      });
    }

    await video.incrementShares();

    res.json({
      success: true,
      message: 'Share count updated',
      data: { shares: video.shares }
    });

  } catch (error) {
    console.error('Share video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update share count',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/videos/:id/like
// @desc    Increment like count
// @access  Public
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    if (video.status !== 'published') {
      return res.status(403).json({
        success: false,
        message: 'Cannot like unpublished video'
      });
    }

    await video.incrementLikes();

    res.json({
      success: true,
      message: 'Like count updated',
      data: { likes: video.likes }
    });

  } catch (error) {
    console.error('Like video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update like count',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/videos/category/:category
// @desc    Get videos by category
// @access  Public
router.get('/category/:category', validateQuery, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate category
    const validCategories = ['News', 'Analysis', 'Interview', 'Documentary', 'Live', 'Entertainment'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [videos, total] = await Promise.all([
      Video.getByCategory(category)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name email')
        .lean(),
      Video.countDocuments({ category, status: 'published' })
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        videos,
        category,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalVideos: total,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get videos by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch videos by category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
