import request from 'supertest';
import app from '../index.js';
import { logIfNotSuccess } from './testHelpers.js';

let accessToken: string;
let workspaceId: string;
let projectId: string;
let commentId: string;

beforeAll(async () => {
  const email = `commentuser+${Date.now()}@example.com`;

  const reg = await request(app).post('/api/auth/register').send({
    id:commentId,
    name: 'Comment User',
    email,
    password: 'Test1234',
  });
  logIfNotSuccess(reg);
  if (reg.statusCode !== 201) {
    throw new Error(`Comment setup register failed: ${JSON.stringify(reg.body)}`);
  }

  const res = await request(app).post('/api/auth/login').send({
    email,
    password: 'Test1234',
  });
  logIfNotSuccess(res);
  if (res.statusCode !== 200) {
    throw new Error(`Comment setup login failed: ${JSON.stringify(res.body)}`);
  }
  accessToken = res.body.data.accessToken;

  const wsRes = await request(app)
    .post('/api/workspaces')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ name: 'Comment Workspace' });
  logIfNotSuccess(wsRes);
  if (wsRes.statusCode !== 201) {
    throw new Error(`Comment setup workspace failed: ${JSON.stringify(wsRes.body)}`);
  }
  workspaceId = wsRes.body.data.workspaceId;

  const prjRes = await request(app)
    .post(`/api/workspaces/${workspaceId}/projects`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ title: 'Comment Project' });
  logIfNotSuccess(prjRes);
  if (prjRes.statusCode !== 201) {
    throw new Error(`Comment setup project failed: ${JSON.stringify(prjRes.body)}`);
  }
  projectId = prjRes.body.data.newProjectId;
});

describe('Comment API', () => {
  it('should add a comment', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ comment: 'Test comment' });
    logIfNotSuccess(res);
    expect(res.statusCode).toBe(201);
    commentId = res.body.data.newCommentId;
  });

  it('should list comments', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`);
    logIfNotSuccess(res);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

