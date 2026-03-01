import { describe, it, expect } from 'vitest';
import { rescheduleSubtasks } from '../pages/Focus.jsx';

describe('focus rescheduleSubtasks', () => {
  it('reschedules remaining subtasks based on new start time and breaks', () => {
    const subtasks = [
      { title: 'A', duration_minutes: 10, start_time: '09:00', end_time: '09:10', completed: true },
      { title: 'B', duration_minutes: 15, start_time: '09:15', end_time: '09:30', completed: false },
      { title: 'C', duration_minutes: 20, start_time: '09:35', end_time: '09:55', completed: false }
    ];

    const startTime = new Date('2026-02-28T10:00:00');
    const result = rescheduleSubtasks(subtasks, 1, startTime, 5);

    expect(result[0].start_time).toBe('09:00');
    expect(result[1].start_time).toBe('10:00');
    expect(result[1].end_time).toBe('10:15');
    expect(result[2].start_time).toBe('10:20');
    expect(result[2].end_time).toBe('10:40');
  });
});
