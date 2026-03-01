import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';

const ENERGY_EMOJIS = ['😴', '😪', '😐', '😊', '⚡'];
const MOODS = [
  { emoji: '😰', label: '焦虑', value: 'anxious' },
  { emoji: '😴', label: '疲惫', value: 'tired' },
  { emoji: '😐', label: '平静', value: 'neutral' },
  { emoji: '😊', label: '不错', value: 'good' },
  { emoji: '🔥', label: '很好', value: 'great' },
];

export default function BodyScan({ onComplete, onDismiss }) {
  const [energy, setEnergy] = useState(3);
  const [mood, setMood] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      onComplete({ energy, mood });
    }, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl p-6 pb-10"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">身体扫描 🌿</h3>
          <p className="text-slate-500 text-sm">花10秒钟感受一下自己</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onDismiss}>
          <X className="w-5 h-5 text-slate-400" />
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div key="form" exit={{ opacity: 0, scale: 0.95 }}>
            {/* 精力评分 */}
            <div className="mb-6">
              <p className="text-sm font-medium text-slate-700 mb-3">精力值怎么样？</p>
              <div className="flex justify-between items-center gap-2">
                {ENERGY_EMOJIS.map((emoji, i) => (
                  <button
                    key={i}
                    onClick={() => setEnergy(i + 1)}
                    className={`flex-1 py-3 rounded-2xl text-2xl transition-all ${
                      energy === i + 1
                        ? 'bg-violet-100 scale-110 shadow-md'
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1 px-1">
                <span>很疲惫</span>
                <span>精力充沛</span>
              </div>
            </div>

            {/* 情绪选择 */}
            <div className="mb-6">
              <p className="text-sm font-medium text-slate-700 mb-3">现在感觉怎样？</p>
              <div className="flex gap-2 flex-wrap">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMood(m.value)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-all ${
                      mood === m.value
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!mood}
              className="w-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl h-12"
            >
              记录完成
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <p className="text-4xl mb-3">✨</p>
            <p className="text-lg font-semibold text-slate-800">
              {energy >= 4 ? '状态不错，继续加油！' : energy >= 3 ? '保持节奏，慢慢来' : '注意休息，量力而行'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}