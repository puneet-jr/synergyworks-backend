import request from 'supertest';
import app from '../index.js';
import { logIfNotSuccess } from './testHelpers.js';

// Use a unique email per test run so re-running tests doesn't fail on duplicate email
const email = `testuser+${Date.now()}@example.com`;

describe('Auth API', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email,
        password: 'Test1234'
      });
    logIfNotSuccess(res);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(email);
  });

  it('should login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email,
        password: 'Test1234'
      });
    logIfNotSuccess(res);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.accessToken).toBeDefined();
  });
});