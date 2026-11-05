import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { DollarSign, Users, Target, Clock, TrendingUp } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import StatsCard from "@/components/dashboard/StatsCard";
import RecentActivity from "@/components/dashboard/RecentActivity";
import RevenueChart from "@/components/dashboard/RevenueChart";
import PipelineOverview from "@/components/dashboard/PipelineOverview";
import UpcomingTasks from "@/components/dashboard/UpcomingTasks";
import { motion } from "framer-motion";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export default function Dashboard() {
  const { t } = useLanguage();
  
  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => base44.entities.Invoice.list("-created_date", 100),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => base44.entities.Contact.list("-created_date", 100),
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ["opportunities"],
    queryFn: () => base44.entities.Opportunity.list("-created_date", 100),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.Task.list("-created_date", 50),
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ["timeEntries"],
    queryFn: () => base44.entities.TimeEntry.list("-created_date", 100),
  });

  // Calculate stats
  const totalRevenue = invoices
    .filter(i => i.status === "paid")
    .reduce((sum, i) => sum + (i.total || 0), 0);

  const pendingInvoices = invoices
    .filter(i => ["sent", "viewed", "overdue"].includes(i.status))
    .reduce((sum, i) => sum + (i.total || 0) - (i.amount_paid || 0), 0);

  const activeClients = contacts.filter(c => c.status === "active_client").length;

  const pipelineValue = opportunities
    .filter(o => !["won", "lost"].includes(o.stage))
    .reduce((sum, o) => sum + (o.value || 0), 0);

  const thisMonthHours = timeEntries
    .filter(t => {
      const date = new Date(t.date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, t) => sum + (t.duration_minutes || 0), 0) / 60;

  // Generate revenue chart data - Fixed to use actual paid invoices
  const revenueChartData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    const monthRevenue = invoices
      .filter(inv => {
        if (inv.status !== "paid") return false;
        // Use paid_date if available, otherwise use issue_date
        const dateToCheck = inv.paid_date || inv.issue_date;
        if (!dateToCheck) return false;
        const checkDate = new Date(dateToCheck);
        return checkDate >= monthStart && checkDate <= monthEnd;
      })
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    return {
      month: format(date, "MMM"),
      revenue: monthRevenue,
    };
  });

  // Generate activity feed
  const activities = [
    ...invoices.slice(0, 3).map(i => ({
      id: `inv-${i.id}`,
      type: "invoice",
      title: `Invoice #${i.invoice_number}`,
      description: `${i.contact_name} - $${i.total?.toFixed(2) || 0}`,
      time: i.created_date,
    })),
    ...contacts.slice(0, 3).map(c => ({
      id: `con-${c.id}`,
      type: "contact",
      title: `New contact: ${c.first_name} ${c.last_name}`,
      description: c.company || c.email,
      time: c.created_date,
    })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const upcomingTasks = tasks
    .filter(t => t.status !== "completed")
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">{t("dashboard.title")}</h1>
        <p className="text-slate-500 mt-1">{t("dashboard.subtitle")}</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatsCard
          title={t("dashboard.totalRevenue")}
          value={formatCurrency(totalRevenue)}
          subtitle="From paid invoices"
          icon={DollarSign}
          color="indigo"
          trend="12% vs last month"
          trendUp={true}
        />
        <StatsCard
          title={t("dashboard.activeClients")}
          value={activeClients}
          subtitle={`${contacts.length} total contacts`}
          icon={Users}
          color="emerald"
        />
        <StatsCard
          title={t("dashboard.pipelineValue")}
          value={formatCurrency(pipelineValue)}
          subtitle={`${opportunities.filter(o => !["won", "lost"].includes(o.stage)).length} opportunities`}
          icon={Target}
          color="amber"
        />
        <StatsCard
          title={t("dashboard.hoursThisMonth")}
          value={thisMonthHours.toFixed(1)}
          subtitle={`${formatCurrency(pendingInvoices)} pending`}
          icon={Clock}
          color="rose"
        />
      </div>

      {/* Charts and Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={revenueChartData} />
        </div>
        <div>
          <RecentActivity activities={activities} />
        </div>
      </div>

      {/* Pipeline and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PipelineOverview opportunities={opportunities} />
        <UpcomingTasks tasks={upcomingTasks} />
      </div>
    </div>
  );
}