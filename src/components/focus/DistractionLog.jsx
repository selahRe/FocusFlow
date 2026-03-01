import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, PenLine, Check, BookOpen } from 'lucide-react';

export default function DistractionLog({ onClose }) {
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState([]);
  const [justSaved, setJustSaved] = useState(false);

  const handleSave = () => {
    if (!input.trim()) return;
    setLogs(prev => [{ text: input.trim(), time: new Date().toLocaleTimeString('zh', { hour: '2-digit', minute: '2-digit' }) }, ...prev]);
    setInput('');
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      className="fixed inset-0 bg-white z-50 flex flex-col"
    >
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-violet-500" />
          <div>
            <h3 className="font-bold text-slate-800">分心记录本</h3>
            <p className="text-xs text-slate-400">记下来，稍后处理</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5 text-slate-400" />
        </Button>
      </div>

      {/* 输入区 */}
      <div className="p-4 bg-violet-50 border-b border-violet-100">
        <p className="text-sm text-violet-700 mb-3 font-medium">
          💡 想到了什么？快速记下来，然后回到任务
        </p>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="随便写，不用整理..."
            className="flex-1 rounded-xl border-violet-200 bg-white"
            autoFocus
          />
          <Button
            onClick={handleSave}
            disabled={!input.trim()}
            className="rounded-xl bg-violet-600 hover:bg-violet-700 w-12 px-0"
          >
            <AnimatePresence mode="wait">
              {justSaved ? (
                <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <Check className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div key="pen" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <PenLine className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </div>

      {/* 记录列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-4xl mb-3">📝</p>
            <p>还没有记录</p>
            <p className="text-sm mt-1">把脑子里乱的想法写下来</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-slate-400 mb-3">今天的分心记录（{logs.length}条）</p>
            <AnimatePresence>
              {logs.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl"
                >
                  <span className="text-xs text-slate-400 mt-0.5 whitespace-nowrap">{log.time}</span>
                  <p className="text-slate-700 text-sm flex-1">{log.text}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="p-4 border-t border-slate-100">
        <Button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl h-12"
        >
          回到专注 🎯
        </Button>
      </div>
    </motion.div>
  );
}