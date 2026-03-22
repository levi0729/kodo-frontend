require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local dev frontends (any localhost:517x) + non-browser tools.
      if (!origin) return callback(null, true);
      if (origin.startsWith('http://localhost:517')) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', require('./routes/users'));
app.use('/api', require('./routes/teams'));
app.use('/api', require('./routes/projects'));
app.use('/api', require('./routes/tasks'));
app.use('/api', require('./routes/messages'));
app.use('/api', require('./routes/calendar'));
app.use('/api', require('./routes/files'));
app.use('/api', require('./routes/notifications'));
app.use('/api', require('./routes/settings'));
app.use('/api', require('./routes/dashboard'));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Kodo API server running on http://localhost:${PORT}`);
});
