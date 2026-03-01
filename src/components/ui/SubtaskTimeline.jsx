import React from 'react';
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Clock, Gift } from "lucide-react";
import { motion } from "framer-motion";

export default function SubtaskTimeline({ subtasks, currentIndex = -1, onSubtaskClick }) {
  return (
    <div className="space-y-3">
      {subtasks?.map((subtask, index) => {
        const isCompleted = subtask.completed;
        const isCurrent = index === currentIndex;
        const isPending = !isCompleted && index > currentIndex;

        return (
          <motion.div
            key={subtask.id || index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSubtaskClick?.(index)}
            className={cn(
              "relative flex items-start gap-4 p-4 rounded-2xl transition-all cursor-pointer",
              isCompleted && "bg-emerald-50/80 border border-emerald-100",
              isCurrent && "bg-violet-50/80 border-2 border-violet-200 shadow-sm",
              isPending && "bg-slate-50/50 border border-slate-100 opacity-60"
            )}
          >
            {/* 连接线 */}
            {index < subtasks.length - 1 && (
              <div className={cn(
                "absolute left-7 top-14 w-0.5 h-6",
                isCompleted ? "bg-emerald-200" : "bg-slate-200"
              )} />
            )}

            {/* 状态图标 */}
            <div className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
              isCompleted && "bg-emerald-500 text-white",
              isCurrent && "bg-violet-500 text-white animate-pulse",
              isPending && "bg-slate-200 text-slate-400"
            )}>
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <span className="text-sm font-semibold">{index + 1}</span>
              )}
            </div>

            {/* 内容 */}
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                "font-medium mb-1",
                isCompleted && "text-emerald-700 line-through",
                isCurrent && "text-violet-700",
                isPending && "text-slate-500"
              )}>
                {subtask.title}
              </h4>
              
              <div className="flex items-center gap-3 text-sm">
                <span className={cn(
                  "flex items-center gap-1",
                  isCompleted ? "text-emerald-600" : "text-slate-500"
                )}>
                  <Clock className="w-3.5 h-3.5" />
                  {subtask.start_time} - {subtask.end_time}
                </span>
                <span className="text-slate-300">|</span>
                <span className={cn(
                  "flex items-center gap-1",
                  isCompleted ? "text-emerald-600" : "text-slate-500"
                )}>
                  <Gift className="w-3.5 h-3.5" />
                  奖励 {subtask.reward_minutes || 5} 分钟
                </span>
              </div>
            </div>

            {/* 时长标签 */}
            <div className={cn(
              "flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium",
              isCompleted && "bg-emerald-100 text-emerald-700",
              isCurrent && "bg-violet-100 text-violet-700",
              isPending && "bg-slate-100 text-slate-500"
            )}>
              {subtask.duration_minutes}分钟
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}