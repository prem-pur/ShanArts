const mongoose = require('mongoose');
const ProductionOrder = require('./models/ProductionOrder');
const Machine = require('./models/Machine');
const User = require('./models/User');
const Schedule = require('./models/Schedule');

// Connect to database
mongoose.connect('mongodb://localhost:27017/orderDB');

async function createSampleData() {
    try {
        console.log('=== CREATING SAMPLE DATA ===\n');

        // First, create a user
        let user = await User.findOne({ email: 'admin@shanart.com' });
        if (!user) {
            user = new User({
                name: 'Admin User',
                email: 'admin@shanart.com',
                passwordHash: 'admin123', // Using raw password as per current system
                role: 'admin',
                isActive: true
            });
            await user.save();
            console.log('✅ Created user:', user.name);
        } else {
            console.log('✅ Found existing user:', user.name);
        }

        // Create machines
        const machines = [
            {
                name: 'Laminator 1',
                type: 'Laminator',
                status: 'In Use',
                operatorId: user._id,
                currentJobId: null,
                startTime: new Date(),
                estimatedEndTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
                lastMaintenanceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
                nextMaintenanceDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000) // 23 days from now
            },
            {
                name: 'Digital Printer 1',
                type: 'Digital Printer',
                status: 'In Use',
                operatorId: user._id,
                currentJobId: null,
                startTime: new Date(),
                estimatedEndTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
                lastMaintenanceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                nextMaintenanceDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000) // 25 days from now
            },
            {
                name: 'Cutting Machine 1',
                type: 'Cutter',
                status: 'Available',
                operatorId: user._id,
                lastMaintenanceDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
                nextMaintenanceDate: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000) // 27 days from now
            },
            {
                name: 'Large Format Printer 1',
                type: 'Large Format Printer',
                status: 'Scheduled',
                operatorId: null,
                lastMaintenanceDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
                nextMaintenanceDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000) // 20 days from now
            },
            {
                name: 'Offset Printer 1',
                type: 'Offset Printer',
                status: 'Under Maintenance',
                operatorId: null,
                lastMaintenanceDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
                nextMaintenanceDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000) // 29 days from now
            }
        ];

        const createdMachines = [];
        for (const machineData of machines) {
            let machine = await Machine.findOne({ name: machineData.name });
            if (!machine) {
                machine = new Machine(machineData);
                await machine.save();
                console.log('✅ Created machine:', machine.name);
            } else {
                // Update existing machine with operator assignment
                await Machine.findByIdAndUpdate(machine._id, {
                    operatorId: user._id,
                    status: machineData.status
                });
                console.log('✅ Updated machine:', machine.name);
            }
            createdMachines.push(machine);
        }

        // Create orders
        const orders = [
            {
                orderId: 'ORD-2026-4346',
                customerName: 'Test Customer',
                staffId: user._id,
                customerId: user._id,
                status: 'In Progress',
                printSpecs: {
                    size: { width: 90, height: 50, unit: 'mm' },
                    designType: 'business_card',
                    quantity: 100,
                    description: 'Test approval workflow',
                    deliveryMethod: 'pickup'
                }
            },
            {
                orderId: 'ORD-2026-4347',
                customerName: 'Another Customer',
                staffId: user._id,
                customerId: user._id,
                status: 'In Progress',
                printSpecs: {
                    size: { width: 210, height: 297, unit: 'mm' },
                    designType: 'flyer',
                    quantity: 500,
                    description: 'Marketing flyer',
                    deliveryMethod: 'delivery'
                }
            }
        ];

        const createdOrders = [];
        for (const orderData of orders) {
            let order = await ProductionOrder.findOne({ orderId: orderData.orderId });
            if (!order) {
                order = new ProductionOrder(orderData);
                await order.save();
                console.log('✅ Created order:', order.orderId);
            } else {
                console.log('✅ Found existing order:', order.orderId);
            }
            createdOrders.push(order);
        }

        // Assign machines to orders
        await ProductionOrder.findByIdAndUpdate(createdOrders[0]._id, {
            assignedMachineId: createdMachines[0]._id,
            assignedMachineName: createdMachines[0].name
        });
        console.log('✅ Assigned', createdMachines[0].name, 'to', createdOrders[0].orderId);

        await ProductionOrder.findByIdAndUpdate(createdOrders[1]._id, {
            assignedMachineId: createdMachines[1]._id,
            assignedMachineName: createdMachines[1].name
        });
        console.log('✅ Assigned', createdMachines[1].name, 'to', createdOrders[1].orderId);

        // Update machine current jobs and status
        await Machine.findByIdAndUpdate(createdMachines[0]._id, {
            currentJobId: createdOrders[0]._id,
            currentOrderId: createdOrders[0]._id,
            status: 'In Use'
        });
        await Machine.findByIdAndUpdate(createdMachines[1]._id, {
            currentJobId: createdOrders[1]._id,
            currentOrderId: createdOrders[1]._id,
            status: 'In Use'
        });

        // Create schedule entries
        const schedules = [
            {
                orderId: createdOrders[0]._id,
                machineId: createdMachines[0]._id,
                operatorId: user._id,
                scheduledStart: new Date(),
                status: 'in_progress'
            },
            {
                orderId: createdOrders[1]._id,
                machineId: createdMachines[1]._id,
                operatorId: user._id,
                scheduledStart: new Date(),
                status: 'in_progress'
            }
        ];

        for (const scheduleData of schedules) {
            const schedule = new Schedule(scheduleData);
            await schedule.save();
            console.log('✅ Created schedule for order:', scheduleData.orderId);
        }

        console.log('\n=== SAMPLE DATA CREATION COMPLETE ===');
        console.log('📊 Summary:');
        console.log(`- Users: 1 (${user.name})`);
        console.log(`- Machines: ${createdMachines.length} (all assigned to ${user.name})`);
        console.log(`- Orders: ${createdOrders.length} (both assigned to machines)`);
        console.log(`- Schedules: ${schedules.length} (all in progress)`);

        console.log('\n🎯 Expected Result:');
        console.log(`Operator "${user.name}" should see ${createdOrders.length} assigned jobs in dashboard`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

createSampleData();
