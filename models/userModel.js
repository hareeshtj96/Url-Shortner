const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        googleId: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                "Please enter a valid email",
            ]
        },
        profilePic: {
            type: String,
        },
        createdAt: {
            type: Date,
            default: Date.now(),
        },
        lastLogin: {
            type: Date,
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);