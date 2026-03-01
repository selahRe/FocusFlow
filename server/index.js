import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server/.env first, then fallback to process env
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const {
  DB_HOST = '127.0.0.1',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'focusflow',
  LLM_API_URL = '',
  LLM_TOKEN = '',
  LLM_MODEL = 'deepseek-chat',
  COACH_SYSTEM_PROMPT = ''
} = process.env;

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const pool = mysql.createPool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

const initDb = async () => {
  await pool.query(`CREATE TABLE IF NOT EXISTS tasks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_minutes INT,
    actual_minutes INT,
    intensity VARCHAR(20),
    category VARCHAR(20),
    scheduled_date DATE,
    status VARCHAR(20),
    subtasks JSON,
    priority INT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS habit_anchors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    anchor_habit VARCHAR(255),
    new_habit VARCHAR(255),
    minimum_version VARCHAR(255),
    full_version VARCHAR(255),
    time_of_day VARCHAR(20),
    stack_phrase VARCHAR(255),
    streak INT DEFAULT 0,
    completed_today TINYINT(1) DEFAULT 0,
    last_completed_date DATE,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS user_preferences (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    constraint_level VARCHAR(20),
    peak_hours JSON,
    lock_screen_enabled TINYINT(1),
    preferred_session_duration INT,
    break_duration INT,
    reminder_frequency VARCHAR(20),
    daily_focus_goal INT,
    reward_per_session INT,
    total_reward_minutes INT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS daily_stats (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    date DATE UNIQUE,
    total_focus_minutes INT,
    tasks_completed INT,
    subtasks_completed INT,
    interruptions INT,
    streak_days INT,
    reward_earned INT,
    reward_used INT,
    average_focus_score INT,
    focus_by_hour JSON,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS focus_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_id BIGINT,
    start_time DATETIME,
    end_time DATETIME,
    planned_duration INT,
    actual_duration INT,
    interruptions INT,
    focus_score INT,
    mood_before VARCHAR(20),
    mood_after VARCHAR(20),
    notes TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
};

const parseOrder = (order, defaultColumn = 'created_date') => {
  if (!order) return { column: defaultColumn, direction: 'DESC' };
  const direction = order.startsWith('-') ? 'DESC' : 'ASC';
  const column = order.replace(/^[+-]/, '') || defaultColumn;
  return { column, direction };
};

const normalizeJson = (value) => {
  if (value == null) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
};

const toJsonString = (value) => {
  if (value == null) return null;
  return JSON.stringify(value);
};

const normalizeRows = (rows, jsonFields = []) => {
  return rows.map((row) => {
    const next = { ...row };
    jsonFields.forEach((field) => {
      next[field] = normalizeJson(next[field]);
    });
    return next;
  });
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Tasks
app.get('/api/tasks', async (req, res) => {
  const { scheduled_date, status, order, limit } = req.query;
  const { column, direction } = parseOrder(order, 'created_date');
  const where = [];
  const params = [];
  if (scheduled_date) {
    where.push('scheduled_date = ?');
    params.push(scheduled_date);
  }
  if (status) {
    where.push('status = ?');
    params.push(status);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const limitSql = limit ? 'LIMIT ?' : '';
  if (limit) params.push(Number(limit));

  const [rows] = await pool.query(
    `SELECT * FROM tasks ${whereSql} ORDER BY ${column} ${direction} ${limitSql}`,
    params
  );
  res.json(normalizeRows(rows, ['subtasks']));
});

app.get('/api/tasks/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
  const data = normalizeRows(rows, ['subtasks']);
  res.json(data[0] || null);
});

app.post('/api/tasks', async (req, res) => {
  const data = { ...req.body, subtasks: toJsonString(req.body.subtasks) };
  const [result] = await pool.query(
    `INSERT INTO tasks (title, description, estimated_minutes, actual_minutes, intensity, category, scheduled_date, status, subtasks, priority, updated_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)` ,
    [
      data.title,
      data.description,
      data.estimated_minutes,
      data.actual_minutes,
      data.intensity,
      data.category,
      data.scheduled_date,
      data.status,
      data.subtasks,
      data.priority
    ]
  );
  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
  res.json(normalizeRows(rows, ['subtasks'])[0]);
});

app.put('/api/tasks/:id', async (req, res) => {
  const data = { ...req.body };
  const fields = [];
  const params = [];
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'subtasks') {
      fields.push(`${key} = ?`);
      params.push(toJsonString(value));
    } else {
      fields.push(`${key} = ?`);
      params.push(value);
    }
  });
  fields.push('updated_date = CURRENT_TIMESTAMP');
  if (!fields.length) {
    return res.json(null);
  }
  params.push(req.params.id);
  await pool.query(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, params);
  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
  res.json(normalizeRows(rows, ['subtasks'])[0]);
});

app.delete('/api/tasks/:id', async (req, res) => {
  await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// Habit Anchors
app.get('/api/habit-anchors', async (req, res) => {
  const { order, limit } = req.query;
  const { column, direction } = parseOrder(order, 'created_date');
  const limitSql = limit ? 'LIMIT ?' : '';
  const params = limit ? [Number(limit)] : [];
  const [rows] = await pool.query(
    `SELECT * FROM habit_anchors ORDER BY ${column} ${direction} ${limitSql}`,
    params
  );
  res.json(rows);
});

app.post('/api/habit-anchors', async (req, res) => {
  const data = req.body;
  const [result] = await pool.query(
    `INSERT INTO habit_anchors
      (anchor_habit, new_habit, minimum_version, full_version, time_of_day, stack_phrase, streak, completed_today, last_completed_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
    [
      data.anchor_habit,
      data.new_habit,
      data.minimum_version,
      data.full_version,
      data.time_of_day,
      data.stack_phrase,
      data.streak || 0,
      data.completed_today ? 1 : 0,
      data.last_completed_date || null
    ]
  );
  const [rows] = await pool.query('SELECT * FROM habit_anchors WHERE id = ?', [result.insertId]);
  res.json(rows[0]);
});

