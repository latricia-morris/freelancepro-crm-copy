import React from "react";
import { motion } from "framer-motion";
import { FileText, Users, Target, Clock } from "lucide-react";
import { format } from "date-fns";

const iconMap = {
  invoice: FileText,
  contact: Users,
  opportunity: Target,
  time: Clock,
};

const colorMap = {
  invoice: "bg-emerald-100 text-emerald-600",
  contact: "bg-blue-100 text-blue-600",
  opportunity: "bg-violet-100 text-violet-600",
  time: "bg-amber-100 text-amber-600",
};

export default function RecentActivity({ activities = [] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {activities.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">
            No recent activity
          </div>
        ) : (
          activities.map((activity, index) => {
            const Icon = iconMap[activity.type] || FileText;
            return (
              <motion.div
                key={activity.id || index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[activity.type] || colorMap.invoice}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                  <p className="text-sm text-slate-500 truncate">{activity.description}</p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {activity.time ? format(new Date(activity.time), "MMM d, h:mm a") : "Just now"}
                </span>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}