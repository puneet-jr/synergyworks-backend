import request from 'supertest';
import app from '../index.js';
import { logIfNotSuccess } from './testHelpers.js';

let accessToken: string;
let workspaceId: string;
let projectId: string;

beforeAll(async () => {
  const email = `projectuser+${Date.now()}@example.com`;

  const reg = await request(app).post('/api/auth/register').send({
    id:projectId,
    name: 'Project User',
    email,
    password: 'Test1234',
  });
  logIfNotSuccess(reg);
  if (reg.statusCode !== 201) {
    throw new Error(`Project setup register failed: ${JSON.stringify(reg.body)}`);
  }

  const res = await request(app).post('/api/auth/login').send({
    email,
    password: 'Test1234',
  });
  logIfNotSuccess(res);
  if (res.statusCode !== 200) {
    throw new Error(`Project setup login failed: ${JSON.stringify(res.body)}`);
  }
  accessToken = res.body.data.accessToken;

  const wsRes = await request(app)
    .post('/api/workspaces')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ name: 'Project Workspace' });
  logIfNotSuccess(wsRes);
  if (wsRes.statusCode !== 201) {
    throw new Error(`Project setup workspace failed: ${JSON.stringify(wsRes.body)}`);
  }
  workspaceId = wsRes.body.data.workspaceId;
});

describe('Project API', () => {
  it('should create a project', async () => {
    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/projects`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Test Project', description: 'A test project' });
    logIfNotSuccess(res);
    expect(res.statusCode).toBe(201);
    projectId = res.body.data.newProjectId;
  });

  it('should list projects', async () => {
    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}/projects`)
      .set('Authorization', `Bearer ${accessToken}`);
    logIfNotSuccess(res);
    expect(res.statusCode).toBe(200);
    // listProjects returns data = ProjectRow[]
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});