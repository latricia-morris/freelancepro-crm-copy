import React from "react";
import { motion } from "framer-motion";
import { Building2, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function ExpenseSummary({ expenses, projects }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Calculate expenses by project
  const projectExpenses = projects.map(project => {
    const projectExpenseList = expenses.filter(e => e.project_id === project.id);
    const total = projectExpenseList.reduce((sum, e) => sum + (e.amount || 0), 0);
    const billable = projectExpenseList.filter(e => e.billable && !e.invoiced).reduce((sum, e) => sum + (e.amount || 0), 0);
    const invoiced = projectExpenseList.filter(e => e.invoiced).reduce((sum, e) => sum + (e.amount || 0), 0);
    
    return {
      ...project,
      total,
      billable,
      invoiced,
      count: projectExpenseList.length,
      budgetUsed: project.budget ? (total / project.budget) * 100 : 0,
    };
  }).filter(p => p.count > 0).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-4">
      {projectExpenses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">Aucune dépense</h3>
            <p className="text-slate-500">Les dépenses apparaîtront ici par projet</p>
          </CardContent>
        </Card>
      ) : (
        projectExpenses.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <p className="text-sm text-slate-500 mt-1">{project.count} dépense(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(project.total)}</p>
                    {project.budget && (
                      <p className="text-sm text-slate-500">sur {formatCurrency(project.budget)}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Budget Progress */}
                {project.budget && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Utilisation du budget</span>
                      <span className={`font-medium ${project.budgetUsed > 100 ? "text-red-600" : "text-slate-900"}`}>
                        {project.budgetUsed.toFixed(0)}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(project.budgetUsed, 100)} 
                      className={project.budgetUsed > 100 ? "bg-red-100" : ""}
                    />
                    {project.budgetUsed > 100 && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>Budget dépassé de {formatCurrency(project.total - project.budget)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Breakdown */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">À facturer</p>
                    <p className="text-lg font-semibold text-emerald-600">{formatCurrency(project.billable)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Déjà facturé</p>
                    <p className="text-lg font-semibold text-indigo-600">{formatCurrency(project.invoiced)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))
      )}
    </div>
  );
}