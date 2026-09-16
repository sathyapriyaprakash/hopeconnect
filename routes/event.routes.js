const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');
const { authenticateToken, authorize } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

// Helper to check user ID from token without failing if unauthenticated
function getUserIdFromReq(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    return decoded.id;
  } catch (err) {
    return null;
  }
}

// GET /api/events - Browse/Search/Filter Events
router.get('/', async (req, res, next) => {
  try {
    const { search, category, city, status, ngo_id } = req.query;
    const db = await getDb();

    let query = `
      SELECT e.*, u.name as ngo_name, u.organization_name, u.email as ngo_email, u.phone as ngo_phone
      FROM events e
      JOIN users u ON e.ngo_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category && category !== 'All') {
      query += ` AND e.category = ?`;
      params.push(category);
    }

    if (city && city !== 'All') {
      query += ` AND e.city = ?`;
      params.push(city);
    }

    if (status) {
      query += ` AND e.status = ?`;
      params.push(status);
    }

    if (ngo_id) {
      query += ` AND e.ngo_id = ?`;
      params.push(ngo_id);
    }

    query += ` ORDER BY e.event_date ASC, e.event_time ASC`;

    const result = await db.query(query, params);
    const events = result.rows || result[0];

    res.json({
      success: true,
      count: events.length,
      events
    });

  } catch (err) {
    next(err);
  }
});

// GET /api/events/ngo/my-events - NGO logged in events
router.get('/ngo/my-events', authenticateToken, authorize('ngo', 'admin'), async (req, res, next) => {
  try {
    const db = await getDb();
    let query = `
      SELECT e.*,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'Registered') as registered_count
      FROM events e
      WHERE e.ngo_id = ?
      ORDER BY e.event_date DESC
    `;
    const result = await db.query(query, [req.user.id]);
    const events = result.rows || result[0];

    res.json({
      success: true,
      events
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:id - Get Single Event Details
router.get('/:id', async (req, res, next) => {
  try {
    const db = await getDb();
    const eventId = req.params.id;

    const query = `
      SELECT e.*, u.name as ngo_name, u.organization_name, u.email as ngo_email, u.phone as ngo_phone, u.bio as ngo_bio
      FROM events e
      JOIN users u ON e.ngo_id = u.id
      WHERE e.id = ?
    `;

    const result = await db.query(query, [eventId]);
    const events = result.rows || result[0];

    if (!events || events.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = events[0];

    // Check if current user is registered
    let isUserRegistered = false;
    let registrationStatus = null;
    const currentUserId = getUserIdFromReq(req);

    if (currentUserId) {
      const regResult = await db.query(
        'SELECT status FROM registrations WHERE event_id = ? AND volunteer_id = ?',
        [eventId, currentUserId]
      );
      const regs = regResult.rows || regResult[0];
      if (regs && regs.length > 0) {
        isUserRegistered = regs[0].status === 'Registered';
        registrationStatus = regs[0].status;
      }
    }

    res.json({
      success: true,
      event,
      isUserRegistered,
      registrationStatus
    });

  } catch (err) {
    next(err);
  }
});

// POST /api/events - Create Event (NGO only)
router.post('/', authenticateToken, authorize('ngo', 'admin'), async (req, res, next) => {
  try {
    const { title, category, description, event_date, event_time, location, city, max_volunteers, image_url } = req.body;

    if (!title || !category || !description || !event_date || !event_time || !location || !city || !max_volunteers) {
      return res.status(400).json({ success: false, message: 'Please fill in all required event fields.' });
    }

    const maxVols = parseInt(max_volunteers, 10);
    if (isNaN(maxVols) || maxVols <= 0) {
      return res.status(400).json({ success: false, message: 'Maximum volunteers must be a positive number.' });
    }

    const defaultImage = image_url || 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=800&q=80';

    const db = await getDb();
    const result = await db.query(
      `INSERT INTO events (ngo_id, title, category, description, event_date, event_time, location, city, max_volunteers, available_slots, image_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Upcoming')`,
      [req.user.id, title.trim(), category, description.trim(), event_date, event_time, location.trim(), city.trim(), maxVols, maxVols, defaultImage]
    );

    res.status(201).json({
      success: true,
      message: 'Event created successfully!',
      eventId: result.insertId
    });

  } catch (err) {
    next(err);
  }
});

// PUT /api/events/:id - Edit Event (NGO owner or Admin)
router.put('/:id', authenticateToken, authorize('ngo', 'admin'), async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const { title, category, description, event_date, event_time, location, city, max_volunteers, image_url, status } = req.body;

    const db = await getDb();

    // Verify ownership or admin
    const checkResult = await db.query('SELECT ngo_id, max_volunteers, available_slots FROM events WHERE id = ?', [eventId]);
    const events = checkResult.rows || checkResult[0];

    if (!events || events.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const existingEvent = events[0];
    if (req.user.role !== 'admin' && existingEvent.ngo_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You can only edit events created by your NGO.' });
    }

    let newMax = existingEvent.max_volunteers;
    let newAvailable = existingEvent.available_slots;

    if (max_volunteers) {
      newMax = parseInt(max_volunteers, 10);
      const diff = newMax - existingEvent.max_volunteers;
      newAvailable = Math.max(0, existingEvent.available_slots + diff);
    }

    await db.query(
      `UPDATE events
       SET title = ?, category = ?, description = ?, event_date = ?, event_time = ?, location = ?, city = ?, max_volunteers = ?, available_slots = ?, image_url = ?, status = ?
       WHERE id = ?`,
      [
        title || existingEvent.title,
        category || existingEvent.category,
        description || existingEvent.description,
        event_date || existingEvent.event_date,
        event_time || existingEvent.event_time,
        location || existingEvent.location,
        city || existingEvent.city,
        newMax,
        newAvailable,
        image_url || existingEvent.image_url,
        status || existingEvent.status,
        eventId
      ]
    );

    res.json({
      success: true,
      message: 'Event updated successfully!'
    });

  } catch (err) {
    next(err);
  }
});

// DELETE /api/events/:id - Delete Event (NGO owner or Admin)
router.delete('/:id', authenticateToken, authorize('ngo', 'admin'), async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const db = await getDb();

    const checkResult = await db.query('SELECT ngo_id FROM events WHERE id = ?', [eventId]);
    const events = checkResult.rows || checkResult[0];

    if (!events || events.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (req.user.role !== 'admin' && events[0].ngo_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You can only delete events created by your NGO.' });
    }

    // Delete event (registrations cascade)
    await db.query('DELETE FROM events WHERE id = ?', [eventId]);

    res.json({
      success: true,
      message: 'Event and associated registrations deleted successfully.'
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
