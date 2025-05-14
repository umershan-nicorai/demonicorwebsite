require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('redis');
 
const app = express();
const PORT = process.env.PORT || 4000;
const REDIS_URL = process.env.REDIS_URL;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
 
let redisHealthy = true; // 🔥 flag to track Redis health
 
const redisClient = createClient({
    url: REDIS_URL,
    socket: {
        reconnectStrategy: false // 🔥 do not keep retrying forever
    }
});
 
redisClient.on('error', (err) => {
    console.error('❌ Redis Client Error:', err.message);
    redisHealthy = false; // mark Redis as unhealthy
});
 
redisClient.on('connect', () => {
    console.log('✅ Redis connected!');
    redisHealthy = true; // mark Redis as healthy
});
 
(async () => {
    try {
        await redisClient.connect();
        console.log('✅ Redis connected!');
    } catch (err) {
        console.error('❌ Failed to connect to Redis:', err.message);
        redisHealthy = false;
    }
})();
 
app.use(cors());
app.use(express.json());
 
app.post('/chat', async (req, res) => {
    console.log('➡️ Incoming request body:', req.body);
 
    const { userId, sessionId, message, timestamp } = req.body;
 
    if (!message) {
        return res.status(400).json({ error: 'Missing required field: message' });
    }
 
    const cacheKey = `chat_cache:${message.trim().toLowerCase()}`;
    let cachedData;
 
    // ✅ Only check Redis if marked healthy
    if (redisHealthy) {
        try {
            cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
                console.log('✅ Cache hit! Returning cached response.');
                return res.json(JSON.parse(cachedData));
            }
            console.log('⚠️ Cache miss. Proceeding to call n8n.');
        } catch (err) {
            console.error('❌ Redis GET error (fallback to n8n):', err.message);
            redisHealthy = false; // if error, mark as unhealthy
        }
    } else {
        console.log('⚠️ Skipping Redis check: marked as unhealthy');
    }
 
    try {
        // Prepare request for n8n
        const sessionIdentifier = sessionId || `session-${userId}-${Date.now()}`;

const n8nRequestBody = {
    requestId: `${Date.now()}`,
    userId,
    sessionId: sessionIdentifier,  // ✅ use fallback here
    message,
    conversationContext: [],
    timestamp: timestamp || new Date().toISOString()
};
        console.log('➡️ Sending to n8n:', n8nRequestBody);
 
        // Call n8n webhook
        const n8nResponse = await axios.post(N8N_WEBHOOK_URL, n8nRequestBody);
        console.log('⬅️ Received from n8n:', n8nResponse.data);
 
        // Transform to frontend format
        const transformedResponse = {
            responseId: n8nResponse.data.responseId || `${Date.now()}`,
            responseType: n8nResponse.data.responseType || 'text',
            content: n8nResponse.data.content ,
            timestamp: n8nResponse.data.timestamp || new Date().toISOString()
        };
 
        console.log('⬅️ Sending to frontend:', transformedResponse);
 
        // ✅ Only attempt Redis SET if healthy
        if (redisHealthy) {
            try {
                const hasValidContent = transformedResponse.content &&
                    (transformedResponse.content.text || transformedResponse.content.viewSpec);
 
                if (hasValidContent) {
                    await redisClient.set(cacheKey, JSON.stringify(transformedResponse), {
                        EX: 3600 // 1 hour TTL
                    });
                    console.log('✅ Stored response in Redis with 1-hour TTL.');
                } else {
                    console.log('⚠️ Skipped caching empty or fallback response.');
                }
            } catch (err) {
                console.error('❌ Redis SET error (skipped caching):', err.message);
                redisHealthy = false;
            }
        }
 
        return res.json(transformedResponse);
 
    } catch (err) {
        console.error('❌ Error calling n8n or transforming response:');
        if (err.response) {
            console.error('🔴 n8n Response Error:', err.response.status, err.response.data);
        } else if (err.request) {
            console.error('🟠 No response from n8n:', err.request);
        } else {
            console.error('⚠️ General Error:', err.message);
        }
        return res.status(500).json({ error: 'Something went wrong while processing your request.' });
    }
});
 
app.listen(PORT, () => {
    console.log(`✅ API Gateway running on port ${PORT}`);
});