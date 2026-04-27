const { pool, generateId } = require('../../database/db');

// Helper: attach timeline array to each complaint row
const attachTimelines = async (complaints) => {
  if (complaints.length === 0) return complaints;
  const ids = complaints.map((c) => c.id);
  const [timelineRows] = await pool.query(
    'SELECT * FROM complaint_timeline WHERE complaint_id IN (?) ORDER BY created_at',
    [ids]
  );

  const timelineMap = {};
  for (const row of timelineRows) {
    if (!timelineMap[row.complaint_id]) timelineMap[row.complaint_id] = [];
    timelineMap[row.complaint_id].push({
      status: row.status,
      note: row.note,
      by: row.by_user,
      timestamp: row.created_at
    });
  }

  return complaints.map((c) => ({
    ...c,
    departmentId: c.department_id,
    timeline: timelineMap[c.id] || []
  }));
};

const getComplaints = async () => {
  const [rows] = await pool.query('SELECT * FROM complaints ORDER BY created_at DESC');
  return attachTimelines(rows);
};

const getComplaintsByField = async (field, value) => {
  const allowed = ['citizen_id', 'department_id', 'id'];
  if (!allowed.includes(field)) throw new Error('Invalid field');
  const [rows] = await pool.query(`SELECT * FROM complaints WHERE ${field} = ? ORDER BY created_at DESC`, [value]);
  return attachTimelines(rows);
};

const getComplaintById = async (id) => {
  const results = await getComplaintsByField('id', id);
  return results.length ? results[0] : null;
};

const createComplaint = async (payload) => {
  const id = generateId('CMP');
  const now = new Date();

  await pool.query(
    `INSERT INTO complaints (id, citizen_id, title, description, category, department, department_id, evidence, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Submitted')`,
    [id, payload.citizen_id, payload.title, payload.description, payload.category, payload.department, payload.departmentId, payload.evidence || null]
  );

  await pool.query(
    'INSERT INTO complaint_timeline (complaint_id, status, note, created_at) VALUES (?, ?, ?, ?)',
    [id, 'Submitted', 'Complaint created by citizen', now]
  );

  return getComplaintById(id);
};

const updateComplaint = async (id, data) => {
  const sets = [];
  const params = [];

  if (data.status) { sets.push('status = ?'); params.push(data.status); }
  if (data.officer_remarks !== undefined) { sets.push('officer_remarks = ?'); params.push(data.officer_remarks); }
  if (data.officer_id) { sets.push('officer_id = ?'); params.push(data.officer_id); }
  if (data.departmentId) { sets.push('department_id = ?'); params.push(data.departmentId); }
  if (data.department) { sets.push('department = ?'); params.push(data.department); }

  if (sets.length > 0) {
    params.push(id);
    await pool.query(`UPDATE complaints SET ${sets.join(', ')} WHERE id = ?`, params);
  }

  // Add timeline entry
  if (data.timelineNote) {
    await pool.query(
      'INSERT INTO complaint_timeline (complaint_id, status, note, by_user) VALUES (?, ?, ?, ?)',
      [id, data.status || 'Updated', data.timelineNote, data.timelineBy || null]
    );
  }

  return getComplaintById(id);
};

module.exports = { getComplaints, getComplaintsByField, getComplaintById, createComplaint, updateComplaint };
