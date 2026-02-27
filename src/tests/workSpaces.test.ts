import request from 'supertest';
import app from '../index.js';
import { logIfNotSuccess } from './testHelpers.js';

let accessToken: string;

beforeAll(async () => {
  const email = `workspaceuser+${Date.now()}@example.com`;

  const reg = await request(app).post('/api/auth/register').send({
    name: 'Workspace User',
    email,
    password: 'Test1234',
  });
  logIfNotSuccess(reg);
  if (reg.statusCode !== 201) {
    throw new Error(`Workspace setup register failed: ${JSON.stringify(reg.body)}`);
  }

  const res = await request(app).post('/api/auth/login').send({
    email,
    password: 'Test1234',
  });
  logIfNotSuccess(res);
  if (res.statusCode !== 200) {
    throw new Error(`Workspace setup login failed: ${JSON.stringify(res.body)}`);
  }

  accessToken = res.body.data.accessToken;
});

describe('Workspace API', () => {
  let workspaceId: string;

  it('should create a workspace', async () => {
    const res = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Test Workspace', description: 'A test workspace' });
    logIfNotSuccess(res);
    expect(res.statusCode).toBe(201);
    workspaceId = res.body.data.workspaceId;
  });

  it('should list workspaces', async () => {
    const res = await request(app)
      .get('/api/workspaces')
      .set('Authorization', `Bearer ${accessToken}`);
    logIfNotSuccess(res);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.workspaces)).toBe(true);
  });

  it('should get workspace by id', async () => {
    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    logIfNotSuccess(res);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.workspace.id).toBe(workspaceId);
  });
});

