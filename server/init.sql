CREATE DATABASE IF NOT EXISTS focusflow;
USE focusflow;

CREATE TABLE IF NOT EXISTS tasks (
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
);

CREATE TABLE IF NOT EXISTS habit_anchors (
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
);

CREATE TABLE IF NOT EXISTS user_preferences (
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
);

CREATE TABLE IF NOT EXISTS daily_stats (
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
);

CREATE TABLE IF NOT EXISTS focus_sessions (
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
);
