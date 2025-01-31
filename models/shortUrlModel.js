const mongoose = require('mongoose');

const shortUrlSchema = new mongoose.Schema({
    longUrl: {
        type: String,
        required: true
    },
    shortUrl: {
        type: String,
        required: true,
        unique: true
    },
    topic: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    userId: {
        type: String,
        required: true
    }

});

module.exports = mongoose.model('ShortUrl', shortUrlSchema);