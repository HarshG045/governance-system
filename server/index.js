const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-123';
const logError = (message, err) => {
  process.stderr.write(`${message}: ${err && err.stack ? err.stack : err}\n`);
};

app.use(cors());
app.use(express.json());

const complaintSelect = `
  SELECT
    c.id::text AS id,
    c.ticket_number,
    c.title,
    c.description,
    c.category,
    c.priority,
    c.status,
    c.citizen_id::text AS citizen_id,
    c.official_id::text AS official_id,
    c.department,
    c.location,
    c.attachments,
    c.created_at,
    c.updated_at,
    cu.name AS "citizenName",
    cu.id::text AS "citizenId",
    ou.name AS "assignedTo",
    ou.id::text AS assigned_to
  FROM complaints c
  LEFT JOIN users cu ON cu.id = c.citizen_id
  LEFT JOIN users ou ON ou.id = c.official_id
`;

async function ensureColumns() {
  await db.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT');
  await db.query('ALTER TABLE departments ADD COLUMN IF NOT EXISTS code TEXT');
  await db.query('ALTER TABLE departments ADD COLUMN IF NOT EXISTS description TEXT DEFAULT \'\'');
  await db.query('ALTER TABLE departments ADD COLUMN IF NOT EXISTS head_id UUID REFERENCES users(id) ON DELETE SET NULL');
  await db.query("UPDATE departments SET code = upper(regexp_replace(name, '[^A-Za-z0-9]+', '', 'g')) WHERE code IS NULL");
}

ensureColumns().catch((err) => {
  logError('schema compatibility check failed', err);
});

// --- Middleware ---

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'cgms-server' });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'cgms-server' });
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

async function getAuthorizedComplaint(req, id) {
  const result = await db.query(`${complaintSelect} WHERE c.id::text = $1 OR c.ticket_number = $1`, [id]);
  if (!result.rows.length) return { status: 404, error: 'Complaint not found' };

  const complaint = result.rows[0];
  if (req.user.role === 'admin') return { complaint };

  if (req.user.role === 'citizen') {
    if (complaint.citizen_id !== req.user.id) return { status: 403, error: 'Unauthorized' };
    return { complaint };
  }

  if (req.user.role === 'official') {
    const userRes = await db.query('SELECT department FROM users WHERE id = $1', [req.user.id]);
    const department = userRes.rows[0]?.department;
    if (!department || department !== complaint.department) return { status: 403, error: 'Unauthorized' };
    return { complaint, department };
  }

  return { status: 403, error: 'Unauthorized' };
}

