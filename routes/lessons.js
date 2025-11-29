const express = require('express');
const { pgPool } = require('../config/database');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Get all lessons
router.get('/', auth, async (req, res) => {
  try {
    const query = `
      SELECT l.*, u.name as instructor_name
      FROM lessons l
      LEFT JOIN users u ON l.instructor_id = u.id
      WHERE l.is_published = true
      ORDER BY l.created_at DESC
    `;
    
    const result = await pgPool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Get lessons error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
