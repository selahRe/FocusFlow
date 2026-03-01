import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Play, Clock, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function RewardBank({ 
  totalMinutes = 0, 
  onUseReward,
  isLocked = false 
}) {
  const [isUsing, setIsUsing] = useState(false);
  const [usingTime, setUsingTime] = useState(0);

  const handleUse = (minutes) => {
    if (minutes > totalMinutes) return;
    setUsingTime(minutes);
    setIsUsing(true);
    onUseReward?.(minutes);
  };

  const quickOptions = [5, 10, 15];

  return (
    <Card className={cn(
      "p-5 border-0 shadow-sm transition-all",
      isLocked 
        ? "bg-slate-100" 
        : "bg-gradient-to-br from-amber-50 to-orange-50"
    )}>
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center",
          isLocked 
            ? "bg-slate-200" 
            : "bg-gradient-to-br from-amber-400 to-orange-500"
        )}>
          <Gift className={cn("w-6 h-6", isLocked ? "text-slate-400" : "text-white")} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">奖励时间银行</h3>
          <p className="text-sm text-slate-500">完成任务获得自由时间</p>
        </div>
      </div>

      <div className="text-center py-4">
        <motion.div
          key={totalMinutes}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="text-4xl font-bold text-slate-800"
        >
          {totalMinutes}
          <span className="text-lg font-normal text-slate-500 ml-1">分钟</span>
        </motion.div>
        <p className="text-sm text-slate-500 mt-1">可用奖励时间</p>
      </div>

      {!isLocked && totalMinutes > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 text-center">快速使用</p>
          <div className="flex gap-2">
            {quickOptions.map(min => (
              <Button
                key={min}
                variant="outline"
                size="sm"
                className={cn(
                  "flex-1 rounded-xl",
                  min <= totalMinutes 
                    ? "hover:bg-amber-50 hover:border-amber-200" 
                    : "opacity-50"
                )}
                disabled={min > totalMinutes}
                onClick={() => handleUse(min)}
              >
                <Clock className="w-3 h-3 mr-1" />
                {min}分钟
              </Button>
            ))}
          </div>
        </div>
      )}

      {isLocked && (
        <div className="text-center py-2">
          <p className="text-sm text-slate-500">
            🔒 完成当前任务后解锁
          </p>
        </div>
      )}

      {totalMinutes === 0 && !isLocked && (
        <div className="text-center py-2">
          <p className="text-sm text-slate-500 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            完成任务赚取奖励时间
          </p>
        </div>
      )}
    </Card>
  );
}