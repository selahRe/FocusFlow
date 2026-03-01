import React, { useState, useEffect } from 'react';
import { localApi } from '@/api/localApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Settings, Gift, Activity, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

import FocusTimer from "@/components/ui/FocusTimer";
import SubtaskTimeline from "@/components/ui/SubtaskTimeline";
import LockScreen from "@/components/ui/LockScreen";
import ChatInterface from "@/components/chat/ChatInterface";
import StartupRitual from "@/components/focus/StartupRitual";
import BodyScan from "@/components/focus/BodyScan";
import DistractionLog from "@/components/focus/DistractionLog";

const formatTime = (date) => format(date, 'HH:mm');

export const rescheduleSubtasks = (subtasks, startIndex, startTime, breakMinutes) => {
  let cursor = new Date(startTime.getTime());
  return subtasks.map((st, idx) => {
    if (idx < startIndex) return st;
    const duration = Number(st.duration_minutes) || 0;
    const start = new Date(cursor.getTime());
    const end = new Date(cursor.getTime());
    end.setMinutes(end.getMinutes() + duration);
    const next = new Date(end.getTime());
    next.setMinutes(next.getMinutes() + breakMinutes);
    cursor = next;
    return {
      ...st,
      start_time: formatTime(start),
      end_time: formatTime(end)
    };
  });
};

