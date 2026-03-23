const Material = require("./Material");
const StockTransaction = require("./StockTransaction");
const ApiError = require('../../utils/apiError');
const notificationService = require('../../services/notificationService');
const QRCode = require('qrcode');

const inventoryController = {
    // Get all materials
    async getAllMaterials(req, res, next) {
        try {
            const { limit = 50, search } = req.query;
            const filter = { isActive: true };

            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { barcode: { $regex: search, $options: 'i' } },
                    { qrCode: { $regex: search, $options: 'i' } }
                ];
            }

            const materials = await Material.find(filter)
                .limit(parseInt(limit, 10))
                .sort({ name: 1 });

            res.status(200).json({
                success: true,
                count: materials.length,
                data: materials,
            });
        } catch (error) {
            next(error);
        }
    },

    // Find material by barcode, QR code, or _id
    async findMaterialByCode(req, res, next) {
        try {
            const { code } = req.params;
            let material = null;

            // Try by MongoDB _id first (24-char hex, as stored in QR payload)
            if (/^[a-f\d]{24}$/i.test(code)) {
                material = await Material.findOne({ _id: code, isActive: true });
            }

            // Fall back to barcode / qrCode string search
            if (!material) {
                material = await Material.findOne({
                    $or: [
                        { barcode: code },
                        { qrCode: code }
                    ],
                    isActive: true
                });
            }

            if (!material) {
                throw new ApiError('Material not found with this barcode/QR code', 404);
            }

            res.status(200).json({
                success: true,
                data: material,
            });
        } catch (error) {
            next(error);
        }
    },


    // Update stock by barcode/QR code
    async updateStockByCode(req, res, next) {
        try {
            const { code } = req.params;
            const { quantity, operation = 'add', notes } = req.body;

            if (!quantity || quantity <= 0) {
                throw new ApiError('Valid quantity is required', 400);
            }

            let material = null;

            // Try by MongoDB _id first (stored in QR payload)
            if (/^[a-f\d]{24}$/i.test(code)) {
                material = await Material.findOne({ _id: code, isActive: true });
            }
            // Fall back to barcode / qrCode string
            if (!material) {
                material = await Material.findOne({
                    $or: [
                        { barcode: code },
                        { qrCode: code }
                    ],
                    isActive: true
                });
            }


            if (!material) {
                throw new ApiError('Material not found with this barcode/QR code', 404);
            }

            // Update stock based on operation
            const previousStock = material.currentStock;
            if (operation === 'add') {
                material.currentStock += quantity;
            } else if (operation === 'subtract') {
                if (material.currentStock < quantity) {
                    throw new ApiError('Insufficient stock', 400);
                }
                material.currentStock -= quantity;
            } else {
                throw new ApiError('Invalid operation. Use "add" or "subtract"', 400);
            }

            await material.save();

            // Create stock transaction record
            const stockTransaction = new StockTransaction({
                materialId: material._id,
                type: operation === 'add' ? 'stock_in' : 'stock_out',
                quantity: operation === 'add' ? quantity : -quantity,
                previousStock,
                newStock: material.currentStock,
                notes: notes || `Stock ${operation} via barcode/QR scan`,
                userId: req.user._id
            });
            await stockTransaction.save();

            // Check if stock is below reorder threshold
            if (material.currentStock <= material.reorderThreshold) {
                try {
                    await notificationService.notifyAdmins(
                        'low_stock',
                        `Low Stock Alert: ${material.name}`,
                        `Current stock: ${material.currentStock} ${material.unit}. Reorder threshold: ${material.reorderThreshold} ${material.unit}.`,
                        material._id,
                        'Material'
                    );
                } catch (notificationError) {
                    console.error('Failed to send low stock notification:', notificationError);
                }
            }

            res.status(200).json({
                success: true,
                message: `Stock ${operation === 'add' ? 'added' : 'removed'} successfully`,
                data: {
                    material,
                    previousStock,
                    newStock: material.currentStock,
                    quantity: operation === 'add' ? quantity : -quantity
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Add new material
    async addMaterial(req, res, next) {
        try {
            const { name, category, unit, reorderThreshold, costPerUnit, supplier } = req.body;

            if (!name || !category || !unit) {
                throw new ApiError('Name, category, and unit are required', 400);
            }

            const material = new Material({
                name,
                category,
                unit,
                reorderThreshold: reorderThreshold || 0,
                costPerUnit: costPerUnit || 0,
                supplier,
                currentStock: 0,
                isActive: true,
            });

            await material.save();

            // Generate QR code containing material identity details
            const qrPayload = JSON.stringify({
                id: material._id.toString(),
                name: material.name,
                category: material.category,
                unit: material.unit,
            });
            const qrCodeDataURL = await QRCode.toDataURL(qrPayload, {
                width: 300,
                margin: 2,
                color: { dark: '#111827', light: '#ffffff' },
            });
            material.qrCode = qrCodeDataURL;
            await material.save();

            res.status(201).json({
                message: 'Material added successfully',
                material,
            });
        } catch (error) {
            next(error);
        }
    },

    // Get QR code image for a material
    async getMaterialQRCode(req, res, next) {
        try {
            const material = await Material.findById(req.params.id);
            if (!material) {
                throw new ApiError('Material not found', 404);
            }

            // Regenerate if missing
            if (!material.qrCode) {
                const qrPayload = JSON.stringify({
                    id: material._id.toString(),
                    name: material.name,
                    category: material.category,
                    unit: material.unit,
                });
                material.qrCode = await QRCode.toDataURL(qrPayload, {
                    width: 300,
                    margin: 2,
                    color: { dark: '#111827', light: '#ffffff' },
                });
                await material.save();
            }

            res.status(200).json({
                success: true,
                data: {
                    materialId: material._id,
                    name: material.name,
                    qrCode: material.qrCode,
                },
            });
        } catch (error) {
            next(error);
        }
    },

    // Get material by ID
    async getMaterialById(req, res, next) {
        try {
            const material = await Material.findById(req.params.id);

            if (!material) {
                throw new ApiError('Material not found', 404);
            }

            res.json(material);
        } catch (error) {
            next(error);
        }
    },

    // Update material
    async updateMaterial(req, res, next) {
        try {
            const { name, category, unit, reorderThreshold, costPerUnit, supplier } = req.body;
            const updates = {};

            if (name) updates.name = name;
            if (category) updates.category = category;
            if (unit) updates.unit = unit;
            if (reorderThreshold !== undefined) updates.reorderThreshold = reorderThreshold;
            if (costPerUnit !== undefined) updates.costPerUnit = costPerUnit;
            if (supplier) updates.supplier = supplier;

            const material = await Material.findByIdAndUpdate(
                req.params.id,
                updates,
                { new: true }
            );

            if (!material) {
                throw new ApiError('Material not found', 404);
            }

            res.json({
                message: 'Material updated successfully',
                material,
            });
        } catch (error) {
            next(error);
        }
    },

    // Deactivate material
    async deactivateMaterial(req, res, next) {
        try {
            const material = await Material.findByIdAndUpdate(
                req.params.id,
                { isActive: false },
                { new: true }
            );

            if (!material) {
                throw new ApiError('Material not found', 404);
            }

            res.json({
                message: 'Material deactivated successfully',
                material,
            });
        } catch (error) {
            next(error);
        }
    },

    // Record stock-in (purchase)
    async recordStockIn(req, res, next) {
        try {
            const { materialId, quantity, supplier, costPerUnit, notes } = req.body;

            if (!materialId || !quantity) {
                throw new ApiError('Material ID and quantity are required', 400);
            }

            const material = await Material.findById(materialId);
            if (!material) {
                throw new ApiError('Material not found', 404);
            }

            // Update stock
            material.currentStock += quantity;
            if (costPerUnit) material.costPerUnit = costPerUnit;
            if (supplier) material.supplier = supplier;
            await material.save();

            // Create transaction record
            const transaction = new StockTransaction({
                materialId,
                type: 'stock_in',
                quantity,
                notes: notes || `Stock in by ${req.user ? req.user.name : 'System'}`,
                performedBy: req.user ? req.user._id : null,
            });

            await transaction.save();

            res.status(201).json({
                message: 'Stock-in recorded successfully',
                material,
                transaction,
            });
        } catch (error) {
            next(error);
        }
    },

    // Get stock transactions
    async getTransactions(req, res, next) {
        try {
            const { materialId, type } = req.query;
            const filters = {};

            if (materialId) filters.materialId = materialId;
            if (type) filters.type = type;

            const transactions = await StockTransaction.find(filters)
                .populate('materialId', 'name category')
                .populate('performedBy', 'name email')
                .sort({ createdAt: -1 });

            res.json(transactions);
        } catch (error) {
            next(error);
        }
    },

    // Get low-stock alerts
    async getLowStockAlerts(req, res, next) {
        try {
            const lowStockMaterials = await Material.find({
                $expr: { $lte: ['$currentStock', '$reorderThreshold'] },
                isActive: true,
            });

            res.json(lowStockMaterials);
        } catch (error) {
            next(error);
        }
    },

    // Subtract stock for production
    async subtractStock(materialId, quantity, orderNumber, userId) {
        const Material = require("./Material");
        const StockTransaction = require("./StockTransaction");

        const material = await Material.findById(materialId);
        if (!material) throw new Error(`Material ${materialId} not found`);

        if (material.currentStock < quantity) {
            throw new Error(`Insufficient stock for ${material.name}.`);
        }

        material.currentStock -= quantity;
        await material.save();

        const transaction = new StockTransaction({
            materialId,
            type: 'stock_out',
            quantity,
            notes: `Used in production for order #${orderNumber}`,
            performedBy: userId,
        });
        await transaction.save();

        // Check for low stock alert
        if (material.currentStock <= material.reorderThreshold) {
            const notificationService = require('../../services/notificationService');
            await notificationService.notifyAdmins(
                'low_stock',
                'Low Stock Alert!',
                `${material.name} is below the threshold (${material.currentStock} ${material.unit} left).`,
                material._id,
                'Material'
            );
        }

        return material;
    },
};

module.exports = inventoryController;
