const { createComplaint, getComplaintsByField, getComplaintById } = require('../models/complaintModel');
const { getDepartments } = require('../models/departmentModel');

const submitComplaint = async (req, res) => {
  try {
    const { title, description, category, departmentId } = req.body;

    if (!title || !description || !category || !departmentId) {
      return res.status(400).json({ message: 'Title, description, category and department are required.' });
    }

    const departments = await getDepartments();
    const department = departments.find((dept) => dept.id === departmentId);
    if (!department) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    const evidencePath = req.file ? `/uploads/${req.file.filename}` : null;

    const complaint = await createComplaint({
      citizen_id: req.user.id,
      title,
      description,
      category,
      department: department.department_name,
      departmentId: department.id,
      evidence: evidencePath
    });

    return res.status(201).json({ message: 'Complaint submitted successfully.', complaint });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to submit complaint.', error: error.message });
  }
};

const listCitizenComplaints = async (req, res) => {
  try {
    const complaints = await getComplaintsByField('citizen_id', req.user.id);
    return res.status(200).json({ complaints });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch complaints.', error: error.message });
  }
};

const getComplaintDetail = async (req, res) => {
  try {
    const complaint = await getComplaintById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    if (req.user.role === 'citizen' && complaint.citizen_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied for this complaint.' });
    }

    return res.status(200).json({ complaint });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch complaint.', error: error.message });
  }
};

const getDepartmentsList = async (req, res) => {
  try {
    const departments = await getDepartments();
    return res.status(200).json({ departments });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch departments.', error: error.message });
  }
};

module.exports = {
  submitComplaint,
  listCitizenComplaints,
  getComplaintById: getComplaintDetail,
  getDepartmentsList
};
