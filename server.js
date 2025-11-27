const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Import routes
const flowsRouter = require('./routes/flows');
app.use('/api/flows', flowsRouter);

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Database Flow Visualizer is running' });
});

// Serve the main application for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Database Flow Visualizer server running on http://localhost:${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
});

module.exports = app;