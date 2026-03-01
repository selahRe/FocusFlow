import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import ChatInterface from "@/components/chat/ChatInterface";

export default function Coach() {
  return (
    <div className="h-screen flex flex-col pb-24 bg-gradient-to-br from-slate-50 via-violet-50/30 to-purple-50/20">
      {/* 头部 */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-100 bg-white/80 backdrop-blur-sm">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-semibold text-slate-800">AI专注力教练</h1>
          <p className="text-xs text-slate-500">帮你规划任务、解决问题</p>
        </div>
      </div>

      {/* 聊天界面 */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          placeholder="告诉我你想完成什么..."
          quickPrompts={[
            "帮我规划今天的学习",
            "我总是无法集中注意力",
            "如何开始一个困难的任务"
          ]}
        />
      </div>
    </div>
  );
}