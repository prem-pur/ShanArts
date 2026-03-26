const mongoose = require('mongoose');
const Machine = require('../Machine');

// Connect to database
mongoose.connect('mongodb://localhost:27017/orderDB');

async function updateExistingMachines() {
    try {
        console.log('=== UPDATING EXISTING MACHINE DATA ===\n');

        // Get all existing machines
        const machines = await Machine.find({});
        console.log(`Found ${machines.length} machines to update\n`);

        for (const machine of machines) {
            console.log(`Updating machine: ${machine.name}`);

            const updateData = {};

            // Update status from old values to new enum values
            if (machine.status === 'available') {
                updateData.status = 'Available';
            } else if (machine.status === 'busy') {
                updateData.status = 'In Use';
            } else if (machine.status === 'maintenance') {
                updateData.status = 'Under Maintenance';
            } else if (machine.status === 'breakdown') {
                updateData.status = 'Out of Order';
            }

            // Update machine type from old values to new enum values
            if (machine.type === 'digital_printer') {
                updateData.type = 'Digital Printer';
            } else if (machine.type === 'offset_printer') {
                updateData.type = 'Offset Printer';
            } else if (machine.type === 'cutting_machine') {
                updateData.type = 'Cutter';
            } else if (machine.type === 'laminator') {
                updateData.type = 'Laminator';
            } else if (machine.type === 'large_format_printer') {
                updateData.type = 'Large Format Printer';
            } else if (machine.type === 'folding_machine') {
                updateData.type = 'Folding Machine';
            } else if (machine.type === 'embossing_machine') {
                updateData.type = 'Embossing Machine';
            }

            // Add missing fields with defaults
            if (!machine.location) {
                updateData.location = 'Main Production Floor';
            }
            if (!machine.specifications) {
                updateData.specifications = '';
            }
            if (!machine.notes) {
                updateData.notes = '';
            }
            if (!machine.lastMaintenanceDate) {
                // Set last maintenance to 30 days ago if not present
                updateData.lastMaintenanceDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            }
            if (!machine.nextMaintenanceDate) {
                // Set next maintenance to 30 days from now if not present
                updateData.nextMaintenanceDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            }

            // Set start time if machine is in use but no start time
            if (machine.status === 'In Use' && !machine.startTime) {
                updateData.startTime = new Date();
            }

            // Set estimated end time if machine is in use but no end time
            if (machine.status === 'In Use' && !machine.estimatedEndTime) {
                updateData.estimatedEndTime = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours from now
            }

            // Copy currentJobId to currentOrderId if currentOrderId is missing
            if (machine.currentJobId && !machine.currentOrderId) {
                updateData.currentOrderId = machine.currentJobId;
            }

            // Apply updates if there are any
            if (Object.keys(updateData).length > 0) {
                await Machine.findByIdAndUpdate(machine._id, updateData);
                console.log(`  ✅ Updated: ${JSON.stringify(updateData, null, 2)}`);
            } else {
                console.log(`  ℹ️  No updates needed`);
            }

            console.log(''); // Add spacing
        }

        // Verify the updates
        console.log('=== VERIFYING UPDATES ===\n');
        const updatedMachines = await Machine.find({});

        console.log('Updated Machine Data:');
        updatedMachines.forEach((machine, index) => {
            console.log(`${index + 1}. ${machine.name}`);
            console.log(`   Type: ${machine.type}`);
            console.log(`   Status: ${machine.status}`);
            console.log(`   Location: ${machine.location}`);
            console.log(`   Operator: ${machine.operatorId?.name || 'None'}`);
            console.log(`   Current Order: ${machine.currentOrderId || 'None'}`);
            console.log(`   Start Time: ${machine.startTime || 'None'}`);
            console.log(`   Est. End Time: ${machine.estimatedEndTime || 'None'}`);
            console.log(`   Last Maintenance: ${machine.lastMaintenanceDate?.toLocaleDateString() || 'None'}`);
            console.log(`   Next Maintenance: ${machine.nextMaintenanceDate?.toLocaleDateString() || 'None'}`);
            console.log('');
        });

        console.log('=== UPDATE COMPLETE ===');
        console.log(`✅ Successfully updated ${updatedMachines.length} machines`);

    } catch (error) {
        console.error('Error updating machines:', error);
    } finally {
        process.exit(0);
    }
}

updateExistingMachines();
