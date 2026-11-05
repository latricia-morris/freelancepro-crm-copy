import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval,
  subDays, startOfYear, endOfYear
} from "date-fns";
import { 
  DollarSign, TrendingUp, Clock, Users, Target, FileText,
  Download, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function Reports() {
  const [period, setPeriod] = useState("6months");

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => base44.entities.Invoice.list("-created_date", 1000),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => base44.entities.Contact.list("-created_date", 500),
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ["opportunities"],
    queryFn: () => base44.entities.Opportunity.list("-created_date", 500),
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ["timeEntries"],
    queryFn: () => base44.entities.TimeEntry.list("-date", 1000),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list("-created_date", 500),
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Revenue over time
  const getRevenueData = () => {
    const months = period === "12months" ? 12 : period === "6months" ? 6 : 3;
    const monthsArray = eachMonthOfInterval({
      start: subMonths(new Date(), months - 1),
      end: new Date(),
    });

    return monthsArray.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const revenue = invoices
        .filter(inv => {
          if (inv.status !== "paid" || !inv.paid_date) return false;
          const paidDate = new Date(inv.paid_date);
          return paidDate >= monthStart && paidDate <= monthEnd;
        })
        .reduce((sum, inv) => sum + (inv.total || 0), 0);

      const invoiced = invoices
        .filter(inv => {
          if (!inv.issue_date) return false;
          const issueDate = new Date(inv.issue_date);
          return issueDate >= monthStart && issueDate <= monthEnd;
        })
        .reduce((sum, inv) => sum + (inv.total || 0), 0);

      return {
        month: format(month, "MMM"),
        revenue,
        invoiced,
      };
    });
  };

  // Pipeline by stage
  const getPipelineData = () => {
    const stages = ["lead", "contact_made", "proposal_sent", "negotiation"];
    return stages.map(stage => ({
      stage: stage.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
      count: opportunities.filter(o => o.stage === stage).length,
      value: opportunities.filter(o => o.stage === stage).reduce((sum, o) => sum + (o.value || 0), 0),
    }));
  };

  // Time by project
  const getTimeByProject = () => {
    const projectTime = {};
    timeEntries.forEach(entry => {
      const projectName = entry.project_name || "Unassigned";
      projectTime[projectName] = (projectTime[projectName] || 0) + (entry.duration_minutes || 0);
    });

    return Object.entries(projectTime)
      .map(([name, minutes]) => ({ name, hours: Math.round(minutes / 60 * 10) / 10 }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 6);
  };

  // Time by activity type
  const getTimeByActivity = () => {
    const activityTime = {};
    timeEntries.forEach(entry => {
      const type = entry.activity_type || "other";
      activityTime[type] = (activityTime[type] || 0) + (entry.duration_minutes || 0);
    });

    return Object.entries(activityTime)
      .map(([name, minutes]) => ({ 
        name: name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), 
        value: Math.round(minutes / 60 * 10) / 10 
      }));
  };

  // Stats
  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + (i.total || 0), 0);
  const pendingRevenue = invoices.filter(i => ["sent", "viewed", "partial"].includes(i.status)).reduce((sum, i) => sum + (i.total || 0) - (i.amount_paid || 0), 0);
  const pipelineValue = opportunities.filter(o => !["won", "lost"].includes(o.stage)).reduce((sum, o) => sum + (o.value || 0), 0);
  const totalHours = timeEntries.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) / 60;
  const billableHours = timeEntries.filter(t => t.billable).reduce((sum, t) => sum + (t.duration_minutes || 0), 0) / 60;
  const avgDealSize = opportunities.filter(o => o.stage === "won").length > 0 
    ? opportunities.filter(o => o.stage === "won").reduce((sum, o) => sum + (o.value || 0), 0) / opportunities.filter(o => o.stage === "won").length
    : 0;

  const revenueData = getRevenueData();
  const pipelineData = getPipelineData();
  const timeByProject = getTimeByProject();
  const timeByActivity = getTimeByActivity();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500 mt-1">Business insights and analytics</p>
        </div>
        <div className="flex gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="12months">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-100 p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-500">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</p>
          <p className="text-sm text-slate-500 mt-1">{formatCurrency(pendingRevenue)} pending</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-100 p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-500">Pipeline Value</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(pipelineValue)}</p>
          <p className="text-sm text-slate-500 mt-1">{opportunities.filter(o => !["won", "lost"].includes(o.stage)).length} opportunities</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-100 p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-500">Hours Tracked</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalHours.toFixed(1)}h</p>
          <p className="text-sm text-slate-500 mt-1">{billableHours.toFixed(1)}h billable</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-100 p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-500">Avg Deal Size</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(avgDealSize)}</p>
          <p className="text-sm text-slate-500 mt-1">{opportunities.filter(o => o.stage === "won").length} won deals</p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-slate-100 p-6"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Revenue Overview</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                  formatter={(value) => [formatCurrency(value), '']}
                />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Paid" />
                <Area type="monotone" dataKey="invoiced" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorInvoiced)" name="Invoiced" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pipeline Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl border border-slate-100 p-6"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Pipeline by Stage</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `$${v/1000}k`} />
                <YAxis type="category" dataKey="stage" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                  formatter={(value) => [formatCurrency(value), 'Value']}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Time by Project */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl border border-slate-100 p-6"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Time by Project</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeByProject}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-45} textAnchor="end" height={70} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                  formatter={(value) => [`${value}h`, 'Hours']}
                />
                <Bar dataKey="hours" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Time by Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl border border-slate-100 p-6"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Time by Activity Type</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={timeByActivity}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}h`}
                  labelLine={false}
                >
                  {timeByActivity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                  formatter={(value) => [`${value}h`, 'Hours']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}