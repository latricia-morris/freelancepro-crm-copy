import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { 
  Plus, Search, Filter, FileText, MoreVertical, Pencil, Trash2, 
  Send, Eye, CheckCircle, Clock, AlertCircle, XCircle, DollarSign, Download 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import QuoteInvoiceForm from "@/components/invoices/QuoteInvoiceForm";
import { downloadPDF } from "@/components/PdfGenerator";
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

const quoteStatusConfig = {
  draft: { label: "Draft", icon: FileText, color: "bg-slate-100 text-slate-700" },
  sent: { label: "Sent", icon: Send, color: "bg-blue-100 text-blue-700" },
  viewed: { label: "Viewed", icon: Eye, color: "bg-violet-100 text-violet-700" },
  accepted: { label: "Accepted", icon: CheckCircle, color: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rejected", icon: XCircle, color: "bg-red-100 text-red-700" },
  expired: { label: "Expired", icon: AlertCircle, color: "bg-amber-100 text-amber-700" },
};

const invoiceStatusConfig = {
  draft: { label: "Draft", icon: FileText, color: "bg-slate-100 text-slate-700" },
  sent: { label: "Sent", icon: Send, color: "bg-blue-100 text-blue-700" },
  viewed: { label: "Viewed", icon: Eye, color: "bg-violet-100 text-violet-700" },
  paid: { label: "Paid", icon: CheckCircle, color: "bg-emerald-100 text-emerald-700" },
  partial: { label: "Partial", icon: DollarSign, color: "bg-amber-100 text-amber-700" },
  overdue: { label: "Overdue", icon: AlertCircle, color: "bg-red-100 text-red-700" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "bg-slate-100 text-slate-500" },
};

export default function QuotesInvoices() {
  const [activeTab, setActiveTab] = useState("quotes");
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("quote");
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "new") {
      setShowForm(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const { data: quotes = [] } = useQuery({
    queryKey: ["quotes"],
    queryFn: () => base44.entities.Quote.list("-created_date", 500),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => base44.entities.Invoice.list("-created_date", 500),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => base44.entities.Contact.list("-created_date", 500),
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ["opportunities"],
    queryFn: () => base44.entities.Opportunity.list("-created_date", 500),
  });

  const createQuoteMutation = useMutation({
    mutationFn: (data) => base44.entities.Quote.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      setShowForm(false);
    },
  });

  const updateQuoteMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Quote.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      setEditingItem(null);
    },
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: (id) => base44.entities.Quote.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      setDeletingItem(null);
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setShowForm(false);
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setEditingItem(null);
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: (id) => base44.entities.Invoice.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setDeletingItem(null);
    },
  });

  const handleSave = (data) => {
    if (formType === "quote") {
      if (editingItem) {
        updateQuoteMutation.mutate({ id: editingItem.id, data });
      } else {
        createQuoteMutation.mutate(data);
      }
    } else {
      if (editingItem) {
        updateInvoiceMutation.mutate({ id: editingItem.id, data });
      } else {
        createInvoiceMutation.mutate(data);
      }
    }
  };

  const handleStatusChange = async (item, newStatus, type) => {
    const updates = { status: newStatus };
    
    if (type === "quote") {
      if (newStatus === "sent" && !item.sent_date) {
        updates.sent_date = new Date().toISOString();
      }
      if (newStatus === "accepted") {
        updates.accepted_date = new Date().toISOString();
        
        // Generate invoice when quote is accepted
        if (!item.converted_to_invoice_id) {
          const year = new Date().getFullYear();
          const invoiceNumber = `INV-${year}-${String(Date.now()).slice(-4)}`;
          const newInvoice = await base44.entities.Invoice.create({
            invoice_number: invoiceNumber,
            contact_id: item.contact_id,
            contact_name: item.contact_name,
            status: "draft",
            issue_date: format(new Date(), "yyyy-MM-dd"),
            due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
            items: item.items,
            subtotal: item.subtotal,
            tax_amount: item.tax_amount,
            total: item.total,
            currency: item.currency,
            notes: item.notes,
          });
          updates.converted_to_invoice_id = newInvoice.id;
          queryClient.invalidateQueries({ queryKey: ["invoices"] });
        }
      }
      
      // Update opportunity stage based on quote status
      if (item.opportunity_id) {
        const oppUpdates = {};
        if (newStatus === "accepted") oppUpdates.stage = "won";
        else if (newStatus === "rejected") oppUpdates.stage = "lost";
        else if (newStatus === "sent") oppUpdates.stage = "proposal_sent";
        
        if (Object.keys(oppUpdates).length > 0) {
          await base44.entities.Opportunity.update(item.opportunity_id, oppUpdates);
          queryClient.invalidateQueries({ queryKey: ["opportunities"] });
        }
      }
      
      updateQuoteMutation.mutate({ id: item.id, data: updates });
    } else {
      if (newStatus === "sent" && !item.sent_date) {
        updates.sent_date = new Date().toISOString();
      }
      if (newStatus === "paid") {
        updates.paid_date = new Date().toISOString();
        updates.amount_paid = item.total;
      }
      updateInvoiceMutation.mutate({ id: item.id, data: updates });
    }
  };

  const confirmDelete = () => {
    if (deletingItem) {
      if (deletingItem.type === "quote") {
        deleteQuoteMutation.mutate(deletingItem.id);
      } else {
        deleteInvoiceMutation.mutate(deletingItem.id);
      }
    }
  };

  const handleDownloadPDF = async (item, type) => {
    await downloadPDF(item, type, contacts);
  };

  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = 
      q.quote_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.contact_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredInvoices = invoices.filter(i => {
    const matchesSearch = 
      i.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.contact_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value, currency = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(value || 0);
  };

  const quoteStats = {
    total: quotes.reduce((sum, q) => sum + (q.total || 0), 0),
    accepted: quotes.filter(q => q.status === "accepted").reduce((sum, q) => sum + (q.total || 0), 0),
    pending: quotes.filter(q => ["sent", "viewed"].includes(q.status)).reduce((sum, q) => sum + (q.total || 0), 0),
  };

  const invoiceStats = {
    total: invoices.reduce((sum, i) => sum + (i.total || 0), 0),
    paid: invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + (i.total || 0), 0),
    pending: invoices.filter(i => ["sent", "viewed", "partial"].includes(i.status)).reduce((sum, i) => sum + (i.total || 0) - (i.amount_paid || 0), 0),
  };

  const getNextQuoteNumber = () => {
    const year = new Date().getFullYear();
    const existingNumbers = quotes
      .map(q => q.quote_number)
      .filter(n => n && n.startsWith(`QUO-${year}`))
      .map(n => parseInt(n.split("-").pop()) || 0);
    const nextNum = Math.max(0, ...existingNumbers) + 1;
    return `QUO-${year}-${String(nextNum).padStart(4, "0")}`;
  };

  const getNextInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const existingNumbers = invoices
      .map(i => i.invoice_number)
      .filter(n => n && n.startsWith(`INV-${year}`))
      .map(n => parseInt(n.split("-").pop()) || 0);
    const nextNum = Math.max(0, ...existingNumbers) + 1;
    return `INV-${year}-${String(nextNum).padStart(4, "0")}`;
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
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Devis & Factures</h1>
          <p className="text-slate-500 mt-1">Gérez vos devis et factures</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              setFormType("quote");
              setShowForm(true);
            }}
            variant="outline"
            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Devis
          </Button>
          <Button 
            onClick={() => {
              setFormType("invoice");
              setShowForm(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Facture
          </Button>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border border-slate-100">
          <TabsTrigger value="quotes">Devis ({quotes.length})</TabsTrigger>
          <TabsTrigger value="invoices">Factures ({invoices.length})</TabsTrigger>
        </TabsList>

        {/* Quotes Tab */}
        <TabsContent value="quotes" className="space-y-6">
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <p className="text-sm text-slate-500">Total Devis</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(quoteStats.total)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <p className="text-sm text-slate-500">Acceptés</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(quoteStats.accepted)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <p className="text-sm text-slate-500">En Attente</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(quoteStats.pending)}</p>
            </div>
          </motion.div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Rechercher devis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44">
                  <Filter className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {Object.entries(quoteStatusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Valide jusqu'au</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      Aucun devis trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotes.map((quote) => {
                    const status = quoteStatusConfig[quote.status] || quoteStatusConfig.draft;
                    const StatusIcon = status.icon;
                    return (
                      <TableRow key={quote.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium">{quote.quote_number}</TableCell>
                        <TableCell>{quote.contact_name}</TableCell>
                        <TableCell>{quote.issue_date && format(new Date(quote.issue_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{quote.valid_until && format(new Date(quote.valid_until), "dd/MM/yyyy")}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(quote.total, quote.currency)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className={`${status.color} flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium`}>
                                <StatusIcon className="w-3 h-3" />
                                {status.label}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {Object.entries(quoteStatusConfig).map(([key, cfg]) => (
                                <DropdownMenuItem key={key} onClick={() => handleStatusChange(quote, key, "quote")}>
                                  {cfg.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4 text-slate-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setFormType("quote");
                                setEditingItem(quote);
                              }}>
                                <Pencil className="w-4 h-4 mr-2" /> Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadPDF(quote, "quote")}>
                                <Download className="w-4 h-4 mr-2" /> Télécharger PDF
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeletingItem({ ...quote, type: "quote" })} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-6">
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <p className="text-sm text-slate-500">Total Facturé</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(invoiceStats.total)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <p className="text-sm text-slate-500">Payé</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(invoiceStats.paid)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <p className="text-sm text-slate-500">En Attente</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(invoiceStats.pending)}</p>
            </div>
          </motion.div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Rechercher factures..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44">
                  <Filter className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {Object.entries(invoiceStatusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Facture</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      Aucune facture trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => {
                    const status = invoiceStatusConfig[invoice.status] || invoiceStatusConfig.draft;
                    const StatusIcon = status.icon;
                    return (
                      <TableRow key={invoice.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.contact_name}</TableCell>
                        <TableCell>{invoice.issue_date && format(new Date(invoice.issue_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{invoice.due_date && format(new Date(invoice.due_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(invoice.total, invoice.currency)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className={`${status.color} flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium`}>
                                <StatusIcon className="w-3 h-3" />
                                {status.label}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {Object.entries(invoiceStatusConfig).map(([key, cfg]) => (
                                <DropdownMenuItem key={key} onClick={() => handleStatusChange(invoice, key, "invoice")}>
                                  {cfg.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4 text-slate-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setFormType("invoice");
                                setEditingItem(invoice);
                              }}>
                                <Pencil className="w-4 h-4 mr-2" /> Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadPDF(invoice, "invoice")}>
                                <Download className="w-4 h-4 mr-2" /> Télécharger PDF
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeletingItem({ ...invoice, type: "invoice" })} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Form */}
      {(showForm || editingItem) && (
        <QuoteInvoiceForm
          type={formType}
          item={editingItem}
          contacts={contacts}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          isLoading={
            createQuoteMutation.isPending || updateQuoteMutation.isPending ||
            createInvoiceMutation.isPending || updateInvoiceMutation.isPending
          }
          nextNumber={formType === "quote" ? getNextQuoteNumber() : getNextInvoiceNumber()}
        />
      )}

      <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {deletingItem?.type === "quote" ? "le devis" : "la facture"}</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}