import request from 'supertest';
import app from '../index.js';

let accessToken: string;
let workspaceId: string;
let projectId: string;
let commentId: string;

beforeAll(async () => {
  await request(app).post('/api/auth/register').send({
    name: 'Comment User',
    email: 'commentuser@example.com',
    password: 'Test1234'
  });
  const res = await request(app).post('/api/auth/login').send({
    email: 'commentuser@example.com',
    password: 'Test1234'
  });
  accessToken = res.body.data.accessToken;

  const wsRes = await request(app)
    .post('/api/workspaces')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ name: 'Comment Workspace' });
  workspaceId = wsRes.body.data.workspaceId;

  const prjRes = await request(app)
    .post(`/api/workspaces/${workspaceId}/projects`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ title: 'Comment Project' });
  projectId = prjRes.body.data.newProjectId;
});

describe('Comment API', () => {
  it('should add a comment', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ comment: 'Test comment' });
    expect(res.statusCode).toBe(201);
    commentId = res.body.data.newCommentId;
  });

  it('should list comments', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});