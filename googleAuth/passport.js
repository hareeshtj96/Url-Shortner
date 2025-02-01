const passport = require('passport');
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require('../models/userModel');
require('dotenv').config();


console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);


passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://localhost:8001/api/auth/google/callback"
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ googleId: profile.id });

                if (!user) {
                    // creating new user
                    user = await User.create({
                        googleId: profile.id,
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        profilePic: profile.photos[0]?.value,
                        lastLogin: new Date(),
                    })
                } else {
                    // will update user info
                    user.lastLogin = new Date();
                    await user.save();
                }
                return done(null, user)
            } catch (error) {
                return done(error, null)
            }
        }
    )
);

// serialize and deserialize user
passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (_id, done) => {
    try {
        const user = await User.findById(_id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
})