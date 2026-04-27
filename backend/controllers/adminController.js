const bcrypt = require('bcryptjs');
const { getUsers, createUser } = require('../models/userModel');
const { getDepartments, createDepartment } = require('../models/departmentModel');
const { getComplaints, updateComplaint } = require('../models/complaintModel');

const addDepartment = async (req, res) => {
  try {
    const { department_name } = req.body;
    if (!department_name) {
      return res.status(400).json({ message: 'Department name is required.' });
    }

    const departments = await getDepartments();
    const existing = departments.find(
      (item) => item.department_name.toLowerCase() === department_name.toLowerCase()
    );

    if (existing) {
      return res.status(409).json({ message: 'Department already exists.' });
    }

    const department = await createDepartment(department_name);
    return res.status(201).json({ message: 'Department created successfully.', department });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create department.', error: error.message });
  }
};

const listUsers = async (req, res) => {
  try {
    const users = (await getUsers()).map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId || null
    }));

    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch users.', error: error.message });
  }
};

const createOfficer = async (req, res) => {
  try {
    const { name, email, password, departmentId } = req.body;

    if (!name || !email || !password || !departmentId) {
      return res.status(400).json({ message: 'Name, email, password and departmentId are required.' });
    }

    const departments = await getDepartments();
    const department = departments.find((item) => item.id === departmentId);
    if (!department) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    const users = await getUsers();
    const existingUser = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const officer = await createUser({
      name,
      email,
      password: hash,
      role: 'officer',
      departmentId
    });

    return res.status(201).json({
      message: 'Officer account created successfully.',
      officer: {
        id: officer.id,
        name: officer.name,
        email: officer.email,
        role: officer.role,
        departmentId: officer.departmentId
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create officer account.', error: error.message });
  }
};

const assignComplaint = async (req, res) => {
  try {
    const { complaintId, departmentId } = req.body;
    if (!complaintId || !departmentId) {
      return res.status(400).json({ message: 'complaintId and departmentId are required.' });
    }

    const departments = await getDepartments();
    const department = departments.find((item) => item.id === departmentId);
    if (!department) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    const complaint = await updateComplaint(complaintId, {
      departmentId: department.id,
      department: department.department_name,
      timelineNote: `Assigned to ${department.department_name}`,
      timelineBy: req.user.name
    });

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    return res.status(200).json({ message: 'Complaint assigned successfully.', complaint });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to assign complaint.', error: error.message });
  }
};

const getAdminComplaints = async (req, res) => {
  try {
    const complaints = await getComplaints();
    return res.status(200).json({ complaints });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch complaints.', error: error.message });
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

const getReports = async (req, res) => {
  try {
    const complaints = await getComplaints();
    const users = await getUsers();

    const statusCount = complaints.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      },
      { Submitted: 0, 'In Progress': 0, Resolved: 0 }
    );

    const complaintsByDepartment = complaints.reduce((acc, item) => {
      const key = item.department || 'Unassigned';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return res.status(200).json({
      totalComplaints: complaints.length,
      totalCitizens: users.filter((u) => u.role === 'citizen').length,
      totalOfficers: users.filter((u) => u.role === 'officer').length,
      statusCount,
      complaintsByDepartment
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate reports.', error: error.message });
  }
};

module.exports = {
  addDepartment,
  listUsers,
  createOfficer,
  assignComplaint,
  getAdminComplaints,
  getDepartmentsList,
  getReports
};
