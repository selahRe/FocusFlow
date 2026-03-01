import { describe, it, expect } from 'vitest';
import { parseMinutes, extractSubtasks, normalizeSubtasks } from '../pages/Home.jsx';

describe('task planning helpers', () => {
  it('parses minutes from numbers and strings', () => {
    expect(parseMinutes(20)).toBe(20);
    expect(parseMinutes('15分钟')).toBe(15);
    expect(parseMinutes('about 5')).toBe(5);
    expect(parseMinutes(null)).toBe(0);
  });

  it('extracts subtasks from multiple response shapes', () => {
    expect(extractSubtasks({ task_plan: { subtasks: [{ title: 'A' }] } })).toHaveLength(1);
    expect(extractSubtasks({ subtasks: [{ title: 'B' }] })).toHaveLength(1);
    expect(extractSubtasks({})).toHaveLength(0);
  });

  it('normalizes subtasks with defaults', () => {
    const normalized = normalizeSubtasks([
      { title: '写提纲', duration: '20分钟', reward: '5' },
      { name: '初稿', duration_minutes: 25, reward_minutes: 10 }
    ]);

    expect(normalized[0].title).toBe('写提纲');
    expect(normalized[0].duration_minutes).toBe(20);
    expect(normalized[0].reward_minutes).toBe(5);
    expect(normalized[1].title).toBe('初稿');
    expect(normalized[1].duration_minutes).toBe(25);
    expect(normalized[1].reward_minutes).toBe(10);
  });
});
