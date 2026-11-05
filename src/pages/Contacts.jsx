import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus, Search, Filter, Grid3X3, List, Users, Mail, Eye, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import ContactCard from "@/components/contacts/ContactCard";
import ContactForm from "@/components/contacts/ContactForm";
import BulkEmailDialog from "@/components/contacts/BulkEmailDialog";
import ContactDetailDialog from "@/components/contacts/ContactDetailDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Contacts() {
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [deletingContact, setDeletingContact] = useState(null);
  const [viewingContact, setViewingContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [showBulkEmail, setShowBulkEmail] = useState(false);

  const queryClient = useQueryClient();

  // Check URL for action
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "new") {
      setShowForm(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => base44.entities.Contact.list("-created_date", 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Contact.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Contact.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setEditingContact(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Contact.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setDeletingContact(null);
    },
  });

  const handleSave = (data) => {
    if (editingContact) {
      updateMutation.mutate({ id: editingContact.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
  };

  const handleDelete = (contact) => {
    setDeletingContact(contact);
  };

  const confirmDelete = () => {
    if (deletingContact) {
      deleteMutation.mutate(deletingContact.id);
    }
  };

  // Get all unique tags
  const allTags = [...new Set(contacts.flatMap(c => c.tags || []))];

  // Filter contacts
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || contact.status === statusFilter;
    
    const matchesTag = tagFilter === "all" || (contact.tags || []).includes(tagFilter);
    
    return matchesSearch && matchesStatus && matchesTag;
  });

  const statusCounts = {
    all: contacts.length,
    prospect: contacts.filter(c => c.status === "prospect").length,
    active_client: contacts.filter(c => c.status === "active_client").length,
    inactive_client: contacts.filter(c => c.status === "inactive_client").length,
    partner: contacts.filter(c => c.status === "partner").length,
  };

  const handleSelectContact = (contactId) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(c => c.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Contacts</h1>
          <p className="text-slate-500 mt-1">
            {selectedContacts.length > 0 
              ? `${selectedContacts.length} contact(s) sélectionné(s)`
              : "Gérez vos clients et prospects"}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedContacts.length > 0 && (
            <Button 
              onClick={() => setShowBulkEmail(true)}
              variant="outline"
              className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email groupé ({selectedContacts.length})
            </Button>
          )}
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-slate-100 p-4"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <Filter className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({statusCounts.all})</SelectItem>
                <SelectItem value="prospect">Prospects ({statusCounts.prospect})</SelectItem>
                <SelectItem value="active_client">Active ({statusCounts.active_client})</SelectItem>
                <SelectItem value="inactive_client">Inactive ({statusCounts.inactive_client})</SelectItem>
                <SelectItem value="partner">Partners ({statusCounts.partner})</SelectItem>
              </SelectContent>
            </Select>
            {allTags.length > 0 && (
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tous les tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les tags</SelectItem>
                  {allTags.map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {filteredContacts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="flex items-center gap-2"
              >
                <CheckSquare className="w-4 h-4" />
                {selectedContacts.length === filteredContacts.length ? "Désélectionner" : "Sélectionner tout"}
              </Button>
            )}
            <Tabs value={viewMode} onValueChange={setViewMode} className="hidden sm:block">
              <TabsList>
                <TabsTrigger value="grid">
                  <Grid3X3 className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="list">
                  <List className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </motion.div>

      {/* Contact List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">No contacts found</h3>
          <p className="text-slate-500 mb-4">
            {searchQuery || statusFilter !== "all" 
              ? "Try adjusting your filters"
              : "Add your first contact to get started"}
          </p>
          {!searchQuery && statusFilter === "all" && (
            <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          )}
        </div>
      ) : (
        <div className={viewMode === "grid" 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          : "space-y-3"
        }>
          {filteredContacts.map((contact, index) => (
            <div 
              key={contact.id} 
              onClick={(e) => {
                // Si on clique sur le menu dropdown ou le bouton view, on ne sélectionne pas
                if (e.target.closest('[role="menuitem"]') || e.target.closest('button[aria-label="View"]')) {
                  return;
                }
                handleSelectContact(contact.id);
              }}
              className="cursor-pointer"
            >
              <ContactCard
                contact={contact}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={(e) => {
                  e.stopPropagation();
                  setViewingContact(contact);
                }}
                index={index}
                isSelected={selectedContacts.includes(contact.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Forms and Dialogs */}
      {(showForm || editingContact) && (
        <ContactForm
          contact={editingContact}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingContact(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {showBulkEmail && (
        <BulkEmailDialog
          contacts={contacts.filter(c => selectedContacts.includes(c.id))}
          onClose={() => {
            setShowBulkEmail(false);
            setSelectedContacts([]);
          }}
        />
      )}

      {viewingContact && (
        <ContactDetailDialog
          contact={viewingContact}
          onClose={() => setViewingContact(null)}
        />
      )}

      <AlertDialog open={!!deletingContact} onOpenChange={() => setDeletingContact(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingContact?.first_name} {deletingContact?.last_name}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}