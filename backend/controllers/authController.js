const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail } = require('../models/userModel');

const validRoles = ['citizen', 'officer', 'admin'];

const buildToken = (user) => jwt.sign(
  {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    departmentId: user.departmentId || null
  },
  process.env.JWT_SECRET || 'dev_secret_key',
  { expiresIn: '1d' }
);

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    const normalizedRole = role || 'citizen';
    if (!validRoles.includes(normalizedRole)) {
      return res.status(400).json({ message: 'Invalid role selected.' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser({
      name,
      email,
      password: hashedPassword,
      role: normalizedRole
    });

    return res.status(201).json({
      message: 'Registration successful.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to register user.', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = buildToken(user);

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId || null
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to login.', error: error.message });
  }
};

module.exports = {
  register,
  login
};
