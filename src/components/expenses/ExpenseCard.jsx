import React from "react";
import { motion } from "framer-motion";
import { Calendar, Building2, FileText, MoreVertical, Pencil, Trash2, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const categoryLabels = {
  marketing: "Marketing",
  material: "Matériel",
  travel: "Déplacement",
  subcontracting: "Sous-traitance",
  software: "Logiciels",
  office: "Bureau",
  other: "Autre",
};

const categoryColors = {
  marketing: "bg-pink-100 text-pink-700",
  material: "bg-blue-100 text-blue-700",
  travel: "bg-amber-100 text-amber-700",
  subcontracting: "bg-purple-100 text-purple-700",
  software: "bg-cyan-100 text-cyan-700",
  office: "bg-slate-100 text-slate-700",
  other: "bg-gray-100 text-gray-700",
};

export default function ExpenseCard({ expense, onEdit, onDelete, index = 0 }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: expense.currency || 'USD',
      minimumFractionDigits: 2,
    }).format(value || 0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:border-slate-200 transition-all duration-300 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-start gap-3 mb-2">
            <Badge className={categoryColors[expense.category]}>
              {categoryLabels[expense.category]}
            </Badge>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-1">
                {expense.description || "Dépense sans description"}
              </h3>
              {expense.vendor && (
                <p className="text-sm text-slate-500">Fournisseur: {expense.vendor}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-xl font-bold text-slate-900">
            {formatCurrency(expense.amount)}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(expense)}>
                <Pencil className="w-4 h-4 mr-2" /> Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(expense)} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" /> Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span>{expense.project_name || "Projet non spécifié"}</span>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{expense.date && format(new Date(expense.date), "d MMM yyyy", { locale: fr })}</span>
        </div>

        {expense.receipt_url && (
          <a 
            href={expense.receipt_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Voir reçu</span>
          </a>
        )}
      </div>

      {(expense.billable || expense.invoiced) && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
          {expense.billable && !expense.invoiced && (
            <Badge variant="outline" className="text-emerald-600 border-emerald-200">
              Facturable
            </Badge>
          )}
          {expense.invoiced && (
            <Badge className="bg-emerald-100 text-emerald-700">
              <CheckCircle className="w-3 h-3 mr-1" />
              Facturé
            </Badge>
          )}
        </div>
      )}

      {expense.notes && (
        <p className="text-sm text-slate-500 mt-3 pt-3 border-t border-slate-100">
          {expense.notes}
        </p>
      )}
    </motion.div>
  );
}