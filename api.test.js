const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../server');

// Helper to start ephemeral server for testing
let server;
let baseUrl;

test.before(async () => {
  process.env.NODE_ENV = 'test';
  process.env.TEST_SECRET_TOKEN = 'test-token-secret';
  
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('GET /api/health returns correct health status', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  const data = await res.json();
  
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.status, 'UP');
  assert.strictEqual(data.hasOwnProperty('uptime'), true);
});

test('GET /api/test returns expected JSON sample', async () => {
  const res = await fetch(`${baseUrl}/api/test`);
  const data = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(Array.isArray(data.data.sampleItems), true);
});

test('POST /api/echo accepts valid JSON and echoes input', async () => {
  const res = await fetch(`${baseUrl}/api/echo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Bob', message: 'Testing echo endpoint' })
  });
  const data = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.received.name, 'Bob');
  assert.strictEqual(data.received.message, 'Testing echo endpoint');
});

test('POST /api/echo rejects malformed/missing fields with 400', async () => {
  const res = await fetch(`${baseUrl}/api/echo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '' }) // missing message & invalid name
  });
  
  assert.strictEqual(res.status, 400);
});

test('GET /api/private rejects unauthorized requests with 401', async () => {
  const res = await fetch(`${baseUrl}/api/private`);
  assert.strictEqual(res.status, 401);
});

test('GET /api/private accepts valid bearer token', async () => {
  const res = await fetch(`${baseUrl}/api/private`, {
    headers: { 'Authorization': 'Bearer test-token-secret' }
  });
  const data = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
});

test('Static file serving restricts access to private server files (server.js)', async () => {
  const res = await fetch(`${baseUrl}/server.js`);
  // Should return 404 because server.js is outside public directory
  assert.strictEqual(res.status, 404);
});
