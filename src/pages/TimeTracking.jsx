import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { 
  Play, Pause, Plus, Clock, Calendar, ChevronLeft, ChevronRight, 
  Trash2, MoreVertical, Pencil, Square 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import TimeEntryForm from "@/components/time/TimeEntryForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const activityColors = {
  development: "bg-blue-100 text-blue-700",
  design: "bg-pink-100 text-pink-700",
  meeting: "bg-violet-100 text-violet-700",
  research: "bg-amber-100 text-amber-700",
  admin: "bg-slate-100 text-slate-700",
  other: "bg-gray-100 text-gray-700",
};

export default function TimeTracking() {
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deletingEntry, setDeletingEntry] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerProject, setTimerProject] = useState("");
  const [timerDescription, setTimerDescription] = useState("");
  const intervalRef = useRef(null);

  const queryClient = useQueryClient();

  const { data: timeEntries = [], isLoading } = useQuery({
    queryKey: ["timeEntries"],
    queryFn: () => base44.entities.TimeEntry.list("-date", 500),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list("-created_date", 500),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TimeEntry.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      setDeletingEntry(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.TimeEntry.create(data);
      const project = projects.find(p => p.id === data.project_id);
      if (project) {
        const newHours = (project.tracked_hours || 0) + (data.duration_minutes / 60);
        await base44.entities.Project.update(project.id, { tracked_hours: newHours });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setTimerSeconds(0);
      setTimerProject("");
      setTimerDescription("");
    },
  });

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const formatTimer = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsRunning(false);
    setIsPaused(true);
  };

  const handleStop = () => {
    if (timerProject && timerSeconds >= 60) {
      const project = projects.find(p => p.id === timerProject);
      createMutation.mutate({
        project_id: timerProject,
        project_name: project?.name || "",
        description: timerDescription,
        date: format(new Date(), "yyyy-MM-dd"),
        duration_minutes: Math.round(timerSeconds / 60),
        billable: true,
        activity_type: "development",
      });
    }
    setIsRunning(false);
    setIsPaused(false);
    setTimerSeconds(0);
    setTimerProject("");
    setTimerDescription("");
  };

  // Week navigation
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getEntriesForDay = (day) => {
    return timeEntries.filter(e => isSameDay(new Date(e.date), day));
  };

  const getDayTotal = (day) => {
    return getEntriesForDay(day).reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
  };

  const weekTotal = weekDays.reduce((sum, day) => sum + getDayTotal(day), 0);

  const formatDuration = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const handleAddEntry = (project) => {
    setSelectedProject(project);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Time Tracking</h1>
          <p className="text-slate-500 mt-1">Track time spent on projects</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Entry
        </Button>
      </motion.div>

      {/* Timer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-slate-100 p-6"
      >
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <Input
              placeholder="What are you working on?"
              value={timerDescription}
              onChange={(e) => setTimerDescription(e.target.value)}
              className="text-lg"
            />
          </div>
          <Select value={timerProject} onValueChange={setTimerProject}>
            <SelectTrigger className="w-full lg:w-64">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-mono font-bold text-slate-900 min-w-[140px] text-center">
              {formatTimer(timerSeconds)}
            </div>
            {!isRunning && !isPaused && (
              <Button
                onClick={handleStart}
                disabled={!timerProject}
                className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600"
              >
                <Play className="w-6 h-6 ml-1" />
              </Button>
            )}
            {isRunning && (
              <>
                <Button
                  onClick={handlePause}
                  className="w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600"
                >
                  <Pause className="w-6 h-6" />
                </Button>
                <Button
                  onClick={handleStop}
                  className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600"
                >
                  <Square className="w-6 h-6" />
                </Button>
              </>
            )}
            {isPaused && (
              <>
                <Button
                  onClick={handleStart}
                  className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600"
                >
                  <Play className="w-6 h-6 ml-1" />
                </Button>
                <Button
                  onClick={handleStop}
                  className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600"
                >
                  <Square className="w-6 h-6" />
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Week View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
      >
        {/* Week Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setCurrentWeek(d => new Date(d.setDate(d.getDate() - 7)))}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h3 className="font-semibold text-slate-900">
              {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
            </h3>
            <Button variant="ghost" size="icon" onClick={() => setCurrentWeek(d => new Date(d.setDate(d.getDate() + 7)))}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Week Total</p>
            <p className="text-xl font-bold text-indigo-600">{formatDuration(weekTotal)}</p>
          </div>
        </div>

        {/* Days */}
        <div className="divide-y divide-slate-100">
          {weekDays.map((day) => {
            const dayEntries = getEntriesForDay(day);
            const dayTotal = getDayTotal(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div key={day.toISOString()} className={`${isToday ? "bg-indigo-50/50" : ""}`}>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isToday ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}>
                      <span className="text-sm font-medium">{format(day, "d")}</span>
                    </div>
                    <div>
                      <p className={`font-medium ${isToday ? "text-indigo-600" : "text-slate-900"}`}>
                        {format(day, "EEEE")}
                      </p>
                      <p className="text-sm text-slate-500">{format(day, "MMMM d")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900">{formatDuration(dayTotal)}</p>
                    <p className="text-xs text-slate-500">{dayEntries.length} entries</p>
                  </div>
                </div>

                {/* Day Entries */}
                {dayEntries.length > 0 && (
                  <div className="px-4 pb-4 space-y-2">
                    {dayEntries.map((entry) => (
                      <div 
                        key={entry.id} 
                        className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-200 group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">
                            {entry.description || "No description"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-slate-500">{entry.project_name}</span>
                            <Badge className={activityColors[entry.activity_type] || activityColors.other}>
                              {entry.activity_type}
                            </Badge>
                            {entry.billable && (
                              <Badge className="bg-emerald-100 text-emerald-700">Billable</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {formatDuration(entry.duration_minutes)}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                <MoreVertical className="w-4 h-4 text-slate-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingEntry(entry)}>
                                <Pencil className="w-4 h-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDeletingEntry(entry)} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Forms and Dialogs */}
      {(showForm || editingEntry) && (
        <TimeEntryForm
          project={selectedProject}
          entry={editingEntry}
          onClose={() => {
            setShowForm(false);
            setEditingEntry(null);
            setSelectedProject(null);
          }}
        />
      )}

      <AlertDialog open={!!deletingEntry} onOpenChange={() => setDeletingEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Time Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this time entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deletingEntry.id)} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}