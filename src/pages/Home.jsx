import React, { useState, useEffect } from 'react';
import { localApi } from '@/api/localApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Target, Clock, Flame, Gift, ChevronRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { toast } from "sonner";

import TaskCard from "@/components/ui/TaskCard";
import StatsCard from "@/components/ui/StatsCard";
import RewardBank from "@/components/ui/RewardBank";
import CreateTaskModal from "@/components/ui/CreateTaskModal";
import GoodStartMode from "@/components/home/GoodStartMode";
import ImperfectAcceptance from "@/components/home/ImperfectAcceptance";
import RescheduleButton from "@/components/home/RescheduleButton";
import NaturalLanguageInput from "@/components/home/NaturalLanguageInput";

export const parseMinutes = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const match = value.match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  }
  return 0;
};

export const extractSubtasks = (response) => {
  if (response?.task_plan?.subtasks) return response.task_plan.subtasks;
  if (response?.subtasks) return response.subtasks;
  return [];
};

export const normalizeSubtasks = (rawList) => {
  return rawList.map((st, idx) => ({
    id: st.id || st.subtask_id || `subtask-${Date.now()}-${idx}`,
    title: st.title || st.name || `子任务${idx + 1}`,
    duration_minutes: parseMinutes(st.duration_minutes ?? st.duration) || 15,
    start_time: st.start_time || st.startTime || '',
    end_time: st.end_time || st.endTime || '',
    completed: false,
    reward_minutes: parseMinutes(st.reward_minutes ?? st.reward) || 5
  }));
};

export default function Home() {
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [rescheduleMsg, setRescheduleMsg] = useState('');
  const [showGoodStart, setShowGoodStart] = useState(true);
  const [intakeCollapsed, setIntakeCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('home_intake_collapsed') === 'true';
  });
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  // 获取今日任务
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', today],
    queryFn: () => localApi.entities.Task.filter({ scheduled_date: today }, '-created_date'),
  });

  // 获取用户偏好设置
  const { data: preferences = [] } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => localApi.entities.UserPreference.list('-created_date', 1),
  });
  const userPref = preferences[0];

  // 获取今日统计
  const { data: dailyStats = [] } = useQuery({
    queryKey: ['dailyStats', today],
    queryFn: () => localApi.entities.DailyStats.filter({ date: today }),
  });
  const todayStats = dailyStats[0] || { 
    total_focus_minutes: 0, 
    tasks_completed: 0, 
    streak_days: 0,
    reward_earned: 0 
  };

  // 创建任务
  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      setIsGenerating(true);
      
      // 使用AI生成子任务计划
      const aiResponse = await localApi.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}\n\n作为ADHD专注力教练，为以下任务生成碎片化执行计划：
任务：${taskData.title}
描述：${taskData.description || '无'}
预估时长：${taskData.estimated_minutes}分钟
执行强度：${taskData.intensity === 'light' ? '轻度（多休息）' : taskData.intensity === 'high' ? '高度（紧凑）' : '中度'}

请将任务拆分为15-25分钟的小任务，每个任务后有5分钟休息。
从简单的开始，逐步增加难度，建立信心。
当前时间约为${format(new Date(), 'HH:mm')}，请安排接下来的时间段。`,
        response_json_schema: {
          type: "object",
          properties: {
            subtasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  duration_minutes: { type: "number" },
                  start_time: { type: "string" },
                  end_time: { type: "string" },
                  reward_minutes: { type: "number" }
                }
              }
            }
          }
        }
      });

      const subtasks = normalizeSubtasks(extractSubtasks(aiResponse));

      if (subtasks.length === 0) {
        throw new Error('AI 规划未返回子任务');
      }

      return localApi.entities.Task.create({
        ...taskData,
        scheduled_date: today,
        status: 'pending',
        subtasks
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowCreateModal(false);
      setIsGenerating(false);
    },
    onError: () => {
      setIsGenerating(false);
      toast.error('AI 规划失败，请重试');
    }
  });

  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const focusGoal = userPref?.daily_focus_goal || 120;
  const focusProgress = Math.min((todayStats.total_focus_minutes / focusGoal) * 100, 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-purple-50/20">
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* 头部问候 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-slate-800">
            今日专注 💪
          </h1>
          <p className="text-slate-500 mt-1">
            {format(new Date(), 'M月d日 EEEE')}
          </p>
        </motion.div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatsCard
            title="专注时长"
            value={`${todayStats.total_focus_minutes}分钟`}
            subtitle={`目标 ${focusGoal} 分钟`}
            icon={Clock}
            color="violet"
            delay={0.1}
          />
          <StatsCard
            title="完成任务"
            value={completedTasks.length}
            subtitle={`共 ${tasks.length} 个`}
            icon={Target}
            color="emerald"
            delay={0.2}
          />
        </div>

        {/* 奖励银行 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <RewardBank 
            totalMinutes={userPref?.total_reward_minutes || todayStats.reward_earned || 0}
            isLocked={pendingTasks.some(t => t.status === 'in_progress')}
          />
        </motion.div>

        <NaturalLanguageInput
          onTasksCreated={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}
          isCollapsed={intakeCollapsed}
          onToggle={() => {
            const next = !intakeCollapsed;
            setIntakeCollapsed(next);
            window.localStorage.setItem('home_intake_collapsed', String(next));
          }}
        />

        {/* 今日任务 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">今日任务</h2>
            <div className="flex items-center gap-2">
              <RescheduleButton tasks={tasks} onRescheduled={msg => setRescheduleMsg(msg)} />
              <Button
                size="sm"
                className="rounded-full bg-gradient-to-r from-violet-500 to-purple-600"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                新任务
              </Button>
            </div>
          </div>

          {/* 重排提示 */}
          {rescheduleMsg && (
            <div className="mb-3 px-4 py-2 bg-violet-50 rounded-xl text-sm text-violet-700">{rescheduleMsg}</div>
          )}

          {/* 好的开始模式 */}
          {showGoodStart && (
            <GoodStartMode
              tasks={pendingTasks}
              onTaskStart={(task) => window.location.href = createPageUrl(`Focus?taskId=${task.id}`)}
              onDismiss={() => setShowGoodStart(false)}
            />
          )}

          {/* 不完美接纳 */}
          <ImperfectAcceptance completedCount={completedTasks.length} totalCount={tasks.length} />

          {tasksLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <Card key={i} className="p-5 animate-pulse">
                  <div className="h-6 bg-slate-200 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                </Card>
              ))}
            </div>
          ) : pendingTasks.length > 0 ? (
            <div className="space-y-3">
              {pendingTasks.map((task, idx) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <TaskCard
                    task={task}
                    onStart={() => window.location.href = createPageUrl(`Focus?taskId=${task.id}`)}
                    onViewDetails={() => window.location.href = createPageUrl(`TaskDetail?id=${task.id}`)}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center border-dashed border-2 border-slate-200 bg-white/50">
              <div className="w-16 h-16 mx-auto mb-4 bg-violet-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-violet-500" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">今天还没有任务</h3>
              <p className="text-sm text-slate-500 mb-4">
                创建一个任务，AI会帮你制定专注计划
              </p>
              <Button
                className="rounded-full bg-gradient-to-r from-violet-500 to-purple-600"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                创建任务
              </Button>
            </Card>
          )}
        </div>

        <CreateTaskModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onSubmit={(data) => createTaskMutation.mutate(data)}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
}
