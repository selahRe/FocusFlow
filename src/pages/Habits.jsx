import React, { useState } from 'react';
import { localApi } from '@/api/localApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Check, Flame, ChevronRight, Loader2, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'sonner';
import HabitHeatmap from '@/components/habits/HabitHeatmap';

const TIME_LABELS = { morning: '🌅 早晨', afternoon: '☀️ 下午', evening: '🌙 傍晚', anytime: '⏱ 随时' };

const SYSTEM_PROMPT = `你是一位专门帮助ADHD人群的专注力教练。你的目标是：
1. 将用户的复杂任务拆分成15-25分钟的小任务块
2. 根据用户的注意力特点安排任务顺序（先简单后复杂，建立信心）
3. 为每个小任务设置合理的奖励时间
4. 用温和、鼓励的语气与用户沟通
5. 当用户分心时，帮助分析原因并提供建议
6. 记住ADHD用户需要即时反馈和明确的短期目标

规划原则：
- 每个子任务控制在15-25分钟
- 任务之间安排5分钟休息
- 先安排简单任务建立成就感
- 难度大的任务放在注意力峰值时段
- 每完成一个子任务奖励5分钟自由时间

数据库使用权限：
Task: creat,read,update
FocusSession:c,r
UserPreference:r,u
DailyStats:r`;

