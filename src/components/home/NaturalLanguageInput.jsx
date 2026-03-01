import React, { useMemo, useState } from 'react';
import { localApi } from '@/api/localApi';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Loader2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'sonner';

const PRIORITY_CONFIG = {
  hard_deadline: { label: '🔴 硬截止', bg: 'bg-rose-50', border: 'border-rose-200' },
  overdue: { label: '🟠 已拖延', bg: 'bg-orange-50', border: 'border-orange-200' },
  flexible: { label: '🟡 弹性任务', bg: 'bg-amber-50', border: 'border-amber-200' },
  deferrable: { label: '🟢 可推迟', bg: 'bg-slate-50', border: 'border-slate-200' }
};

const PRIORITY_VALUE = {
  hard_deadline: 1,
  overdue: 2,
  flexible: 3,
  deferrable: 4
};

const PRIORITY_OPTIONS = [
  { value: 'hard_deadline', label: '🔴 硬截止' },
  { value: 'overdue', label: '🟡 已拖延' },
  { value: 'flexible', label: '🟢 弹性任务' },
  { value: 'deferrable', label: '⚪ 可推迟' }
];

const normalizeMessage = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export default function NaturalLanguageInput({ onTasksCreated, isCollapsed = false, onToggle }) {
  const [text, setText] = useState('');
  const [step, setStep] = useState('input');
  const [tasks, setTasks] = useState([]);
  const [aiMessage, setAiMessage] = useState('');

  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: allTasks = [] } = useQuery({
    queryKey: ['allTasksForIntake'],
    queryFn: () => localApi.entities.Task.list('-created_date', 120)
  });

  const overdueHints = useMemo(() => {
    return allTasks
      .filter((task) => task.scheduled_date && task.scheduled_date < today && task.status !== 'completed')
      .slice(0, 6)
      .map((task) => task.title);
  }, [allTasks, today]);

  const extractTasks = (res) => Array.isArray(res?.tasks)
    ? res.tasks.filter((task) => task?.title)
    : [];

  const requestTasks = async (inputText) => {
    return localApi.integrations.Core.InvokeLLM({
      prompt: `你是ADHD任务教练。用户输入了以下内容，请分析并提取任务列表：

用户输入："${inputText}"

今天是 ${format(new Date(), 'yyyy年M月d日 EEEE')}。

如果发现与以下“已拖延任务”相符或用户明确说拖延，请归类为 overdue：
${overdueHints.length ? overdueHints.map((t, i) => `${i + 1}. ${t}`).join('\n') : '无'}

请将任务分为4类：
- hard_deadline：有明确截止日期且临近（今天/明天/本周）
- overdue：用户明确说拖了或与拖延任务匹配
- flexible：最好今天做但可以移动
- deferrable：用户说不急或重要性低

同时估算每个任务时长（分钟），不确定就给一个区间描述。
输出严格JSON，包含 tasks 数组与 overdue_message/summary。`,
      response_json_schema: {
        type: 'object',
        properties: {
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                priority: { type: 'string', enum: ['hard_deadline', 'overdue', 'flexible', 'deferrable'] },
                estimated_minutes: { type: 'number' },
                duration_label: { type: 'string' },
                category: { type: 'string' },
                intensity: { type: 'string' }
              }
            }
          },
          overdue_message: { type: 'string' },
          summary: { type: 'string' }
        }
      }
    });
  };

  const analyze = async () => {
    if (!text.trim()) return;
    setStep('analyzing');
    try {
      let res = await requestTasks(text);
      let extracted = extractTasks(res);

      if (!extracted.length) {
        res = await requestTasks(`请只输出任务列表，不要总结：${text}`);
        extracted = extractTasks(res);
      }

      const nextTasks = extracted.map((task, index) => ({
        ...task,
        id: `nl-${index}`,
        selected: true,
        priority: task.priority || 'flexible'
      }));

      if (nextTasks.length === 0) {
        setStep('input');
        setAiMessage('');
        toast.error('没有解析到任务，请换种说法试试');
        return;
      }

      setTasks(nextTasks);
      setAiMessage(normalizeMessage(res?.overdue_message || res?.summary || ''));
      setStep('confirm');
    } catch (error) {
      console.error('LLM analyze failed', error);
      setStep('input');
      setAiMessage('');
      toast.error('AI 分析失败，请稍后重试');
    }
  };

  const confirm = async () => {
    setStep('analyzing');
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const selected = tasks.filter((task) => task.selected);
      for (const task of selected) {
        await localApi.entities.Task.create({
          title: task.title,
          estimated_minutes: task.estimated_minutes || 30,
          category: task.category || 'other',
          intensity: task.intensity || 'medium',
          scheduled_date: today,
          status: 'pending',
          priority: PRIORITY_VALUE[task.priority] || 3,
          subtasks: []
        });
      }
      setStep('done');
      toast.success(`已添加 ${selected.length} 个任务！`);
      onTasksCreated?.();
      setTimeout(() => {
        setStep('input');
        setText('');
        setTasks([]);
        setAiMessage('');
      }, 1500);
    } catch (error) {
      console.error('Task creation failed', error);
      setStep('confirm');
      toast.error('任务创建失败，请稍后重试');
    }
  };

  const toggleTask = (id) => setTasks((prev) => prev.map((task) => task.id === id ? { ...task, selected: !task.selected } : task));
  const updateTask = (id, patch) => setTasks((prev) => prev.map((task) => task.id === id ? { ...task, ...patch } : task));

  const grouped = ['hard_deadline', 'overdue', 'flexible', 'deferrable']
    .map((priority) => ({ priority, items: tasks.filter((task) => task.priority === priority) }))
    .filter((group) => group.items.length > 0);

  if (isCollapsed) {
    return (
      <Card className="border-0 shadow-sm bg-white/90 mb-6 overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="font-semibold text-slate-800 text-sm">今天想做什么？</span>
          </div>
          <Button variant="outline" size="sm" onClick={onToggle}>
            展开 <ChevronDown className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm bg-white/90 mb-6 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="font-semibold text-slate-800 text-sm">今天想做什么？</span>
          </div>
          {onToggle && (
            <Button variant="outline" size="sm" onClick={onToggle}>
              收起 <ChevronUp className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="直接说，比如：这周要交报告，数学作业拖了三天了，下午想跑步，还要回几封邮件不急..."
                className="w-full text-sm text-slate-700 placeholder-slate-300 resize-none border border-slate-100 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-violet-200 min-h-[80px]"
              />
              <Button onClick={analyze} disabled={!text.trim()} className="w-full mt-3 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl h-10">
                <Sparkles className="w-4 h-4 mr-2" />AI 分析任务
              </Button>
            </motion.div>
          )}

          {step === 'analyzing' && (
            <motion.div key="loading" className="py-6 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">AI正在分析优先级...</p>
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {aiMessage && (
                <div className="mb-3 p-3 bg-amber-50 rounded-xl text-xs text-amber-700 border border-amber-100">
                  💬 {aiMessage}
                </div>
              )}
              <p className="text-xs text-slate-400 mb-3">点击取消勾选不想加的任务，确认后生成计划</p>
              {grouped.map((group) => {
                const config = PRIORITY_CONFIG[group.priority];
                return (
                  <div key={group.priority} className="mb-3">
                    <p className="text-xs font-semibold text-slate-500 mb-1.5">{config.label}</p>
                    {group.items.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border mb-1.5 cursor-pointer transition-all ${
                          task.selected ? `${config.bg} ${config.border}` : 'bg-slate-50 border-slate-100 opacity-50'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${task.selected ? 'bg-violet-500' : 'bg-slate-200'}`}>
                          {task.selected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{task.title}</p>
                          <p className="text-xs text-slate-400">{task.duration_label || `约${task.estimated_minutes || 30}分钟`}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                            <select
                              value={task.priority || 'flexible'}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) => updateTask(task.id, { priority: event.target.value })}
                              className="border border-slate-200 rounded-md px-2 py-1 text-xs bg-white"
                            >
                              {PRIORITY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min="5"
                              step="5"
                              value={task.estimated_minutes || 30}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) => updateTask(task.id, { estimated_minutes: Number(event.target.value) })}
                              className="w-20 border border-slate-200 rounded-md px-2 py-1 text-xs"
                            />
                            <span className="text-slate-400">分钟</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setStep('input')}>重新输入</Button>
                <Button size="sm" className="flex-1 bg-violet-600 hover:bg-violet-700" onClick={confirm}>
                  确认添加 {tasks.filter((task) => task.selected).length} 个
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'done' && (
            <motion.div key="done" className="py-4 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm text-emerald-600 font-medium">任务已添加！</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
