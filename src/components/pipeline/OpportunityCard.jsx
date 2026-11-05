import React from "react";
import { motion } from "framer-motion";
import { DollarSign, Calendar, User, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function OpportunityCard({ opportunity, onEdit, onDelete, provided }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: opportunity.currency || 'USD',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  return (
    <div
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group"
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-medium text-slate-900 line-clamp-2">{opportunity.title}</h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(opportunity)}>
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(opportunity)} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2 text-sm">
        {opportunity.contact_name && (
          <div className="flex items-center gap-2 text-slate-600">
            <User className="w-4 h-4 text-slate-400" />
            <span className="truncate">{opportunity.contact_name}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-slate-900 font-medium">
          <DollarSign className="w-4 h-4 text-emerald-500" />
          <span>{formatCurrency(opportunity.value)}</span>
        </div>

        {opportunity.expected_close_date && (
          <div className="flex items-center gap-2 text-slate-500">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{format(new Date(opportunity.expected_close_date), "MMM d, yyyy")}</span>
          </div>
        )}
      </div>

      {opportunity.probability !== undefined && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-500">Probability</span>
            <span className="font-medium text-slate-700">{opportunity.probability}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
              style={{ width: `${opportunity.probability}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}