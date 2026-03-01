import React from 'react';
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Shield, Bell, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const constraintLevels = [
  { 
    value: "gentle", 
    label: "轻度约束", 
    description: "以提醒为主，锁屏时间短",
    icon: "🌱",
    color: "border-emerald-200 bg-emerald-50"
  },
  { 
    value: "moderate", 
    label: "中度约束", 
    description: "平衡提醒与约束",
    icon: "🌿",
    color: "border-amber-200 bg-amber-50"
  },
  { 
    value: "strict", 
    label: "严格约束", 
    description: "强制执行，严格限制",
    icon: "🌳",
    color: "border-rose-200 bg-rose-50"
  }
];

const reminderOptions = [
  { value: "low", label: "低频", description: "每30分钟提醒一次" },
  { value: "medium", label: "中频", description: "每15分钟提醒一次" },
  { value: "high", label: "高频", description: "每5分钟提醒一次" }
];

export default function ConstraintSettings({ 
  settings, 
  onUpdate 
}) {
  const handleUpdate = (key, value) => {
    onUpdate?.({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* 约束等级 */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-base">
          <Shield className="w-4 h-4 text-violet-500" />
          约束强度等级
        </Label>
        <div className="grid gap-3">
          {constraintLevels.map(level => (
            <label
              key={level.value}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                settings?.constraint_level === level.value
                  ? "border-violet-500 bg-violet-50"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <input
                type="radio"
                name="constraint_level"
                value={level.value}
                checked={settings?.constraint_level === level.value}
                onChange={() => handleUpdate('constraint_level', level.value)}
                className="sr-only"
              />
              <span className="text-2xl">{level.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-slate-800">{level.label}</p>
                <p className="text-sm text-slate-500">{level.description}</p>
              </div>
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                settings?.constraint_level === level.value
                  ? "border-violet-500 bg-violet-500"
                  : "border-slate-300"
              )}>
                {settings?.constraint_level === level.value && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 锁屏开关 */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <Zap className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="font-medium text-slate-800">启用锁屏约束</p>
              <p className="text-sm text-slate-500">超时自动锁定手机</p>
            </div>
          </div>
          <Switch
            checked={settings?.lock_screen_enabled ?? true}
            onCheckedChange={(checked) => handleUpdate('lock_screen_enabled', checked)}
          />
        </div>
      </Card>

      {/* 单次专注时长 */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-base">
          <Clock className="w-4 h-4 text-violet-500" />
          偏好单次专注时长：{settings?.preferred_session_duration || 20} 分钟
        </Label>
        <Slider
          value={[settings?.preferred_session_duration || 20]}
          onValueChange={([val]) => handleUpdate('preferred_session_duration', val)}
          min={10}
          max={45}
          step={5}
          className="py-4"
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>10分钟（短专注）</span>
          <span>45分钟（长专注）</span>
        </div>
      </div>

      {/* 休息时长 */}
      <div className="space-y-3">
        <Label className="text-base">休息时长：{settings?.break_duration || 5} 分钟</Label>
        <Slider
          value={[settings?.break_duration || 5]}
          onValueChange={([val]) => handleUpdate('break_duration', val)}
          min={3}
          max={15}
          step={1}
          className="py-4"
        />
      </div>

      {/* 提醒频率 */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-base">
          <Bell className="w-4 h-4 text-violet-500" />
          提醒频率
        </Label>
        <RadioGroup
          value={settings?.reminder_frequency || 'medium'}
          onValueChange={(val) => handleUpdate('reminder_frequency', val)}
          className="grid grid-cols-3 gap-3"
        >
          {reminderOptions.map(option => (
            <label
              key={option.value}
              className={cn(
                "p-3 rounded-xl border-2 cursor-pointer transition-all text-center",
                settings?.reminder_frequency === option.value
                  ? "border-violet-500 bg-violet-50"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <RadioGroupItem value={option.value} className="sr-only" />
              <p className="font-medium text-slate-800">{option.label}</p>
              <p className="text-xs text-slate-500 mt-1">{option.description}</p>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* 每日目标 */}
      <div className="space-y-3">
        <Label className="text-base">每日专注目标：{settings?.daily_focus_goal || 120} 分钟</Label>
        <Slider
          value={[settings?.daily_focus_goal || 120]}
          onValueChange={([val]) => handleUpdate('daily_focus_goal', val)}
          min={30}
          max={300}
          step={30}
          className="py-4"
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>30分钟</span>
          <span>300分钟</span>
        </div>
      </div>
    </div>
  );
}