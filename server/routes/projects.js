const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/projects/user/:userId — projects accessible to user (via team membership)
router.get('/projects/user/:userId', async (req, res, next) => {
  try {
    const [projects] = await pool.query(
      `SELECT p.*, COALESCE(pts.completion_percentage, 0) AS progress
       FROM projects p
       JOIN teams t ON p.team_id = t.id
       JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = ?
       LEFT JOIN v_project_task_summary pts ON pts.project_id = p.id
       WHERE p.deleted_at IS NULL AND t.deleted_at IS NULL
       ORDER BY p.created_at DESC`,
      [req.params.userId]
    );
    res.json(projects);
  } catch (err) { next(err); }
});

// GET /api/projects/:id
router.get('/projects/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, COALESCE(pts.completion_percentage, 0) AS progress
       FROM projects p
       LEFT JOIN v_project_task_summary pts ON pts.project_id = p.id
       WHERE p.id = ? AND p.deleted_at IS NULL`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Project not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// GET /api/projects/:id/members — team members of a project
router.get('/projects/:id/members', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.display_name, u.job_title, u.avatar_url, u.presence_status
       FROM projects p
       JOIN team_members tm ON tm.team_id = p.team_id
       JOIN users u ON u.id = tm.user_id
       WHERE p.id = ? AND u.deleted_at IS NULL`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
