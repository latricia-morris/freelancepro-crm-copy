import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, FileText, DollarSign, Users, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const notificationIcons = {
  invoice: FileText,
  payment: DollarSign,
  contact: Users,
  task: CheckCircle,
};

export default function NotificationPanel({ isOpen, onClose, notifications = [] }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600" />
                <h2 className="font-semibold text-slate-900">Notifications</h2>
                {notifications.length > 0 && (
                  <span className="bg-indigo-100 text-indigo-600 text-xs font-medium px-2 py-0.5 rounded-full">
                    {notifications.length}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Notifications List */}
            <div className="p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Aucune notification</p>
                  <p className="text-slate-400 text-xs mt-1">Vous êtes à jour!</p>
                </div>
              ) : (
                notifications.map((notification, index) => {
                  const Icon = notificationIcons[notification.type] || Bell;
                  return (
                    <motion.div
                      key={notification.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                        notification.read
                          ? "bg-white border-slate-100 hover:bg-slate-50"
                          : "bg-indigo-50 border-indigo-100 hover:bg-indigo-100"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          notification.read ? "bg-slate-100" : "bg-indigo-100"
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            notification.read ? "text-slate-600" : "text-indigo-600"
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 text-sm">
                            {notification.title}
                          </p>
                          <p className="text-slate-600 text-xs mt-1">
                            {notification.message}
                          </p>
                          <p className="text-slate-400 text-xs mt-2">
                            {notification.time && format(new Date(notification.time), "PPp", { locale: fr })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}