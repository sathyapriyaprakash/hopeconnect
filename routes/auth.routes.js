const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../config/db');
const config = require('../config/config');
const { authenticateToken } = require('../middleware/auth');

// Register Endpoint
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role, phone, organization_name, city, bio } = req.body;

    // Input Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, password, and role.' });
    }

    if (!['volunteer', 'ngo'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be either volunteer or ngo.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const db = await getDb();

    // Check if user already exists
    const existingUsers = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    const foundUsers = existingUsers.rows || existingUsers[0];
    if (foundUsers && foundUsers.length > 0) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert User
    const insertResult = await db.query(
      `INSERT INTO users (name, email, password, role, phone, organization_name, city, bio)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        email.toLowerCase().trim(),
        hashedPassword,
        role,
        phone || null,
        role === 'ngo' ? (organization_name || name) : null,
        city || null,
        bio || null
      ]
    );

    const userId = insertResult.insertId;

    // Generate JWT Token
    const payload = { id: userId, name: name.trim(), email: email.toLowerCase().trim(), role };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '24h' });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to the portal.',
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role,
        phone,
        organization_name: role === 'ngo' ? (organization_name || name) : null,
        city,
        bio
      }
    });

  } catch (err) {
    next(err);
  }
});

// Login Endpoint
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const db = await getDb();
    const result = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    const users = result.rows || result[0];

    if (!users || users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = users[0];

    // Verify Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Generate JWT Token
    const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '24h' });

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        organization_name: user.organization_name,
        city: user.city,
        bio: user.bio,
        created_at: user.created_at
      }
    });

  } catch (err) {
    next(err);
  }
});

// Get Current User Profile
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const db = await getDb();
    const result = await db.query(
      'SELECT id, name, email, role, phone, organization_name, city, bio, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    const users = result.rows || result[0];

    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (err) {
    next(err);
  }
});

// Update Profile
router.put('/profile', authenticateToken, async (req, res, next) => {
  try {
    const { name, phone, city, organization_name, bio } = req.body;
    const db = await getDb();

    await db.query(
      `UPDATE users SET name = ?, phone = ?, city = ?, organization_name = ?, bio = ? WHERE id = ?`,
      [name || req.user.name, phone || null, city || null, organization_name || null, bio || null, req.user.id]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully!'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
