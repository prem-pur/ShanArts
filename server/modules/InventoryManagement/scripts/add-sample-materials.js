const Material = require('../Material');
const mongoose = require('mongoose');

// Connect to database
mongoose.connect('mongodb://localhost:27017/printing-management-system');

async function addSampleMaterials() {
    try {
        // Sample materials with barcodes
        const sampleMaterials = [
            {
                name: 'Premium Glossy Paper',
                category: 'Paper',
                unit: 'sheets',
                currentStock: 500,
                reorderThreshold: 100,
                costPerUnit: 0.15,
                supplier: 'Paper Supplies Inc',
                barcode: '1234567890123',
                qrCode: 'QR-PREMIUM-PAPER-001'
            },
            {
                name: 'Standard Ink - Black',
                category: 'Ink',
                unit: 'ml',
                currentStock: 2000,
                reorderThreshold: 500,
                costPerUnit: 0.05,
                supplier: 'InkTech Solutions',
                barcode: '9876543210987',
                qrCode: 'QR-INK-BLACK-001'
            },
            {
                name: 'Cardstock - Heavy',
                category: 'Paper',
                unit: 'sheets',
                currentStock: 200,
                reorderThreshold: 50,
                costPerUnit: 0.25,
                supplier: 'Premium Papers Ltd',
                barcode: '5555666677778',
                qrCode: 'QR-CARDSTOCK-001'
            },
            {
                name: 'Lamination Film',
                category: 'Lamination',
                unit: 'rolls',
                currentStock: 25,
                reorderThreshold: 10,
                costPerUnit: 15.00,
                supplier: 'FilmCo Industries',
                barcode: '1111222233334',
                qrCode: 'QR-LAMINATION-001'
            }
        ];

        for (const material of sampleMaterials) {
            // Check if material already exists
            const existing = await Material.findOne({ name: material.name });
            if (existing) {
                // Update existing material with barcode/qr code
                await Material.findByIdAndUpdate(existing._id, {
                    barcode: material.barcode,
                    qrCode: material.qrCode
                });
                console.log(`Updated ${material.name} with barcode/QR code`);
            } else {
                // Create new material
                const newMaterial = new Material(material);
                await newMaterial.save();
                console.log(`Created ${material.name} with barcode/QR code`);
            }
        }

        console.log('Sample materials with barcodes added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

addSampleMaterials();
