const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const url = process.env.MONGO_URL;

async function connectToMongoDB() {
    try {
        await mongoose.connect(url);
        console.log("Database connected")
    } catch (error) {
        console.error("Error connecting Database", error);
    }
}

module.exports = connectToMongoDB;