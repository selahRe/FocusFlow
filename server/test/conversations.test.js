import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';

let app;
let initDb;
let pool;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.LLM_API_URL = '';
  process.env.LLM_TOKEN = '';

  const serverModule = await import('../index.js');
  app = serverModule.app;
  initDb = serverModule.initDb;
  pool = serverModule.pool;

  await initDb();
});

afterAll(async () => {
  await pool.end();
});

describe('conversation API', () => {
  it('creates a conversation and persists messages', async () => {
    const createRes = await request(app)
      .post('/api/conversations')
      .send({ metadata: { name: 'test' } });

    expect(createRes.status).toBe(200);
    const id = createRes.body.id;
    expect(id).toBeTruthy();

    const msgRes = await request(app)
      .post(`/api/conversations/${id}/messages`)
      .send({ role: 'user', content: 'hello' });

    expect(msgRes.status).toBe(200);
    const messages = msgRes.body.messages || [];
    expect(messages.some((m) => m.role === 'user' && m.content === 'hello')).toBe(true);
    expect(messages.some((m) => m.role === 'assistant')).toBe(true);
  });
});
