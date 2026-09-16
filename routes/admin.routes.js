const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');
const { authenticateToken, authorize } = require('../middleware/auth');

// All routes in this file require Admin authorization
router.use(authenticateToken, authorize('admin'));

// GET /api/admin/users - Get all registered users filtered by role
router.get('/users', async (req, res, next) => {
  try {
    const { role } = req.query;
    const db = await getDb();

    let query = 'SELECT id, name, email, role, phone, organization_name, city, created_at FROM users WHERE 1=1';
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    const users = result.rows || result[0];

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/users/:id - Delete User Account (and their events/registrations)
router.delete('/users/:id', async (req, res, next) => {
  try {
    const userId = req.params.id;
    const db = await getDb();

    if (parseInt(userId, 10) === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
    }

    await db.query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({
      success: true,
      message: 'User account and associated records deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/registrations - View all platform registrations
router.get('/registrations', async (req, res, next) => {
  try {
    const db = await getDb();
    const query = `
      SELECT r.id as registration_id, r.status, r.registered_at,
             u.name as volunteer_name, u.email as volunteer_email, u.phone as volunteer_phone,
             e.title as event_title, ngo.name as ngo_name
      FROM registrations r
      JOIN users u ON r.volunteer_id = u.id
      JOIN events e ON r.event_id = e.id
      JOIN users ngo ON e.ngo_id = ngo.id
      ORDER BY r.registered_at DESC
    `;

    const result = await db.query(query);
    const registrations = result.rows || result[0];

    res.json({
      success: true,
      count: registrations.length,
      registrations
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
