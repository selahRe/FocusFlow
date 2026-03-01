import React, { useState, useMemo } from 'react';
import { localApi } from '@/api/localApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2, Target, Sparkles, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

function CalendarView({ tasks, currentMonth }) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startWeekday = getDay(monthStart);

  const tasksByDay = useMemo(() => {
    const map = {};
    tasks.forEach((task) => {
      if (task.scheduled_date) {
        if (!map[task.scheduled_date]) map[task.scheduled_date] = [];
        map[task.scheduled_date].push(task);
      }
    });
    return map;
  }, [tasks]);

  const today = format(new Date(), 'yyyy-MM-dd');
  const currentMonthStr = format(currentMonth, 'yyyy-MM');

  const totalTasks = tasks.filter((task) => task.scheduled_date?.startsWith(currentMonthStr)).length;
  const completedTasks = tasks.filter((task) => task.scheduled_date?.startsWith(currentMonthStr) && task.status === 'completed').length;
  const hardDeadlineTasks = tasks.filter((task) => task.scheduled_date?.startsWith(currentMonthStr) && task.priority === 1);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div>
      {totalTasks > 0 && (
        <div className="mb-4 p-3 bg-violet-50 rounded-2xl border border-violet-100">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700">月度进度</span>
          </div>
          <p className="text-xs text-slate-600">
            本月已完成 <span className="font-bold text-violet-600">{completionRate}%</span>
            {hardDeadlineTasks.length > 0 && (
              <span className="text-rose-500"> · {hardDeadlineTasks.length} 个硬截止需关注</span>
            )}
          </p>
          <div className="mt-2 h-1.5 bg-violet-100 rounded-full overflow-hidden">
            <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${completionRate}%` }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-xs text-slate-400 py-1">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array(startWeekday).fill(null).map((_, index) => <div key={`empty-${index}`} />)}
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDay[dateStr] || [];
          const isToday = dateStr === today;
          const hasPast = dateStr < today;
          const completedCount = dayTasks.filter((task) => task.status === 'completed').length;
          const hasOverdue = dayTasks.some((task) => task.status !== 'completed' && dateStr < today);
          const totalCount = dayTasks.length;
          const intensity = totalCount === 0 ? 'none' : totalCount <= 2 ? 'low' : totalCount <= 4 ? 'medium' : 'high';

          return (
            <Link key={dateStr} to={createPageUrl('Home')}>
              <div className={`aspect-square rounded-xl p-1 flex flex-col items-center justify-between transition-all cursor-pointer hover:scale-105 ${
                isToday ? 'ring-2 ring-violet-400 bg-violet-50' :
                completedCount > 0 && completedCount === totalCount ? 'bg-amber-50' :
                intensity === 'low' ? 'bg-sky-50' :
                intensity === 'medium' ? 'bg-sky-100' :
                intensity === 'high' ? 'bg-sky-200' : 'bg-slate-50'
              }`}>
                <span className={`text-xs font-medium ${isToday ? 'text-violet-600' : hasPast ? 'text-slate-400' : 'text-slate-600'}`}>
                  {format(day, 'd')}
                </span>
                {totalCount > 0 && (
                  <div className="flex items-center gap-0.5">
                    {completedCount > 0 && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                    {hasOverdue && <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
                    {totalCount > completedCount && !hasOverdue && <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="flex gap-4 mt-3 justify-center">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-xs text-slate-400">完成</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-400" /><span className="text-xs text-slate-400">待处理</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-sky-400" /><span className="text-xs text-slate-400">计划中</span></div>
      </div>
    </div>
  );
}

function MilestoneView({ goals, currentMonth }) {
  const monthStr = format(currentMonth, 'yyyy-MM');
  const monthGoals = goals.filter((goal) => goal.month === monthStr);

  if (monthGoals.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-4xl mb-3">🎯</p>
        <p className="font-medium mb-1">本月还没有目标</p>
        <p className="text-sm">添加一个月目标，AI为你拆分周里程碑</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {monthGoals.map((goal) => (
        <Card key={goal.id} className="p-4 border-0 shadow-sm bg-white/80">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-violet-500" />
            <span className="font-semibold text-slate-800">{goal.title}</span>
          </div>
          <div className="space-y-2">
            {(goal.milestones || []).map((milestone, index) => (
              <div key={milestone.id || index} className={`flex items-center gap-3 p-2.5 rounded-xl ${milestone.completed ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${milestone.completed ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  W{milestone.week}
                </div>
                <span className={`text-sm flex-1 ${milestone.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{milestone.title}</span>
                {milestone.completed && <span className="text-xs text-emerald-500">✓</span>}
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function TaskOverviewView({ tasks, currentMonth }) {
  const monthStr = format(currentMonth, 'yyyy-MM');
  const monthTasks = tasks.filter((task) => task.scheduled_date?.startsWith(monthStr));

  const groups = [
    { label: '🔴 硬截止', tasks: monthTasks.filter((task) => task.priority === 1) },
    { label: '🟠 已拖延', tasks: monthTasks.filter((task) => task.status !== 'completed' && task.scheduled_date < format(new Date(), 'yyyy-MM-dd') && task.priority !== 1) },
    { label: '🟡 弹性任务', tasks: monthTasks.filter((task) => task.priority === 2 || task.priority === 3) },
    { label: '🟢 可推迟', tasks: monthTasks.filter((task) => task.priority >= 4 || !task.priority) }
  ].filter((group) => group.tasks.length > 0);

  if (monthTasks.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-4xl mb-3">📋</p>
        <p className="font-medium">本月还没有任务</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-semibold text-slate-500 mb-2">{group.label}</p>
          <div className="space-y-2">
            {group.tasks.map((task) => (
              <Link key={task.id} to={createPageUrl(`TaskDetail?id=${task.id}`)}>
                <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm ${
                  task.status === 'completed' ? 'bg-emerald-50 border-emerald-100' :
                  task.scheduled_date < format(new Date(), 'yyyy-MM-dd') ? 'bg-orange-50 border-orange-200' :
                  'bg-white border-slate-100'
                }`}>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${task.status === 'completed' ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.title}</p>
                    <p className="text-xs text-slate-400">{task.scheduled_date}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MonthPlan() {
  const [view, setView] = useState('calendar');
  const [currentMonth] = useState(new Date());
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [goalText, setGoalText] = useState('');
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['allTasks'],
    queryFn: () => localApi.entities.Task.list('-created_date', 200)
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['monthGoals'],
    queryFn: () => localApi.entities.MonthGoal.list('-created_date')
  });

  const createGoalMutation = useMutation({
    mutationFn: async (title) => {
      setGenerating(true);
      const monthStr = format(currentMonth, 'yyyy-MM');
      const res = await localApi.integrations.Core.InvokeLLM({
        prompt: `用户的月目标是："${title}"，当月是${format(currentMonth, 'yyyy年M月')}。
请将月目标拆分成4个周里程碑（W1-W4），每个里程碑用一句话描述这周应该达成什么。`,
        response_json_schema: {
          type: 'object',
          properties: {
            milestones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  week: { type: 'number' },
                  title: { type: 'string' }
                }
              }
            }
          }
        }
      });
      const milestones = (res.milestones || []).map((milestone, index) => ({
        id: `m-${index}`,
        ...milestone,
        completed: false
      }));
      return localApi.entities.MonthGoal.create({ title, month: monthStr, milestones, status: 'active' });
    },
    onSuccess: () => {
      setGenerating(false);
      setShowAddGoal(false);
      setGoalText('');
      queryClient.invalidateQueries(['monthGoals']);
      toast.success('月目标已创建，周里程碑已生成！');
    },
    onError: () => setGenerating(false)
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-purple-50/20 pb-24">
      <div className="max-w-lg mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <h1 className="text-2xl font-bold text-slate-800">月计划 📅</h1>
          <p className="text-slate-500 mt-1">{format(currentMonth, 'yyyy年M月', { locale: zhCN })}</p>
        </motion.div>

        <Tabs value={view} onValueChange={setView} className="mb-5">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar">月历</TabsTrigger>
            <TabsTrigger value="milestone">里程碑</TabsTrigger>
            <TabsTrigger value="tasks">任务总览</TabsTrigger>
          </TabsList>
        </Tabs>

        <AnimatePresence mode="wait">
          <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {view === 'calendar' && (
              <Card className="p-4 border-0 shadow-sm bg-white/80">
                <CalendarView tasks={tasks} currentMonth={currentMonth} />
              </Card>
            )}
            {view === 'milestone' && (
              <>
                <Button
                  onClick={() => setShowAddGoal(true)}
                  className="w-full mb-4 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl h-11"
                >
                  <Plus className="w-4 h-4 mr-2" />添加月目标
                </Button>

                <AnimatePresence>
                  {showAddGoal && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <Card className="p-4 mb-4 border-violet-200">
                        <p className="text-sm font-semibold text-slate-700 mb-2">本月想达成什么？</p>
                        <input
                          value={goalText}
                          onChange={(event) => setGoalText(event.target.value)}
                          placeholder="如：备考托福、完成毕业论文初稿..."
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-violet-200"
                        />
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowAddGoal(false)}>取消</Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-violet-600"
                            onClick={() => createGoalMutation.mutate(goalText)}
                            disabled={!goalText || generating}
                          >
                            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-1" />AI拆分</>}
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                <MilestoneView goals={goals} currentMonth={currentMonth} />
              </>
            )}
            {view === 'tasks' && <TaskOverviewView tasks={tasks} currentMonth={currentMonth} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
