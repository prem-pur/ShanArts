const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    PORT: process.env.PORT || 5001,
    MONGODB_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/orderDB',
    JWT_SECRET: process.env.JWT_SECRET || 'printing_management_secret_key_2024',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
    FILE_UPLOAD_PATH: process.env.FILE_UPLOAD_PATH || './public/uploads',
    NODE_ENV: process.env.NODE_ENV || 'development',
};
