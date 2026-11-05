import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  FolderKanban, FileText, MessageSquare, User, Clock, 
  CheckCircle2, Calendar, DollarSign, AlertCircle 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

const statusConfig = {
  planning: { label: "Planning", color: "bg-slate-100 text-slate-700" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  on_hold: { label: "On Hold", color: "bg-amber-100 text-amber-700" },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700" },
};

export default function ClientPortal() {
  const [user, setUser] = useState(null);
  const [userContact, setUserContact] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => base44.entities.Contact.list(),
  });

  useEffect(() => {
    if (user && contacts.length > 0) {
      const contact = contacts.find(c => c.email === user.email);
      setUserContact(contact);
    }
  }, [user, contacts]);

  const { data: allProjects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list("-created_date", 100),
  });

  const { data: allInvoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => base44.entities.Invoice.list("-created_date", 100),
  });

  const { data: allMessages = [] } = useQuery({
    queryKey: ["messages"],
    queryFn: () => base44.entities.Message.list("-created_date", 100),
  });

  const { data: allDeliverables = [] } = useQuery({
    queryKey: ["deliverables"],
    queryFn: () => base44.entities.Deliverable.list("-created_date", 100),
  });

  // Filter data for current client
  const myProjects = allProjects.filter(p => 
    userContact && (p.contact_id === userContact.id || p.contact_name?.includes(user?.full_name))
  );

  const myInvoices = allInvoices.filter(i => 
    userContact && (i.contact_id === userContact.id || i.contact_name?.includes(user?.full_name))
  );

  const myMessages = allMessages.filter(m => 
    myProjects.some(p => p.id === m.project_id)
  );

  const unreadMessages = myMessages.filter(m => !m.read && !m.is_from_client).length;

  const pendingDeliverables = allDeliverables.filter(d => 
    myProjects.some(p => p.id === d.project_id) && d.status === "pending_review"
  ).length;

  const totalPaid = myInvoices.filter(i => i.status === "paid").reduce((sum, i) => sum + (i.total || 0), 0);
  const totalPending = myInvoices.filter(i => ["sent", "viewed"].includes(i.status)).reduce((sum, i) => sum + (i.total || 0), 0);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (!user || !userContact) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <User className="w-8 h-8 text-indigo-600" />
          </div>
          <p className="text-slate-600">Loading your portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center lg:text-left"
        >
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">
            Welcome, {user.full_name}
          </h1>
          <p className="text-slate-500 mt-2">Your projects and communications</p>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <FolderKanban className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900">{myProjects.length}</p>
                <p className="text-sm text-slate-500">Active Projects</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-violet-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900">{unreadMessages}</p>
                <p className="text-sm text-slate-500">New Messages</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900">{pendingDeliverables}</p>
                <p className="text-sm text-slate-500">Pending Review</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalPaid)}</p>
                <p className="text-sm text-slate-500">Total Paid</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FolderKanban className="w-5 h-5 text-indigo-600" />
                    My Projects
                  </CardTitle>
                  <Link 
                    to={createPageUrl("ClientProjects")} 
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    View All
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {myProjects.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No projects yet</p>
                ) : (
                  <div className="space-y-4">
                    {myProjects.slice(0, 3).map(project => {
                      const progress = project.estimated_hours > 0 
                        ? Math.min(100, ((project.tracked_hours || 0) / project.estimated_hours) * 100)
                        : 0;
                      const status = statusConfig[project.status] || statusConfig.planning;
                      
                      return (
                        <Link 
                          key={project.id}
                          to={createPageUrl("ClientProjectDetail") + `?id=${project.id}`}
                          className="block p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-slate-900">{project.name}</h4>
                              <p className="text-sm text-slate-500 line-clamp-1">{project.description}</p>
                            </div>
                            <Badge className={status.color}>{status.label}</Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-600">
                              <span>Progress</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                          {project.end_date && (
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                              <Calendar className="w-3 h-3" />
                              Due {format(new Date(project.end_date), "MMM d, yyyy")}
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            {/* Messages */}
            <Card>
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="w-5 h-5 text-violet-600" />
                  Recent Messages
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <Link 
                  to={createPageUrl("ClientMessages")}
                  className="block text-center py-3 bg-violet-50 hover:bg-violet-100 rounded-lg text-violet-700 font-medium transition-colors"
                >
                  View Messages ({unreadMessages} new)
                </Link>
              </CardContent>
            </Card>

            {/* Invoices */}
            <Card>
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  Invoices
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Paid</span>
                    <span className="font-semibold text-emerald-600">{formatCurrency(totalPaid)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Pending</span>
                    <span className="font-semibold text-amber-600">{formatCurrency(totalPending)}</span>
                  </div>
                </div>
                <Link 
                  to={createPageUrl("ClientInvoices")}
                  className="block text-center py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-sm font-medium transition-colors"
                >
                  View All Invoices
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}