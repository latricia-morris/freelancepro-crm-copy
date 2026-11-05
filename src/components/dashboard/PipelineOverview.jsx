import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight } from "lucide-react";

const stageColors = {
  lead: "bg-slate-100 text-slate-700",
  contact_made: "bg-blue-100 text-blue-700",
  proposal_sent: "bg-violet-100 text-violet-700",
  negotiation: "bg-amber-100 text-amber-700",
  won: "bg-emerald-100 text-emerald-700",
  lost: "bg-rose-100 text-rose-700",
};

const stageLabels = {
  lead: "Lead",
  contact_made: "Contact Made",
  proposal_sent: "Proposal Sent",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export default function PipelineOverview({ opportunities = [] }) {
  const stages = ["lead", "contact_made", "proposal_sent", "negotiation"];
  
  const stageCounts = stages.map(stage => ({
    stage,
    label: stageLabels[stage],
    count: opportunities.filter(o => o.stage === stage).length,
    value: opportunities
      .filter(o => o.stage === stage)
      .reduce((sum, o) => sum + (o.value || 0), 0),
  }));

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100"
    >
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Sales Pipeline</h3>
          <p className="text-sm text-slate-500">Active opportunities by stage</p>
        </div>
        <Link 
          to={createPageUrl("Pipeline")} 
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stageCounts.map((item, index) => (
            <motion.div
              key={item.stage}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-3 ${stageColors[item.stage]}`}>
                {item.count}
              </div>
              <p className="text-sm font-medium text-slate-900">{item.label}</p>
              <p className="text-xs text-slate-500 mt-1">{formatCurrency(item.value)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}