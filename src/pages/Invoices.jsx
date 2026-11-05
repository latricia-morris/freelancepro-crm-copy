import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { 
  Plus, Search, Filter, FileText, MoreVertical, Pencil, Trash2, 
  Send, Eye, CheckCircle, Clock, AlertCircle, XCircle, DollarSign 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import InvoiceForm from "@/components/invoices/InvoiceForm";
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

const statusConfig = {
  draft: { label: "Draft", icon: FileText, color: "bg-slate-100 text-slate-700" },
  sent: { label: "Sent", icon: Send, color: "bg-blue-100 text-blue-700" },
  viewed: { label: "Viewed", icon: Eye, color: "bg-violet-100 text-violet-700" },
  paid: { label: "Paid", icon: CheckCircle, color: "bg-emerald-100 text-emerald-700" },
  partial: { label: "Partial", icon: DollarSign, color: "bg-amber-100 text-amber-700" },
  overdue: { label: "Overdue", icon: AlertCircle, color: "bg-red-100 text-red-700" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "bg-slate-100 text-slate-500" },
};

export default function Invoices() {
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [deletingInvoice, setDeletingInvoice] = useState(null);
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

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => base44.entities.Invoice.list("-created_date", 500),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => base44.entities.Contact.list("-created_date", 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setEditingInvoice(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Invoice.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setDeletingInvoice(null);
    },
  });

  const handleSave = (data) => {
    if (editingInvoice) {
      updateMutation.mutate({ id: editingInvoice.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleStatusChange = (invoice, newStatus) => {
    const updates = { status: newStatus };
    if (newStatus === "sent" && !invoice.sent_date) {
      updates.sent_date = new Date().toISOString();
    }
    if (newStatus === "paid") {
      updates.paid_date = new Date().toISOString();
      updates.amount_paid = invoice.total;
    }
    updateMutation.mutate({ id: invoice.id, data: updates });
  };

  const confirmDelete = () => {
    if (deletingInvoice) {
      deleteMutation.mutate(deletingInvoice.id);
    }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.contact_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value, currency = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(value || 0);
  };

  // Stats
  const stats = {
    total: invoices.reduce((sum, i) => sum + (i.total || 0), 0),
    paid: invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + (i.total || 0), 0),
    pending: invoices.filter(i => ["sent", "viewed", "partial"].includes(i.status)).reduce((sum, i) => sum + (i.total || 0) - (i.amount_paid || 0), 0),
    overdue: invoices.filter(i => i.status === "overdue").reduce((sum, i) => sum + (i.total || 0) - (i.amount_paid || 0), 0),
  };

  // Generate next invoice number
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
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Invoices</h1>
          <p className="text-slate-500 mt-1">Create and manage your invoices</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Invoice
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-sm text-slate-500">Total Invoiced</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(stats.total)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-sm text-slate-500">Paid</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(stats.paid)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-sm text-slate-500">Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(stats.pending)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-sm text-slate-500">Overdue</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(stats.overdue)}</p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-slate-100 p-4"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <Filter className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(statusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Invoice</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 bg-slate-100 rounded w-24 animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-slate-100 rounded w-32 animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-slate-100 rounded w-20 animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-slate-100 rounded w-20 animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-slate-100 rounded w-16 animate-pulse" /></TableCell>
                  <TableCell><div className="h-6 bg-slate-100 rounded-full w-16 animate-pulse" /></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))
            ) : filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => {
                const status = statusConfig[invoice.status] || statusConfig.draft;
                const StatusIcon = status.icon;
                return (
                  <TableRow key={invoice.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.contact_name}</TableCell>
                    <TableCell>{invoice.issue_date && format(new Date(invoice.issue_date), "MMM d, yyyy")}</TableCell>
                    <TableCell>{invoice.due_date && format(new Date(invoice.due_date), "MMM d, yyyy")}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(invoice.total, invoice.currency)}</TableCell>
                    <TableCell>
                      <Badge className={`${status.color} flex items-center gap-1 w-fit`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingInvoice(invoice)}>
                            <Pencil className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {invoice.status === "draft" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(invoice, "sent")}>
                              <Send className="w-4 h-4 mr-2" /> Mark as Sent
                            </DropdownMenuItem>
                          )}
                          {["sent", "viewed", "partial"].includes(invoice.status) && (
                            <DropdownMenuItem onClick={() => handleStatusChange(invoice, "paid")}>
                              <CheckCircle className="w-4 h-4 mr-2" /> Mark as Paid
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeletingInvoice(invoice)} className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
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
      </motion.div>

      {/* Forms and Dialogs */}
      {(showForm || editingInvoice) && (
        <InvoiceForm
          invoice={editingInvoice}
          contacts={contacts}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingInvoice(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
          nextInvoiceNumber={getNextInvoiceNumber()}
        />
      )}

      <AlertDialog open={!!deletingInvoice} onOpenChange={() => setDeletingInvoice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice {deletingInvoice?.invoice_number}? This action cannot be undone.
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