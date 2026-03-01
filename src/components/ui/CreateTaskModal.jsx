import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  { value: "study", label: "学习", emoji: "📚" },
  { value: "work", label: "工作", emoji: "💼" },
  { value: "exercise", label: "运动", emoji: "🏃" },
  { value: "housework", label: "家务", emoji: "🏠" },
  { value: "creative", label: "创作", emoji: "🎨" },
  { value: "other", label: "其他", emoji: "📌" }
];

const intensityLevels = [
  { value: "light", label: "轻度", description: "较长休息，温和提醒", color: "bg-emerald-500" },
  { value: "medium", label: "中度", description: "适中节奏，平衡约束", color: "bg-amber-500" },
  { value: "high", label: "高度", description: "紧凑安排，严格约束", color: "bg-rose-500" }
];

export default function CreateTaskModal({ 
  open, 
  onOpenChange, 
  onSubmit,
  isGenerating = false 
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'study',
    intensity: 'medium',
    estimated_minutes: 60
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">创建新任务</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 任务标题 */}
          <div className="space-y-2">
            <Label htmlFor="title">任务内容</Label>
            <Input
              id="title"
              placeholder="例如：完成数学作业"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="text-lg"
            />
          </div>

          {/* 详细描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">补充说明（可选）</Label>
            <Textarea
              id="description"
              placeholder="可以写下具体要做什么，AI会帮你更好地拆分任务"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
          </div>

          {/* 任务类别 */}
          <div className="space-y-3">
            <Label>任务类别</Label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData({...formData, category: cat.value})}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all text-center",
                    formData.category === cat.value
                      ? "border-violet-500 bg-violet-50"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <p className="text-sm mt-1 text-slate-700">{cat.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 预估时长 */}
          <div className="space-y-3">
            <Label>预估时长：{formData.estimated_minutes} 分钟</Label>
            <Slider
              value={[formData.estimated_minutes]}
              onValueChange={([val]) => setFormData({...formData, estimated_minutes: val})}
              min={15}
              max={180}
              step={15}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>15分钟</span>
              <span>180分钟</span>
            </div>
          </div>

          {/* 执行强度 */}
          <div className="space-y-3">
            <Label>可接受的执行强度</Label>
            <RadioGroup
              value={formData.intensity}
              onValueChange={(val) => setFormData({...formData, intensity: val})}
              className="space-y-3"
            >
              {intensityLevels.map(level => (
                <label
                  key={level.value}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                    formData.intensity === level.value
                      ? "border-violet-500 bg-violet-50"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <RadioGroupItem value={level.value} id={level.value} />
                  <div className={cn("w-3 h-3 rounded-full", level.color)} />
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{level.label}强度</p>
                    <p className="text-sm text-slate-500">{level.description}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* 提交按钮 */}
          <Button 
            type="submit" 
            className="w-full h-12 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            disabled={!formData.title || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                AI正在规划中...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                AI智能规划任务
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}