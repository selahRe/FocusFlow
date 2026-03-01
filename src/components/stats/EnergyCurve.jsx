import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Info } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { localApi } from '@/api/localApi';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';

// 从FocusSession数据聚合每小时能量
function buildHourlyEnergy(sessions) {
  const hourMap = Array(24).fill(0).map(() => ({ count: 0, totalScore: 0 }));
  sessions.forEach(s => {
    if (!s.start_time) return;
    const hour = new Date(s.start_time).getHours();
    hourMap[hour].count++;
    hourMap[hour].totalScore += s.focus_score || 70;
  });
  return hourMap.map((h, hour) => ({
    hour: `${hour}时`,
    energy: h.count > 0 ? Math.round(h.totalScore / h.count) : null,
    sessions: h.count,
  }));
}

const PEAK_LABELS = {
  morning: { label: '早晨黄金期', color: '#f59e0b', hours: [8, 9, 10, 11] },
  afternoon: { label: '午后活跃期', color: '#8b5cf6', hours: [14, 15, 16] },
  evening: { label: '傍晚恢复期', color: '#10b981', hours: [19, 20, 21] },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white rounded-xl shadow-lg p-3 text-sm border border-slate-100">
      <p className="font-semibold text-slate-800">{label}</p>
      {d.energy != null ? (
        <>
          <p className="text-violet-600">能量: {d.energy}%</p>
          <p className="text-slate-400">{d.sessions} 次专注</p>
        </>
      ) : (
        <p className="text-slate-400">暂无数据</p>
      )}
    </div>
  );
};

export default function EnergyCurve() {
  const [days, setDays] = useState(7);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['focusSessions', days],
    queryFn: () => {
      const since = format(subDays(new Date(), days), "yyyy-MM-dd'T'00:00:00");
      return localApi.entities.FocusSession.list('-start_time', 200);
    },
  });

  const hourlyData = buildHourlyEnergy(sessions);
  const filledData = hourlyData.filter((_, i) => i >= 6 && i <= 23); // 6时~23时

  // 找出峰值小时
  const peakHour = filledData.reduce((best, cur) =>
    (cur.energy ?? 0) > (best.energy ?? 0) ? cur : best, filledData[0]);

  // 判断用户的高峰时段
  let peakPeriod = null;
  const peakHourNum = filledData.indexOf(peakHour) + 6;
  for (const [key, val] of Object.entries(PEAK_LABELS)) {
    if (val.hours.includes(peakHourNum)) { peakPeriod = { key, ...val }; break; }
  }

  return (
    <Card className="p-5 mb-6 border-0 shadow-sm bg-white/80 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-slate-800">能量曲线</h3>
        </div>
        <div className="flex gap-1">
          {[7, 14, 30].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                days === d ? 'bg-violet-600 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {d}天
            </button>
          ))}
        </div>
      </div>

      {peakPeriod && (
        <p className="text-xs text-slate-500 mb-4">
          你的高峰时段：<span className="font-semibold" style={{ color: peakPeriod.color }}>{peakPeriod.label}</span>
          （{peakHour.hour}前后）
        </p>
      )}

      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="h-40 flex flex-col items-center justify-center text-slate-400">
          <Zap className="w-8 h-8 mb-2 opacity-30" />
          <p className="text-sm">完成几次专注后，这里会显示你的能量规律</p>
        </div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filledData}>
              <defs>
                <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} interval={3} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              {/* 高峰区参考线 */}
              <ReferenceLine x="9时" stroke="#f59e0b" strokeDasharray="4 4" opacity={0.5} />
              <ReferenceLine x="15时" stroke="#8b5cf6" strokeDasharray="4 4" opacity={0.5} />
              <Area
                type="monotone"
                dataKey="energy"
                stroke="#f59e0b"
                fill="url(#energyGradient)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 图例 */}
      <div className="flex gap-4 mt-3 flex-wrap">
        {Object.values(PEAK_LABELS).map(p => (
          <div key={p.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-xs text-slate-500">{p.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}