app.put('/api/habit-anchors/:id', async (req, res) => {
  const data = { ...req.body };
  const fields = [];
  const params = [];
  Object.entries(data).forEach(([key, value]) => {
    fields.push(`${key} = ?`);
    if (key === 'completed_today') {
      params.push(value ? 1 : 0);
    } else {
      params.push(value);
    }
  });
  params.push(req.params.id);
  await pool.query(`UPDATE habit_anchors SET ${fields.join(', ')} WHERE id = ?`, params);
  const [rows] = await pool.query('SELECT * FROM habit_anchors WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
});

app.delete('/api/habit-anchors/:id', async (req, res) => {
  await pool.query('DELETE FROM habit_anchors WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// User Preferences
app.get('/api/user-preferences', async (req, res) => {
  const { order, limit } = req.query;
  const { column, direction } = parseOrder(order, 'created_date');
  const limitSql = limit ? 'LIMIT ?' : '';
  const params = limit ? [Number(limit)] : [];
  const [rows] = await pool.query(
    `SELECT * FROM user_preferences ORDER BY ${column} ${direction} ${limitSql}`,
    params
  );
  res.json(normalizeRows(rows, ['peak_hours']));
});

app.post('/api/user-preferences', async (req, res) => {
  const data = req.body;
  const [result] = await pool.query(
    `INSERT INTO user_preferences
      (constraint_level, peak_hours, lock_screen_enabled, preferred_session_duration, break_duration, reminder_frequency,
       daily_focus_goal, reward_per_session, total_reward_minutes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
    [
      data.constraint_level,
      toJsonString(data.peak_hours),
      data.lock_screen_enabled ? 1 : 0,
      data.preferred_session_duration,
      data.break_duration,
      data.reminder_frequency,
      data.daily_focus_goal,
      data.reward_per_session,
      data.total_reward_minutes || 0
    ]
  );
  const [rows] = await pool.query('SELECT * FROM user_preferences WHERE id = ?', [result.insertId]);
  res.json(normalizeRows(rows, ['peak_hours'])[0]);
});

app.put('/api/user-preferences/:id', async (req, res) => {
  const data = { ...req.body };
  const fields = [];
  const params = [];
  Object.entries(data).forEach(([key, value]) => {
    fields.push(`${key} = ?`);
    if (key === 'lock_screen_enabled') {
      params.push(value ? 1 : 0);
    } else if (key === 'peak_hours') {
      params.push(toJsonString(value));
    } else {
      params.push(value);
    }
  });
  params.push(req.params.id);
  await pool.query(`UPDATE user_preferences SET ${fields.join(', ')} WHERE id = ?`, params);
  const [rows] = await pool.query('SELECT * FROM user_preferences WHERE id = ?', [req.params.id]);
  res.json(normalizeRows(rows, ['peak_hours'])[0]);
});

// Daily Stats
app.get('/api/daily-stats', async (req, res) => {
  const { date, order, limit } = req.query;
  const { column, direction } = parseOrder(order, 'date');
  const where = [];
  const params = [];
  if (date) {
    where.push('date = ?');
    params.push(date);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const limitSql = limit ? 'LIMIT ?' : '';
  if (limit) params.push(Number(limit));
  const [rows] = await pool.query(
    `SELECT * FROM daily_stats ${whereSql} ORDER BY ${column} ${direction} ${limitSql}`,
    params
  );
  res.json(normalizeRows(rows, ['focus_by_hour']));
});

app.post('/api/daily-stats', async (req, res) => {
  const data = req.body;
  const [result] = await pool.query(
    `INSERT INTO daily_stats (date, total_focus_minutes, tasks_completed, subtasks_completed, interruptions, streak_days, reward_earned, reward_used, average_focus_score, focus_by_hour)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
    [
      data.date,
      data.total_focus_minutes,
      data.tasks_completed,
      data.subtasks_completed,
      data.interruptions,
      data.streak_days,
      data.reward_earned,
      data.reward_used,
      data.average_focus_score,
      toJsonString(data.focus_by_hour)
    ]
  );
  const [rows] = await pool.query('SELECT * FROM daily_stats WHERE id = ?', [result.insertId]);
  res.json(normalizeRows(rows, ['focus_by_hour'])[0]);
});

app.put('/api/daily-stats/:id', async (req, res) => {
  const data = { ...req.body };
  const fields = [];
  const params = [];
  Object.entries(data).forEach(([key, value]) => {
    fields.push(`${key} = ?`);
    if (key === 'focus_by_hour') {
      params.push(toJsonString(value));
    } else {
      params.push(value);
    }
  });
  params.push(req.params.id);
  await pool.query(`UPDATE daily_stats SET ${fields.join(', ')} WHERE id = ?`, params);
  const [rows] = await pool.query('SELECT * FROM daily_stats WHERE id = ?', [req.params.id]);
  res.json(normalizeRows(rows, ['focus_by_hour'])[0]);
});

// Focus Sessions
app.get('/api/focus-sessions', async (req, res) => {
  const { order, limit } = req.query;
  const { column, direction } = parseOrder(order, 'start_time');
  const limitSql = limit ? 'LIMIT ?' : '';
  const params = limit ? [Number(limit)] : [];
  const [rows] = await pool.query(
    `SELECT * FROM focus_sessions ORDER BY ${column} ${direction} ${limitSql}`,
    params
  );
  res.json(rows);
});

app.post('/api/focus-sessions', async (req, res) => {
  const data = req.body;
  const [result] = await pool.query(
    `INSERT INTO focus_sessions (task_id, start_time, end_time, planned_duration, actual_duration, interruptions, focus_score, mood_before, mood_after, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
    [
      data.task_id,
      data.start_time,
      data.end_time,
      data.planned_duration,
      data.actual_duration,
      data.interruptions,
      data.focus_score,
      data.mood_before,
      data.mood_after,
      data.notes
    ]
  );
  const [rows] = await pool.query('SELECT * FROM focus_sessions WHERE id = ?', [result.insertId]);
  res.json(rows[0]);
});

// LLM
const buildLlmUrl = (baseUrl) => {
  if (!baseUrl) return '';
  if (baseUrl.endsWith('/v1/chat/completions')) return baseUrl;
  if (baseUrl.endsWith('/v1')) return `${baseUrl}/chat/completions`;
  return `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`;
};

const extractJson = (content) => {
  try {
    return JSON.parse(content);
  } catch {
    return { text: content };
  }
};

app.post('/api/llm', async (req, res) => {
  const { prompt } = req.body;
  if (!LLM_API_URL || !LLM_TOKEN) {
    return res.json({ text: 'LLM not configured.' });
  }
  const url = buildLlmUrl(LLM_API_URL);
  const messages = [];
  if (COACH_SYSTEM_PROMPT) {
    messages.push({ role: 'system', content: COACH_SYSTEM_PROMPT });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LLM_TOKEN}`
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages,
      temperature: 0.4
    })
  });
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || '';
  res.json(extractJson(content));
});

// Conversations (simple in-memory store)
const conversations = new Map();

app.post('/api/conversations', (req, res) => {
  const id = crypto.randomUUID();
  const conversation = {
    id,
    metadata: req.body?.metadata || {},
    messages: []
  };
  conversations.set(id, conversation);
  res.json(conversation);
});

app.get('/api/conversations/:id', (req, res) => {
  const conversation = conversations.get(req.params.id);
  res.json(conversation || null);
});

app.post('/api/conversations/:id/messages', async (req, res) => {
  const conversation = conversations.get(req.params.id);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  const { role, content } = req.body;
  if (role && content) {
    conversation.messages.push({ role, content });
  }

  if (!LLM_API_URL || !LLM_TOKEN) {
    conversation.messages.push({ role: 'assistant', content: 'LLM not configured.' });
    return res.json(conversation);
  }

  const url = buildLlmUrl(LLM_API_URL);
  const messages = [];
  if (COACH_SYSTEM_PROMPT) {
    messages.push({ role: 'system', content: COACH_SYSTEM_PROMPT });
  }
  messages.push(...conversation.messages);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LLM_TOKEN}`
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages,
      temperature: 0.6
    })
  });
  const data = await response.json();
  const contentReply = data?.choices?.[0]?.message?.content || '';
  conversation.messages.push({ role: 'assistant', content: contentReply });
  res.json(conversation);
});

const port = process.env.PORT || 3001;

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Local API server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
