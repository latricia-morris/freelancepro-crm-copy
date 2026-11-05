import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, Phone, Building2, MapPin, Globe, Linkedin, 
  Target, FolderKanban, FileText, MessageSquare, Clock,
  ExternalLink, Calendar
} from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  prospect: "bg-blue-100 text-blue-700",
  active_client: "bg-emerald-100 text-emerald-700",
  inactive_client: "bg-slate-100 text-slate-700",
  partner: "bg-violet-100 text-violet-700",
};

const statusLabels = {
  prospect: "Prospect",
  active_client: "Client Actif",
  inactive_client: "Inactif",
  partner: "Partenaire",
};

export default function ContactDetailDialog({ contact, onClose }) {
  const { data: opportunities = [] } = useQuery({
    queryKey: ["contact-opportunities", contact.id],
    queryFn: () => base44.entities.Opportunity.filter({ contact_id: contact.id }, "-created_date", 100),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["contact-projects", contact.id],
    queryFn: () => base44.entities.Project.filter({ contact_id: contact.id }, "-created_date", 100),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["contact-invoices", contact.id],
    queryFn: () => base44.entities.Invoice.filter({ contact_id: contact.id }, "-created_date", 100),
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ["contact-quotes", contact.id],
    queryFn: () => base44.entities.Quote.filter({ contact_id: contact.id }, "-created_date", 100),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["contact-messages", contact.id],
    queryFn: async () => {
      const contactProjects = await base44.entities.Project.filter({ contact_id: contact.id }, "-created_date", 100);
      const projectIds = contactProjects.map(p => p.id);
      if (projectIds.length === 0) return [];
      const allMessages = await base44.entities.Message.list("-created_date", 500);
      return allMessages.filter(m => projectIds.includes(m.project_id));
    },
  });

  const totalRevenue = invoices
    .filter(i => i.status === "paid")
    .reduce((sum, i) => sum + (i.total || 0), 0);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-medium">
              {contact.first_name?.[0]}{contact.last_name?.[0]}
            </div>
            <div>
              {contact.first_name} {contact.last_name}
              <Badge className={`ml-3 ${statusColors[contact.status]}`}>
                {statusLabels[contact.status]}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="info" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">Informations</TabsTrigger>
              <TabsTrigger value="activity">Activité</TabsTrigger>
              <TabsTrigger value="projects">Projets ({projects.length})</TabsTrigger>
              <TabsTrigger value="financial">Finances</TabsTrigger>
            </TabsList>

            {/* Info Tab */}
            <TabsContent value="info" className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-6">
                {/* Contact Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900 mb-3">Contact</h3>
                  {contact.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <a href={`mailto:${contact.email}`} className="text-indigo-600 hover:underline">
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <a href={`tel:${contact.phone}`} className="text-indigo-600 hover:underline">
                        {contact.phone}
                      </a>
                    </div>
                  )}
                  {contact.company && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{contact.company}</span>
                    </div>
                  )}
                  {contact.job_title && (
                    <div className="text-sm text-slate-600 ml-6">{contact.job_title}</div>
                  )}
                  {contact.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{contact.address}</span>
                    </div>
                  )}
                  {contact.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-slate-400" />
                      <a href={contact.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                        {contact.website.replace(/^https?:\/\//, '')}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {contact.linkedin && (
                    <div className="flex items-center gap-2 text-sm">
                      <Linkedin className="w-4 h-4 text-slate-400" />
                      <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                        LinkedIn
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900 mb-3">Statistiques</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-indigo-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-indigo-600">{opportunities.length}</div>
                      <div className="text-xs text-slate-600">Opportunités</div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-emerald-600">{projects.length}</div>
                      <div className="text-xs text-slate-600">Projets</div>
                    </div>
                    <div className="bg-violet-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-violet-600">{invoices.length}</div>
                      <div className="text-xs text-slate-600">Factures</div>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalRevenue)}</div>
                      <div className="text-xs text-slate-600">Revenus</div>
                    </div>
                  </div>
                </div>
              </div>

              {contact.notes && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Notes</h3>
                  <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg whitespace-pre-wrap">
                    {contact.notes}
                  </p>
                </div>
              )}

              {contact.tags && contact.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {contact.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4 mt-4">
              <div className="space-y-3">
                {opportunities.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Opportunités récentes
                    </h3>
                    {opportunities.slice(0, 5).map(opp => (
                      <div key={opp.id} className="bg-slate-50 rounded-lg p-3 flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium text-slate-900">{opp.title}</div>
                          <div className="text-sm text-slate-500">{opp.stage}</div>
                        </div>
                        <div className="text-sm font-medium text-slate-900">
                          {formatCurrency(opp.value)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {messages.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Messages récents
                    </h3>
                    {messages.slice(0, 5).map(msg => (
                      <div key={msg.id} className="bg-slate-50 rounded-lg p-3 mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-900">{msg.sender_name}</span>
                          <span className="text-xs text-slate-500">
                            {msg.created_date && format(new Date(msg.created_date), "dd MMM yyyy")}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {opportunities.length === 0 && messages.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    Aucune activité récente
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-3 mt-4">
              {projects.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Aucun projet
                </div>
              ) : (
                projects.map(project => (
                  <div key={project.id} className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-slate-900">{project.name}</h4>
                      <Badge variant="outline">{project.status}</Badge>
                    </div>
                    {project.description && (
                      <p className="text-sm text-slate-600 mb-2">{project.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {project.budget && (
                        <span>{formatCurrency(project.budget)}</span>
                      )}
                      {project.end_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(project.end_date), "dd MMM yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial" className="space-y-4 mt-4">
              {/* Invoices */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Factures ({invoices.length})
                </h3>
                {invoices.length === 0 ? (
                  <div className="text-sm text-slate-500 text-center py-4">Aucune facture</div>
                ) : (
                  <div className="space-y-2">
                    {invoices.map(inv => (
                      <div key={inv.id} className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-900">#{inv.invoice_number}</div>
                          <div className="text-sm text-slate-500">{inv.status}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-slate-900">{formatCurrency(inv.total)}</div>
                          {inv.due_date && (
                            <div className="text-xs text-slate-500">
                              {format(new Date(inv.due_date), "dd MMM yyyy")}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quotes */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Devis ({quotes.length})
                </h3>
                {quotes.length === 0 ? (
                  <div className="text-sm text-slate-500 text-center py-4">Aucun devis</div>
                ) : (
                  <div className="space-y-2">
                    {quotes.map(quote => (
                      <div key={quote.id} className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-900">#{quote.quote_number}</div>
                          <div className="text-sm text-slate-500">{quote.status}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-slate-900">{formatCurrency(quote.total)}</div>
                          {quote.valid_until && (
                            <div className="text-xs text-slate-500">
                              Valide jusqu'au {format(new Date(quote.valid_until), "dd MMM yyyy")}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total Revenue */}
              <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-lg p-4 border border-indigo-100">
                <div className="text-sm text-slate-600 mb-1">Revenu total</div>
                <div className="text-2xl font-bold text-indigo-600">{formatCurrency(totalRevenue)}</div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}