import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { localApi } from '@/api/localApi';
import { format } from 'date-fns';

export default function GoodStartMode({ tasks, onTaskStart, onDismiss }) {
  const [tip, setTip] = useState(null);
  const [loading, setLoading] = useState(false);

  const hour = new Date().getHours();
  // 只在下午（12点后）且还有未开始任务时出现
  const hasPendingTasks = tasks.some(t => t.status === 'pending');
  if (hour < 12 || !hasPendingTasks) return null;

  const getEasiestTask = () => tasks
    .filter(t => t.status === 'pending')
    .sort((a, b) => (a.estimated_minutes || 999) - (b.estimated_minutes || 999))[0];

  const handleGetTip = async () => {
    setLoading(true);
    const easiest = getEasiestTask();
    const result = await localApi.integrations.Core.InvokeLLM({
      prompt: `用户下午${hour}点还没开始今天的任务，给一句温暖、不评判的鼓励，并推荐从这个任务的第一步开始：
任务名：${easiest?.title || '今日任务'}
任务描述：${easiest?.description || ''}
要求：
- 语气温暖亲切，不带指责
- 用"没关系"开头
- 只需说第一步该做什么，极度具体（比如"打开文档"而不是"开始写报告"）
- 不超过50字`,
      response_json_schema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          first_step: { type: 'string' }
        }
      }
    });
    setTip({ ...result, task: easiest });
    setLoading(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-5 relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-4"
      >
        <button onClick={onDismiss} className="absolute top-3 right-3 text-amber-400 hover:text-amber-600">
          <X className="w-4 h-4" />
        </button>

        {!tip ? (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-800 text-sm">好的开始模式</p>
              <p className="text-amber-600 text-xs mt-0.5 mb-3">
                {hour >= 15 ? `下午${hour}点了，没关系，现在开始也不晚 ✨` : `午后了，找到一个温柔的起点 ✨`}
              </p>
              <Button
                size="sm"
                onClick={handleGetTip}
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-full h-8 text-xs"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '告诉我怎么开始'}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-amber-700 text-sm mb-3">{tip.message}</p>
            <div className="bg-white/70 rounded-xl p-3 mb-3">
              <p className="text-xs text-amber-500 mb-1">第一步</p>
              <p className="font-semibold text-amber-800">{tip.first_step}</p>
            </div>
            {tip.task && (
              <Button
                size="sm"
                onClick={() => onTaskStart(tip.task)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-9 text-sm"
              >
                开始：{tip.task.title} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}