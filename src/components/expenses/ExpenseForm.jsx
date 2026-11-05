import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

const categoryLabels = {
  marketing: "Marketing",
  material: "Matériel",
  travel: "Déplacement",
  subcontracting: "Sous-traitance",
  software: "Logiciels",
  office: "Bureau",
  other: "Autre",
};

export default function ExpenseForm({ expense, projects, onSave, onClose, isLoading }) {
  const [formData, setFormData] = useState({
    project_id: "",
    project_name: "",
    category: "other",
    description: "",
    amount: "",
    currency: "USD",
    date: format(new Date(), "yyyy-MM-dd"),
    receipt_url: "",
    vendor: "",
    billable: true,
    invoiced: false,
    notes: "",
  });
  
  const [uploading, setUploading] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);

  useEffect(() => {
    if (expense) {
      setFormData({ ...expense });
    }
  }, [expense]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-fill project name when project is selected
    if (field === "project_id") {
      const project = projects.find(p => p.id === value);
      setFormData(prev => ({ ...prev, project_name: project?.name || "" }));
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptFile(file);
    setUploading(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, receipt_url: file_url }));
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      amount: parseFloat(formData.amount),
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] md:w-full md:max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-900">
            {expense ? "Modifier la dépense" : "Nouvelle dépense"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="project">Projet *</Label>
            <Select value={formData.project_id} onValueChange={(value) => handleChange("project_id", value)} required>
              <SelectTrigger id="project">
                <SelectValue placeholder="Sélectionner un projet" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category and Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Montant * ({formData.currency})</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Détails de la dépense"
            />
          </div>

          {/* Date and Vendor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor">Fournisseur</Label>
              <Input
                id="vendor"
                value={formData.vendor}
                onChange={(e) => handleChange("vendor", e.target.value)}
                placeholder="Nom du fournisseur"
              />
            </div>
          </div>

          {/* Receipt Upload */}
          <div className="space-y-2">
            <Label htmlFor="receipt">Reçu / Justificatif</Label>
            <div className="flex gap-3">
              <Input
                id="receipt"
                type="file"
                onChange={handleFileUpload}
                accept="image/*,.pdf"
                disabled={uploading}
                className="flex-1"
              />
              {formData.receipt_url && (
                <a 
                  href={formData.receipt_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Voir
                </a>
              )}
            </div>
            {uploading && <p className="text-sm text-slate-500">Upload en cours...</p>}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Notes additionnelles"
              rows={3}
            />
          </div>

          {/* Switches */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <Label htmlFor="billable" className="text-sm font-medium">Facturable au client</Label>
              <p className="text-xs text-slate-500 mt-1">Peut être ajoutée à une facture</p>
            </div>
            <Switch
              id="billable"
              checked={formData.billable}
              onCheckedChange={(value) => handleChange("billable", value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
              {isLoading ? "Enregistrement..." : expense ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </form>
      </motion.div>
    </>
  );
}