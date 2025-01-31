const express = require("express");
const dotenv = require('dotenv');
const connectToMongoDB = require("./Database/connectToMongoDB");
const session = require('express-session');
const passport = require('passport');
require('./googleAuth/passport');
const authRoute = require("./routes/routes")


dotenv.config();

const PORT = process.env.PORT || 5000

const secret_key = process.env.SESSION_SECRET


const app = express();

app.use(express.json());

app.use(session({
    secret: secret_key,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true
    }
}));

// passport
app.use(passport.initialize());
app.use(passport.session());

//routes
app.use('/api', authRoute);

app.listen(PORT, () => {
    console.log(`Server is running at port: ${PORT}`)
    connectToMongoDB();
})