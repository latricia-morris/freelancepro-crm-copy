import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";

const priorityColors = {
  urgent: "text-red-500",
  high: "text-orange-500",
  medium: "text-amber-500",
  low: "text-slate-400",
};

export default function UpcomingTasks({ tasks = [] }) {
  const formatDueDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "MMM d");
  };

  const isOverdue = (date) => {
    if (!date) return false;
    return isPast(new Date(date)) && !isToday(new Date(date));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100"
    >
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Upcoming Tasks</h3>
          <p className="text-sm text-slate-500">Your next priorities</p>
        </div>
        <Link 
          to={createPageUrl("Projects")} 
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="divide-y divide-slate-100">
        {tasks.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">
            No upcoming tasks
          </div>
        ) : (
          tasks.slice(0, 5).map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
            >
              <button className={priorityColors[task.priority]}>
                {task.status === "completed" ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-slate-400" : "text-slate-900"}`}>
                  {task.title}
                </p>
                {task.project_name && (
                  <p className="text-xs text-slate-500">{task.project_name}</p>
                )}
              </div>
              {task.due_date && (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  isOverdue(task.due_date) 
                    ? "bg-red-50 text-red-600" 
                    : isToday(new Date(task.due_date))
                    ? "bg-amber-50 text-amber-600"
                    : "bg-slate-100 text-slate-600"
                }`}>
                  {formatDueDate(task.due_date)}
                </span>
              )}
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}