const express = require('express');
const { pgPool } = require('../config/database');
const router = express.Router();

// Get all lessons
router.get('/', async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT l.*, u.name as instructor_name
      FROM lessons l
      LEFT JOIN users u ON l.instructor_id = u.id
      WHERE l.is_published = true
      ORDER BY l.created_at DESC
    `);

    res.json({
      success: true,
      count: result.rows.length,
      lessons: result.rows
    });
  } catch (error) {
    console.error('Get lessons error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching lessons'
    });
  }
});

// Get single lesson
router.get('/:id', async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT l.*, u.name as instructor_name
      FROM lessons l
      LEFT JOIN users u ON l.instructor_id = u.id
      WHERE l.id = $1 AND l.is_published = true
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    res.json({
      success: true,
      lesson: result.rows[0]
    });
  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching lesson'
    });
  }
});

// Create new lesson (instructor only)
router.post('/', async (req, res) => {
  try {
    // Get user from token (you'll need to implement proper auth middleware)
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // For now, we'll use a simple approach - in production, use proper JWT verification
    // This is a simplified version - you should implement proper auth middleware
    const { title, description, content, category, difficulty_level, estimated_duration } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // For demo purposes, we'll use instructor ID 1
    // In production, get the actual instructor ID from the JWT token
    const instructorId = 1;

    const result = await pgPool.query(
      `INSERT INTO lessons (
        title, description, content, instructor_id, 
        category, difficulty_level, estimated_duration, is_published
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        title,
        description || '',
        content,
        instructorId,
        category || 'Security',
        difficulty_level || 'Beginner',
        estimated_duration || 30,
        true
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      lesson: result.rows[0]
    });

  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating lesson'
    });
  }
});

// Mark lesson as completed
router.post('/:id/complete', async (req, res) => {
  try {
    // This would require proper authentication
    const { score } = req.body;
    
    // For demo, we'll just return success
    res.json({
      success: true,
      message: 'Lesson marked as completed'
    });
  } catch (error) {
    console.error('Complete lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while completing lesson'
    });
  }
});

module.exports = router;
