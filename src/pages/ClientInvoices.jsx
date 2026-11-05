import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, FileText, Download, CheckCircle, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

const statusConfig = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-700", icon: FileText },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-700", icon: FileText },
  viewed: { label: "Viewed", color: "bg-violet-100 text-violet-700", icon: Eye },
  paid: { label: "Paid", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  partial: { label: "Partial", color: "bg-amber-100 text-amber-700", icon: Clock },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-700", icon: Clock },
};

export default function ClientInvoices() {
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

  const { data: allInvoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => base44.entities.Invoice.list("-created_date", 100),
  });

  const myInvoices = allInvoices.filter(i => 
    userContact && (i.contact_id === userContact.id || i.contact_name?.includes(user?.full_name))
  );

  const formatCurrency = (value, currency = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(value);
  };

  const totalPaid = myInvoices.filter(i => i.status === "paid").reduce((sum, i) => sum + (i.total || 0), 0);
  const totalPending = myInvoices.filter(i => ["sent", "viewed", "partial"].includes(i.status)).reduce((sum, i) => sum + (i.total || 0) - (i.amount_paid || 0), 0);

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
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">My Invoices</h1>
            <p className="text-slate-500 mt-1">View and download your invoices</p>
          </div>
        </motion.div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total Paid</p>
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalPaid)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Pending Payment</p>
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalPending)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Invoices List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {myInvoices.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">No invoices yet</h3>
                <p className="text-slate-500">Your invoices will appear here</p>
              </CardContent>
            </Card>
          ) : (
            myInvoices.map((invoice) => {
              const config = statusConfig[invoice.status] || statusConfig.draft;
              const StatusIcon = config.icon;
              
              return (
                <Card key={invoice.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-slate-900 text-lg">
                            Invoice {invoice.invoice_number}
                          </h3>
                          <Badge className={`${config.color} flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {config.label}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Issue Date</p>
                            <p className="font-medium text-slate-900">
                              {invoice.issue_date && format(new Date(invoice.issue_date), "MMM d, yyyy")}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Due Date</p>
                            <p className="font-medium text-slate-900">
                              {invoice.due_date && format(new Date(invoice.due_date), "MMM d, yyyy")}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Amount</p>
                            <p className="font-semibold text-slate-900">
                              {formatCurrency(invoice.total, invoice.currency)}
                            </p>
                          </div>
                          {invoice.amount_paid > 0 && (
                            <div>
                              <p className="text-slate-500">Paid</p>
                              <p className="font-medium text-emerald-600">
                                {formatCurrency(invoice.amount_paid, invoice.currency)}
                              </p>
                            </div>
                          )}
                        </div>

                        {invoice.items && invoice.items.length > 0 && (
                          <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs font-medium text-slate-700 mb-2">Items:</p>
                            <ul className="space-y-1">
                              {invoice.items.map((item, idx) => (
                                <li key={idx} className="text-sm text-slate-600">
                                  {item.description} - {item.quantity} x {formatCurrency(item.unit_price, invoice.currency)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {invoice.notes && (
                          <div className="mt-3">
                            <p className="text-sm text-slate-500">{invoice.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex md:flex-col gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1 md:flex-none"
                          asChild
                        >
                          <a href="#" onClick={(e) => { e.preventDefault(); alert("Download functionality would be implemented here"); }}>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </a>
                        </Button>
                        {["sent", "viewed", "partial"].includes(invoice.status) && (
                          <Button 
                            className="bg-emerald-600 hover:bg-emerald-700 flex-1 md:flex-none"
                            onClick={() => alert("Payment processing would be integrated here (Stripe, PayPal, etc.)")}
                          >
                            Pay Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </motion.div>
      </div>
    </div>
  );
}