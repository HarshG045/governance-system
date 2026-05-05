const express = require('express');
const db = require('./db');
const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(express.json());

function normalizeComplaintId(value) {
  const matches = String(value).match(/\d+/g);
  if (!matches || matches.length === 0) return NaN;
  return Number(matches[matches.length - 1]);
}

function serializeAttachments(attachments) {
  if (typeof attachments === 'string') return attachments;
  if (Array.isArray(attachments)) return JSON.stringify(attachments);
  return '[]';
}

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Create complaint
app.post('/api/complaints', async (req, res) => {
  const { title, description, user_id, category, department, priority, location, attachments } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  try {
    const result = await db.query(
      `INSERT INTO complaints(title, description, user_id, category, department, priority, location, attachments)
       VALUES($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        title,
        description || null,
        user_id || null,
        category || null,
        department || null,
        priority || null,
        location || null,
        serializeAttachments(attachments),
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

app.put('/api/complaints/:id', async (req, res) => {
  const numericId = normalizeComplaintId(req.params.id);
  const { title, description, user_id, category, department, priority, location, attachments } = req.body;
  if (Number.isNaN(numericId)) return res.status(400).json({ error: 'invalid id' });
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  try {
    const result = await db.query(
      `UPDATE complaints
       SET title = $1,
           description = $2,
           category = $3,
           department = $4,
           priority = $5,
           location = $6,
           attachments = $7,
           updated_at = now()
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [
        title,
        description || null,
        category || null,
        department || null,
        priority || null,
        location || null,
        serializeAttachments(attachments),
        numericId,
        user_id,
      ]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// List complaints (optionally by user)
app.get('/api/complaints', async (req, res) => {
  const { userId } = req.query;
  try {
    let q = 'SELECT * FROM complaints';
    const params = [];
    if (userId) {
      q += ' WHERE user_id = $1';
      params.push(userId);
    }
    q += ' ORDER BY created_at DESC';
    const result = await db.query(q, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Get complaint by id
app.get('/api/complaints/:id', async (req, res) => {
  const numericId = normalizeComplaintId(req.params.id);
  if (Number.isNaN(numericId)) return res.status(400).json({ error: 'invalid id' });
  try {
    const result = await db.query('SELECT * FROM complaints WHERE id = $1', [numericId]);
    if (!result.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Update status
app.put('/api/complaints/:id/status', async (req, res) => {
  const numericId = normalizeComplaintId(req.params.id);
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status required' });
  if (Number.isNaN(numericId)) return res.status(400).json({ error: 'invalid id' });
  try {
    const result = await db.query(
      'UPDATE complaints SET status = $1, updated_at = now() WHERE id = $2 RETURNING *',
      [status, numericId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

app.put('/api/complaints/:id/cancel', async (req, res) => {
  const numericId = normalizeComplaintId(req.params.id);
  if (Number.isNaN(numericId)) return res.status(400).json({ error: 'invalid id' });
  try {
    const result = await db.query(
      "UPDATE complaints SET status = 'cancelled', updated_at = now() WHERE id = $1 RETURNING *",
      [numericId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
