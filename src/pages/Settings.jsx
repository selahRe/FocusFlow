import React, { useState, useEffect } from 'react';
import { localApi } from '@/api/localApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, Save, User, Bell, Shield, 
  Palette, HelpCircle, LogOut, Check
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

import ConstraintSettings from "@/components/ui/ConstraintSettings";

export default function Settings() {
  const [activeTab, setActiveTab] = useState('constraint');
  const [settings, setSettings] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();

  // 获取用户偏好
  const { data: preferences = [], isLoading } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => localApi.entities.UserPreference.list('-created_date', 1),
  });

  useEffect(() => {
    if (preferences.length > 0) {
      setSettings(preferences[0]);
    } else {
      // 默认设置
      setSettings({
        constraint_level: 'gentle',
        lock_screen_enabled: true,
        preferred_session_duration: 20,
        break_duration: 5,
        reminder_frequency: 'medium',
        daily_focus_goal: 120,
        reward_per_session: 5
      });
    }
  }, [preferences]);

  // 保存设置
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (preferences.length > 0 && preferences[0].id) {
        return localApi.entities.UserPreference.update(preferences[0].id, data);
      }
      return localApi.entities.UserPreference.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      setHasChanges(false);
      toast.success('设置已保存');
    }
  });

  const handleUpdate = (newSettings) => {
    setSettings(newSettings);
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const tabs = [
    { id: 'constraint', label: '约束设置', icon: Shield },
    { id: 'notification', label: '通知设置', icon: Bell },
    { id: 'account', label: '账户', icon: User },
    { id: 'help', label: '帮助', icon: HelpCircle }
  ];

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-purple-50/20 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-purple-50/20 pb-24">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-slate-800">设置</h1>
          </div>
          {hasChanges && (
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-violet-600 hover:bg-violet-700"
            >
              <Save className="w-4 h-4 mr-1" />
              保存
            </Button>
          )}
        </div>

        {/* 标签页 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-violet-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 内容 */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {activeTab === 'constraint' && (
            <Card className="p-6 border-0 shadow-sm bg-white/80 backdrop-blur-sm">
              <ConstraintSettings 
                settings={settings}
                onUpdate={handleUpdate}
              />
            </Card>
          )}

          {activeTab === 'notification' && (
            <Card className="p-6 border-0 shadow-sm bg-white/80 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-800">任务提醒</p>
                    <p className="text-sm text-slate-500">任务开始前提醒</p>
                  </div>
                  <div className="w-12 h-6 bg-violet-600 rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-800">休息提醒</p>
                    <p className="text-sm text-slate-500">专注结束时提醒休息</p>
                  </div>
                  <div className="w-12 h-6 bg-violet-600 rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-800">成就通知</p>
                    <p className="text-sm text-slate-500">获得成就时通知</p>
                  </div>
                  <div className="w-12 h-6 bg-slate-300 rounded-full relative">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'account' && (
            <Card className="p-6 border-0 shadow-sm bg-white/80 backdrop-blur-sm">
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-1">用户</h3>
                <p className="text-sm text-slate-500 mb-6">专注达人</p>
                <Button 
                  variant="outline" 
                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
                  onClick={() => localApi.auth.logout()}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  退出登录
                </Button>
              </div>
            </Card>
          )}

          {activeTab === 'help' && (
            <Card className="p-6 border-0 shadow-sm bg-white/80 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="p-4 bg-violet-50 rounded-xl">
                  <h4 className="font-medium text-violet-800 mb-2">🎯 如何使用？</h4>
                  <p className="text-sm text-violet-600">
                    创建任务后，AI会自动将其拆分为适合ADHD特点的小任务，每完成一个就能获得奖励时间！
                  </p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <h4 className="font-medium text-emerald-800 mb-2">💡 小技巧</h4>
                  <p className="text-sm text-emerald-600">
                    刚开始使用时，建议选择"轻度约束"，慢慢适应后再提高强度。
                  </p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl">
                  <h4 className="font-medium text-amber-800 mb-2">❓ 遇到问题？</h4>
                  <p className="text-sm text-amber-600">
                    随时可以和AI教练聊天，说出你的困难，它会帮你找到解决方案。
                  </p>
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}