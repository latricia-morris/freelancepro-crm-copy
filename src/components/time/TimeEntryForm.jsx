import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

export default function TimeEntryForm({ project, entry, onClose }) {
  const [formData, setFormData] = useState(entry || {
    project_id: project?.id || "",
    project_name: project?.name || "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
    duration_minutes: 60,
    billable: true,
    activity_type: "development",
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.TimeEntry.create(data);
      // Update project tracked hours
      if (project) {
        const newHours = (project.tracked_hours || 0) + (data.duration_minutes / 60);
        await base44.entities.Project.update(project.id, { tracked_hours: newHours });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TimeEntry.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (entry) {
      updateMutation.mutate({ id: entry.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Convert hours:minutes input to total minutes
  const hours = Math.floor(formData.duration_minutes / 60);
  const minutes = formData.duration_minutes % 60;

  const handleTimeChange = (h, m) => {
    const totalMinutes = (parseInt(h) || 0) * 60 + (parseInt(m) || 0);
    handleChange("duration_minutes", totalMinutes);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {entry ? "Edit Time Entry" : "Log Time"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {project && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-sm text-slate-500">Project</p>
              <p className="font-medium text-slate-900">{project.name}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange("date", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Duration</Label>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <Input
                  type="number"
                  min="0"
                  value={hours}
                  onChange={(e) => handleTimeChange(e.target.value, minutes)}
                  className="text-center"
                />
                <p className="text-xs text-slate-500 text-center mt-1">Hours</p>
              </div>
              <span className="text-xl text-slate-400">:</span>
              <div className="flex-1">
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => handleTimeChange(hours, e.target.value)}
                  className="text-center"
                />
                <p className="text-xs text-slate-500 text-center mt-1">Minutes</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Activity Type</Label>
            <Select value={formData.activity_type} onValueChange={(v) => handleChange("activity_type", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="What did you work on?"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <Label htmlFor="billable" className="cursor-pointer">Billable</Label>
            <Switch
              id="billable"
              checked={formData.billable}
              onCheckedChange={(v) => handleChange("billable", v)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}