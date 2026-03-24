const User = require('../User');
const mongoose = require('mongoose');

// Connect to database
mongoose.connect('mongodb://localhost:27017/printing-management-system');

async function createOperator() {
    try {
        // Create or update operator account
        const operator = await User.findOneAndUpdate(
            { email: 'pamoda@shanart.com' },
            {
                name: 'Pamoda',
                email: 'pamoda@shanart.com',
                role: 'staff_operator',
                isActive: true,
                password: '$2b$10$rOzJqQjQjQjQjQjQjQjQuOzJqQjQjQjQjQjQjQjQjQuOzJqQjQjQjQjQjQjQjQ' // password: operator123
            },
            { upsert: true, new: true }
        );
        
        console.log('Operator created/updated:', operator);
        
        // Assign operator to Digital Printer 1
        const Machine = require('../../InventoryManagement/Machine');
        await Machine.findByIdAndUpdate(
            '69a58336e17052fa75632f58',
            { operatorId: operator._id }
        );
        
        console.log('Digital Printer 1 assigned to Pamoda');
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createOperator();

