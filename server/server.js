// server.js
// Main entry point for the Express backend.
// MongoDB has been removed — the server is now fully stateless.
// Test run history is stored in the browser (localStorage).

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const testRoutes = require('./routes/testRoutes');
const demoRoutes = require('./routes/demoRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(express.json());

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api', testRoutes);
app.use('/api/products', demoRoutes);
app.use('/api', demoRoutes);

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API Fuzzing Generator backend is running (no DB).',
    timestamp: new Date().toISOString()
  });
});

// ── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error.', message: err.message });
});

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`📋 Health check:      http://localhost:${PORT}/health`);
  console.log(`🛍️  Demo - Products:  http://localhost:${PORT}/api/products`);
  console.log(`👤 Demo - Users:     http://localhost:${PORT}/api/users`);
  console.log(`🔧 Fuzzing API:      http://localhost:${PORT}/api/tests/generate\n`);
});
