const mongoose = require('mongoose');

async function connectDB(url) {
    try {
        await mongoose.connect(url);
        console.log('MongoDB connected');
    } catch (err) {
        console.error(err);
    }
}

module.exports = connectDB;