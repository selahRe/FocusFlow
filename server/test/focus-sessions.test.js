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
  await pool.query('DELETE FROM focus_sessions WHERE notes = ?', ['vitest']);
});

afterAll(async () => {
  await pool.query('DELETE FROM focus_sessions WHERE notes = ?', ['vitest']);
  await pool.end();
});

describe('focus session API', () => {
  it('creates a focus session with ISO timestamps', async () => {
    const payload = {
      task_id: null,
      start_time: new Date('2026-02-28T10:00:00.000Z').toISOString(),
      end_time: new Date('2026-02-28T10:20:00.000Z').toISOString(),
      planned_duration: 20,
      actual_duration: 20,
      interruptions: 0,
      focus_score: 90,
      mood_before: 'calm',
      mood_after: 'focused',
      notes: 'vitest'
    };

    const res = await request(app)
      .post('/api/focus-sessions')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.id).toBeTruthy();
    expect(res.body.planned_duration).toBe(20);
    expect(res.body.actual_duration).toBe(20);
    expect(res.body.focus_score).toBe(90);
  });
});
