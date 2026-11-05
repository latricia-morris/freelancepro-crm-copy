import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import { Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import OpportunityCard from "@/components/pipeline/OpportunityCard";
import OpportunityForm from "@/components/pipeline/OpportunityForm";
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

const stages = [
  { id: "lead", label: "Lead", color: "bg-slate-500" },
  { id: "contact_made", label: "Contact Made", color: "bg-blue-500" },
  { id: "proposal_sent", label: "Proposal Sent", color: "bg-violet-500" },
  { id: "negotiation", label: "Negotiation", color: "bg-amber-500" },
  { id: "won", label: "Won", color: "bg-emerald-500" },
  { id: "lost", label: "Lost", color: "bg-rose-500" },
];

export default function Pipeline() {
  const [showForm, setShowForm] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const [deletingOpportunity, setDeletingOpportunity] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "new") {
      setShowForm(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ["opportunities"],
    queryFn: () => base44.entities.Opportunity.list("-created_date", 500),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => base44.entities.Contact.list("-created_date", 500),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const opp = await base44.entities.Opportunity.create(data);
      
      // Generate quote for new opportunity in lead stage
      if (data.stage === "lead" && opp.id) {
        const year = new Date().getFullYear();
        const quoteNumber = `QUO-${year}-${String(Date.now()).slice(-4)}`;
        await base44.entities.Quote.create({
          quote_number: quoteNumber,
          contact_id: data.contact_id,
          contact_name: data.contact_name,
          opportunity_id: opp.id,
          status: "draft",
          issue_date: format(new Date(), "yyyy-MM-dd"),
          valid_until: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
          items: [{ description: data.title, quantity: 1, unit_price: data.value || 0, tax_rate: 0 }],
          subtotal: data.value || 0,
          tax_amount: 0,
          total: data.value || 0,
          currency: data.currency || "USD",
        });
      }
      
      return opp;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const opportunity = opportunities.find(o => o.id === id);
      await base44.entities.Opportunity.update(id, data);
      
      // Update contact status based on stage
      if (data.stage && opportunity) {
        const contact = contacts.find(c => c.id === opportunity.contact_id);
        if (contact) {
          let newStatus = contact.status;
          if (data.stage === "won") {
            newStatus = "active_client";
            
            // Generate invoice when won
            const year = new Date().getFullYear();
            const invoiceNumber = `INV-${year}-${String(Date.now()).slice(-4)}`;
            await base44.entities.Invoice.create({
              invoice_number: invoiceNumber,
              contact_id: opportunity.contact_id,
              contact_name: opportunity.contact_name,
              status: "draft",
              issue_date: format(new Date(), "yyyy-MM-dd"),
              due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
              items: [{ description: opportunity.title, quantity: 1, unit_price: opportunity.value || 0, tax_rate: 0 }],
              subtotal: opportunity.value || 0,
              tax_amount: 0,
              total: opportunity.value || 0,
              currency: opportunity.currency || "USD",
            });
          } else if (data.stage === "lost") {
            newStatus = "inactive_client";
          } else if (["contact_made", "proposal_sent", "negotiation"].includes(data.stage)) {
            newStatus = "prospect";
          }
          
          if (newStatus !== contact.status) {
            await base44.entities.Contact.update(contact.id, { status: newStatus });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setEditingOpportunity(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Opportunity.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      setDeletingOpportunity(null);
    },
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    const newStage = destination.droppableId;
    
    const opportunity = opportunities.find(o => o.id === draggableId);
    if (opportunity && opportunity.stage !== newStage) {
      updateMutation.mutate({ id: draggableId, data: { stage: newStage } });
    }
  };

  const handleSave = (data) => {
    if (editingOpportunity) {
      updateMutation.mutate({ id: editingOpportunity.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const confirmDelete = () => {
    if (deletingOpportunity) {
      deleteMutation.mutate(deletingOpportunity.id);
    }
  };

  const getStageOpportunities = (stageId) => {
    return opportunities.filter(o => o.stage === stageId);
  };

  const getStageValue = (stageId) => {
    return getStageOpportunities(stageId).reduce((sum, o) => sum + (o.value || 0), 0);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Sales Pipeline</h1>
          <p className="text-slate-500 mt-1">Track and manage your opportunities</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Opportunity
        </Button>
      </motion.div>

      {/* Pipeline Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {stages.map((stage, index) => (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="w-80 flex-shrink-0"
              >
                <div className="bg-slate-50 rounded-2xl p-4 h-full">
                  {/* Stage Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                      <h3 className="font-semibold text-slate-900">{stage.label}</h3>
                      <span className="text-sm text-slate-500 bg-white px-2 py-0.5 rounded-full">
                        {getStageOpportunities(stage.id).length}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-600 mb-4">
                    {formatCurrency(getStageValue(stage.id))}
                  </p>

                  {/* Droppable Area */}
                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-3 min-h-[200px] rounded-xl transition-colors ${
                          snapshot.isDraggingOver ? "bg-indigo-50" : ""
                        }`}
                      >
                        {getStageOpportunities(stage.id).map((opportunity, idx) => (
                          <Draggable 
                            key={opportunity.id} 
                            draggableId={opportunity.id} 
                            index={idx}
                          >
                            {(provided) => (
                              <OpportunityCard
                                opportunity={opportunity}
                                onEdit={setEditingOpportunity}
                                onDelete={setDeletingOpportunity}
                                provided={provided}
                              />
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </DragDropContext>

      {/* Empty State */}
      {!isLoading && opportunities.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">No opportunities yet</h3>
          <p className="text-slate-500 mb-4">Start tracking your sales opportunities</p>
          <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Opportunity
          </Button>
        </div>
      )}

      {/* Forms and Dialogs */}
      {(showForm || editingOpportunity) && (
        <OpportunityForm
          opportunity={editingOpportunity}
          contacts={contacts}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingOpportunity(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <AlertDialog open={!!deletingOpportunity} onOpenChange={() => setDeletingOpportunity(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Opportunity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingOpportunity?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}