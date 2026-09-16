const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const { getDb } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Import Routes
const authRoutes = require('./routes/auth.routes');
const eventRoutes = require('./routes/event.routes');
const registrationRoutes = require('./routes/registration.routes');
const adminRoutes = require('./routes/admin.routes');
const statsRoutes = require('./routes/stats.routes');

const app = express();

// Enable Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Frontend Assets
app.use(express.static(path.join(__dirname, 'public')));

// Register API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);

// Health Check API Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'Volunteer & NGO Event Coordination Portal REST API'
  });
});

// Fallback to index.html for SPA/Direct route handling if needed
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const pageMap = {
    '/about': 'about.html',
    '/events': 'events.html',
    '/event-detail': 'event-detail.html',
    '/login': 'login.html',
    '/register': 'register.html',
    '/dashboard-volunteer': 'dashboard-volunteer.html',
    '/dashboard-ngo': 'dashboard-ngo.html',
    '/dashboard-admin': 'dashboard-admin.html'
  };

  const targetPage = pageMap[req.path];
  if (targetPage) {
    return res.sendFile(path.join(__dirname, 'public', targetPage));
  }

  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global Error Handler
app.use(errorHandler);

// Start Server & Initialize DB
async function startServer() {
  try {
    const db = await getDb();
    const PORT = config.port;

    app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 REST API Endpoints active at http://localhost:${PORT}/api`);
      console.log(`======================================================\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