function AddHabitForm({ onSubmit, onCancel, isLoading }) {
  const [anchor, setAnchor] = useState('');
  const [newHabit, setNewHabit] = useState('');
  const [time, setTime] = useState('anytime');
  const [generating, setGenerating] = useState(false);
  const [minVersion, setMinVersion] = useState('');

  const generateMin = async () => {
    if (!newHabit) return;
    setGenerating(true);
    const res = await localApi.integrations.Core.InvokeLLM({
      prompt: `${SYSTEM_PROMPT}

为习惯"${newHabit}"生成一个极小化版本（最低门槛，2秒内可完成的动作），比如"跑步"的最小版本是"穿上运动鞋站到门口"。只返回这个极小动作，不超过15个字。`,
      response_json_schema: { type: 'object', properties: { min_version: { type: 'string' } } }
    });
    setMinVersion(res.min_version || '');
    setGenerating(false);
  };

  const handleSubmit = () => {
    if (!anchor || !newHabit || !minVersion) return;
    onSubmit({
      anchor_habit: anchor,
      new_habit: newHabit,
      minimum_version: minVersion,
      full_version: newHabit,
      time_of_day: time,
      stack_phrase: `${anchor}后 → ${minVersion}`,
      streak: 0,
      completed_today: false,
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
      <Card className="p-5 border-0 shadow-sm bg-white/90">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">新增习惯锚点</h3>
          <button onClick={onCancel}><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">已有习惯（锚点）</label>
            <input
              value={anchor}
              onChange={e => setAnchor(e.target.value)}
              placeholder="如：刷牙、喝早咖啡、坐上地铁..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">想建立的新习惯</label>
            <input
              value={newHabit}
              onChange={e => setNewHabit(e.target.value)}
              placeholder="如：冥想、跑步、读书..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-slate-500">最小版本（最低门槛行动）</label>
              <button onClick={generateMin} disabled={!newHabit || generating} className="text-xs text-violet-500 hover:text-violet-700 flex items-center gap-1">
                {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}AI生成
              </button>
            </div>
            <input
              value={minVersion}
              onChange={e => setMinVersion(e.target.value)}
              placeholder="如：穿上运动鞋..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-2 block">时段</label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(TIME_LABELS).map(([val, label]) => (
                <button key={val} onClick={() => setTime(val)}
                  className={`px-3 py-1 rounded-full text-xs transition-all ${time === val ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={!anchor || !newHabit || !minVersion || isLoading}
            className="w-full bg-violet-600 hover:bg-violet-700 rounded-xl">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '添加习惯锚点'}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

function HabitCard({ habit, onComplete, onDelete }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const doneToday = habit.completed_today && habit.last_completed_date === today;

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`p-4 border-0 shadow-sm mb-3 transition-all ${doneToday ? 'bg-emerald-50' : 'bg-white/90'}`}>
        <div className="flex items-start gap-3">
          <button
            onClick={() => !doneToday && onComplete(habit)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              doneToday ? 'bg-emerald-500 text-white' : 'bg-slate-100 hover:bg-violet-100 text-slate-400 hover:text-violet-500'
            }`}
          >
            {doneToday ? <Check className="w-5 h-5" /> : <Zap className="w-4 h-4" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-slate-400">{TIME_LABELS[habit.time_of_day]}</span>
              {habit.streak > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-amber-500">
                  <Flame className="w-3 h-3" />{habit.streak}天
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-700">{habit.stack_phrase || `${habit.anchor_habit} → ${habit.minimum_version}`}</p>
            <p className="text-xs text-slate-400 mt-1 truncate">最小版本：{habit.minimum_version}</p>
          </div>
          <button onClick={() => onDelete(habit.id)} className="text-slate-300 hover:text-rose-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-4">
          <HabitHeatmap habit={habit} />
        </div>
      </Card>
    </motion.div>
  );
}

export default function Habits() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: habits = [], isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: () => localApi.entities.HabitAnchor.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => localApi.entities.HabitAnchor.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['habits']); setShowForm(false); toast.success('习惯锚点已添加！'); }
  });

  const completeMutation = useMutation({
    mutationFn: async (habit) => {
      const newStreak = habit.last_completed_date === format(new Date(Date.now() - 86400000), 'yyyy-MM-dd') ? (habit.streak || 0) + 1 : 1;
      const updatedHabit = await localApi.entities.HabitAnchor.update(habit.id, {
        completed_today: true,
        last_completed_date: today,
        streak: newStreak,
      });
      const existingLogs = await localApi.entities.HabitLog.filter({ habit_id: habit.id, date: today });
      if (existingLogs[0]) {
        await localApi.entities.HabitLog.update(existingLogs[0].id, { completed: true });
      } else {
        await localApi.entities.HabitLog.create({ habit_id: habit.id, date: today, completed: true, is_forgiven: false });
      }
      return updatedHabit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['habits']);
      queryClient.invalidateQueries({ queryKey: ['habitLogs'] });
      toast.success('最小习惯完成！🎉');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localApi.entities.HabitAnchor.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['habits']),
  });

  const doneCount = habits.filter(h => h.completed_today && h.last_completed_date === today).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-purple-50/20 pb-24">
      <div className="max-w-lg mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">习惯锚点 🔗</h1>
          <p className="text-slate-500 mt-1">把新习惯绑在已有习惯上</p>
        </motion.div>

        {/* 今日进度 */}
        {habits.length > 0 && (
          <Card className="p-4 mb-6 border-0 shadow-sm bg-white/80">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">今日完成</p>
                <p className="text-2xl font-bold text-slate-800">{doneCount} <span className="text-base font-normal text-slate-400">/ {habits.length}</span></p>
              </div>
              <div className="w-16 h-16 relative">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#8b5cf6" strokeWidth="6"
                    strokeDasharray={`${habits.length > 0 ? (doneCount / habits.length) * 175.9 : 0} 175.9`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-violet-600">{habits.length > 0 ? Math.round(doneCount/habits.length*100) : 0}%</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 添加按钮 */}
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="w-full mb-5 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 h-12">
            <Plus className="w-5 h-5 mr-2" />绑定新习惯
          </Button>
        )}

        <AnimatePresence>
          {showForm && <AddHabitForm onSubmit={createMutation.mutate} onCancel={() => setShowForm(false)} isLoading={createMutation.isPending} />}
        </AnimatePresence>

        {isLoading ? (
          <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto" /></div>
        ) : habits.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-4xl mb-3">🔗</p>
            <p className="font-medium mb-1">还没有习惯锚点</p>
            <p className="text-sm">将新习惯绑在已有习惯后，更容易坚持</p>
          </div>
        ) : (
          <AnimatePresence>
            {habits.map(h => (
              <HabitCard key={h.id} habit={h} onComplete={completeMutation.mutate} onDelete={deleteMutation.mutate} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}