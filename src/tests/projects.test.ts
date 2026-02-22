import request from 'supertest';
import app from '../index.js';

let accessToken: string;
let workspaceId: string;
let projectId: string;

beforeAll(async () => {
  await request(app).post('/api/auth/register').send({
    name: 'Project User',
    email: 'projectuser@example.com',
    password: 'Test1234'
  });
  const res = await request(app).post('/api/auth/login').send({
    email: 'projectuser@example.com',
    password: 'Test1234'
  });
  accessToken = res.body.data.accessToken;

  const wsRes = await request(app)
    .post('/api/workspaces')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ name: 'Project Workspace' });
  workspaceId = wsRes.body.data.workspaceId;
});

describe('Project API', () => {
  it('should create a project', async () => {
    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/projects`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Test Project', description: 'A test project' });
    expect(res.statusCode).toBe(201);
    projectId = res.body.data.newProjectId;
  });

  it('should list projects', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/comments`) 
    expect(res.statusCode).toBe(200);
  });
});