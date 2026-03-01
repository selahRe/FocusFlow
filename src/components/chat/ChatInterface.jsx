import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Loader2, Bot, User, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import { cn } from "@/lib/utils";
import { localApi } from "@/api/localApi";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ChatInterface({ 
  conversationId,
  onNewPlan,
  persistKey,
  placeholder = "告诉我你想完成什么任务...",
  quickPrompts = []
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState(conversationId || null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [draftPlan, setDraftPlan] = useState(null);
  const [draftSourceIndex, setDraftSourceIndex] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (conversationId) {
      setActiveConversationId(conversationId);
      loadConversation(conversationId);
    } else if (persistKey) {
      const savedId = window.localStorage.getItem(persistKey);
      if (savedId) {
        setActiveConversationId(savedId);
        loadConversation(savedId);
      }
    }
  }, [conversationId, persistKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversation = async (id) => {
    try {
      const conv = await localApi.agents.getConversation(id);
      setConversation(conv);
      setMessages(conv.messages || []);
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  const initConversation = async () => {
    try {
      const conv = await localApi.agents.createConversation({
        agent_name: "focus_coach",
        metadata: { name: "专注规划对话" }
      });
      if (persistKey && conv?.id) {
        window.localStorage.setItem(persistKey, conv.id);
      }
      setActiveConversationId(conv?.id || null);
      setConversation(conv);
      return conv;
    } catch (err) {
      console.error('Failed to create conversation:', err);
      return null;
    }
  };

  const sendMessage = async (content) => {
    if (!content.trim()) return;

    let currentConv = conversation;
    if (!currentConv) {
      currentConv = await initConversation();
      if (!currentConv) return;
    }

    setInput('');
    setIsLoading(true);

    try {
      const updated = await localApi.agents.addMessage(currentConv, {
        role: "user",
        content: content.trim()
      });
      if (updated) {
        setConversation(updated);
        setMessages(updated.messages || []);
      }
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to send message:', err);
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const getLastUserMessage = () => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === 'user') return messages[i].content;
    }
    return '';
  };

  const getLastAssistantMessage = () => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === 'assistant') return messages[i].content;
    }
    return '';
  };

  const buildPlanFromAssistant = async () => {
    const assistantText = getLastAssistantMessage();
    const userText = getLastUserMessage();
    const prompt = `请基于AI给出的时间规划，生成一个可直接创建的任务JSON。
要求：
- title 不超过30字
- estimated_minutes 为整数
- intensity 仅使用 light/medium/high
- category 仅使用 study/work/exercise/housework/creative/other
    - subtasks 为数组，每项包含 title/duration_minutes/start_time/end_time/reward_minutes
    - start_time/end_time 使用 HH:mm

    当前时间：${format(new Date(), 'HH:mm')}
    当前日期：${format(new Date(), 'yyyy-MM-dd')}

    AI规划内容：
    ${assistantText || '未获取到规划内容'}

    用户需求：${userText || '帮我制定一个专注计划'}`;

    const result = await localApi.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          estimated_minutes: { type: "number" },
          intensity: { type: "string" },
          category: { type: "string" },
          subtasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                duration_minutes: { type: "number" },
                start_time: { type: "string" },
                end_time: { type: "string" },
                reward_minutes: { type: "number" }
              }
            }
          }
        }
      }
    });

    return {
      title: result.title || '专注计划',
      description: result.description || userText,
      estimated_minutes: Math.round(result.estimated_minutes || 60),
      intensity: result.intensity || 'medium',
      category: result.category || 'other',
      subtasks: Array.isArray(result.subtasks) ? result.subtasks : []
    };
  };

  const handleGeneratePlan = async (sourceIndex) => {
    if (!onNewPlan) return;
    setIsGeneratingPlan(true);
    try {
      const plan = await buildPlanFromAssistant();
      setDraftPlan(plan);
      setDraftSourceIndex(sourceIndex);
    } catch (err) {
      console.error('Failed to generate plan:', err);
      toast.error('生成任务预览失败，请重试');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleAddPlan = async () => {
    if (!onNewPlan || !draftPlan) return;
    setIsCreatingTask(true);
    try {
      await onNewPlan(draftPlan);
      toast.success('已添加到今日任务');
    } catch (err) {
      console.error('Failed to add plan:', err);
      toast.error('添加任务失败，请重试');
    } finally {
      setIsCreatingTask(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              嗨，我是你的专注力教练 ✨
            </h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              告诉我你想完成什么任务，我会帮你制定适合ADHD特点的专注计划
            </p>

            {quickPrompts.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {quickPrompts.map((prompt, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => sendMessage(prompt)}
                  >
                    <Sparkles className="w-3 h-3 mr-1.5" />
                    {prompt}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-3",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {msg.role !== 'user' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3",
                msg.role === 'user'
                  ? "bg-slate-800 text-white"
                  : "bg-white border border-slate-200"
              )}>
                {msg.role === 'user' ? (
                  <p>{msg.content}</p>
                ) : (
                  <div className="space-y-3">
                    <ReactMarkdown className="prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {msg.content}
                    </ReactMarkdown>
                    {onNewPlan && index === messages.length - 1 && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="rounded-full"
                          onClick={() => handleGeneratePlan(index)}
                          disabled={isGeneratingPlan}
                        >
                          {isGeneratingPlan ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              生成中...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-1" />
                              生成任务预览
                            </>
                          )}
                        </Button>
                        {draftPlan && draftSourceIndex === index && (
                          <Button
                            type="button"
                            size="sm"
                            className="rounded-full"
                            onClick={handleAddPlan}
                            disabled={isCreatingTask}
                          >
                            {isCreatingTask ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                添加中...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 mr-1" />
                                添加到今日任务
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                    {draftPlan && draftSourceIndex === index && (
                      <div className="mt-3 space-y-3">
                        <Card className="border-slate-200">
                          <div className="p-4 space-y-3">
                            <Input
                              value={draftPlan.title}
                              onChange={(e) => setDraftPlan({ ...draftPlan, title: e.target.value })}
                              placeholder="任务标题"
                            />
                            <Input
                              value={draftPlan.description || ''}
                              onChange={(e) => setDraftPlan({ ...draftPlan, description: e.target.value })}
                              placeholder="任务描述"
                            />
                            <div className="grid grid-cols-3 gap-2">
                              <Input
                                value={draftPlan.estimated_minutes}
                                onChange={(e) => setDraftPlan({ ...draftPlan, estimated_minutes: Number(e.target.value) || 0 })}
                                placeholder="分钟"
                              />
                              <Input
                                value={draftPlan.intensity}
                                onChange={(e) => setDraftPlan({ ...draftPlan, intensity: e.target.value })}
                                placeholder="light/medium/high"
                              />
                              <Input
                                value={draftPlan.category}
                                onChange={(e) => setDraftPlan({ ...draftPlan, category: e.target.value })}
                                placeholder="study/work/..."
                              />
                            </div>
                          </div>
                        </Card>

                        <Card className="border-slate-200">
                          <div className="p-4 space-y-2">
                            <div className="text-sm font-medium text-slate-700">子任务预览</div>
                            {draftPlan.subtasks.length === 0 && (
                              <div className="text-xs text-slate-500">暂无子任务</div>
                            )}
                            {draftPlan.subtasks.map((st, idx) => (
                              <div key={idx} className="grid grid-cols-5 gap-2">
                                <Input
                                  value={st.title || ''}
                                  onChange={(e) => {
                                    const next = [...draftPlan.subtasks];
                                    next[idx] = { ...next[idx], title: e.target.value };
                                    setDraftPlan({ ...draftPlan, subtasks: next });
                                  }}
                                  placeholder="标题"
                                />
                                <Input
                                  value={st.start_time || ''}
                                  onChange={(e) => {
                                    const next = [...draftPlan.subtasks];
                                    next[idx] = { ...next[idx], start_time: e.target.value };
                                    setDraftPlan({ ...draftPlan, subtasks: next });
                                  }}
                                  placeholder="开始"
                                />
                                <Input
                                  value={st.end_time || ''}
                                  onChange={(e) => {
                                    const next = [...draftPlan.subtasks];
                                    next[idx] = { ...next[idx], end_time: e.target.value };
                                    setDraftPlan({ ...draftPlan, subtasks: next });
                                  }}
                                  placeholder="结束"
                                />
                                <Input
                                  value={st.duration_minutes || ''}
                                  onChange={(e) => {
                                    const next = [...draftPlan.subtasks];
                                    next[idx] = { ...next[idx], duration_minutes: Number(e.target.value) || 0 };
                                    setDraftPlan({ ...draftPlan, subtasks: next });
                                  }}
                                  placeholder="分钟"
                                />
                                <Input
                                  value={st.reward_minutes || ''}
                                  onChange={(e) => {
                                    const next = [...draftPlan.subtasks];
                                    next[idx] = { ...next[idx], reward_minutes: Number(e.target.value) || 0 };
                                    setDraftPlan({ ...draftPlan, subtasks: next });
                                  }}
                                  placeholder="奖励"
                                />
                              </div>
                            ))}
                          </div>
                        </Card>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-slate-600" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>正在思考...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="p-4 border-t border-slate-100">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="flex-1 rounded-full bg-slate-50 border-slate-200"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="rounded-full w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-600"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}