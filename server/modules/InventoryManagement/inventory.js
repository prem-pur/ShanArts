const express = require('express');
const router = express.Router();
const inventoryController = require("./inventoryController");
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');

router.get('/', auth, roleCheck(['admin', 'staff_inventory', 'staff_operator', 'staff_designer']), inventoryController.getAllMaterials);
router.get('/low-stock', auth, roleCheck(['admin', 'staff_inventory']), inventoryController.getLowStockAlerts);
router.get('/transactions', auth, roleCheck(['admin', 'staff_inventory']), inventoryController.getTransactions);
router.get('/:id', auth, roleCheck(['admin', 'staff_inventory', 'staff_operator', 'staff_designer']), inventoryController.getMaterialById);
router.post('/', auth, roleCheck(['admin', 'staff_inventory']), inventoryController.addMaterial);
router.put('/:id', auth, roleCheck(['admin', 'staff_inventory']), inventoryController.updateMaterial);
router.delete('/:id', auth, roleCheck(['admin']), inventoryController.deactivateMaterial);
router.post('/stock-in', auth, roleCheck(['admin', 'staff_inventory']), inventoryController.recordStockIn);

// Barcode/QR Code scanning endpoints
router.get('/barcode/:code', auth, roleCheck(['admin', 'staff_inventory']), inventoryController.findMaterialByCode);
router.patch('/barcode/:code', auth, roleCheck(['admin', 'staff_inventory']), inventoryController.updateStockByCode);

module.exports = router;