export default function Focus() {
  const urlParams = new URLSearchParams(window.location.search);
  const taskId = urlParams.get('taskId');
  
  const [currentSubtaskIndex, setCurrentSubtaskIndex] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showLockScreen, setShowLockScreen] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [totalReward, setTotalReward] = useState(0);
  const [showRitual, setShowRitual] = useState(true);
  const [showBodyScan, setShowBodyScan] = useState(false);
  const [showDistractionLog, setShowDistractionLog] = useState(false);
  
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  // 获取任务详情
  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => localApi.entities.Task.filter({ id: taskId }),
    enabled: !!taskId,
    select: (data) => data[0]
  });

  // 获取用户偏好
  const { data: preferences = [] } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => localApi.entities.UserPreference.list('-created_date', 1),
  });
  const userPref = preferences[0];

  // 更新任务
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => localApi.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  // 更新偏好（奖励时间）
  const updatePrefMutation = useMutation({
    mutationFn: (data) => {
      if (userPref?.id) {
        return localApi.entities.UserPreference.update(userPref.id, data);
      }
      return localApi.entities.UserPreference.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    }
  });

  // 记录专注会话
  const createSessionMutation = useMutation({
    mutationFn: (data) => localApi.entities.FocusSession.create(data),
  });

  useEffect(() => {
    if (task && !task.subtasks?.length) {
      // 如果任务没有子任务，返回详情页
      window.location.href = createPageUrl(`TaskDetail?id=${taskId}`);
    }
  }, [task, taskId]);

  // 找到第一个未完成的子任务
  useEffect(() => {
    if (task?.subtasks) {
      const firstIncomplete = task.subtasks.findIndex(st => !st.completed);
      if (firstIncomplete >= 0) {
        setCurrentSubtaskIndex(firstIncomplete);
      }
    }
  }, [task]);

  const currentSubtask = task?.subtasks?.[currentSubtaskIndex];

  const handleSubtaskComplete = async (rewardMinutes) => {
    if (!task || !currentSubtask) return;

    // 更新子任务状态
    const updatedSubtasks = [...task.subtasks];
    const now = new Date();
    updatedSubtasks[currentSubtaskIndex] = {
      ...updatedSubtasks[currentSubtaskIndex],
      completed: true,
      end_time: formatTime(now)
    };

    const breakMinutes = userPref?.break_duration || 5;
    const startNext = new Date(now.getTime());
    startNext.setMinutes(startNext.getMinutes() + breakMinutes);
    const rescheduled = rescheduleSubtasks(
      updatedSubtasks,
      currentSubtaskIndex + 1,
      startNext,
      breakMinutes
    );

    // 检查是否全部完成
    const allCompleted = rescheduled.every(st => st.completed);

    await updateTaskMutation.mutateAsync({
      id: task.id,
      data: {
        subtasks: rescheduled,
        status: allCompleted ? 'completed' : 'in_progress'
      }
    });

    // 记录专注会话
    await createSessionMutation.mutateAsync({
      task_id: task.id,
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      planned_duration: currentSubtask.duration_minutes,
      actual_duration: currentSubtask.duration_minutes,
      focus_score: 80
    });

    // 累加奖励时间
    if (rewardMinutes > 0) {
      const newTotal = (userPref?.total_reward_minutes || 0) + rewardMinutes;
      setTotalReward(prev => prev + rewardMinutes);
      await updatePrefMutation.mutateAsync({
        total_reward_minutes: newTotal
      });
    }

    // 进入下一个子任务或完成
    if (currentSubtaskIndex < task.subtasks.length - 1) {
      setCurrentSubtaskIndex(prev => prev + 1);
      setIsTimerRunning(false);
    } else {
      // 任务全部完成
      window.location.href = createPageUrl(`TaskDetail?id=${taskId}&completed=true`);
    }
  };

  const handleNeedHelp = () => {
    setShowChat(true);
    setIsTimerRunning(false);
  };

  const handleEmergencyUnlock = async (reason) => {
    // 记录紧急解锁请求
    console.log('Emergency unlock requested:', reason);
    setShowLockScreen(false);
  };

  if (isLoading || !task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-purple-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-purple-950">
      {/* 启动仪式 */}
      <AnimatePresence>
        {showRitual && task && (
          <StartupRitual task={task} onComplete={() => setShowRitual(false)} />
        )}
      </AnimatePresence>

      {/* 身体扫描 */}
      <AnimatePresence>
        {showBodyScan && (
          <BodyScan
            onComplete={(data) => {
              console.log('Body scan:', data);
              setShowBodyScan(false);
            }}
            onDismiss={() => setShowBodyScan(false)}
          />
        )}
      </AnimatePresence>

      {/* 分心记录本 */}
      <AnimatePresence>
        {showDistractionLog && (
          <DistractionLog onClose={() => setShowDistractionLog(false)} />
        )}
      </AnimatePresence>

      {/* 锁屏 */}
      <AnimatePresence>
        {showLockScreen && (
          <LockScreen
            reason={lockReason}
            duration={8}
            onEmergencyRequest={handleEmergencyUnlock}
            onTimeout={() => setShowLockScreen(false)}
          />
        )}
      </AnimatePresence>

      {/* 帮助聊天 */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="fixed inset-0 bg-white z-50"
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-semibold">需要帮助？</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowChat(false)}>
                  关闭
                </Button>
              </div>
              <div className="flex-1">
                <ChatInterface
                  placeholder="告诉我你遇到了什么困难..."
                  quickPrompts={[
                    "我觉得这个任务太难了",
                    "我无法集中注意力",
                    "我想换一个任务"
                  ]}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-white font-semibold">{task.title}</h1>
            <p className="text-white/60 text-sm">{currentSubtaskIndex + 1} / {task.subtasks?.length} 子任务</p>
          </div>
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* 工具栏 */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2"
          >
            <Gift className="w-4 h-4 text-amber-400" />
            <span className="text-white/80 text-sm">
              <span className="font-semibold text-amber-400">{totalReward}</span> 分钟奖励
            </span>
          </motion.div>
          <button
            onClick={() => setShowBodyScan(true)}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-full px-3 py-2 transition-all"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-white/70 text-sm">身体</span>
          </button>
          <button
            onClick={() => setShowDistractionLog(true)}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-full px-3 py-2 transition-all"
          >
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span className="text-white/70 text-sm">分心</span>
          </button>
        </div>

        {/* 计时器 */}
        {currentSubtask && (
          <div className="mb-8">
            <FocusTimer
              duration={currentSubtask.duration_minutes}
              subtaskTitle={currentSubtask.title}
              rewardMinutes={currentSubtask.reward_minutes || 5}
              isRunning={isTimerRunning}
              onToggle={setIsTimerRunning}
              onComplete={handleSubtaskComplete}
              onPause={() => setIsTimerRunning(false)}
              onNeedHelp={handleNeedHelp}
            />
          </div>
        )}

        {/* 当前任务信息 */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/10 p-4 mb-6">
          <h3 className="text-white font-medium mb-1">当前任务</h3>
          <p className="text-white/80 text-lg">{currentSubtask?.title}</p>
          <p className="text-white/50 text-sm mt-2">
            {currentSubtask?.start_time} - {currentSubtask?.end_time}
          </p>
        </Card>

        {/* 子任务时间线 */}
        <div className="mb-6">
          <h3 className="text-white/70 text-sm font-medium mb-4">任务进度</h3>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4">
            <SubtaskTimeline
              subtasks={task.subtasks}
              currentIndex={currentSubtaskIndex}
            />
          </div>
        </div>
      </div>
    </div>
  );
}