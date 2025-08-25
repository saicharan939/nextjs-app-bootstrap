const express = require('express');
const { body, query, validationResult } = require('express-validator');
const News = require('../models/News');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();

// Validation middleware
const validateNews = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('summary')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Summary must be between 10 and 500 characters'),
  body('content')
    .trim()
    .isLength({ min: 50 })
    .withMessage('Content must be at least 50 characters long'),
  body('category')
    .isIn(['Politics', 'Technology', 'Sports', 'Entertainment', 'Business', 'Health'])
    .withMessage('Invalid category'),
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  body('status')
    .optional()
    .isIn(['published', 'draft'])
    .withMessage('Status must be either published or draft'),
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
    .isIn(['Politics', 'Technology', 'Sports', 'Entertainment', 'Business', 'Health'])
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

// @route   GET /api/news
// @desc    Get all news articles (public endpoint)
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
    
    // Only show published articles for public access
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
    const [articles, total] = await Promise.all([
      News.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name email')
        .lean(),
      News.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      data: {
        articles,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalArticles: total,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch news articles',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/news/featured
// @desc    Get featured news articles
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const articles = await News.getFeatured()
      .limit(parseInt(limit))
      .populate('createdBy', 'name email')
      .lean();

    res.json({
      success: true,
      data: { articles }
    });

  } catch (error) {
    console.error('Get featured news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured articles',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/news/trending
// @desc    Get trending news articles
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const articles = await News.find({ status: 'published' })
      .sort({ views: -1, shares: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .populate('createdBy', 'name email')
      .lean();

    res.json({
      success: true,
      data: { articles }
    });

  } catch (error) {
    console.error('Get trending news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending articles',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/news/search
// @desc    Search news articles
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

    const articles = await News.searchNews(q)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email')
      .lean();

    res.json({
      success: true,
      data: { 
        articles,
        query: q,
        total: articles.length
      }
    });

  } catch (error) {
    console.error('Search news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search articles',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/news/:id
// @desc    Get single news article
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { increment_view = 'true' } = req.query;

    const article = await News.findById(id)
      .populate('createdBy', 'name email')
      .lean();

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    // Check if user can access draft articles
    if (article.status === 'draft' && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Increment view count if requested
    if (increment_view === 'true' && article.status === 'published') {
      await News.findByIdAndUpdate(id, { $inc: { views: 1 } });
      article.views += 1;
    }

    // Get related articles
    const relatedArticles = await News.find({
      _id: { $ne: id },
      category: article.category,
      status: 'published'
    })
      .limit(5)
      .sort({ createdAt: -1 })
      .select('title summary imageUrl createdAt views')
      .lean();

    res.json({
      success: true,
      data: {
        article,
        relatedArticles
      }
    });

  } catch (error) {
    console.error('Get single news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch article',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/news
// @desc    Create new news article
// @access  Private (Admin only)
router.post('/', [authMiddleware, adminMiddleware, ...validateNews], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const articleData = {
      ...req.body,
      createdBy: req.user.userId
    };

    const article = new News(articleData);
    await article.save();

    // Populate created by field
    await article.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      data: { article }
    });

  } catch (error) {
    console.error('Create news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create article',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/news/:id
// @desc    Update news article
// @access  Private (Admin only)
router.put('/:id', [authMiddleware, adminMiddleware, ...validateNews], async (req, res) => {
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

    const article = await News.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.json({
      success: true,
      message: 'Article updated successfully',
      data: { article }
    });

  } catch (error) {
    console.error('Update news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update article',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/news/:id
// @desc    Delete news article
// @access  Private (Admin only)
router.delete('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { id } = req.params;

    const article = await News.findByIdAndDelete(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.json({
      success: true,
      message: 'Article deleted successfully',
      data: { deletedId: id }
    });

  } catch (error) {
    console.error('Delete news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete article',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/news/:id/share
// @desc    Increment share count
// @access  Public
router.post('/:id/share', async (req, res) => {
  try {
    const { id } = req.params;

    const article = await News.findById(id);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    if (article.status !== 'published') {
      return res.status(403).json({
        success: false,
        message: 'Cannot share unpublished article'
      });
    }

    await article.incrementShares();

    res.json({
      success: true,
      message: 'Share count updated',
      data: { shares: article.shares }
    });

  } catch (error) {
    console.error('Share news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update share count',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/news/category/:category
// @desc    Get news by category
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
    const validCategories = ['Politics', 'Technology', 'Sports', 'Entertainment', 'Business', 'Health'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [articles, total] = await Promise.all([
      News.getByCategory(category)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name email')
        .lean(),
      News.countDocuments({ category, status: 'published' })
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        articles,
        category,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalArticles: total,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get news by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch articles by category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
