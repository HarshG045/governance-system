const { getComplaintsByField, getComplaintById, updateComplaint } = require('../models/complaintModel');

const allowedStatuses = ['Submitted', 'In Progress', 'Resolved'];

const getOfficerComplaints = async (req, res) => {
  try {
    const complaints = await getComplaintsByField('department_id', req.user.departmentId);
    return res.status(200).json({ complaints });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch officer complaints.', error: error.message });
  }
};

const updateOfficerComplaint = async (req, res) => {
  try {
    const { status, officer_remarks } = req.body;
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Valid status is required.' });
    }

    const complaint = await getComplaintById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    if (complaint.departmentId !== req.user.departmentId) {
      return res.status(403).json({ message: 'You can only manage complaints in your department.' });
    }

    const updated = await updateComplaint(req.params.id, {
      status,
      officer_remarks: officer_remarks || complaint.officer_remarks,
      officer_id: req.user.id,
      timelineNote: officer_remarks || `Status updated to ${status}`,
      timelineBy: req.user.name
    });

    return res.status(200).json({ message: 'Complaint updated successfully.', complaint: updated });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update complaint.', error: error.message });
  }
};

module.exports = {
  getOfficerComplaints,
  updateOfficerComplaint
};
