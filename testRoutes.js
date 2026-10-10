const express = express || require('express');
const router = express.Router();

// GET /api/health
router.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// GET /api/test
router.get('/test', (req, res) => {
  res.json({
    message: 'Hello from the backend API!',
    success: true,
    data: {
      itemsCount: 3,
      sampleItems: ['Alpha', 'Beta', 'Gamma']
    }
  });
});

// POST /api/echo
router.post('/echo', (req, res, next) => {
  try {
    const { name, message } = req.body || {};

    // Basic validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      const err = new Error('Invalid or missing "name" field.');
      err.statusCode = 400;
      return next(err);
    }

    if (!message || typeof message !== 'string' || message.trim() === '') {
      const err = new Error('Invalid or missing "message" field.');
      err.statusCode = 400;
      return next(err);
    }

    // Reject oversized requests
    if (name.length > 100 || message.length > 500) {
      const err = new Error('Input fields exceed maximum allowed length.');
      err.statusCode = 400;
      return next(err);
    }

    // Return permitted input fields only
    res.json({
      success: true,
      received: {
        name: name.trim(),
        message: message.trim()
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/private
router.get('/private', (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const expectedToken = process.env.TEST_SECRET_TOKEN;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = new Error('Unauthorized: Missing or invalid authorization token.');
    err.statusCode = 401;
    return next(err);
  }

  const token = authHeader.split(' ')[1];

  if (token !== expectedToken) {
    const err = new Error('Unauthorized: Invalid token.');
    err.statusCode = 401;
    return next(err);
  }

  res.json({
    success: true,
    message: 'Access granted to private endpoint.',
    data: 'Confidential system metrics confirmed secure.'
  });
});

module.exports = router;
