const express = require("express");
const dotenv = require('dotenv');
const connectToMongoDB = require("./Database/connectToMongoDB");
const session = require('express-session');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
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

// Swagger options
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Short URL API',
            version: '1.0.0',
            description: 'API documentation for the Short URL service',
        },
    },
    apis: ['./routes/routes.js'],
};

// Initialize Swagger
const swaggerDocs = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// passport
app.use(passport.initialize());
app.use(passport.session());

//routes
app.use('/api', authRoute);

app.listen(PORT, () => {
    console.log(`Server is running at port: ${PORT}`)
    connectToMongoDB();
})