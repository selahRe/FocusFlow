import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Brain, Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { localApi } from '@/api/localApi';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

const TRIGGER_COLORS = {
  time: 'bg-amber-100 text-amber-700 border-amber-200',
  mood: 'bg-rose-100 text-rose-700 border-rose-200',
  task: 'bg-violet-100 text-violet-700 border-violet-200',
  environment: 'bg-sky-100 text-sky-700 border-sky-200',
  unknown: 'bg-slate-100 text-slate-600 border-slate-200',
};

const TRIGGER_ICONS = {
  time: '⏰',
  mood: '😤',
  task: '📋',
  environment: '🌍',
  unknown: '❓',
};

export default function TriggerInsights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const { data: sessions = [] } = useQuery({
    queryKey: ['focusSessions_triggers'],
    queryFn: () => localApi.entities.FocusSession.list('-start_time', 50),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks_triggers'],
    queryFn: () => localApi.entities.Task.list('-updated_date', 50),
  });

  const analyzeWithAI = async () => {
    setLoading(true);
    setExpanded(true);

    const sessionSummary = sessions.slice(0, 20).map(s => ({
      time: s.start_time ? new Date(s.start_time).getHours() + '时' : '未知',
      score: s.focus_score,
      interruptions: s.interruptions || 0,
      mood_before: s.mood_before,
      duration: s.actual_duration,
    }));

    const taskSummary = tasks.slice(0, 20).map(t => ({
      category: t.category,
      intensity: t.intensity,
      status: t.status,
      completion: t.subtasks?.length > 0
        ? Math.round(t.subtasks.filter(s => s.completed).length / t.subtasks.length * 100) + '%'
        : '未知'
    }));

    const result = await localApi.integrations.Core.InvokeLLM({
      prompt: `你是一位专注于ADHD的行为分析专家。根据以下用户数据，识别可能导致专注力下降或中断的触发器，并给出具体可执行的建议。

专注会话数据（最近20条）：
${JSON.stringify(sessionSummary, null, 2)}

任务数据（最近20条）：
${JSON.stringify(taskSummary, null, 2)}

请分析：
1. 哪些时间段专注分数最低？
2. 哪类任务完成率最低？
3. 中断次数多的规律是什么？
4. 推测3-5个可能的分心触发器

以JSON格式输出，要简洁实用。`,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          triggers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['time', 'mood', 'task', 'environment', 'unknown'] },
                title: { type: 'string' },
                description: { type: 'string' },
                suggestion: { type: 'string' },
                severity: { type: 'string', enum: ['high', 'medium', 'low'] },
              }
            }
          },
          best_focus_window: { type: 'string' },
          worst_focus_window: { type: 'string' },
        }
      }
    });

    setInsights(result);
    setLoading(false);
  };

  return (
    <Card className="p-5 mb-6 border-0 shadow-sm bg-white/80 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-violet-500" />
          <h3 className="font-semibold text-slate-800">触发器识别</h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={analyzeWithAI}
          disabled={loading}
          className="rounded-full text-xs h-8"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : insights ? (
            <><RefreshCw className="w-3.5 h-3.5 mr-1" />重新分析</>
          ) : (
            <><Brain className="w-3.5 h-3.5 mr-1" />AI分析</>
          )}
        </Button>
      </div>

      {!insights && !loading && (
        <div className="text-center py-8 text-slate-400">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">点击"AI分析"，识别让你分心的规律触发器</p>
          <p className="text-xs mt-1 text-slate-300">需要至少5次专注记录</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center py-10 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500 mb-3" />
          <p className="text-sm">AI正在分析你的专注模式...</p>
        </div>
      )}

      <AnimatePresence>
        {insights && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* 摘要 */}
            <div className="bg-violet-50 rounded-xl p-3 mb-4 text-sm text-violet-700">
              {insights.summary}
            </div>

            {/* 最佳/最差时间窗口 */}
            {(insights.best_focus_window || insights.worst_focus_window) && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {insights.best_focus_window && (
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-emerald-600 mb-1">最佳时段 ⚡</p>
                    <p className="text-sm font-semibold text-emerald-700">{insights.best_focus_window}</p>
                  </div>
                )}
                {insights.worst_focus_window && (
                  <div className="bg-rose-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-rose-500 mb-1">低谷时段 😴</p>
                    <p className="text-sm font-semibold text-rose-600">{insights.worst_focus_window}</p>
                  </div>
                )}
              </div>
            )}

            {/* 触发器列表 */}
            <div className="space-y-3">
              {insights.triggers?.slice(0, expanded ? undefined : 3).map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className={`rounded-xl border p-3 ${TRIGGER_COLORS[t.type] || TRIGGER_COLORS.unknown}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg mt-0.5">{TRIGGER_ICONS[t.type] || '❓'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">{t.title}</p>
                        {t.severity === 'high' && (
                          <span className="text-xs bg-rose-200 text-rose-700 px-1.5 py-0.5 rounded-full">高频</span>
                        )}
                      </div>
                      <p className="text-xs opacity-80 mb-2">{t.description}</p>
                      <div className="bg-white/60 rounded-lg px-2 py-1.5">
                        <p className="text-xs font-medium">💡 {t.suggestion}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {insights.triggers?.length > 3 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full mt-3 flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-slate-700 py-2"
              >
                {expanded ? (
                  <><ChevronUp className="w-4 h-4" />收起</>
                ) : (
                  <><ChevronDown className="w-4 h-4" />查看全部 {insights.triggers.length} 个触发器</>
                )}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}