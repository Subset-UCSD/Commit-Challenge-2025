import request from 'supertest';
import { app, startServer } from './server.mjs';

describe('Server', () => {
  let server;

  beforeAll(async () => {
    server = await startServer();
  }, 30000);

  afterAll((done) => {
    server.close(done);
  });

  it('should return the correct HTML content', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Jury Commissioner for the Superior Court');
  });
});
