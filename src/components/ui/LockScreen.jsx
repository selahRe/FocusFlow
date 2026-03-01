import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Lock, MessageCircle, Clock, AlertTriangle, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LockScreen({ 
  reason,
  duration = 8,
  onRequestUnlock,
  onEmergencyRequest,
  onTimeout
}) {
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [showHelp, setShowHelp] = useState(false);
  const [helpReason, setHelpReason] = useState('');

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            onTimeout?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, onTimeout]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleEmergency = () => {
    onEmergencyRequest?.(helpReason);
    setShowHelp(false);
    setHelpReason('');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-50 flex items-center justify-center p-4"
    >
      <div className="max-w-md w-full text-center">
        {/* 锁定图标 */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center"
        >
          <Lock className="w-12 h-12 text-white" />
        </motion.div>

        {/* 标题 */}
        <h2 className="text-2xl font-bold text-white mb-2">专注时间</h2>
        <p className="text-slate-400 mb-6">{reason}</p>

        {/* 倒计时 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 mb-6">
          <motion.div
            key={timeLeft}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="text-6xl font-bold text-white font-mono"
          >
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </motion.div>
          <p className="text-slate-400 mt-2">休息结束后自动解锁</p>
        </div>

        {/* 触发原因说明 */}
        <Card className="bg-white/5 border-white/10 p-4 mb-6 text-left">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white text-sm font-medium">为什么会锁屏？</p>
              <p className="text-slate-400 text-sm mt-1">
                {reason || "系统检测到您已连续使用手机超过设定时间，短暂休息有助于恢复专注力。"}
              </p>
            </div>
          </div>
        </Card>

        {/* 操作按钮 */}
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={() => setShowHelp(true)}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            我遇到困难，需要帮助
          </Button>
        </div>

        {/* 帮助对话框 */}
        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-x-4 bottom-4 md:relative md:inset-auto md:mt-6"
            >
              <Card className="p-4 bg-white">
                <h3 className="font-semibold text-slate-800 mb-2">
                  告诉我发生了什么？
                </h3>
                <Textarea
                  placeholder="比如：我在查找学习资料 / 有急事需要处理..."
                  value={helpReason}
                  onChange={(e) => setHelpReason(e.target.value)}
                  className="mb-3 resize-none"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowHelp(false)}
                  >
                    取消
                  </Button>
                  <Button
                    className="flex-1 bg-violet-600 hover:bg-violet-700"
                    onClick={handleEmergency}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    申请紧急解锁
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}