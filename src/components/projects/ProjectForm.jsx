import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ProjectForm({ project, contacts, onSave, onClose, isLoading }) {
  const [formData, setFormData] = useState(project || {
    name: "",
    contact_id: "",
    contact_name: "",
    description: "",
    status: "planning",
    budget: 0,
    currency: "USD",
    hourly_rate: 0,
    start_date: "",
    end_date: "",
    estimated_hours: 0,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    
    // Auto-calculate budget when hourly_rate or estimated_hours change
    if (field === "hourly_rate" || field === "estimated_hours") {
      const rate = field === "hourly_rate" ? value : newData.hourly_rate;
      const hours = field === "estimated_hours" ? value : newData.estimated_hours;
      if (rate && hours) {
        newData.budget = rate * hours;
      }
    }
    
    setFormData(newData);
  };

  const handleContactChange = (contactId) => {
    const contact = contacts.find(c => c.id === contactId);
    setFormData(prev => ({
      ...prev,
      contact_id: contactId,
      contact_name: contact ? `${contact.first_name} ${contact.last_name}` : "",
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {project ? "Edit Project" : "New Project"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              placeholder="Website Redesign"
            />
          </div>

          <div className="space-y-2">
            <Label>Client *</Label>
            <Select value={formData.contact_id} onValueChange={handleContactChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map(contact => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name}
                    {contact.company && ` - ${contact.company}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Budget</Label>
              <Input
                type="number"
                min="0"
                value={formData.budget}
                onChange={(e) => handleChange("budget", parseFloat(e.target.value) || 0)}
                placeholder="10000"
                className="bg-slate-50"
                readOnly
              />
              <p className="text-xs text-slate-500">Calculé automatiquement</p>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={formData.currency} onValueChange={(v) => handleChange("currency", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hourly Rate</Label>
              <Input
                type="number"
                min="0"
                value={formData.hourly_rate}
                onChange={(e) => handleChange("hourly_rate", parseFloat(e.target.value) || 0)}
                placeholder="150"
              />
            </div>
            <div className="space-y-2">
              <Label>Estimated Hours</Label>
              <Input
                type="number"
                min="0"
                value={formData.estimated_hours}
                onChange={(e) => handleChange("estimated_hours", parseFloat(e.target.value) || 0)}
                placeholder="40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange("start_date", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => handleChange("end_date", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Project description and objectives..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.name || !formData.contact_id}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? "Saving..." : project ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}