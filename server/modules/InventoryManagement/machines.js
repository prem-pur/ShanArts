const express = require('express');
const router = express.Router();
const machineController = require("./machineController");
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');

router.get('/', auth, roleCheck(['admin', 'staff_schedule', 'staff_operator']), machineController.getAllMachines);
router.get('/:id', auth, roleCheck(['admin', 'staff_schedule', 'staff_operator']), machineController.getMachineById);
router.get('/:id/load', auth, roleCheck(['admin', 'staff_schedule']), machineController.getMachineLoad);
router.post('/', auth, roleCheck(['admin']), machineController.addMachine);
router.put('/:id', auth, roleCheck(['admin']), machineController.updateMachine);
router.patch('/:id/status', auth, roleCheck(['admin', 'staff_operator', 'staff_schedule']), machineController.updateMachineStatus);
router.patch('/:id/assign-operator', auth, roleCheck(['admin']), machineController.assignOperator);

// New endpoints for enhanced machine management
router.patch('/:id/maintenance', auth, roleCheck(['admin', 'staff_schedule']), machineController.updateMaintenance);
router.get('/status/summary', auth, roleCheck(['admin', 'staff_schedule']), machineController.getProductionSummary);
router.get('/filter/:status', auth, roleCheck(['admin', 'staff_schedule']), machineController.getMachinesByStatus);

module.exports = router;
