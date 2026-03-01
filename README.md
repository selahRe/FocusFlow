# FocusFlow
Name: 
### Tutorial, LLMs, and other Code used


### Resource Attributions


### Running the Program

Main class:

Data files needed: 

Inputs:

Known Bugs:


### Data Models

Task
- title: 任务标题
- description: 任务描述
- intensity: 轻度/中度/高度
- status: pending/in_progress/completed/paused
- category: study/work/exercise/housework/creative/other
- scheduled_date: 计划日期
- estimated_minutes: 预估时长（分钟）
- actual_minutes: 实际用时（分钟）
- subtasks: 子任务数组（id/title/duration_minutes/start_time/end_time/completed/reward_minutes）
- priority: 优先级 1-5

HabitAnchor
- anchor_habit: 已有习惯（锚点）
- new_habit: 新习惯
- minimum_version: 最小习惯版本
- full_version: 完整习惯版本
- time_of_day: morning/afternoon/evening/anytime
- stack_phrase: 触发短语
- completed_today: 今日是否完成
- streak: 连续完成天数
- last_completed_date: 最后完成日期

UserPreference
- constraint_level: gentle/moderate/strict
- peak_hours: 注意力峰值时段（小时数组）
- preferred_session_duration: 偏好单次专注时长（分钟）
- break_duration: 休息时长（分钟）
- reward_per_session: 每次奖励时长（分钟）
- total_reward_minutes: 累计奖励时长（分钟）
- daily_focus_goal: 每日专注目标（分钟）
- lock_screen_enabled: 是否启用锁屏
- reminder_frequency: low/medium/high

FocusSession
- task_id: 关联任务ID
- start_time: 开始时间
- end_time: 结束时间
- planned_duration: 计划时长（分钟）
- actual_duration: 实际时长（分钟）
- interruptions: 中断次数
- focus_score: 专注度评分 0-100
- mood_before: great/good/neutral/tired/anxious
- mood_after: great/good/neutral/tired/anxious
- notes: 备注

DailyStats
- date: 日期
- total_focus_minutes: 总专注时间（分钟）
- tasks_completed: 完成任务数
- subtasks_completed: 完成子任务数
- interruptions: 总中断次数
- average_focus_score: 平均专注度
- reward_earned: 获得奖励时长
- reward_used: 使用奖励时长
- focus_by_hour: 每小时专注分钟数组
- streak_days: 连续打卡天数


### Server Startup
#### Testing the API

#### Agent Workflow

### Notes/Assumptions


### Impressions

