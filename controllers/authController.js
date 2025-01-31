const passport = require('passport');

exports.login = (req, res) => {
    res.redirect('/api/auth/google');
};

exports.googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

exports.googleAuthCallback = passport.authenticate('google', {
    failureRedirect: '/login-failed',
    successRedirect: '/api/profile',
    session: true,
});

exports.loginFailed = (req, res) => {
    res.status(401).json({ message: 'Authentication failed. Please try again.' });
};

exports.profile = (req, res) => {
    res.send(`Welcome, ${req.user.name}`);
};
