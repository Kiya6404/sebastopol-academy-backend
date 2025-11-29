const express = require('express');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Get cybersecurity news
router.get('/cybersecurity', auth, async (req, res) => {
  try {
    // Mock news data for now
    const news = [
      {
        title: "Cybersecurity Training Essential",
        description: "Learn how proper training can protect against threats.",
        source: "Sebastopol Academy",
        publishedAt: new Date().toISOString()
      }
    ];

    res.json({ news });
  } catch (error) {
    console.error('News error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
