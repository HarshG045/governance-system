const express = require('express');
const {
  submitComplaint,
  listCitizenComplaints,
  getComplaintById,
  getDepartmentsList
} = require('../controllers/citizenController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/departments', authenticate, getDepartmentsList);
router.post('/complaints', authenticate, authorize('citizen'), upload.single('evidence'), submitComplaint);
router.get('/complaints', authenticate, authorize('citizen'), listCitizenComplaints);
router.get('/complaints/:id', authenticate, getComplaintById);

module.exports = router;
