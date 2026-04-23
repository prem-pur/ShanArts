const User = require("./User");
const Notification = require("../FeedbackNotificationManagement/Notification");
const ApiError = require('../../utils/apiError');
const jwt = require('jsonwebtoken');
const config = require('../../config/env');
const QRCode = require('qrcode');

const ROLE_PREFIXES = {
    staff_designer: 'D',
    staff_operator: 'O',
    staff_schedule: 'S',
    staff_inventory: 'I',
    staff_finance: 'F',
    staff_system: 'M',
    admin: 'A',
};

const generateMerchantCode = async (role) => {
    const prefix = ROLE_PREFIXES[role] || 'S';
    let isUnique = false;
    let merchantCode = '';

    while (!isUnique) {
        // Generate a random 5 digit number for the suffix (to ensure uniqueness more easily than sequential in a distributed environment)
        const suffix = Math.floor(10000 + Math.random() * 90000).toString();
        merchantCode = `${prefix}${suffix}`;

        const existingUser = await User.findOne({ merchantCode });
        if (!existingUser) {
            isUnique = true;
        }
    }
    return merchantCode;
};


// Register user
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role, nic, phone, address } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return next(new ApiError('User already exists', 400));
        }

        // Email validation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return next(new ApiError('Please provide a valid email address.', 400));
        }

        // Password validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return next(new ApiError('Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.', 400));
        }

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

        // Validate NIC, Phone, and Address for staff
        if (isStaffRole) {
            if (!nic) return next(new ApiError('NIC is required for staff registration.', 400));
            if (!phone) return next(new ApiError('Phone number is required for staff registration.', 400));
            if (!address) return next(new ApiError('Address is required for staff registration.', 400));

            // NIC validation (10 digits/characters as requested)
            if (nic.length !== 10) {
                return next(new ApiError('NIC must be exactly 10 characters long.', 400));
            }

            // Phone number validation (10 digits)
            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(phone)) {
                return next(new ApiError('Phone number must be exactly 10 digits.', 400));
            }

            // Check if NIC already exists
            const nicExists = await User.findOne({ nic });
            if (nicExists) {
                return next(new ApiError('Staff member with this NIC already exists.', 400));
            }
        }

        const user = new User({
            name,
            email,
            passwordHash: password,
            role: role || 'customer',
            nic,
            phone,
            address,
        });

        // Generate merchant code for staff members
        if (isStaffRole) {
            user.merchantCode = await generateMerchantCode(user.role);
        }

        await user.save();

        // Generate unique QR code for staff members
        if (isStaffRole) {
            const qrData = JSON.stringify({
                userId: user._id.toString(),
                name: user.name,
                role: user.role,
                merchantCode: user.merchantCode
            });
            const qrBase64 = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });
            user.qrCode = qrBase64;
            await user.save();
        }

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            qrCode: user.qrCode || null,
            userId: user._id,
            merchantCode: user.merchantCode || null,
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
        if (!user || !(await user.matchPassword(password))) {
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

// Get full staff profile by ID (used by QR profile scanner)
exports.getStaffDetails = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-passwordHash');
        if (!user) return next(new ApiError('Staff member not found', 404));
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            merchantCode: user.merchantCode,
            nic: user.nic,
            phone: user.phone,
            address: user.address,
            qrCode: user.qrCode,
            isActive: user.isActive,
            registeredAt: user.createdAt,
        });
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

// Get QR by merchant code
exports.getQrByMerchantCode = async (req, res, next) => {
    try {
        const { merchantCode } = req.params;
        const user = await User.findOne({ merchantCode }).select('qrCode name role merchantCode nic phone address email createdAt');
        if (!user) return next(new ApiError('No staff member found with this merchant code', 404));
        if (!user.qrCode) return next(new ApiError('QR code not yet generated for this member', 404));
        res.status(200).json({
            qrCode: user.qrCode,
            name: user.name,
            role: user.role,
            merchantCode: user.merchantCode,
            nic: user.nic,
            phone: user.phone,
            address: user.address,
            email: user.email,
            registeredAt: user.createdAt,
        });
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

// Update existing staff profile
exports.updateStaff = async (req, res, next) => {
    try {
        const { name, role, nic, phone, address, isActive } = req.body;

        // Ensure user exists
        const user = await User.findById(req.params.id);
        if (!user) {
            return next(new ApiError('Staff member not found', 404));
        }

        if (name) user.name = name;
        if (role) user.role = role;
        if (nic) user.nic = nic;
        if (phone) user.phone = phone;
        if (address) user.address = address;
        if (isActive !== undefined) user.isActive = isActive;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Staff member updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                nic: user.nic,
                phone: user.phone,
                address: user.address,
                isActive: user.isActive,
                merchantCode: user.merchantCode
            }
        });
    } catch (error) {
        next(error);
    }
};

// Delete staff profile
exports.deleteStaff = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return next(new ApiError('Staff member not found', 404));
        }

        await User.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Staff member deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Get customers
exports.getCustomers = async (req, res, next) => {
    try {
        const customers = await User.find({ role: 'customer' }).select('-passwordHash');
        res.status(200).json(customers);
    } catch (error) {
        next(error);
    }
};
// Forgot password request via Identity Verification (NIC/Phone)
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email, nic, phone, newPassword } = req.body;
        
        if (!email || !nic || !phone || !newPassword) {
            return next(new ApiError('All fields (Email, NIC, Phone, New Password) are required.', 400));
        }

        const user = await User.findOne({ email });

        if (!user) {
            return next(new ApiError('Verification failed. This email is not registered.', 404));
        }

        if (user.role === 'customer') {
            return next(new ApiError('Access denied. Self-service reset is for staff members only.', 403));
        }

        // Identity Verification: Check if NIC and Phone match exactly
        if (user.nic !== nic || user.phone !== phone) {
            return next(new ApiError('Verification failed. Provided NIC or Phone number does not match our records.', 401));
        }

        // Update password
        user.passwordHash = newPassword;
        await user.save();

        // Create an audit notification for managers
        const managers = await User.find({ role: { $in: ['admin', 'staff_system'] } });
        for (const manager of managers) {
            await Notification.create({
                recipientId: manager._id,
                type: 'general_announcement',
                title: 'Password Reset Notification',
                message: `The password for ${user.name} (${user.role}) was reset using identity verification (NIC/Phone).`,
                relatedEntityId: user._id,
                relatedEntityType: 'User'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Verification successful. Your password has been updated!'
        });
    } catch (error) {
        next(error);
    }
};
