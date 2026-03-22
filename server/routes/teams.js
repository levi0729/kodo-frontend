const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/teams — all teams for org 1, with members and projects embedded
router.get('/teams', async (req, res, next) => {
  try {
    const [teams] = await pool.query(
      `SELECT t.* FROM teams t WHERE t.organization_id = 1 AND t.deleted_at IS NULL AND t.is_archived = 0`
    );

    // For each team, fetch members and projects
    const result = await Promise.all(teams.map(async (team) => {
      const [members] = await pool.query(
        `SELECT u.id, u.username, u.display_name, u.job_title, u.department, u.avatar_url, u.presence_status, u.presence_message, tm.role
         FROM team_members tm JOIN users u ON tm.user_id = u.id
         WHERE tm.team_id = ? AND u.deleted_at IS NULL`,
        [team.id]
      );
      const [projects] = await pool.query(
        `SELECT id, name, slug, color, status, start_date, target_end_date FROM projects WHERE team_id = ? AND deleted_at IS NULL`,
        [team.id]
      );
      return { ...team, members, projects };
    }));

    res.json(result);
  } catch (err) { next(err); }
});

// GET /api/teams/:id/members
router.get('/teams/:id/members', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.display_name, u.job_title, u.department, u.avatar_url, u.presence_status, u.presence_message, tm.role
       FROM team_members tm JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = ? AND u.deleted_at IS NULL`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
