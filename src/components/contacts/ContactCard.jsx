import React from "react";
import { motion } from "framer-motion";
import { Mail, Phone, Building2, MapPin, MoreVertical, Pencil, Trash2, Eye, Check } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusColors = {
  prospect: "bg-blue-100 text-blue-700",
  active_client: "bg-emerald-100 text-emerald-700",
  inactive_client: "bg-slate-100 text-slate-700",
  partner: "bg-violet-100 text-violet-700",
};

const statusLabels = {
  prospect: "Prospect",
  active_client: "Active Client",
  inactive_client: "Inactive",
  partner: "Partner",
};

export default function ContactCard({ contact, onEdit, onDelete, onView, index = 0, isSelected = false }) {
  const getInitials = (first, last) => {
    return `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase() || "?";
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white rounded-2xl border p-5 transition-all duration-300 group relative ${
        isSelected 
          ? "border-indigo-500 shadow-lg ring-2 ring-indigo-200" 
          : "border-slate-100 hover:shadow-lg hover:border-slate-200"
      }`}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-violet-500">
            <AvatarFallback className="bg-transparent text-white font-medium">
              {getInitials(contact.first_name, contact.last_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-slate-900">
              {contact.first_name} {contact.last_name}
            </h3>
            {contact.job_title && (
              <p className="text-sm text-slate-500">{contact.job_title}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onView && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onView}
              aria-label="View"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Eye className="w-4 h-4 text-slate-400" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(contact); }}>
                <Pencil className="w-4 h-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(contact); }} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {contact.company && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>{contact.company}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Mail className="w-4 h-4 text-slate-400" />
          <a href={`mailto:${contact.email}`} className="hover:text-indigo-600 transition-colors">
            {contact.email}
          </a>
        </div>
        {contact.phone && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Phone className="w-4 h-4 text-slate-400" />
            <a href={`tel:${contact.phone}`} className="hover:text-indigo-600 transition-colors">
              {contact.phone}
            </a>
          </div>
        )}
        {contact.country && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{contact.country}</span>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <Badge className={statusColors[contact.status]}>
            {statusLabels[contact.status]}
          </Badge>
          {contact.total_revenue > 0 && (
            <span className="text-sm font-medium text-slate-900">
              {formatCurrency(contact.total_revenue)}
            </span>
          )}
        </div>
        {contact.tags && contact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {contact.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {contact.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{contact.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}