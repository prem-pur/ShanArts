const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: '../.env' });

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/orderDB');
        console.log('Connected to MongoDB');

        const adminEmail = 'sachi@gmail.com';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('Admin user already exists!');
            process.exit(0);
        }

        const admin = new User({
            name: 'Sachi Admin',
            email: adminEmail,
            passwordHash: '12345', // Note: Using raw password as per current controller logic
            role: 'admin'
        });

        await admin.save();
        console.log('✅ Admin user created successfully!');
        console.log('Email: sachi@gmail.com');
        console.log('Password: 12345');
        console.log('Role: admin');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding admin:', error.message);
        process.exit(1);
    }
};

seedAdmin();