// --- Auth Routes ---

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, role, phone } = req.body;
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const normalizedRole = String(role).toLowerCase();
    if (!['citizen', 'official', 'admin'].includes(normalizedRole)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (email, password_hash, name, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role, phone, department, status, created_at',
      [email, hashedPassword, name, normalizedRole, phone || null]
    );
    
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    
    res.status(201).json({ user, token });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    logError('register failed', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    
    // Don't send password hash
    delete user.password_hash;
    res.json({ user, token });
  } catch (err) {
    logError('login failed', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT id, email, name, role, department, status, phone, created_at FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    logError('auth/me failed', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- User Routes ---

app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    let query = 'SELECT id, email, name, role, department, status, phone, created_at FROM users';
    const params = [];
    const clauses = [];
    if (req.query.role) {
      params.push(String(req.query.role).toLowerCase());
      clauses.push(`role = $${params.length}`);
    }
    if (req.query.status) {
      params.push(req.query.status);
      clauses.push(`status = $${params.length}`);
    }
    if (clauses.length) query += ` WHERE ${clauses.join(' AND ')}`;
    query += ' ORDER BY created_at DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    logError('list users failed', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const result = await db.query(
      'SELECT id, email, name, role, department, status, phone, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    logError('get user failed', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const { name, email, password, role, department, status, phone } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password and role are required' });
  }

  try {
    const normalizedRole = String(role).toLowerCase();
    if (!['citizen', 'official', 'admin'].includes(normalizedRole)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (email, password_hash, name, role, department, status, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, name, role, department, status, phone, created_at`,
      [email, hashedPassword, name, normalizedRole, department || null, status || 'Active', phone || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    logError('create user failed', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  const { name, role, department, status, phone } = req.body;
  try {
    const result = await db.query(
      'UPDATE users SET name = COALESCE($1, name), role = COALESCE($2, role), department = COALESCE($3, department), status = COALESCE($4, status), phone = COALESCE($5, phone), updated_at = now() WHERE id = $6 RETURNING id, email, name, role, department, status, phone, created_at',
      [name, role ? String(role).toLowerCase() : null, department, status, phone, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    logError('update user failed', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account' });

  try {
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.sendStatus(204);
  } catch (err) {
    logError('delete user failed', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Complaint Routes ---

app.get('/api/complaints', authenticateToken, async (req, res) => {
  try {
    let query = complaintSelect;
    const params = [];
    const clauses = [];

    if (req.user.role === 'citizen') {
      params.push(req.user.id);
      clauses.push(`c.citizen_id = $${params.length}`);
    } else if (req.query.userId && req.user.role === 'admin') {
      params.push(req.query.userId);
      clauses.push(`c.citizen_id = $${params.length}`);
    }

    if (req.query.status) {
      params.push(req.query.status);
      clauses.push(`c.status = $${params.length}`);
    }

    if (req.query.department && req.user.role === 'admin') {
      params.push(req.query.department);
      clauses.push(`c.department = $${params.length}`);
    } else if (req.user.role === 'official') {
      const userRes = await db.query('SELECT department FROM users WHERE id = $1', [req.user.id]);
      const dept = userRes.rows[0]?.department;
      if (dept) {
        params.push(dept);
        clauses.push(`c.department = $${params.length}`);
      } else {
        clauses.push('false');
      }
    }

    if (clauses.length) query += ` WHERE ${clauses.join(' AND ')}`;
    query += ' ORDER BY c.created_at DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    logError('list complaints failed', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/complaints/:id', authenticateToken, async (req, res) => {
  try {
    const access = await getAuthorizedComplaint(req, req.params.id);
    if (access.error) return res.status(access.status).json({ error: access.error });
    res.json(access.complaint);
  } catch (err) {
    logError('get complaint failed', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/complaints', authenticateToken, async (req, res) => {
  const { title, description, category, priority, department, location, attachments } = req.body;
  if (!title || !description || !category || !priority || !department || !location) {
    return res.status(400).json({ error: 'Title, description, category, priority, department and location are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO complaints (title, description, category, priority, department, location, attachments, citizen_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id::text`,
      [title, description, category, priority, department, location, JSON.stringify(attachments || []), req.user.id]
    );
    const created = await db.query(`${complaintSelect} WHERE c.id::text = $1`, [result.rows[0].id]);
    res.status(201).json(created.rows[0]);
  } catch (err) {
    logError('create complaint failed', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/complaints/:id', authenticateToken, async (req, res) => {
  const { title, description, category, priority, department, location, status, attachments } = req.body;
  try {
    const access = await getAuthorizedComplaint(req, req.params.id);
    if (access.error) return res.status(access.status).json({ error: access.error });

    const existing = access.complaint;
    if (req.user.role === 'citizen') {
      if (status && status !== 'Cancelled') return res.status(403).json({ error: 'Citizens can only cancel complaints' });
      if (!status && existing.status !== 'Pending') return res.status(400).json({ error: 'Only pending complaints can be edited' });
    }

    let officialId = null;
    if (req.user.role === 'official') {
      officialId = req.user.id;
    }

    const nextTitle = req.user.role === 'official' ? null : title;
    const nextDescription = req.user.role === 'official' ? null : description;
    const nextCategory = req.user.role === 'official' ? null : category;
    const nextPriority = req.user.role === 'official' ? null : priority;
    const nextDepartment = req.user.role === 'official' ? null : department;
    const nextLocation = req.user.role === 'official' ? null : location;
    const nextAttachments = req.user.role === 'official' ? null : attachments;

    const result = await db.query(
      `UPDATE complaints 
       SET title = COALESCE($1, title), 
           description = COALESCE($2, description), 
           category = COALESCE($3, category), 
           priority = COALESCE($4, priority), 
           department = COALESCE($5, department), 
           location = COALESCE($6, location),
           status = COALESCE($7, status),
           attachments = COALESCE($8, attachments),
           official_id = COALESCE($9, official_id),
           updated_at = now()
       WHERE id::text = $10 RETURNING id`,
      [
        nextTitle,
        nextDescription,
        nextCategory,
        nextPriority,
        nextDepartment,
        nextLocation,
        status,
        nextAttachments ? JSON.stringify(nextAttachments) : null,
        officialId,
        existing.id,
      ]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Complaint not found' });
    const updated = await db.query(`${complaintSelect} WHERE c.id::text = $1`, [String(result.rows[0].id)]);
    res.json(updated.rows[0]);
  } catch (err) {
    logError('update complaint failed', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/complaints/:id', authenticateToken, async (req, res) => {
  try {
    const access = await getAuthorizedComplaint(req, req.params.id);
    if (access.error) return res.status(access.status).json({ error: access.error });

    let result;
    if (req.user.role === 'citizen') {
      result = await db.query('DELETE FROM complaints WHERE id::text = $1 AND citizen_id = $2 RETURNING id', [req.params.id, req.user.id]);
    } else if (req.user.role === 'official') {
      result = await db.query('DELETE FROM complaints WHERE id::text = $1 AND department = $2 RETURNING id', [access.complaint.id, access.complaint.department]);
    } else {
      result = await db.query('DELETE FROM complaints WHERE id::text = $1 OR ticket_number = $1 RETURNING id', [req.params.id]);
    }
    if (!result.rows.length) return res.status(404).json({ error: 'Complaint not found' });
    res.sendStatus(204);
  } catch (err) {
    logError('delete complaint failed', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Department Routes ---

app.get('/api/departments', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT d.id, d.name, COALESCE(d.code, upper(regexp_replace(d.name, '[^A-Za-z0-9]+', '', 'g'))) AS code,
             COALESCE(d.description, '') AS description, d.head_id, d.created_at,
             u.name AS head,
             COUNT(DISTINCT o.id)::int AS officials,
             COUNT(DISTINCT c.id)::int AS "complaintsThisMonth"
      FROM departments d
      LEFT JOIN users u ON u.id = d.head_id
      LEFT JOIN users o ON o.department = d.name AND o.role = 'official'
      LEFT JOIN complaints c ON c.department = d.name AND c.created_at >= date_trunc('month', now())
      GROUP BY d.id, d.name, d.code, d.description, d.head_id, d.created_at, u.name
      ORDER BY d.name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    logError('list departments failed', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/departments/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT d.id, d.name, COALESCE(d.code, upper(regexp_replace(d.name, '[^A-Za-z0-9]+', '', 'g'))) AS code,
              COALESCE(d.description, '') AS description, d.head_id, d.created_at,
              u.name AS head
       FROM departments d
       LEFT JOIN users u ON u.id = d.head_id
       WHERE d.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Department not found' });
    res.json(result.rows[0]);
  } catch (err) {
    logError('get department failed', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/departments', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const { name, code, description, head_id } = req.body;
  if (!name || !code) return res.status(400).json({ error: 'Department name and code are required' });

  try {
    const result = await db.query(
      'INSERT INTO departments (name, code, description, head_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, code, description || '', head_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Department already exists' });
    logError('create department failed', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/departments/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const { name, code, description, head_id } = req.body;
  try {
    const result = await db.query(
      `UPDATE departments
       SET name = COALESCE($1, name), code = COALESCE($2, code), description = COALESCE($3, description), head_id = $4
       WHERE id = $5 RETURNING *`,
      [name, code, description, head_id || null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Department not found' });
    res.json(result.rows[0]);
  } catch (err) {
    logError('update department failed', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/departments/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  try {
    const result = await db.query('DELETE FROM departments WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Department not found' });
    res.sendStatus(204);
  } catch (err) {
    logError('delete department failed', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Notification Routes ---

app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    logError('list notifications failed', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.sendStatus(204);
  } catch (err) {
    logError('mark notification read failed', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.user.id]);
    res.sendStatus(204);
  } catch (err) {
    logError('mark all notifications read failed', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/notifications', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM notifications WHERE user_id = $1', [req.user.id]);
    res.sendStatus(204);
  } catch (err) {
    logError('clear notifications failed', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Comment Routes ---

app.get('/api/complaints/:id/comments', authenticateToken, async (req, res) => {
  try {
    const access = await getAuthorizedComplaint(req, req.params.id);
    if (access.error) return res.status(access.status).json({ error: access.error });

    const result = await db.query(
      `SELECT
         c.id::text,
         c.complaint_id::text,
         c.user_id::text AS author_id,
         COALESCE(u.name, 'System') AS author,
         COALESCE(u.role, 'system') AS role,
         c.comment AS message,
         c.created_at AS timestamp,
         c.created_at
       FROM complaint_comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.complaint_id::text = $1
       ORDER BY c.created_at ASC`,
      [access.complaint.id]
    );
    res.json(result.rows);
  } catch (err) {
    logError('list comments failed', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/complaints/:id/comments', authenticateToken, async (req, res) => {
  const { comment } = req.body;
  if (!comment || !String(comment).trim()) return res.status(400).json({ error: 'Comment is required' });

  try {
    const access = await getAuthorizedComplaint(req, req.params.id);
    if (access.error) return res.status(access.status).json({ error: access.error });

    const result = await db.query(
      `INSERT INTO complaint_comments (complaint_id, user_id, comment)
       VALUES ($1, $2, $3)
       RETURNING id::text, complaint_id::text, user_id::text AS author_id, comment AS message, created_at AS timestamp, created_at`,
      [access.complaint.id, req.user.id, String(comment).trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logError('create comment failed', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/comments/:id', authenticateToken, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await db.query('DELETE FROM complaint_comments WHERE id::text = $1 RETURNING id', [req.params.id]);
    } else {
      result = await db.query('DELETE FROM complaint_comments WHERE id::text = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
    }
    if (!result.rows.length) return res.status(404).json({ error: 'Comment not found' });
    res.sendStatus(204);
  } catch (err) {
    logError('delete comment failed', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  process.stdout.write(`Server listening on http://localhost:${PORT}\n`);
});
