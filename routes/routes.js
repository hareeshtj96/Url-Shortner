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


/**
 * @swagger
 * /api/login:
 *   get:
 *     summary: Login to the app using Google
 *     description: Redirects the user to Google for authentication.
 *     responses:
 *       302:
 *         description: Redirects to Google authentication
 */
router.get('/login', login);



/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Authenticate using Google
 *     description: Initiates the OAuth2.0 authentication with Google.
 *     responses:
 *       302:
 *         description: Redirects to Google's OAuth2.0 authentication page.
 */
router.get('/auth/google', googleAuth);


/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth2.0 callback
 *     description: Handles the callback from Google after the user has authenticated.
 *     responses:
 *       302:
 *         description: Redirects to the profile page or login failure page.
 */
router.get('/auth/google/callback', googleAuthCallback);

/**
 * @swagger
 * /api/login-failed:
 *   get:
 *     summary: Failed authentication
 *     description: Returns a message when authentication fails.
 *     responses:
 *       401:
 *         description: Authentication failed.
 */
router.get('/login-failed', loginFailed);


/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: View user profile
 *     description: Displays the profile of the authenticated user.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Welcome message with user's name.
 *       401:
 *         description: Unauthorized if the user is not authenticated.
 */
router.get('/profile', isAuthenticated, profile);

/**
 * @swagger
 * /api/shorten:
 *   post:
 *     summary: Create a shortened URL
 *     description: This endpoint allows an authenticated user to create a shortened version of a long URL.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               longUrl:
 *                 type: string
 *                 description: The original long URL to be shortened.
 *                 example: 'https://www.example.com/very-long-url'
 *               customAlias:
 *                 type: string
 *                 description: The custom alias for the shortened URL. Optional.
 *                 example: 'my-short-url'
 *               topic:
 *                 type: string
 *                 description: The topic or category for the shortened URL. Optional.
 *                 example: 'tech'
 *     responses:
 *       201:
 *         description: The shortened URL has been created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shortUrl:
 *                   type: string
 *                   description: The newly created shortened URL.
 *                   example: 'https://example.com/api/shorten/my-short-url'
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: The timestamp when the shortened URL was created.
 *                   example: '2025-02-01T10:00:00Z'
 *       400:
 *         description: Invalid input or alias already in use.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'longUrl is required.' or 'Custom Alias is already in use'
 *       401:
 *         description: Unauthorized if the user is not authenticated.
 *       500:
 *         description: Internal Server Error in case of unexpected issues.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Internal Server Error'
 */
router.post('/shorten', isAuthenticated, limiter, createShortUrl);

/**
 * @swagger
 * /api/shorten/{alias}:
 *   get:
 *     summary: Redirect to the original long URL from the shortened URL
 *     description: This endpoint redirects the user to the original long URL associated with the given alias. It also tracks analytics data like the user's IP, user agent, and geolocation.
 *     parameters:
 *       - in: path
 *         name: alias
 *         required: true
 *         description: The alias of the shortened URL.
 *         schema:
 *           type: string
 *           example: 'my-short-url'
 *     security:
 *       - cookieAuth: []  # Security for cookies (session authentication)
 *     responses:
 *       301:
 *         description: Redirected to the original long URL.
 *       404:
 *         description: Short URL not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Short URL not found'
 *       401:
 *         description: Unauthorized if the user is not authenticated.
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Internal Server Error'
 */
router.get('/shorten/:alias', isAuthenticated, limiter, redirectShortUrl);


