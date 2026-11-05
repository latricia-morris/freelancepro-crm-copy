import React from "react";
import { motion } from "framer-motion";

export default function StatsCard({ title, value, subtitle, icon: Icon, trend, trendUp, color = "indigo" }) {
  const colorClasses = {
    indigo: "from-indigo-500 to-violet-500 shadow-indigo-200",
    emerald: "from-emerald-500 to-teal-500 shadow-emerald-200",
    amber: "from-amber-500 to-orange-500 shadow-amber-200",
    rose: "from-rose-500 to-pink-500 shadow-rose-200",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          )}
          {trend && (
            <div className={`mt-3 inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              trendUp ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}>
              {trendUp ? "↑" : "↓"} {trend}
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}