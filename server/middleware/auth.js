const jwt = require('jsonwebtoken');
const config = require('../config/env');

const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            // For development/initial setup, if no token, we might want to skip or return 401
            // For now, let's keep it strict but mention it to the user if needed.
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token', error: error.message });
    }
};

module.exports = authMiddleware;
