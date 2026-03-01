import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Play, CheckCircle2, Pause, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const intensityConfig = {
  light: { label: "轻度", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  medium: { label: "中度", color: "bg-amber-100 text-amber-700 border-amber-200" },
  high: { label: "高度", color: "bg-rose-100 text-rose-700 border-rose-200" }
};

const categoryConfig = {
  study: { label: "学习", emoji: "📚" },
  work: { label: "工作", emoji: "💼" },
  exercise: { label: "运动", emoji: "🏃" },
  housework: { label: "家务", emoji: "🏠" },
  creative: { label: "创作", emoji: "🎨" },
  other: { label: "其他", emoji: "📌" }
};

export default function TaskCard({ task, onStart, onViewDetails, compact = false }) {
  const completedSubtasks = task.subtasks?.filter(s => s.completed)?.length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;
  
  const intensity = intensityConfig[task.intensity] || intensityConfig.medium;
  const category = categoryConfig[task.category] || categoryConfig.other;

  if (compact) {
    return (
      <div 
        onClick={onViewDetails}
        className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all cursor-pointer"
      >
        <span className="text-xl">{category.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800 truncate">{task.title}</p>
          <p className="text-xs text-slate-500">{completedSubtasks}/{totalSubtasks} 子任务</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-white/80 backdrop-blur-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{category.emoji}</span>
            <div>
              <h3 className="font-semibold text-slate-800 text-lg leading-tight">{task.title}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{category.label}</p>
            </div>
          </div>
          <Badge variant="outline" className={cn("text-xs font-medium", intensity.color)}>
            {intensity.label}强度
          </Badge>
        </div>

        {task.description && (
          <p className="text-sm text-slate-600 mb-4 line-clamp-2">{task.description}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{task.estimated_minutes || 60}分钟</span>
          </div>
          {totalSubtasks > 0 && (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{completedSubtasks}/{totalSubtasks} 子任务</span>
            </div>
          )}
        </div>

        {totalSubtasks > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>进度</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="flex gap-2">
          {task.status === 'in_progress' ? (
            <Button 
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
              onClick={onStart}
            >
              <Pause className="w-4 h-4 mr-2" />
              继续专注
            </Button>
          ) : task.status === 'completed' ? (
            <Button 
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
              disabled
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              已完成
            </Button>
          ) : (
            <Button 
              className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
              onClick={onStart}
            >
              <Play className="w-4 h-4 mr-2" />
              开始专注
            </Button>
          )}
          <Button variant="outline" onClick={onViewDetails}>
            详情
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}