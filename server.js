const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const testRoutes = require('./routes/testRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting setup
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Too many requests from this IP, please try again later.' }
});

// Apply rate limiter to all API routes
app.use('/api/', limiter);

// Middleware to parse JSON bodies with size limit (prevents oversized requests)
app.use(express.json({ limit: '10kb' }));

// Secure Static file serving: Serve ONLY the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Mount API routes
app.use('/api', testRoutes);

// 404 handler for unknown routes
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running securely on http://localhost:${PORT}`);
  });
}

module.exports = app;
