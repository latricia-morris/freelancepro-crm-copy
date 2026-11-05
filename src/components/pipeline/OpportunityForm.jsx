import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

const stages = [
  { value: "lead", label: "Lead" },
  { value: "contact_made", label: "Contact Made" },
  { value: "proposal_sent", label: "Proposal Sent" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export default function OpportunityForm({ opportunity, contacts, onSave, onClose, isLoading }) {
  const [formData, setFormData] = React.useState(opportunity || {
    title: "",
    contact_id: "",
    contact_name: "",
    stage: "lead",
    value: 0,
    currency: "USD",
    probability: 20,
    expected_close_date: "",
    description: "",
    notes: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleContactChange = (contactId) => {
    const contact = contacts.find(c => c.id === contactId);
    setFormData(prev => ({
      ...prev,
      contact_id: contactId,
      contact_name: contact ? `${contact.first_name} ${contact.last_name}` : "",
    }));
  };

  // Auto-adjust probability based on stage
  const handleStageChange = (stage) => {
    const probabilities = {
      lead: 20,
      contact_made: 40,
      proposal_sent: 60,
      negotiation: 80,
      won: 100,
      lost: 0,
    };
    setFormData(prev => ({
      ...prev,
      stage,
      probability: probabilities[stage] || prev.probability,
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {opportunity ? "Edit Opportunity" : "New Opportunity"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Opportunity Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
              placeholder="Website Redesign Project"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Contact *</Label>
            <Select value={formData.contact_id} onValueChange={handleContactChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a contact" />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Deal Value *</Label>
              <Input
                id="value"
                type="number"
                min="0"
                step="100"
                value={formData.value}
                onChange={(e) => handleChange("value", parseFloat(e.target.value) || 0)}
                placeholder="10000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={formData.currency} onValueChange={(v) => handleChange("currency", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CAD">CAD ($)</SelectItem>
                  <SelectItem value="AUD">AUD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage">Stage</Label>
            <Select value={formData.stage} onValueChange={handleStageChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stages.map(stage => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Win Probability</Label>
              <span className="text-sm font-medium text-slate-700">{formData.probability}%</span>
            </div>
            <Slider
              value={[formData.probability]}
              onValueChange={([value]) => handleChange("probability", value)}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected_close_date">Expected Close Date</Label>
            <Input
              id="expected_close_date"
              type="date"
              value={formData.expected_close_date}
              onChange={(e) => handleChange("expected_close_date", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe this opportunity..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.title || !formData.contact_id}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? "Saving..." : opportunity ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}