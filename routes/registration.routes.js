const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');
const { authenticateToken, authorize } = require('../middleware/auth');

// POST /api/registrations - Register for an event (Volunteer Only)
router.post('/', authenticateToken, authorize('volunteer'), async (req, res, next) => {
  try {
    const { event_id } = req.body;
    const volunteerId = req.user.id;

    if (!event_id) {
      return res.status(400).json({ success: false, message: 'Event ID is required.' });
    }

    const db = await getDb();

    // 1. Check if Event exists
    const eventResult = await db.query('SELECT * FROM events WHERE id = ?', [event_id]);
    const events = eventResult.rows || eventResult[0];

    if (!events || events.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = events[0];

    if (event.status !== 'Upcoming') {
      return res.status(400).json({ success: false, message: `Registration is closed because the event is marked as ${event.status}.` });
    }

    // 2. Prevent Registration when Event is Full (available_slots <= 0)
    if (event.available_slots <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Sorry, this event has reached its maximum volunteer capacity! No slots available.'
      });
    }

    // 3. Prevent Duplicate Event Registration
    const existingReg = await db.query(
      'SELECT id, status FROM registrations WHERE event_id = ? AND volunteer_id = ?',
      [event_id, volunteerId]
    );
    const regs = existingReg.rows || existingReg[0];

    if (regs && regs.length > 0) {
      if (regs[0].status === 'Registered') {
        return res.status(400).json({
          success: false,
          message: 'You have already registered for this event!'
        });
      } else if (regs[0].status === 'Cancelled') {
        // Re-activate cancelled registration
        await db.query('UPDATE registrations SET status = "Registered", registered_at = CURRENT_TIMESTAMP WHERE id = ?', [regs[0].id]);
        await db.query('UPDATE events SET available_slots = available_slots - 1 WHERE id = ? AND available_slots > 0', [event_id]);
        return res.json({
          success: true,
          message: 'Your registration has been successfully restored!'
        });
      }
    }

    // Insert new registration
    await db.query(
      `INSERT INTO registrations (event_id, volunteer_id, status) VALUES (?, ?, 'Registered')`,
      [event_id, volunteerId]
    );

    // Atomically decrement available slots
    await db.query(
      `UPDATE events SET available_slots = available_slots - 1 WHERE id = ? AND available_slots > 0`,
      [event_id]
    );

    res.status(201).json({
      success: true,
      message: '🎉 Congratulations! You have successfully registered for this volunteer event.'
    });

  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(400).json({ success: false, message: 'You are already registered for this event.' });
    }
    next(err);
  }
});

// DELETE /api/registrations/:eventId - Cancel Registration (Volunteer or Admin)
router.delete('/:eventId', authenticateToken, authorize('volunteer', 'admin'), async (req, res, next) => {
  try {
    const eventId = req.params.eventId;
    const volunteerId = req.user.id;

    const db = await getDb();

    // Find registration
    const regResult = await db.query(
      'SELECT * FROM registrations WHERE event_id = ? AND volunteer_id = ? AND status = "Registered"',
      [eventId, volunteerId]
    );
    const regs = regResult.rows || regResult[0];

    if (!regs || regs.length === 0) {
      return res.status(404).json({ success: false, message: 'Active registration record not found.' });
    }

    // Update status to Cancelled or delete
    await db.query(
      'UPDATE registrations SET status = "Cancelled" WHERE event_id = ? AND volunteer_id = ?',
      [eventId, volunteerId]
    );

    // Atomically increment available slots back
    await db.query(
      'UPDATE events SET available_slots = available_slots + 1 WHERE id = ?',
      [eventId]
    );

    res.json({
      success: true,
      message: 'Registration cancelled successfully. Your seat has been freed for others.'
    });

  } catch (err) {
    next(err);
  }
});

// GET /api/registrations/my-registrations - Logged-in Volunteer Registrations
router.get('/my-registrations', authenticateToken, authorize('volunteer'), async (req, res, next) => {
  try {
    const db = await getDb();
    const query = `
      SELECT r.id as registration_id, r.status as registration_status, r.registered_at,
             e.*, u.organization_name, u.name as ngo_name
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      JOIN users u ON e.ngo_id = u.id
      WHERE r.volunteer_id = ?
      ORDER BY r.registered_at DESC
    `;

    const result = await db.query(query, [req.user.id]);
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

// GET /api/registrations/event/:eventId - List of registered volunteers for an event (NGO owner or Admin)
router.get('/event/:eventId', authenticateToken, authorize('ngo', 'admin'), async (req, res, next) => {
  try {
    const eventId = req.params.eventId;
    const db = await getDb();

    // Verify ownership
    const eventResult = await db.query('SELECT ngo_id, title FROM events WHERE id = ?', [eventId]);
    const events = eventResult.rows || eventResult[0];

    if (!events || events.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (req.user.role !== 'admin' && events[0].ngo_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to attendee list.' });
    }

    const query = `
      SELECT r.id as registration_id, r.status, r.registered_at,
             u.id as volunteer_id, u.name as volunteer_name, u.email as volunteer_email, u.phone as volunteer_phone, u.city as volunteer_city
      FROM registrations r
      JOIN users u ON r.volunteer_id = u.id
      WHERE r.event_id = ? AND r.status = 'Registered'
      ORDER BY r.registered_at ASC
    `;

    const result = await db.query(query, [eventId]);
    const volunteers = result.rows || result[0];

    res.json({
      success: true,
      event_title: events[0].title,
      count: volunteers.length,
      volunteers
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
