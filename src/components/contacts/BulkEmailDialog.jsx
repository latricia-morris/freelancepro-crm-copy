import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mail, X, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function BulkEmailDialog({ contacts, onClose }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!subject || !body) return;
    
    setSending(true);
    try {
      // Send email to each contact
      await Promise.all(
        contacts.map(contact =>
          base44.integrations.Core.SendEmail({
            to: contact.email,
            subject: subject,
            body: body,
          })
        )
      );
      setSent(true);
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      console.error("Failed to send emails:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-600" />
            Envoyer un email groupé
          </DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Emails envoyés !</h3>
            <p className="text-slate-600">{contacts.length} email(s) envoyé(s) avec succès</p>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {/* Recipients */}
            <div className="space-y-2">
              <Label>Destinataires ({contacts.length})</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg max-h-32 overflow-y-auto">
                {contacts.map(contact => (
                  <Badge key={contact.id} variant="secondary" className="text-xs">
                    {contact.first_name} {contact.last_name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Objet *</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Objet de l'email"
                required
              />
            </div>

            {/* Body */}
            <div className="space-y-2">
              <Label htmlFor="body">Message *</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Bonjour,&#10;&#10;Je vous contacte pour...&#10;&#10;Cordialement,"
                rows={12}
                required
                className="font-sans resize-none"
              />
              <p className="text-xs text-slate-500">
                💡 Variables disponibles: {"{nom}"} {"{prenom}"} {"{entreprise}"}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button
                onClick={handleSend}
                disabled={!subject || !body || sending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer à {contacts.length} contact(s)
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}