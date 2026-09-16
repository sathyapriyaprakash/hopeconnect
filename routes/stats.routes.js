const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');

// GET /api/stats - Public Platform Statistics
router.get('/', async (req, res, next) => {
  try {
    const db = await getDb();

    const usersRes = await db.query('SELECT COUNT(*) as total FROM users');
    const volsRes = await db.query("SELECT COUNT(*) as total FROM users WHERE role = 'volunteer'");
    const ngosRes = await db.query("SELECT COUNT(*) as total FROM users WHERE role = 'ngo'");
    const eventsRes = await db.query('SELECT COUNT(*) as total FROM events');
    const regsRes = await db.query("SELECT COUNT(*) as total FROM registrations WHERE status = 'Registered'");

    const getCount = (r) => {
      const row = r.rows ? r.rows[0] : (r[0] ? r[0][0] || r[0] : {});
      return row.total || row['COUNT(*)'] || 0;
    };

    res.json({
      success: true,
      stats: {
        totalUsers: getCount(usersRes),
        totalVolunteers: getCount(volsRes),
        totalNGOs: getCount(ngosRes),
        totalEvents: getCount(eventsRes),
        totalRegistrations: getCount(regsRes)
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
