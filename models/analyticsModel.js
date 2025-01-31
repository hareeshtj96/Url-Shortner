const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    shortUrl: String,
    longUrl: String,
    timeStamp: {
        type: Date,
        default: Date.now
    },
    userAgent: String,
    ipAddress: String,
    geolocation: Object,
});

module.exports = mongoose.model('Analytics', analyticsSchema);