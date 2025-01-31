const redis = require('redis');
const dotenv = require('dotenv');
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

const redisClient = redis.createClient({
    url: REDIS_URL,
    password: REDIS_PASSWORD,
    socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 2000)
    }


});

redisClient.on('error', (err) => {
    console.error('Redis error:', err)
});

redisClient.connect();

module.exports = redisClient;