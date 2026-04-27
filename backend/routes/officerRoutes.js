const express = require('express');
const { getOfficerComplaints, updateOfficerComplaint } = require('../controllers/officerController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/complaints', authenticate, authorize('officer'), getOfficerComplaints);
router.put('/complaints/:id', authenticate, authorize('officer'), updateOfficerComplaint);

module.exports = router;
