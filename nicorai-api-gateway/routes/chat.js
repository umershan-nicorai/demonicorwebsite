const express = require('express');
const router = express.Router();

// POST /chat - Placeholder route
router.post('/', async (req, res) => {
    const redisClient = req.redisClient;
    console.log('📨 Received request:', req.body);

    // Test Redis: Set and Get a sample key (for Day 1 testing)
    try {
        await redisClient.set('test:key', 'NicorAi API Gateway Connected');
        const value = await redisClient.get('test:key');
        console.log('🔑 Redis test value:', value);
    } catch (err) {
        console.error('❌ Redis error:', err);
    }

    res.json({
        message: 'Chat endpoint is working! (Mock response)'
    });
});

module.exports = router;
