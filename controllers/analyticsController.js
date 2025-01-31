const redisClient = require('../redis/redisClient');
const Analytics = require("../models/analyticsModel");
const ShortUrl = require("../models/shortUrlModel");

exports.getAnalytics = async (req, res) => {
    try {
        const { alias } = req.params;
        const sanitizedAlias = alias.replace(/^:/, "");

        // check cache
        const cachedData = await redisClient.get(`analytics:${sanitizedAlias}`);

        if (cachedData) return res.json(JSON.parse(cachedData));

        const totalClicks = await Analytics.countDocuments({
            shortUrl: sanitizedAlias,
        });
        const uniqueUsers = await Analytics.distinct("ipAddress", {
            shortUrl: sanitizedAlias,
        }).then((users) => users.length);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const clicksByDate = await Analytics.aggregate([
            {
                $match: { shortUrl: sanitizedAlias, timeStamp: { $gte: sevenDaysAgo } },
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timeStamp" } },
                    clicks: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]).then((data) =>
            data.map((item) => ({ date: item._id, clickCount: item.clicks }))
        );

        const osType = await Analytics.aggregate([
            { $match: { shortUrl: sanitizedAlias } },
            {
                $group: {
                    _id: `$geolocation.os`,
                    uniqueUsers: { $addToSet: "$ipAddress" },
                },
            },
            { $project: { osName: `$_id`, uniqueClicks: { $size: "$uniqueUsers" } } },
        ]);

        const deviceType = await Analytics.aggregate([
            {
                $match: {
                    shortUrl: sanitizedAlias,
                    "geolocation.deviceType": { $ne: null },
                },
            },
            {
                $group: {
                    _id: `$geolocation.deviceType`,
                    uniqueClicks: { $addToSet: "$ipAddress" },
                },
            },
            {
                $project: {
                    deviceName: "$_id",
                    uniqueClicks: { $size: "$uniqueUsers" },
                },
            },
        ]);

        const analyticsData = {
            totalClicks,
            uniqueUsers,
            clicksByDate,
            osType,
            deviceType,
        }

        // store in in cache with 1 hour expiry
        await redisClient.setEx(`analytics:${sanitizedAlias}`, 3600, JSON.stringify(analyticsData))

        res.json(analyticsData);
    } catch (error) {
        console.error("Error occurred during fetching analytics:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};



// Topic Analytics
exports.getTopicAnalytics = async (req, res) => {
    try {
        const { topic } = req.params;
        const sanitizedTopic = topic.replace(/^:/, "");

        if (!sanitizedTopic) return res.status(400).json({ message: "Topic is required" });

        // check cache 
        const cachedData = await redisClient.get(`topicAnalytics:${sanitizedTopic}`);

        if (cachedData) return res.json(JSON.parse(cachedData));

        const url = await ShortUrl.find({ topic: sanitizedTopic });

        if (!url.length) return res.status(404).json("Topic not found");

        const totalClicks = await Analytics.countDocuments({ shortUrl: { $in: url.map((u) => u.shortUrl) } });
        const uniqueUsers = await Analytics.distinct("ipAddress", { shortUrl: { $in: url.map((u) => u.shortUrl) } }).then(users => users.length);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const clicksByDate = await Analytics.aggregate([
            { $match: { shortUrl: { $in: url.map((u) => u.shortUrl) }, timeStamp: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: '$timeStamp' } },
                    clicks: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]).then(data => data.map(item => ({ date: item._id, clickCount: item.clicks })))

        const urlAnalytics = await Promise.all(
            url.map(async (u) => {
                const urlClicks = await Analytics.countDocuments({ shortUrl: u.shortUrl });
                const urlUniqueUsers = await Analytics.distinct("ipAddress", { shortUrl: u.shortUrl }).then(users => users.length);

                return {
                    shortUrl: `${req.protocol}://${req.get('host')}/api/shorten/${u.shortUrl}`,
                    totalClicks: urlClicks,
                    uniqueUsers: urlUniqueUsers
                }
            })
        );

        const topicAnalyticsData = {
            topic,
            totalClicks,
            uniqueUsers,
            clicksByDate,
            urls: urlAnalytics
        };

        // store in cache with 1 hour expiry
        await redisClient.setEx(`topicAnalytics:${sanitizedTopic}`, 3600, JSON.stringify(topicAnalyticsData));


        res.json(topicAnalyticsData);
    } catch (error) {
        console.error("Error occured during fetching analytics details:", error);
        res.status(500).json({ message: "Internal Server Error" })

    }
}



exports.getOverallAnalytics = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        const userId = req.user._id;

        // check cache
        const cachedData = await redisClient.get(`overallAnalytics:${userId}`);

        if (cachedData) return res.json(JSON.parse(cachedData));

        const urls = await ShortUrl.find({ userId: userId });

        if (!urls.length) {
            return res.status(404).json({ message: "No URLs found for this user." });
        }

        const urlId = urls.map(url => url.shortUrl);

        // Total URLs count
        const totalUrls = urls.length;

        // Total Clicks
        const totalClicks = await Analytics.countDocuments({ shortUrl: { $in: urlId } });

        // Unique Users 
        const uniqueUsers = await Analytics.distinct('ipAddress', { shortUrl: { $in: urlId } }).then(users => users.length);

        // Clicks by Date (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const clicksByDate = await Analytics.aggregate([
            { $match: { shortUrl: { $in: urlId }, timeStamp: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timeStamp" } },
                    clicks: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]).then(data => data.map(item => ({ date: item._id, clickCount: item.clicks })));

        // OS Type Analytics
        const osType = await Analytics.aggregate([
            { $match: { shortUrl: { $in: urlId } } },
            {
                $group: {
                    _id: "$osName",
                    uniqueClicks: { $sum: 1 },
                    uniqueUsers: { $addToSet: "$ipAddress" }
                }
            }
        ]).then(data => data.map(item => ({
            osName: item._id,
            uniqueClicks: item.uniqueClicks,
            uniqueUsers: item.uniqueUsers.length
        })));

        // Device Type Analytics
        const deviceType = await Analytics.aggregate([
            { $match: { shortUrl: { $in: urlId } } },
            {
                $group: {
                    _id: "$deviceType",
                    uniqueClicks: { $sum: 1 },
                    uniqueUsers: { $addToSet: "$ipAddress" }
                }
            }
        ]).then(data => data.map(item => ({
            deviceName: item._id,
            uniqueClicks: item.uniqueClicks,
            uniqueUsers: item.uniqueUsers.length
        })));

        const overallAnalyticsData = {
            totalUrls,
            totalClicks,
            uniqueUsers,
            clicksByDate,
            osType,
            deviceType
        };

        // store in cache with 1 hour expiry
        await redisClient.setEx(`overallAnalytics:${userId}`, 3600, JSON.stringify(overallAnalyticsData));

        res.json(overallAnalyticsData);
    } catch (error) {
        console.error("Error fetching overall analytics:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};