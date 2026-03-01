import React, { useMemo } from 'react';
import { localApi } from '@/api/localApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { Flame, Shield } from 'lucide-react';
import { toast } from 'sonner';

const WEEKS = 15;
const MAX_FORGIVEN = 3;

function getForgivenCount(logs, month) {
  return logs.filter((log) => log.is_forgiven && log.date?.startsWith(month)).length;
}

export default function HabitHeatmap({ habit }) {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const currentMonth = format(new Date(), 'yyyy-MM');
  const startDate = subDays(new Date(), WEEKS * 7 - 1);

  const { data: logs = [] } = useQuery({
    queryKey: ['habitLogs', habit.id],
    queryFn: () => localApi.entities.HabitLog.filter({ habit_id: habit.id }),
  });

  const forgivenThisMonth = useMemo(() => getForgivenCount(logs, currentMonth), [logs, currentMonth]);

  const forgiveMutation = useMutation({
    mutationFn: async (date) => {
      const existing = logs.find((log) => log.date === date);
      if (existing) {
        return localApi.entities.HabitLog.update(existing.id, { is_forgiven: true });
      }
      return localApi.entities.HabitLog.create({
        habit_id: habit.id,
        date,
        completed: false,
        is_forgiven: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['habitLogs', habit.id]);
      toast.success('原谅日已使用，连续不中断 ✨');
    }
  });

  const days = eachDayOfInterval({ start: startDate, end: new Date() });

  const effectiveStreak = useMemo(() => {
    let streak = 0;
    for (let i = 0; i < 60; i += 1) {
      const dateStr = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const log = logs.find((entry) => entry.date === dateStr);
      if (log?.completed || log?.is_forgiven) {
        streak += 1;
      } else if (dateStr === today) {
        streak += 1;
      } else {
        break;
      }
    }
    return streak;
  }, [logs, today]);

  const logMap = useMemo(() => {
    const map = {};
    logs.forEach((log) => { map[log.date] = log; });
    return map;
  }, [logs]);

  function getCellStyle(dateStr) {
    const log = logMap[dateStr];
    const isToday = dateStr === today;
    if (log?.completed) return 'bg-emerald-400';
    if (log?.is_forgiven) return 'bg-amber-300 opacity-70';
    if (isToday) return 'bg-violet-200 ring-2 ring-violet-400';
    if (dateStr < today) return 'bg-slate-100';
    return 'bg-slate-50 opacity-40';
  }

  const weeks = [];
  let currentWeek = [];
  days.forEach((day, index) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || index === days.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const missedDays = days
    .filter((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const log = logMap[dateStr];
      return dateStr < today && !log?.completed && !log?.is_forgiven && dateStr.startsWith(currentMonth);
    })
    .slice(-5);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">{habit.new_habit}</span>
          {effectiveStreak > 1 && (
            <span className="flex items-center gap-0.5 text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">
              <Flame className="w-3 h-3" />{effectiveStreak}天
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Shield className="w-3 h-3 text-amber-400" />
          <span>原谅日 {forgivenThisMonth}/{MAX_FORGIVEN}</span>
        </div>
      </div>

      <div className="flex gap-0.5 overflow-x-auto pb-1">
        {weeks.map((week, weekIndex) => (
          <div key={`week-${weekIndex}`} className="flex flex-col gap-0.5">
            {week.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const log = logMap[dateStr];
              const isMissed = dateStr < today && !log?.completed && !log?.is_forgiven && dateStr.startsWith(currentMonth);
              return (
                <div
                  key={dateStr}
                  title={dateStr}
                  onClick={() => {
                    if (isMissed && forgivenThisMonth < MAX_FORGIVEN) {
                      forgiveMutation.mutate(dateStr);
                    }
                  }}
                  className={`w-4 h-4 rounded-sm transition-all ${getCellStyle(dateStr)} ${
                    isMissed && forgivenThisMonth < MAX_FORGIVEN
                      ? 'cursor-pointer hover:ring-2 hover:ring-amber-400'
                      : ''
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {missedDays.length > 0 && forgivenThisMonth < MAX_FORGIVEN && (
        <p className="text-xs text-amber-500 mt-2">
          点击空格子使用原谅日（还剩 {MAX_FORGIVEN - forgivenThisMonth} 次）
        </p>
      )}

      <div className="flex items-center gap-3 mt-2">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-emerald-400" />
          <span className="text-xs text-slate-400">已完成</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-amber-300" />
          <span className="text-xs text-slate-400">原谅日</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-slate-100" />
          <span className="text-xs text-slate-400">未完成</span>
        </div>
      </div>
    </div>
  );
}
