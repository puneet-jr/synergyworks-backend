import request from 'supertest';
import app from '../index.js';

let accessToken: string;

beforeAll(async () => {
  await request(app).post('/api/auth/register').send({
    name: 'Workspace User',
    email: 'workspaceuser@example.com',
    password: 'Test1234'
  });
  const res = await request(app).post('/api/auth/login').send({
    email: 'workspaceuser@example.com',
    password: 'Test1234'
  });
  accessToken = res.body.data.accessToken;
});

describe('Workspace API', () => {
  let workspaceId: string;

  it('should create a workspace', async () => {
    const res = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Test Workspace', description: 'A test workspace' });
    expect(res.statusCode).toBe(201);
    workspaceId = res.body.data.workspaceId;
  });

  it('should list workspaces', async () => {
    const res = await request(app)
      .get('/api/workspaces')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.workspaces)).toBe(true);
  });

  it('should get workspace by id', async () => {
    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.workspace.id).toBe(workspaceId);
  });
});