/**
 * @swagger
 * /analytics/overall:
 *   get:
 *     summary: Get Overall Analytics for Authenticated User
 *     description: Retrieves the overall analytics for the authenticated user, including total URLs, total clicks, unique users, clicks by date (last 7 days), operating system type, and device type. This endpoint also caches the data for faster subsequent access.
 *     security:
 *       - cookieAuth -[]
 *     responses:
 *       200:
 *         description: Successfully retrieved overall analytics data for the authenticated user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUrls:
 *                   type: integer
 *                   example: 10
 *                 totalClicks:
 *                   type: integer
 *                   example: 1500
 *                 uniqueUsers:
 *                   type: integer
 *                   example: 1200
 *                 clicksByDate:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: '2024-01-01'
 *                       clickCount:
 *                         type: integer
 *                         example: 100
 *                 osType:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       osName:
 *                         type: string
 *                         example: 'Windows'
 *                       uniqueClicks:
 *                         type: integer
 *                         example: 800
 *                       uniqueUsers:
 *                         type: integer
 *                         example: 700
 *                 deviceType:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       deviceName:
 *                         type: string
 *                         example: 'Mobile'
 *                       uniqueClicks:
 *                         type: integer
 *                         example: 1000
 *                       uniqueUsers:
 *                         type: integer
 *                         example: 950
 *       401:
 *         description: Unauthorized if the user is not authenticated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'User not authenticated'
 *       404:
 *         description: No URLs found for this user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'No URLs found for this user.'
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Internal Server Error'
 */
router.get('/analytics/overall', isAuthenticated, limiter, getOverallAnalytics);

/**
 * @swagger
 * /analytics/{alias}:
 *   get:
 *     summary: Get Analytics for a Specific Short URL Alias
 *     description: Retrieves analytics data for a specific short URL alias, including total clicks, unique users, clicks by date (last 7 days), operating system type, and device type. This endpoint also caches the data for faster subsequent access.
 *     parameters:
 *       - in: path
 *         name: alias
 *         required: true
 *         description: The alias of the short URL.
 *         schema:
 *           type: string
 *           example: 'short-url-alias'
 *     security:
 *       - cookieAuth - []
 *     responses:
 *       200:
 *         description: Successfully retrieved analytics data for the specific short URL alias.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalClicks:
 *                   type: integer
 *                   example: 1500
 *                 uniqueUsers:
 *                   type: integer
 *                   example: 1200
 *                 clicksByDate:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: '2024-01-01'
 *                       clickCount:
 *                         type: integer
 *                         example: 100
 *                 osType:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       osName:
 *                         type: string
 *                         example: 'Windows'
 *                       uniqueClicks:
 *                         type: integer
 *                         example: 800
 *                       uniqueUsers:
 *                         type: integer
 *                         example: 700
 *                 deviceType:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       deviceName:
 *                         type: string
 *                         example: 'Mobile'
 *                       uniqueClicks:
 *                         type: integer
 *                         example: 1000
 *                       uniqueUsers:
 *                         type: integer
 *                         example: 950
 *       401:
 *         description: Unauthorized if the user is not authenticated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'User not authenticated'
 *       404:
 *         description: The specified alias is not found in the system.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Alias not found'
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Internal Server Error'
 */
router.get('/analytics/:alias', isAuthenticated, limiter, getAnalytics);

/**
 * @swagger
 * /analytics/topic/{topic}:
 *   get:
 *     summary: Get Analytics for a Specific Topic
 *     description: Retrieves analytics data for a specific topic, including total clicks, unique users, clicks by date (last 7 days), and individual URL analytics related to the topic. This endpoint also caches the data for faster subsequent access.
 *     parameters:
 *       - in: path
 *         name: topic
 *         required: true
 *         description: The topic for which analytics data is required.
 *         schema:
 *           type: string
 *           example: 'marketing'
 *     security:
 *       - cookieAuth - []
 *     responses:
 *       200:
 *         description: Successfully retrieved analytics data for the specified topic.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 topic:
 *                   type: string
 *                   example: 'marketing'
 *                 totalClicks:
 *                   type: integer
 *                   example: 5000
 *                 uniqueUsers:
 *                   type: integer
 *                   example: 4000
 *                 clicksByDate:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: '2024-01-01'
 *                       clickCount:
 *                         type: integer
 *                         example: 300
 *                 urls:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       shortUrl:
 *                         type: string
 *                         example: 'http://localhost/api/shorten/abcd1234'
 *                       totalClicks:
 *                         type: integer
 *                         example: 200
 *                       uniqueUsers:
 *                         type: integer
 *                         example: 180
 *       400:
 *         description: Bad Request if the topic parameter is not provided.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Topic is required'
 *       404:
 *         description: Not Found if no URLs are associated with the specified topic.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Topic not found'
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Internal Server Error'
 */
router.get('/analytics/topic/:topic', isAuthenticated, limiter, getTopicAnalytics);



module.exports = router