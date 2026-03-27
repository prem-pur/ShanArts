const express = require('express');
const router = express.Router();
const inventoryController = require("./inventoryController");
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');

router.get('/', auth, roleCheck(['admin', 'staff_inventory', 'staff_operator', 'staff_designer']), inventoryController.getAllMaterials);
router.get('/categories', auth, roleCheck(['admin', 'staff_inventory', 'staff_operator', 'staff_designer']), inventoryController.getCategories);
router.post('/categories', auth, roleCheck(['admin']), inventoryController.addCategory);
router.get('/low-stock', auth, roleCheck(['admin', 'staff_inventory']), inventoryController.getLowStockAlerts);
router.get('/transactions', auth, roleCheck(['admin', 'staff_inventory']), inventoryController.getTransactions);
router.get('/:id', auth, roleCheck(['admin', 'staff_inventory', 'staff_operator', 'staff_designer']), inventoryController.getMaterialById);
router.post('/', auth, roleCheck(['admin', 'staff_inventory']), inventoryController.addMaterial);
router.put('/:id', auth, roleCheck(['admin', 'staff_inventory']), inventoryController.updateMaterial);
router.delete('/:id', auth, roleCheck(['admin']), inventoryController.deactivateMaterial);
router.post('/:id/request-delete', auth, roleCheck(['admin', 'staff_inventory']), inventoryController.requestMaterialDeletion);
router.post('/stock-in', auth, roleCheck(['admin', 'staff_inventory']), inventoryController.recordStockIn);

// QR Code generation endpoint
router.get('/qr/:id', auth, roleCheck(['admin', 'staff_inventory', 'staff_operator', 'staff_designer']), inventoryController.getMaterialQRCode);

// Barcode/QR Code scanning endpoints
router.get('/barcode/:code', auth, roleCheck(['admin', 'staff_inventory']), inventoryController.findMaterialByCode);
router.patch('/barcode/:code', auth, roleCheck(['admin', 'staff_inventory']), inventoryController.updateStockByCode);

module.exports = router;
