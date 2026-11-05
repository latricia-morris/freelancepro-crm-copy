import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, DollarSign, User, MoreVertical, Pencil, Trash2, Play, CheckCircle2, Plus, Pause, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusConfig = {
  planning: { label: "Planning", color: "bg-slate-100 text-slate-700" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  on_hold: { label: "On Hold", color: "bg-amber-100 text-amber-700" },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
};

export default function ProjectCard({ project, onEdit, onDelete, onTrackTime, index = 0, onRefresh }) {
  const status = statusConfig[project.status] || statusConfig.planning;
  const [showTasks, setShowTasks] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [startTime, setStartTime] = useState(null);
  
  const progress = project.estimated_hours > 0 
    ? Math.min(100, ((project.tracked_hours || 0) / project.estimated_hours) * 100)
    : 0;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: project.currency || 'USD',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  // Load tasks
  useEffect(() => {
    if (showTasks) {
      base44.entities.Task.filter({ project_id: project.id }).then(setTasks).catch(() => {});
    }
  }, [showTasks, project.id]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (timerRunning && !timerPaused) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerPaused]);

  const formatTimer = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleStartTimer = () => {
    setTimerRunning(true);
    setTimerPaused(false);
    setStartTime(new Date());
  };

  const handlePauseTimer = () => {
    setTimerPaused(!timerPaused);
  };

  const handleStopTimer = async () => {
    if (timerSeconds > 0) {
      const durationMinutes = timerSeconds / 60;
      await base44.entities.TimeEntry.create({
        project_id: project.id,
        project_name: project.name,
        date: format(new Date(), "yyyy-MM-dd"),
        start_time: startTime.toISOString(),
        end_time: new Date().toISOString(),
        duration_minutes: durationMinutes,
        description: "Tracked from project card",
        billable: true,
      });
      
      await base44.entities.Project.update(project.id, {
        tracked_hours: (project.tracked_hours || 0) + (durationMinutes / 60),
      });
      
      if (onRefresh) onRefresh();
    }
    setTimerRunning(false);
    setTimerPaused(false);
    setTimerSeconds(0);
    setStartTime(null);
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    await base44.entities.Task.create({
      title: newTask,
      project_id: project.id,
      project_name: project.name,
      status: "todo",
      priority: "medium",
    });
    setNewTask("");
    const updatedTasks = await base44.entities.Task.filter({ project_id: project.id });
    setTasks(updatedTasks);
  };

  const handleToggleTask = async (task) => {
    const newStatus = task.status === "completed" ? "todo" : "completed";
    await base44.entities.Task.update(task.id, {
      status: newStatus,
      completed_at: newStatus === "completed" ? new Date().toISOString() : null,
    });
    const updatedTasks = await base44.entities.Task.filter({ project_id: project.id });
    setTasks(updatedTasks);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:border-slate-200 transition-all duration-300 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900">{project.name}</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <User className="w-4 h-4" />
            <span>{project.contact_name}</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onTrackTime(project)}>
              <Play className="w-4 h-4 mr-2" /> Track Time
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(project)}>
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(project)} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{(project.tracked_hours || 0).toFixed(1)} / {project.estimated_hours || 0}h</span>
          </div>
          <span className="text-slate-500">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="flex flex-wrap gap-2 mb-4 text-sm text-slate-600">
        {project.budget > 0 && (
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span>{formatCurrency(project.budget)}</span>
          </div>
        )}
        {project.end_date && (
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{format(new Date(project.end_date), "MMM d, yyyy")}</span>
          </div>
        )}
      </div>

      {/* Timer Section */}
      {timerRunning && (
        <div className="mb-4 p-3 bg-indigo-50 rounded-xl border border-indigo-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <span className="text-2xl font-mono font-bold text-indigo-900">
                {formatTimer(timerSeconds)}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePauseTimer}
                className="h-8"
              >
                <Pause className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleStopTimer}
                className="h-8"
              >
                <Square className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {timerPaused && (
            <p className="text-xs text-amber-600 mt-1">En pause</p>
          )}
        </div>
      )}

      {/* Tasks Section */}
      {showTasks && (
        <div className="mb-4 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Nouvelle tâche..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
              className="h-8 text-sm"
            />
            <Button size="sm" onClick={handleAddTask} className="h-8">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {tasks.map(task => (
              <div
                key={task.id}
                onClick={() => handleToggleTask(task)}
                className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer text-sm"
              >
                <CheckCircle2 
                  className={`w-4 h-4 ${task.status === 'completed' ? 'text-emerald-500 fill-emerald-500' : 'text-slate-300'}`}
                />
                <span className={task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-700'}>
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={status.color}>{status.label}</Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowTasks(!showTasks)}
            className="h-6 px-2 text-xs"
          >
            {showTasks ? 'Masquer' : 'Tâches'}
          </Button>
          {!timerRunning && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleStartTimer}
              className="h-6 px-2 text-xs text-indigo-600"
            >
              <Play className="w-3 h-3 mr-1" />
              Démarrer
            </Button>
          )}
        </div>
        {project.hourly_rate > 0 && (
          <span className="text-xs text-slate-500">
            {formatCurrency(project.hourly_rate)}/hr
          </span>
        )}
      </div>
    </motion.div>
  );
}