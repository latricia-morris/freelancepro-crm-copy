import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FolderKanban, ArrowLeft, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

const statusConfig = {
  planning: { label: "Planning", color: "bg-slate-100 text-slate-700" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  on_hold: { label: "On Hold", color: "bg-amber-100 text-amber-700" },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700" },
};

export default function ClientProjects() {
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

  const myProjects = allProjects.filter(p => 
    userContact && (p.contact_id === userContact.id || p.contact_name?.includes(user?.full_name))
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <Link to={createPageUrl("ClientPortal")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">My Projects</h1>
            <p className="text-slate-500 mt-1">All your projects in one place</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myProjects.map((project, index) => {
            const progress = project.estimated_hours > 0 
              ? Math.min(100, ((project.tracked_hours || 0) / project.estimated_hours) * 100)
              : 0;
            const status = statusConfig[project.status] || statusConfig.planning;
            
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link 
                  to={createPageUrl("ClientProjectDetail") + `?id=${project.id}`}
                  className="block bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-lg hover:border-slate-200 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 text-lg mb-1">{project.name}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2">{project.description}</p>
                    </div>
                    <Badge className={status.color}>{status.label}</Badge>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-600 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Progress
                        </span>
                        <span className="font-medium text-slate-700">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2.5" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                      {project.end_date && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Due Date</p>
                          <p className="text-sm font-medium text-slate-900 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(project.end_date), "MMM d, yyyy")}
                          </p>
                        </div>
                      )}
                      {project.budget > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Budget</p>
                          <p className="text-sm font-medium text-slate-900">
                            {formatCurrency(project.budget)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {myProjects.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">No projects yet</h3>
            <p className="text-slate-500">Your projects will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}