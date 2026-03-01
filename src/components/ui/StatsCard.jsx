import React from 'react';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  color = "violet",
  delay = 0 
}) {
  const colorClasses = {
    violet: "from-violet-500 to-purple-600",
    emerald: "from-emerald-500 to-teal-600",
    amber: "from-amber-500 to-orange-600",
    rose: "from-rose-500 to-pink-600",
    blue: "from-blue-500 to-indigo-600"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="p-5 border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">{title}</p>
            <p className="text-3xl font-bold text-slate-800">{value}</p>
            {subtitle && (
              <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
            )}
            {trend && (
              <p className={cn(
                "text-sm mt-2 font-medium",
                trend > 0 ? "text-emerald-600" : trend < 0 ? "text-rose-600" : "text-slate-500"
              )}>
                {trend > 0 ? "↑" : trend < 0 ? "↓" : "→"} {Math.abs(trend)}% 较昨日
              </p>
            )}
          </div>
          {Icon && (
            <div className={cn(
              "w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center",
              colorClasses[color]
            )}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}