const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/users/me — current user (id=1)
router.get('/users/me', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = 1 AND deleted_at IS NULL');
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// GET /api/users — all active users
router.get('/users', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, username, display_name, job_title, department, avatar_url, presence_status, presence_message, is_active FROM users WHERE is_active = 1 AND deleted_at IS NULL'
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/users/:id
router.get('/users/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, username, display_name, job_title, department, avatar_url, presence_status, presence_message FROM users WHERE id = ? AND deleted_at IS NULL',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/users/:id — update profile
router.put('/users/:id', async (req, res, next) => {
  try {
    const { display_name, username, job_title, department } = req.body;
    await pool.query(
      'UPDATE users SET display_name=?, username=?, job_title=?, department=? WHERE id=?',
      [display_name, username, job_title, department, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
