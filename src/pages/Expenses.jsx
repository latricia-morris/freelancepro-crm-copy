import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus, Receipt, TrendingUp, DollarSign, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import ExpenseCard from "@/components/expenses/ExpenseCard";
import ExpenseSummary from "@/components/expenses/ExpenseSummary";
import MonthlyReport from "@/components/expenses/MonthlyReport";
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

export default function Expenses() {
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deletingExpense, setDeletingExpense] = useState(null);
  const [projectFilter, setProjectFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("list");

  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => base44.entities.Expense.list("-date", 500),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list("-created_date", 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Expense.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setEditingExpense(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Expense.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setDeletingExpense(null);
    },
  });

  const handleSave = (data) => {
    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const confirmDelete = () => {
    if (deletingExpense) {
      deleteMutation.mutate(deletingExpense.id);
    }
  };

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesProject = projectFilter === "all" || expense.project_id === projectFilter;
    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;
    return matchesProject && matchesCategory;
  });

  // Calculate stats
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const billableExpenses = filteredExpenses.filter(e => e.billable && !e.invoiced).reduce((sum, e) => sum + (e.amount || 0), 0);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
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
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Gestion des Dépenses</h1>
          <p className="text-slate-500 mt-1">Suivez et gérez vos dépenses projet</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Dépense
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <Receipt className="w-8 h-8 opacity-80" />
            <span className="text-sm font-medium opacity-90">{filteredExpenses.length} dépenses</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totalExpenses)}</p>
          <p className="text-sm opacity-80 mt-1">Total des dépenses</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(billableExpenses)}</p>
          <p className="text-sm opacity-80 mt-1">À facturer aux clients</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-3xl font-bold">{projects.length}</p>
          <p className="text-sm opacity-80 mt-1">Projets actifs</p>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="list">Liste</TabsTrigger>
          <TabsTrigger value="summary">Par Projet</TabsTrigger>
          <TabsTrigger value="monthly">Rapport Mensuel</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4 mt-6">
          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-100 p-4"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-full sm:w-56">
                  <Filter className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Tous les projets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les projets</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-56">
                  <Filter className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Toutes catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="material">Matériel</SelectItem>
                  <SelectItem value="travel">Déplacement</SelectItem>
                  <SelectItem value="subcontracting">Sous-traitance</SelectItem>
                  <SelectItem value="software">Logiciels</SelectItem>
                  <SelectItem value="office">Bureau</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Expense List */}
          {isLoading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">Aucune dépense</h3>
              <p className="text-slate-500 mb-4">Commencez à suivre vos dépenses</p>
              <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Dépense
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredExpenses.map((expense, index) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  onEdit={setEditingExpense}
                  onDelete={setDeletingExpense}
                  index={index}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="summary" className="mt-6">
          <ExpenseSummary expenses={expenses} projects={projects} />
        </TabsContent>

        <TabsContent value="monthly" className="mt-6">
          <MonthlyReport expenses={expenses} />
        </TabsContent>
      </Tabs>

      {/* Forms and Dialogs */}
      {(showForm || editingExpense) && (
        <ExpenseForm
          expense={editingExpense}
          projects={projects}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingExpense(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <AlertDialog open={!!deletingExpense} onOpenChange={() => setDeletingExpense(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la dépense</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette dépense ? Cette action est irréversible.
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