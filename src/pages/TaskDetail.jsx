import React, { useState, useEffect } from 'react';
import { localApi } from '@/api/localApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Play, Pencil, Trash2, Clock, Target, 
  Gift, CheckCircle2, Sparkles, RefreshCw 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import SubtaskTimeline from "@/components/ui/SubtaskTimeline";

const intensityConfig = {
  light: { label: "轻度", color: "bg-emerald-100 text-emerald-700" },
  medium: { label: "中度", color: "bg-amber-100 text-amber-700" },
  high: { label: "高度", color: "bg-rose-100 text-rose-700" }
};

const categoryConfig = {
  study: { label: "学习", emoji: "📚" },
  work: { label: "工作", emoji: "💼" },
  exercise: { label: "运动", emoji: "🏃" },
  housework: { label: "家务", emoji: "🏠" },
  creative: { label: "创作", emoji: "🎨" },
  other: { label: "其他", emoji: "📌" }
};

export default function TaskDetail() {
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
  const urlParams = new URLSearchParams(window.location.search);
  const taskId = urlParams.get('id');
  const justCompleted = urlParams.get('completed') === 'true';
  
  const [isRegenerating, setIsRegenerating] = useState(false);
  const queryClient = useQueryClient();

  // 获取任务详情
  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => localApi.entities.Task.filter({ id: taskId }),
    enabled: !!taskId,
    select: (data) => data[0]
  });

  // 删除任务
  const deleteMutation = useMutation({
    mutationFn: () => localApi.entities.Task.delete(taskId),
    onSuccess: () => {
      window.location.href = createPageUrl('Home');
    }
  });

  // 重新生成计划
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      setIsRegenerating(true);
      const aiResponse = await localApi.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}

      作为ADHD专注力教练，重新为以下任务生成碎片化执行计划：
任务：${task.title}
描述：${task.description || '无'}
预估时长：${task.estimated_minutes}分钟
执行强度：${task.intensity === 'light' ? '轻度' : task.intensity === 'high' ? '高度' : '中度'}

请将任务拆分为15-25分钟的小任务，每个任务后有5分钟休息。
当前时间约为${format(new Date(), 'HH:mm')}`,
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

      const subtasks = aiResponse.subtasks?.map((st, idx) => ({
        ...st,
        id: `subtask-${Date.now()}-${idx}`,
        completed: false,
        reward_minutes: st.reward_minutes || 5
      })) || [];

      return localApi.entities.Task.update(taskId, { subtasks });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      setIsRegenerating(false);
    },
    onError: () => {
      setIsRegenerating(false);
    }
  });

  if (isLoading || !task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-purple-50/20 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  const intensity = intensityConfig[task.intensity] || intensityConfig.medium;
  const category = categoryConfig[task.category] || categoryConfig.other;
  const completedSubtasks = task.subtasks?.filter(s => s.completed)?.length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const totalReward = task.subtasks?.reduce((sum, st) => sum + (st.reward_minutes || 5), 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-purple-50/20">
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate()}>
              <Trash2 className="w-5 h-5 text-slate-400" />
            </Button>
          </div>
        </div>

        {/* 完成庆祝 */}
        <AnimatePresence>
          {justCompleted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-6"
            >
              <Card className="p-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center"
                >
                  <CheckCircle2 className="w-10 h-10" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">太棒了！🎉</h2>
                <p className="text-white/80">
                  你完成了这个任务！继续保持！
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 任务信息 */}
        <Card className="p-6 mb-6 border-0 shadow-sm bg-white/80 backdrop-blur-sm">
          <div className="flex items-start gap-4 mb-4">
            <span className="text-4xl">{category.emoji}</span>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-800 mb-2">{task.title}</h1>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={intensity.color}>
                  {intensity.label}强度
                </Badge>
                <Badge variant="outline" className="bg-slate-100 text-slate-700">
                  {category.label}
                </Badge>
              </div>
            </div>
          </div>

          {task.description && (
            <p className="text-slate-600 mb-4">{task.description}</p>
          )}

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                <Clock className="w-4 h-4" />
              </div>
              <p className="font-semibold text-slate-800">{task.estimated_minutes}分钟</p>
              <p className="text-xs text-slate-500">预估时长</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                <Target className="w-4 h-4" />
              </div>
              <p className="font-semibold text-slate-800">{completedSubtasks}/{totalSubtasks}</p>
              <p className="text-xs text-slate-500">子任务</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                <Gift className="w-4 h-4" />
              </div>
              <p className="font-semibold text-slate-800">{totalReward}分钟</p>
              <p className="text-xs text-slate-500">总奖励</p>
            </div>
          </div>
        </Card>

        {/* 子任务计划 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">AI规划的任务</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => regenerateMutation.mutate()}
              disabled={isRegenerating}
            >
              <RefreshCw className={cn("w-4 h-4 mr-1", isRegenerating && "animate-spin")} />
              重新规划
            </Button>
          </div>

          {task.subtasks?.length > 0 ? (
            <Card className="p-4 border-0 shadow-sm bg-white/80 backdrop-blur-sm">
              <SubtaskTimeline 
                subtasks={task.subtasks}
                currentIndex={task.subtasks.findIndex(st => !st.completed)}
              />
            </Card>
          ) : (
            <Card className="p-6 text-center border-dashed border-2 border-slate-200">
              <Sparkles className="w-8 h-8 mx-auto mb-3 text-violet-500" />
              <p className="text-slate-600 mb-3">AI正在为你规划任务...</p>
              <Button onClick={() => regenerateMutation.mutate()} disabled={isRegenerating}>
                {isRegenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    生成计划
                  </>
                )}
              </Button>
            </Card>
          )}
        </div>

        {/* 开始按钮 */}
        {task.status !== 'completed' && task.subtasks?.length > 0 && (
          <Link to={createPageUrl(`Focus?taskId=${task.id}`)}>
            <Button className="w-full h-14 text-lg bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
              <Play className="w-5 h-5 mr-2" />
              开始专注
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}