import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  ArrowLeft, CheckCircle2, Clock, Calendar, DollarSign, 
  FileText, MessageSquare, AlertCircle, XCircle, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

const statusConfig = {
  pending_review: { label: "Pending Review", color: "bg-amber-100 text-amber-700", icon: AlertCircle },
  approved: { label: "Approved", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  needs_revision: { label: "Needs Revision", color: "bg-red-100 text-red-700", icon: XCircle },
  completed: { label: "Completed", color: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
};

export default function ClientProjectDetail() {
  const [projectId, setProjectId] = useState(null);
  const [reviewingDeliverable, setReviewingDeliverable] = useState(null);
  const [feedback, setFeedback] = useState("");

  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setProjectId(params.get("id"));
  }, []);

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.list();
      return projects.find(p => p.id === projectId);
    },
    enabled: !!projectId,
  });

  const { data: deliverables = [] } = useQuery({
    queryKey: ["deliverables", projectId],
    queryFn: async () => {
      const all = await base44.entities.Deliverable.list("-created_date");
      return all.filter(d => d.project_id === projectId);
    },
    enabled: !!projectId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", projectId],
    queryFn: async () => {
      const all = await base44.entities.Message.list("-created_date");
      return all.filter(m => m.project_id === projectId);
    },
    enabled: !!projectId,
  });

  const updateDeliverableMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Deliverable.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverables"] });
      setReviewingDeliverable(null);
      setFeedback("");
    },
  });

  const handleApprove = (deliverable) => {
    updateDeliverableMutation.mutate({
      id: deliverable.id,
      data: {
        status: "approved",
        approved_date: new Date().toISOString(),
        client_notes: feedback || "Approved",
      },
    });
  };

  const handleRequestRevision = (deliverable) => {
    if (!feedback.trim()) {
      alert("Please provide feedback for revision");
      return;
    }
    updateDeliverableMutation.mutate({
      id: deliverable.id,
      data: {
        status: "needs_revision",
        client_notes: feedback,
      },
    });
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <p className="text-slate-500">Loading project...</p>
      </div>
    );
  }

  const progress = project.estimated_hours > 0 
    ? Math.min(100, ((project.tracked_hours || 0) / project.estimated_hours) * 100)
    : 0;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: project.currency || 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto p-4 lg:p-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <Link to={createPageUrl("ClientProjects")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">{project.name}</h1>
            <p className="text-slate-500 mt-1">{project.description}</p>
          </div>
        </motion.div>

        {/* Project Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Project Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Overall Progress</span>
                  <span className="font-semibold text-slate-900">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {project.start_date && (
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <Calendar className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-500">Start Date</p>
                    <p className="text-sm font-medium text-slate-900">{format(new Date(project.start_date), "MMM d")}</p>
                  </div>
                )}
                {project.end_date && (
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <Calendar className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-500">Due Date</p>
                    <p className="text-sm font-medium text-slate-900">{format(new Date(project.end_date), "MMM d")}</p>
                  </div>
                )}
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <Clock className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-500">Hours Tracked</p>
                  <p className="text-sm font-medium text-slate-900">{project.tracked_hours || 0}h</p>
                </div>
                {project.budget > 0 && (
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <DollarSign className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-500">Budget</p>
                    <p className="text-sm font-medium text-slate-900">{formatCurrency(project.budget)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Deliverables */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Deliverables
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deliverables.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No deliverables yet</p>
              ) : (
                <div className="space-y-4">
                  {deliverables.map((deliverable) => {
                    const config = statusConfig[deliverable.status] || statusConfig.pending_review;
                    const StatusIcon = config.icon;
                    const isReviewing = reviewingDeliverable?.id === deliverable.id;
                    
                    return (
                      <div key={deliverable.id} className="p-4 border border-slate-200 rounded-xl">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">{deliverable.title}</h4>
                            <p className="text-sm text-slate-500 mt-1">{deliverable.description}</p>
                          </div>
                          <Badge className={`${config.color} flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {config.label}
                          </Badge>
                        </div>

                        {deliverable.file_url && (
                          <a 
                            href={deliverable.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 mb-3"
                          >
                            <Download className="w-4 h-4" />
                            Download File
                          </a>
                        )}

                        {deliverable.client_notes && (
                          <div className="bg-slate-50 rounded-lg p-3 mb-3">
                            <p className="text-sm font-medium text-slate-700 mb-1">Your Feedback:</p>
                            <p className="text-sm text-slate-600">{deliverable.client_notes}</p>
                          </div>
                        )}

                        {deliverable.status === "pending_review" && !isReviewing && (
                          <Button 
                            onClick={() => setReviewingDeliverable(deliverable)}
                            variant="outline"
                            size="sm"
                            className="mt-2"
                          >
                            Review Deliverable
                          </Button>
                        )}

                        {isReviewing && (
                          <div className="mt-4 p-4 bg-slate-50 rounded-xl space-y-3">
                            <Textarea
                              placeholder="Add your feedback (optional for approval, required for revision)"
                              value={feedback}
                              onChange={(e) => setFeedback(e.target.value)}
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => handleApprove(deliverable)}
                                className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                                disabled={updateDeliverableMutation.isPending}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Approve
                              </Button>
                              <Button 
                                onClick={() => handleRequestRevision(deliverable)}
                                variant="outline"
                                className="flex-1"
                                disabled={updateDeliverableMutation.isPending}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Request Revision
                              </Button>
                              <Button 
                                onClick={() => {
                                  setReviewingDeliverable(null);
                                  setFeedback("");
                                }}
                                variant="ghost"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Messages Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-violet-600" />
                  Communication
                </CardTitle>
                <Link 
                  to={createPageUrl("ClientMessages") + `?project=${projectId}`}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View All
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <p className="text-center text-slate-500 py-4">No messages yet</p>
              ) : (
                <div className="space-y-3">
                  {messages.slice(0, 3).map((message) => (
                    <div 
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.is_from_client ? "bg-indigo-50" : "bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-900">{message.sender_name}</span>
                        <span className="text-xs text-slate-500">
                          {message.created_date && format(new Date(message.created_date), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{message.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}