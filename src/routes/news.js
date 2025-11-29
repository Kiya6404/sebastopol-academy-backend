const express = require('express');
const router = express.Router();

// Get cybersecurity news
router.get('/cybersecurity', async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    // Mock news data - will be replaced with real NewsAPI
    const news = [
      {
        source: { id: 'sebastopol', name: 'Sebastopol Academy' },
        title: 'Cybersecurity Training Reduces Phishing Success by 70%',
        description: 'Recent studies show organizations with regular security training see significant improvement in threat detection.',
        url: 'https://sebastopol.academy',
        publishedAt: new Date().toISOString(),
        category: 'cybersecurity'
      },
      {
        source: { id: 'sebastopol', name: 'Sebastopol Academy' },
        title: 'Ethiopian Banks Enhance Digital Security Infrastructure',
        description: 'Financial institutions across Ethiopia are implementing advanced security protocols.',
        url: 'https://sebastopol.academy',
        publishedAt: new Date(Date.now() - 86400000).toISOString(),
        category: 'cybersecurity'
      }
    ];

    res.json({
      success: true,
      source: 'mock',
      count: news.length,
      news: news.slice(0, limit)
    });
  } catch (error) {
    console.error('News error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching news'
    });
  }
});

module.exports = router;
