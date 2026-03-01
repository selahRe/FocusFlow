import React, { useState } from 'react';
import { localApi } from '@/api/localApi';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock, Target, Flame, TrendingUp, Brain, BarChart3
} from "lucide-react";
import { motion } from "framer-motion";
import { format, subDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';

import StatsCard from "@/components/ui/StatsCard";
import EnergyCurve from "@/components/stats/EnergyCurve";
import TriggerInsights from "@/components/stats/TriggerInsights";

export default function Stats() {
  const [period, setPeriod] = useState('week');
  const today = format(new Date(), 'yyyy-MM-dd');

  // 获取统计数据
  const { data: allStats = [] } = useQuery({
    queryKey: ['allStats'],
    queryFn: () => localApi.entities.DailyStats.list('-date', 30),
  });

  // 获取所有任务
  const { data: allTasks = [] } = useQuery({
    queryKey: ['allTasks'],
    queryFn: () => localApi.entities.Task.list('-created_date', 100),
  });

  // 计算统计数据
  const todayStats = allStats.find(s => s.date === today) || {
    total_focus_minutes: 0,
    tasks_completed: 0,
    streak_days: 0
  };

  const weekStats = allStats.slice(0, 7);
  const totalFocusThisWeek = weekStats.reduce((sum, s) => sum + (s.total_focus_minutes || 0), 0);
  const tasksCompletedThisWeek = weekStats.reduce((sum, s) => sum + (s.tasks_completed || 0), 0);
  const avgFocusScore = weekStats.length > 0
    ? Math.round(weekStats.reduce((sum, s) => sum + (s.average_focus_score || 70), 0) / weekStats.length)
    : 0;

  // 图表数据
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const stat = allStats.find(s => s.date === dateStr) || {};
    return {
      date: format(date, 'E', { locale: zhCN }),
      focus: stat.total_focus_minutes || 0,
      tasks: stat.tasks_completed || 0
    };
  });

  // 任务完成率
  const completedTasks = allTasks.filter(t => t.status === 'completed').length;
  const completionRate = allTasks.length > 0
    ? Math.round((completedTasks / allTasks.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-purple-50/20 pb-24">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* 头部 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-slate-800">数据统计</h1>
          <p className="text-slate-500 mt-1">追踪你的专注进步</p>
        </motion.div>

        {/* 时间选择 */}
        <Tabs value={period} onValueChange={setPeriod} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">今日</TabsTrigger>
            <TabsTrigger value="week">本周</TabsTrigger>
            <TabsTrigger value="month">本月</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 核心统计 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatsCard
            title="总专注时长"
            value={`${totalFocusThisWeek}分钟`}
            subtitle="本周累计"
            icon={Clock}
            color="violet"
            delay={0.1}
          />
          <StatsCard
            title="完成任务"
            value={tasksCompletedThisWeek}
            subtitle="本周完成"
            icon={Target}
            color="emerald"
            delay={0.2}
          />
          <StatsCard
            title="专注评分"
            value={`${avgFocusScore}分`}
            subtitle="平均得分"
            icon={Brain}
            color="amber"
            delay={0.3}
          />
          <StatsCard
            title="连续天数"
            value={`${todayStats.streak_days || 0}天`}
            subtitle="持续进步"
            icon={Flame}
            color="rose"
            delay={0.4}
          />
        </div>

        {/* 能量曲线 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <EnergyCurve />
        </motion.div>

        {/* 触发器识别 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <TriggerInsights />
        </motion.div>

        {/* 专注时长趋势 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-5 mb-6 border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">专注时长趋势</h3>
              <TrendingUp className="w-5 h-5 text-violet-500" />
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="focus"
                    stroke="#8b5cf6"
                    fill="url(#focusGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* 任务完成情况 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-5 mb-6 border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">任务完成</h3>
              <BarChart3 className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar dataKey="tasks" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        <Card className="p-5 border-0 shadow-sm bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800">任务完成率</h3>
              <p className="text-sm text-slate-500">最近任务完成比例</p>
            </div>
            <div className="text-2xl font-bold text-emerald-600">{completionRate}%</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
