const roleCheck = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const userRole = (req.user.role || '').toString().toLowerCase();
        const normalizedAllowed = (allowedRoles || []).map((r) => (r || '').toString().toLowerCase());
        if (!normalizedAllowed.includes(userRole)) {
            return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
        }

        next();
    };
};

module.exports = roleCheck;
