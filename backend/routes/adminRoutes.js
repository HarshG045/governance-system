const express = require('express');
const {
  addDepartment,
  listUsers,
  createOfficer,
  assignComplaint,
  getAdminComplaints,
  getDepartmentsList,
  getReports
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/departments', authenticate, authorize('admin'), addDepartment);
router.get('/departments', authenticate, authorize('admin'), getDepartmentsList);
router.get('/users', authenticate, authorize('admin'), listUsers);
router.post('/officers', authenticate, authorize('admin'), createOfficer);
router.put('/assign', authenticate, authorize('admin'), assignComplaint);
router.get('/complaints', authenticate, authorize('admin'), getAdminComplaints);
router.get('/reports', authenticate, authorize('admin'), getReports);

module.exports = router;
