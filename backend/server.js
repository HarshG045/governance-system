const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const { initDatabase } = require('../database/db');

const authRoutes = require('./routes/authRoutes');
const citizenRoutes = require('./routes/citizenRoutes');
const officerRoutes = require('./routes/officerRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));

app.use('/api/auth', authRoutes);
app.use('/api', citizenRoutes);
app.use('/api/officer', officerRoutes);
app.use('/api/admin', adminRoutes);

// Provide a JSON 404 for missing API routes
app.use('/api/*', (req, res) => {
  return res.status(404).json({ message: 'API Route not found.' });
});

// Catch-all route to serve the React SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
});

// Initialize DB then start server
(async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log('Default admin login: admin@gov.local / admin123');
    });
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
    process.exit(1);
  }
})();
