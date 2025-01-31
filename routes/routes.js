const express = require('express');
const router = express.Router();

const rateLimit = require('express-rate-limit');

const isAuthenticated = require('../middleware/auth');

const {
    login,
    googleAuth,
    googleAuthCallback,
    loginFailed,
    profile
} = require("../controllers/authController");

const {
    createShortUrl,
    redirectShortUrl
} = require("../controllers/shortUrlController");

const { getAnalytics, getTopicAnalytics, getOverallAnalytics } = require("../controllers/analyticsController");




// Rate limiting
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: "You have reached maximum limit of creating short URLs. Please try again later"
})



router.get('/login', login);
router.get('/auth/google', googleAuth);
router.get('/auth/google/callback', googleAuthCallback);
router.get('/login-failed', loginFailed);
router.get('/profile', isAuthenticated, profile);

router.post('/shorten', isAuthenticated, limiter, createShortUrl);
router.get('/shorten/:alias', isAuthenticated, limiter, redirectShortUrl);

router.get('/analytics/overall', isAuthenticated, limiter, getOverallAnalytics);
router.get('/analytics/:alias', isAuthenticated, limiter, getAnalytics);
router.get('/analytics/topic/:topic', isAuthenticated, limiter, getTopicAnalytics);



module.exports = router