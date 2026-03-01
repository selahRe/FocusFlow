import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, BarChart3, Settings, Sparkles, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/sonner";

const navItems = [
  { page: 'Home', icon: Home, label: '首页' },
  { page: 'Habits', icon: Link2, label: '习惯' },
  { page: 'Stats', icon: BarChart3, label: '统计' },
  { page: 'Coach', icon: Sparkles, label: '教练' },
  { page: 'Settings', icon: Settings, label: '设置' }
];

export default function Layout({ children, currentPageName }) {
  // 专注页面不显示导航
  const hideNav = ['Focus'].includes(currentPageName);

  return (
    <div className="min-h-screen">
      <Toaster position="top-center" />
      
      {children}

      {/* 底部导航 */}
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-100 safe-area-inset-bottom z-40">
          <div className="max-w-lg mx-auto flex justify-around py-2">
            {navItems.map(({ page, icon: Icon, label }) => {
              const isActive = currentPageName === page;
              return (
                <Link
                  key={page}
                  to={createPageUrl(page)}
                  className={cn(
                    "flex flex-col items-center py-2 px-4 rounded-xl transition-all",
                    isActive 
                      ? "text-violet-600" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-xl mb-1 transition-all",
                    isActive && "bg-violet-100"
                  )}>
                    <Icon className={cn(
                      "w-5 h-5",
                      isActive && "text-violet-600"
                    )} />
                  </div>
                  <span className="text-xs font-medium">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* 安全区域样式 */}
      <style>{`
        .safe-area-inset-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
        
        @media (max-width: 640px) {
          .safe-area-inset-bottom {
            padding-bottom: max(env(safe-area-inset-bottom), 8px);
          }
        }
      `}</style>
    </div>
  );
}