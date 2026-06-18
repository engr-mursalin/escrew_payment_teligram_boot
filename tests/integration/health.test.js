const request = require('supertest');
const { createApp } = require('../../src/app');

describe('GET /api/health', () => {
  test('returns ok', async () => {
    const app = createApp({ controllers: { adminController: {}, webhookController: {} } });
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

