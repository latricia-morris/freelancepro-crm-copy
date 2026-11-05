import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Eye, Edit } from "lucide-react";
import { format, addDays } from "date-fns";
import { base44 } from "@/api/base44Client";

export default function QuoteInvoiceForm({ type, item, contacts, onSave, onClose, isLoading, nextNumber }) {
  const isQuote = type === "quote";
  const [businessSettings, setBusinessSettings] = useState(null);
  
  const [formData, setFormData] = useState(item || {
    [isQuote ? "quote_number" : "invoice_number"]: nextNumber || `${isQuote ? "QUO" : "INV"}-${String(Date.now()).slice(-6)}`,
    contact_id: "",
    contact_name: "",
    status: "draft",
    issue_date: format(new Date(), "yyyy-MM-dd"),
    [isQuote ? "valid_until" : "due_date"]: format(addDays(new Date(), isQuote ? 30 : 30), "yyyy-MM-dd"),
    items: [{ description: "", quantity: 1, unit_price: 0, tax_rate: 0 }],
    currency: "USD",
    notes: "",
    payment_terms: "Net 30",
  });

  useEffect(() => {
    base44.auth.me().then(user => {
      setBusinessSettings(user?.business || {});
      if (!item && user?.business?.currency) {
        setFormData(prev => ({ ...prev, currency: user.business.currency }));
      }
    }).catch(() => {});
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const subtotal = formData.items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price), 0
    );
    const taxAmount = formData.items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price * (item.tax_rate / 100)), 0
    );
    
    onSave({
      ...formData,
      subtotal,
      tax_amount: taxAmount,
      total: subtotal + taxAmount,
    });
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

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, unit_price: 0, tax_rate: 0 }],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price), 0
    );
    const taxAmount = formData.items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price * (item.tax_rate / 100)), 0
    );
    return { subtotal, taxAmount, total: subtotal + taxAmount };
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  const formatCurrency = (value) => {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
    
    const currencySymbol = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: '$',
      AUD: '$'
    }[formData.currency] || formData.currency;
    
    const position = businessSettings?.currency_position || 'after';
    return position === 'before' 
      ? `${currencySymbol} ${formatted}`
      : `${formatted} ${currencySymbol}`;
  };

  const selectedContact = contacts.find(c => c.id === formData.contact_id);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {item ? `Modifier ${isQuote ? "le devis" : "la facture"}` : `Nouveau ${isQuote ? "devis" : "facture"}`}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="edit" className="mt-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit className="w-4 h-4" /> Édition
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" /> Aperçu
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{isQuote ? "Numéro de devis" : "Numéro de facture"}</Label>
                  <Input
                    value={formData[isQuote ? "quote_number" : "invoice_number"]}
                    onChange={(e) => handleChange(isQuote ? "quote_number" : "invoice_number", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => handleChange("issue_date", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isQuote ? "Valide jusqu'au" : "Date d'échéance"}</Label>
                  <Input
                    type="date"
                    value={formData[isQuote ? "valid_until" : "due_date"]}
                    onChange={(e) => handleChange(isQuote ? "valid_until" : "due_date", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client *</Label>
                  <Select value={formData.contact_id} onValueChange={handleContactChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
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
                  <Label>Devise</Label>
                  <Select value={formData.currency} onValueChange={(v) => handleChange("currency", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Articles</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="w-4 h-4 mr-1" /> Ajouter
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-slate-50 rounded-xl">
                      <div className="col-span-12 sm:col-span-5 space-y-1">
                        <Label className="text-xs text-slate-500">Description</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => handleItemChange(index, "description", e.target.value)}
                          placeholder="Service ou produit"
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2 space-y-1">
                        <Label className="text-xs text-slate-500">Qté</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2 space-y-1">
                        <Label className="text-xs text-slate-500">Prix</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, "unit_price", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-2 space-y-1">
                        <Label className="text-xs text-slate-500">Taxe %</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={item.tax_rate}
                          onChange={(e) => handleItemChange(index, "tax_rate", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          disabled={formData.items.length === 1}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Sous-total</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Taxe</span>
                  <span className="font-medium">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span className="text-indigo-600">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Instructions de paiement ou notes additionnelles..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading || !formData.contact_id}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isLoading ? "Enregistrement..." : item ? "Mettre à jour" : "Créer"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-4xl mx-auto">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">{isQuote ? "DEVIS" : "FACTURE"}</h2>
                  <p className="text-slate-600">#{formData[isQuote ? "quote_number" : "invoice_number"]}</p>
                </div>
                <div className="text-right">
                  {businessSettings?.logo_url && (
                    <img src={businessSettings.logo_url} alt="Logo" className="h-12 ml-auto mb-2" />
                  )}
                  <p className="font-semibold text-slate-900 text-lg">
                    {businessSettings?.business_name || "Votre entreprise"}
                  </p>
                  {businessSettings?.address && (
                    <p className="text-sm text-slate-600 whitespace-pre-line max-w-xs">
                      {businessSettings.address}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-slate-200">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Client</p>
                  {selectedContact ? (
                    <>
                      <p className="font-semibold text-slate-900">{selectedContact.first_name} {selectedContact.last_name}</p>
                      {selectedContact.company && <p className="text-slate-600">{selectedContact.company}</p>}
                      {selectedContact.email && <p className="text-sm text-slate-600">{selectedContact.email}</p>}
                    </>
                  ) : (
                    <p className="text-slate-400 italic">Sélectionner un client</p>
                  )}
                </div>
                <div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Date:</span>
                      <span className="font-medium text-slate-900">
                        {formData.issue_date && format(new Date(formData.issue_date), "dd/MM/yyyy")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">{isQuote ? "Valide jusqu'au:" : "Échéance:"}</span>
                      <span className="font-medium text-slate-900">
                        {formData[isQuote ? "valid_until" : "due_date"] && format(new Date(formData[isQuote ? "valid_until" : "due_date"]), "dd/MM/yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-300">
                      <th className="text-left py-3 text-sm font-semibold text-slate-700">Description</th>
                      <th className="text-right py-3 text-sm font-semibold text-slate-700 w-20">Qté</th>
                      <th className="text-right py-3 text-sm font-semibold text-slate-700 w-24">Prix</th>
                      <th className="text-right py-3 text-sm font-semibold text-slate-700 w-20">Taxe</th>
                      <th className="text-right py-3 text-sm font-semibold text-slate-700 w-28">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => {
                      const itemTotal = item.quantity * item.unit_price;
                      const itemTax = itemTotal * (item.tax_rate / 100);
                      return (
                        <tr key={index} className="border-b border-slate-100">
                          <td className="py-3 text-slate-900">
                            {item.description || <span className="text-slate-400 italic">Sans description</span>}
                          </td>
                          <td className="py-3 text-right text-slate-600">{item.quantity}</td>
                          <td className="py-3 text-right text-slate-600">{formatCurrency(item.unit_price)}</td>
                          <td className="py-3 text-right text-slate-600">{item.tax_rate}%</td>
                          <td className="py-3 text-right font-medium text-slate-900">
                            {formatCurrency(itemTotal + itemTax)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mb-8">
                <div className="w-80 space-y-3">
                  <div className="flex justify-between text-slate-600">
                    <span>Sous-total:</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Taxe:</span>
                    <span className="font-medium">{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-slate-900 pt-3 border-t-2 border-slate-300">
                    <span>Total:</span>
                    <span className="text-indigo-600">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {formData.notes && (
                <div className="pt-6 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Notes</p>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{formData.notes}</p>
                </div>
              )}

              <div className="mt-12 pt-6 border-t border-slate-200 text-center">
                <p className="text-xs text-slate-500">Merci pour votre confiance!</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isLoading || !formData.contact_id}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? "Enregistrement..." : item ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}