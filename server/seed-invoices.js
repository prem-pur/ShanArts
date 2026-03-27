require('dotenv').config();
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String, email: String, role: String, password: { type: String, select: false }
});
const orderSchema = new mongoose.Schema({
    orderNumber: String, customerId: mongoose.Schema.Types.ObjectId,
    jobType: String, status: String, totalPrice: Number, deliveryMethod: String
});

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('MongoDB Connected');
        
        let User;
        try {
            User = require('./modules/UserManagement/User');
        } catch(e) {
            User = mongoose.models.User || mongoose.model('User', userSchema);
        }
        
        let ShopOrder;
        try {
            ShopOrder = require('./modules/OrderManagement/ShopOrder');
        } catch(e) {
            ShopOrder = mongoose.models.ShopOrder || mongoose.model('ShopOrder', orderSchema);
        }
        
        const Invoice = require('./modules/BillingManagement/Invoice');

        let testUser = await User.findOne({ email: 'testcustomer@example.com' });
        if (!testUser) {
            testUser = new User({
                name: 'Test Customer',
                email: 'testcustomer@example.com',
                passwordHash: 'passwordhash123',
                role: 'customer'
            });
            await testUser.save();
        }

        const order1 = new ShopOrder({
            orderNumber: 'ORD-' + Math.floor(Math.random() * 10000),
            customerId: testUser._id,
            jobType: 'poster',
            status: 'completed',
            totalPrice: 15000,
            deliveryMethod: 'delivery'
        });
        await order1.save();
        
        const order2 = new ShopOrder({
            orderNumber: 'ORD-' + Math.floor(Math.random() * 10000),
            customerId: testUser._id,
            jobType: 'banner',
            status: 'completed',
            totalPrice: 20000,
            deliveryMethod: 'pickup'
        });
        await order2.save();

        await Invoice.deleteMany({ customerId: testUser._id });

        const invoice1 = new Invoice({
            invoiceNumber: 'INV-' + Math.floor(Math.random() * 10000),
            orderId: order1._id,
            customerId: testUser._id,
            lineItems: [{ description: 'Poster Printing', quantity: 15, unitPrice: 1000, total: 15000 }],
            subtotal: 15000,
            tax: 1500,
            discount: 500,
            totalAmount: 16000,
            amountPaid: 0,
            balanceDue: 16000,
            paymentStatus: 'unpaid',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        });
        await invoice1.save();

        const invoice2 = new Invoice({
            invoiceNumber: 'INV-' + Math.floor(Math.random() * 10000),
            orderId: order2._id,
            customerId: testUser._id,
            lineItems: [{ description: 'Logo Design', quantity: 1, unitPrice: 20000, total: 20000 }],
            subtotal: 20000,
            tax: 0,
            discount: 0,
            totalAmount: 20000,
            amountPaid: 20000,
            balanceDue: 0,
            paymentStatus: 'paid',
            dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
        });
        await invoice2.save();

        console.log('Seed completed successfully!');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
