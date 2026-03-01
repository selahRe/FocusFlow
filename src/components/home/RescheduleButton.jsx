import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, Check } from 'lucide-react';
import { localApi } from '@/api/localApi';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function RescheduleButton({ tasks, onRescheduled }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'paused');
  if (pendingTasks.length === 0) return null;

  const handleReschedule = async () => {
    setLoading(true);
    const now = new Date();
    const nowStr = format(now, 'HH:mm');

    const result = await localApi.integrations.Core.InvokeLLM({
      prompt: `现在是${nowStr}，用户今天还有以下未完成任务，请为剩余时间重新规划合理的时间块：
${pendingTasks.map((t, i) => `${i + 1}. ${t.title}，预估${t.estimated_minutes || 30}分钟`).join('\n')}
要求：
- 从现在开始排，每个任务之间留5分钟休息
- 优先排简单/短任务建立信心
- 如果剩余时间不够，减少任务数量而不是压缩每个任务时长
- 时间格式用 HH:mm`,
      response_json_schema: {
        type: 'object',
        properties: {
          scheduled: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                task_id: { type: 'string' },
                task_title: { type: 'string' },
                start_time: { type: 'string' },
                end_time: { type: 'string' },
                note: { type: 'string' }
              }
            }
          },
          message: { type: 'string' }
        }
      }
    });

    // 更新每个任务的子任务时间
    for (const scheduled of result.scheduled || []) {
      const task = pendingTasks.find(t => t.title === scheduled.task_title);
      if (task?.subtasks?.length) {
        const updatedSubtasks = task.subtasks.map((st, idx) => ({
          ...st,
          start_time: idx === 0 ? scheduled.start_time : st.start_time,
        }));
        await localApi.entities.Task.update(task.id, { subtasks: updatedSubtasks });
      }
    }

    setLoading(false);
    setDone(true);
    onRescheduled?.(result.message);
    setTimeout(() => setDone(false), 3000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleReschedule}
      disabled={loading || done}
      className="rounded-full border-violet-200 text-violet-600 hover:bg-violet-50 h-8 text-xs"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
      ) : done ? (
        <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" />
      ) : (
        <RefreshCw className="w-3.5 h-3.5 mr-1" />
      )}
      {done ? '已重排' : '一键重排'}
    </Button>
  );
}