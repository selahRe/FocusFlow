import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, SkipForward, MessageCircle, Gift, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function FocusTimer({ 
  duration = 20, 
  subtaskTitle,
  rewardMinutes = 5,
  onComplete, 
  onPause,
  onNeedHelp,
  isRunning: externalIsRunning,
  onToggle
}) {
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isRunning, setIsRunning] = useState(externalIsRunning ?? false);
  const [showReward, setShowReward] = useState(false);
  const intervalRef = useRef(null);

  const totalSeconds = duration * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  useEffect(() => {
    if (externalIsRunning !== undefined) {
      setIsRunning(externalIsRunning);
    }
  }, [externalIsRunning]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setShowReward(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const handleToggle = () => {
    const newState = !isRunning;
    setIsRunning(newState);
    onToggle?.(newState);
    if (!newState) {
      onPause?.();
    }
  };

  const handleComplete = () => {
    setShowReward(false);
    onComplete?.(rewardMinutes);
  };

  // 计算圆环参数
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      {/* 圆形计时器 */}
      <div className="relative w-72 h-72 mb-6">
        <svg className="w-full h-full transform -rotate-90">
          {/* 背景圆 */}
          <circle
            cx="144"
            cy="144"
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="12"
          />
          {/* 进度圆 */}
          <motion.circle
            cx="144"
            cy="144"
            r={radius}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5 }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </svg>

        {/* 中心内容 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            key={timeLeft}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl font-bold text-slate-800 font-mono"
          >
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </motion.div>
          <p className="text-slate-500 mt-2 text-sm">{subtaskTitle}</p>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="lg"
          className="rounded-full w-14 h-14"
          onClick={onNeedHelp}
        >
          <MessageCircle className="w-5 h-5" />
        </Button>

        <Button
          size="lg"
          className={cn(
            "rounded-full w-20 h-20 shadow-lg transition-all",
            isRunning 
              ? "bg-amber-500 hover:bg-amber-600" 
              : "bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
          )}
          onClick={handleToggle}
        >
          {isRunning ? (
            <Pause className="w-8 h-8 text-white" />
          ) : (
            <Play className="w-8 h-8 text-white ml-1" />
          )}
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="rounded-full w-14 h-14"
          onClick={() => onComplete?.(0)}
        >
          <SkipForward className="w-5 h-5" />
        </Button>
      </div>

      {/* 奖励弹窗 */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <Card className="p-8 text-center max-w-sm w-full">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center"
              >
                <Gift className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">太棒了！🎉</h3>
              <p className="text-slate-600 mb-4">
                你完成了这个任务，获得了 <span className="font-bold text-violet-600">{rewardMinutes}分钟</span> 自由时间！
              </p>
              <Button 
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600"
                onClick={handleComplete}
              >
                领取奖励
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}