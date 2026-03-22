const User = require("./User");
const ApiError = require('../../utils/apiError');
const jwt = require('jsonwebtoken');
const config = require('../../config/env');
const QRCode = require('qrcode');

// Register user
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return next(new ApiError('User already exists', 400));
        }

        // In a real app we would hash the password properly. For this demo we just store it.
        // Assuming passwordHash is handled by model pre-save if implemented there.
        // Check if user is trying to register as staff or admin
        const isStaffRole = role && role !== 'customer';
        if (isStaffRole) {
            // Check for admin authorization header (simplified)
            const adminToken = req.headers['x-admin-token'];
            if (!adminToken || adminToken !== 'sachi-admin-super-secret-key') {
                // For the very first admin (seeding), we already handled it.
                // For others, we'll allow registration if there are NO users yet (bootstrap).
                const userCount = await User.countDocuments();
                if (userCount > 0) {
                    return next(new ApiError('Only admins can register staff members. Please provide valid admin authorization.', 403));
                }
            }
        }

        const user = new User({
            name,
            email,
            passwordHash: password,
            role: role || 'customer',
        });

        await user.save();

        // Generate unique QR code for staff members
        if (isStaffRole) {
            const qrData = JSON.stringify({ userId: user._id.toString(), name: user.name, role: user.role });
            const qrBase64 = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });
            user.qrCode = qrBase64;
            await user.save();
        }

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            qrCode: user.qrCode || null,
            userId: user._id,
        });
    } catch (error) {
        next(error);
    }
};

// Login user
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user || user.passwordHash !== password) {
            return next(new ApiError('Invalid credentials', 401));
        }

        const token = jwt.sign(
            { _id: user._id, role: user.role, name: user.name },
            config.JWT_SECRET,
            { expiresIn: config.JWT_EXPIRES_IN }
        );

        res.status(200).json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        next(error);
    }
};

// Get staff members
exports.getStaff = async (req, res, next) => {
    try {
        const { role } = req.query;
        const filter = { role: { $ne: 'customer' } };
        if (role) filter.role = role;

        const staff = await User.find(filter).select('-passwordHash');
        res.status(200).json(staff);
    } catch (error) {
        next(error);
    }
};

// Get QR code for a specific staff member
exports.getStaffQR = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('qrCode name role');
        if (!user) return next(new ApiError('User not found', 404));
        if (!user.qrCode) return next(new ApiError('No QR code found for this user', 404));
        res.status(200).json({ qrCode: user.qrCode, name: user.name, role: user.role });
    } catch (error) {
        next(error);
    }
};

// Get current user
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('-passwordHash');
        if (!user) {
            return next(new ApiError('User not found', 404));
        }
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};

// Update current user profile
exports.updateMe = async (req, res, next) => {
    try {
        const { name, phone } = req.body;
        
        const user = await User.findById(req.user._id);
        if (!user) {
            return next(new ApiError('User not found', 404));
        }

        if (name) user.name = name;
        if (phone) user.phone = phone;

        await user.save();

        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone
            }
        });
    } catch (error) {
        next(error);
    }
};
