const axios = require('axios');
const redisClient = require('../redis/redisClient');
const ShortUrl = require('../models/shortUrlModel');
const Analytics = require('../models/analyticsModel');
const dotenv = require('dotenv');
dotenv.config();


async function generateId(len) {
    const { nanoid } = await import('nanoid');
    return nanoid(len);
}


exports.createShortUrl = async (req, res) => {
    try {
        const { longUrl, customAlias, topic } = req.body;
        if (!longUrl) return res.status(400).json({ message: 'longUrl is required.' });

        const shortUrl = customAlias || await generateId(8);

        const existingAlias = await ShortUrl.findOne({ shortUrl });

        if (existingAlias) return res.status(400).json({ message: 'Custom Alias is already in use' });

        const newShortUrl = await ShortUrl.create({
            longUrl,
            shortUrl,
            topic,
            createdAt: new Date(),
            userId: req.user.id,
        });

        //clear cache
        await redisClient.del(`shortUrl:${shortUrl}`);

        res.status(201).json({
            shortUrl: `${req.protocol}://${req.get('host')}/api/shorten/${shortUrl}`,
            createdAt: newShortUrl.createdAt,
        });
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.redirectShortUrl = async (req, res) => {
    try {
        const { alias } = req.params;

        // check cache 
        const cachedUrl = await redisClient.get(`shortUrl:${alias}`);

        if (cachedUrl) return res.redirect(301, cachedUrl);

        // fetch from database if not in cache
        const url = await ShortUrl.findOne({ shortUrl: alias });

        if (!url) return res.status(404).json({ message: 'Short URL not found' });

        // store result in cache
        await redisClient.setEx(`shortUrl:${alias}`, 3600, url.longUrl);

        const userAgent = req.headers['user-agent'];
        const ipAddress =
            req.headers['x-forwarded-for']?.split(',')[0].trim() ||
            req.socket.remoteAddress?.replace('::ffff:', '');

        const geolocation = ipAddress && !['127.0.0.1', '::1', 'localhost'].includes(ipAddress)
            ? (await axios.get(`https://ipinfo.io/${ipAddress}/json`, {
                params: { token: process.env.IP_TOKEN },
            })).data
            : null;

        await Analytics.create({
            shortUrl: alias,
            longUrl: url.longUrl,
            userAgent,
            ipAddress,
            geolocation,
            timeStamp: new Date(),
        });

        res.redirect(301, url.longUrl);
    } catch (error) {
        console.error('Error occurred during redirection:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
