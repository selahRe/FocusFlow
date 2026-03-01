import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronRight, Loader2 } from 'lucide-react';
import { localApi } from '@/api/localApi';

export default function StartupRitual({ task, onComplete }) {
  const [step, setStep] = useState('intro'); // intro | generating | ritual | ready
  const [firstStep, setFirstStep] = useState('');
  const [breathing, setBreathing] = useState(false);
  const [breathCount, setBreathCount] = useState(0);

  const generateFirstStep = async () => {
    setStep('generating');
    const res = await localApi.integrations.Core.InvokeLLM({
      prompt: `你是ADHD专注力教练。用户即将开始任务："${task.title}"。
请给出一个极小的、几乎不需要任何努力就能完成的"第一步"，帮助用户突破启动阻力。
要求：
- 一句话，10字以内
- 极其具体，比如"打开文档"、"坐到桌子前"、"拿出笔记本"
- 让人感觉"这也太简单了"
只输出这一句话，不要任何解释。`,
    });
    setFirstStep(res || '打开要用的文件或工具');
    setStep('ritual');
  };

  const startBreathing = () => {
    setBreathing(true);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setBreathCount(count);
      if (count >= 3) {
        clearInterval(interval);
        setTimeout(() => {
          setBreathing(false);
          setStep('ready');
        }, 1000);
      }
    }, 4000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-gradient-to-br from-slate-900 via-violet-950 to-purple-950 z-50 flex items-center justify-center p-6"
    >
      <div className="max-w-sm w-full text-center">
        <AnimatePresence mode="wait">
          {step === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">2分钟启动仪式</h2>
              <p className="text-white/60 mb-8 leading-relaxed">
                我们先做一个极小的第一步，<br />让你轻松进入状态
              </p>
              <Button
                onClick={generateFirstStep}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl h-14 text-lg"
              >
                开始仪式 ✨
              </Button>
            </motion.div>
          )}

          {step === 'generating' && (
            <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Loader2 className="w-12 h-12 text-violet-400 animate-spin mx-auto mb-4" />
              <p className="text-white/70">AI正在为你准备...</p>
            </motion.div>
          )}

          {step === 'ritual' && (
            <motion.div key="ritual" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <p className="text-white/50 text-sm mb-6 uppercase tracking-wider">你只需要做一件事</p>
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 mb-8">
                <p className="text-3xl font-bold text-white leading-tight">{firstStep}</p>
              </div>
              <p className="text-white/50 text-sm mb-6">就这一步，不用想后面的</p>
              <Button
                onClick={startBreathing}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl h-14 text-lg"
              >
                好的，我做到了 ✓
              </Button>
            </motion.div>
          )}

          {step === 'ready' && (
            <motion.div key="ready" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-24 h-24 mx-auto mb-6 bg-emerald-500 rounded-full flex items-center justify-center"
              >
                <span className="text-4xl">🎯</span>
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-3">太棒了！</h2>
              <p className="text-white/60 mb-8">
                你已经开始了。<br />接下来只是继续这个状态。
              </p>
              <Button
                onClick={onComplete}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl h-14 text-lg"
              >
                进入专注模式 <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 呼吸动画 */}
        <AnimatePresence>
          {breathing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/90 flex items-center justify-center"
            >
              <div className="text-center">
                <motion.div
                  animate={{ scale: breathCount % 2 === 0 ? [1, 1.8] : [1.8, 1] }}
                  transition={{ duration: 4, ease: "easeInOut" }}
                  className="w-32 h-32 mx-auto mb-6 bg-violet-500/30 rounded-full border-2 border-violet-400"
                />
                <p className="text-white text-xl">{breathCount % 2 === 0 ? '吸气...' : '呼气...'}</p>
                <p className="text-white/50 mt-2">{breathCount}/3 次深呼吸</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}