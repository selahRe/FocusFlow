import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

export default function ImperfectAcceptance({ completedCount, totalCount }) {
  if (totalCount === 0) return null;
  const rate = Math.round((completedCount / totalCount) * 100);
  // 只在有进展但未全完成时显示正向反馈
  if (rate === 0 || rate === 100) return null;

  const getMessage = (rate) => {
    if (rate >= 80) return { emoji: '🌟', text: '太棒了！完成度很高，今天的你超厉害！', color: 'from-emerald-50 to-green-50', border: 'border-emerald-200', text_color: 'text-emerald-700' };
    if (rate >= 60) return { emoji: '💪', text: `完成了${rate}%，已经很了不起了。不完美也是完成！`, color: 'from-violet-50 to-purple-50', border: 'border-violet-200', text_color: 'text-violet-700' };
    if (rate >= 40) return { emoji: '🌱', text: `完成${rate}%，每一步都算数。明天继续？`, color: 'from-sky-50 to-blue-50', border: 'border-sky-200', text_color: 'text-sky-700' };
    return { emoji: '🤗', text: `今天开始了，已经赢了不开始的自己。`, color: 'from-amber-50 to-orange-50', border: 'border-amber-200', text_color: 'text-amber-700' };
  };

  const msg = getMessage(rate);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
      className={`mb-5 rounded-2xl bg-gradient-to-br ${msg.color} border ${msg.border} p-4 flex items-center gap-3`}
    >
      <span className="text-2xl">{msg.emoji}</span>
      <div className="flex-1">
        <div className="flex items-center gap-1.5 mb-1">
          <Heart className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-xs font-semibold text-rose-500">不完美接纳</span>
        </div>
        <p className={`text-sm ${msg.text_color}`}>{msg.text}</p>
      </div>
    </motion.div>
  );
}