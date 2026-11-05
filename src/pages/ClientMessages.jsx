import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, MessageSquare, Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

export default function ClientMessages() {
  const [user, setUser] = useState(null);
  const [userContact, setUserContact] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [newMessage, setNewMessage] = useState("");

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("project");
    if (projectId) setSelectedProjectId(projectId);
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

  const { data: allMessages = [] } = useQuery({
    queryKey: ["messages"],
    queryFn: () => base44.entities.Message.list("-created_date", 500),
  });

  const projectMessages = selectedProjectId
    ? allMessages.filter(m => m.project_id === selectedProjectId)
    : allMessages.filter(m => myProjects.some(p => p.id === m.project_id));

  const createMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.Message.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      setNewMessage("");
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedProjectId) return;

    const project = myProjects.find(p => p.id === selectedProjectId);
    
    createMessageMutation.mutate({
      project_id: selectedProjectId,
      project_name: project?.name || "",
      sender_name: user?.full_name || "",
      sender_email: user?.email || "",
      message: newMessage,
      is_from_client: true,
      read: false,
    });
  };

  useEffect(() => {
    if (myProjects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(myProjects[0].id);
    }
  }, [myProjects, selectedProjectId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto p-4 lg:p-8 space-y-6">
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
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Messages</h1>
            <p className="text-slate-500 mt-1">Communicate with your freelancer</p>
          </div>
          {myProjects.length > 1 && (
            <Select value={selectedProjectId || ""} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {myProjects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-violet-600" />
                {selectedProjectId && myProjects.find(p => p.id === selectedProjectId)?.name}
              </CardTitle>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
              {projectMessages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500">No messages yet</p>
                  <p className="text-sm text-slate-400 mt-1">Start the conversation below</p>
                </div>
              ) : (
                projectMessages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.is_from_client ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[70%] ${
                      message.is_from_client
                        ? "bg-indigo-600 text-white"
                        : "bg-white border border-slate-200 text-slate-900"
                    } rounded-2xl p-4`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium ${
                          message.is_from_client ? "text-indigo-100" : "text-slate-600"
                        }`}>
                          {message.sender_name}
                        </span>
                        <span className={`text-xs ${
                          message.is_from_client ? "text-indigo-200" : "text-slate-400"
                        }`}>
                          {message.created_date && format(new Date(message.created_date), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">{message.message}</p>
                      {message.attachment_url && (
                        <a 
                          href={message.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-xs mt-2 inline-flex items-center gap-1 ${
                            message.is_from_client ? "text-indigo-100" : "text-indigo-600"
                          }`}
                        >
                          <Paperclip className="w-3 h-3" />
                          Attachment
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>

            {/* Message Input */}
            <div className="border-t border-slate-100 p-4">
              <div className="flex gap-3">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={2}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || createMessageMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}