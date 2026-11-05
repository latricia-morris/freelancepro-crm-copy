import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths 
} from "date-fns";
import { 
  ChevronLeft, ChevronRight, Plus, Clock, MapPin, Video, 
  MoreVertical, Pencil, Trash2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

const eventColors = {
  meeting: "#4F46E5",
  call: "#10B981",
  deadline: "#EF4444",
  reminder: "#F59E0B",
  personal: "#8B5CF6",
};

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deletingEvent, setDeletingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    type: "meeting",
    location: "",
    video_link: "",
    color: "#4F46E5",
  });

  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => base44.entities.Event.list("-start_time", 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Event.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      closeForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Event.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Event.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setDeletingEvent(null);
    },
  });

  const closeForm = () => {
    setShowForm(false);
    setEditingEvent(null);
    setSelectedDate(null);
    setFormData({
      title: "",
      description: "",
      start_time: "",
      end_time: "",
      type: "meeting",
      location: "",
      video_link: "",
      color: "#4F46E5",
    });
  };

  const openNewEvent = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setFormData({
      title: "",
      description: "",
      start_time: `${dateStr}T09:00`,
      end_time: `${dateStr}T10:00`,
      type: "meeting",
      location: "",
      video_link: "",
      color: "#4F46E5",
    });
    setSelectedDate(date);
    setShowForm(true);
  };

  const openEditEvent = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title || "",
      description: event.description || "",
      start_time: event.start_time ? format(new Date(event.start_time), "yyyy-MM-dd'T'HH:mm") : "",
      end_time: event.end_time ? format(new Date(event.end_time), "yyyy-MM-dd'T'HH:mm") : "",
      type: event.type || "meeting",
      location: event.location || "",
      video_link: event.video_link || "",
      color: event.color || "#4F46E5",
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const eventData = {
      ...formData,
      start_time: new Date(formData.start_time).toISOString(),
      end_time: formData.end_time ? new Date(formData.end_time).toISOString() : null,
    };

    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data: eventData });
    } else {
      createMutation.mutate(eventData);
    }
  };

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day) => {
    return events.filter(e => {
      if (!e.start_time) return false;
      return isSameDay(new Date(e.start_time), day);
    });
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
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Calendar</h1>
          <p className="text-slate-500 mt-1">Manage your schedule and appointments</p>
        </div>
        <Button 
          onClick={() => openNewEvent(new Date())}
          className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Event
        </Button>
      </motion.div>

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
      >
        {/* Month Navigation */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-semibold text-slate-900">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-slate-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
          {calendarDays.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <div
                key={day.toISOString()}
                onClick={() => openNewEvent(day)}
                className={`min-h-[120px] p-2 cursor-pointer hover:bg-slate-50 transition-colors ${
                  !isCurrentMonth ? "bg-slate-50/50" : ""
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mb-1 ${
                  isToday 
                    ? "bg-indigo-600 text-white font-semibold" 
                    : isCurrentMonth 
                    ? "text-slate-900" 
                    : "text-slate-400"
                }`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditEvent(event);
                      }}
                      className="text-xs p-1.5 rounded-md truncate cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ 
                        backgroundColor: `${event.color || eventColors[event.type]}20`,
                        color: event.color || eventColors[event.type],
                        borderLeft: `3px solid ${event.color || eventColors[event.type]}`,
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-slate-500 pl-1">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Event Form */}
      <Dialog open={showForm} onOpenChange={closeForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {editingEvent ? "Edit Event" : "New Event"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
                required
                placeholder="Meeting with client"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start</Label>
                <Input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData(f => ({ ...f, start_time: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>End</Label>
                <Input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData(f => ({ ...f, end_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(v) => setFormData(f => ({ ...f, type: v, color: eventColors[v] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData(f => ({ ...f, location: e.target.value }))}
                placeholder="Office or address"
              />
            </div>

            <div className="space-y-2">
              <Label>Video Link</Label>
              <Input
                value={formData.video_link}
                onChange={(e) => setFormData(f => ({ ...f, video_link: e.target.value }))}
                placeholder="Zoom or Google Meet link"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                placeholder="Event details..."
                rows={3}
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              {editingEvent && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setDeletingEvent(editingEvent)}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              )}
              <div className="flex gap-3 ml-auto">
                <Button type="button" variant="outline" onClick={closeForm}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingEvent} onOpenChange={() => setDeletingEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingEvent?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                deleteMutation.mutate(deletingEvent.id);
                closeForm();
              }} 
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}