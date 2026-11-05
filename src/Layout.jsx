import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { LanguageProvider, useLanguage } from "@/components/LanguageContext";
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  FileText, 
  FolderKanban, 
  Clock, 
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  Search,
  Plus,
  Receipt
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NotificationPanel from "@/components/NotificationPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

function LayoutContent({ children, currentPageName }) {
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: t("nav.dashboard"), href: "Dashboard", icon: LayoutDashboard },
    { name: t("nav.contacts"), href: "Contacts", icon: Users },
    { name: t("nav.prospecting"), href: "Prospecting", icon: Search },
    { name: t("nav.pipeline"), href: "Pipeline", icon: Target },
    { name: t("nav.quotesInvoices"), href: "QuotesInvoices", icon: FileText },
    { name: t("nav.projects"), href: "Projects", icon: FolderKanban },
    { name: t("nav.expenses"), href: "Expenses", icon: Receipt },
    { name: t("nav.timeTracking"), href: "TimeTracking", icon: Clock },
    { name: t("nav.calendar"), href: "Calendar", icon: Calendar },
    { name: t("nav.reports"), href: "Reports", icon: BarChart3 },
  ];

  const publicPages = ["Home", "ClientPortal", "ClientProjects", "ClientProjectDetail", "ClientMessages", "ClientInvoices"];

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => {
        // User not authenticated
        if (!publicPages.includes(currentPageName)) {
          window.location.href = createPageUrl("Home");
        }
      })
      .finally(() => setLoading(false));
  }, [currentPageName]);

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // For public pages (Home, ClientPortal, etc.), render without CRM layout
  if (publicPages.includes(currentPageName)) {
    return <>{children}</>;
  }

  // For authenticated users, render with full CRM layout
  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        :root {
          --primary: 224 76% 48%;
          --primary-foreground: 0 0% 100%;
        }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100">
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className="text-xl font-semibold text-slate-900">FreelancePro</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Add */}
          <div className="p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-200">
                  <Plus className="w-4 h-4 mr-2" />
                  {t("nav.quickAdd")}
                  <ChevronDown className="w-4 h-4 ml-auto" />
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("Contacts") + "?action=new"}>{t("nav.newContact")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("Pipeline") + "?action=new"}>{t("nav.newOpportunity")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("QuotesInvoices") + "?action=new"}>{t("nav.newQuoteInvoice")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("Projects") + "?action=new"}>{t("nav.newProject")}</Link>
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = currentPageName === item.href;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.href)}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-slate-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <Avatar className="h-9 w-9 bg-gradient-to-br from-indigo-500 to-violet-500">
                    {user?.profile_photo_url && <AvatarImage src={user.profile_photo_url} />}
                    <AvatarFallback className="bg-transparent text-white text-sm">
                      {getInitials(user?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-slate-900">{user?.full_name || "User"}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("Settings")}>
                    <Settings className="w-4 h-4 mr-2" />
                    {t("nav.settings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden sm:flex items-center gap-2 bg-slate-100 rounded-xl px-4 py-2 w-80">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search contacts, projects..."
                  className="bg-transparent border-none outline-none text-sm text-slate-600 placeholder-slate-400 w-full"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setNotificationsOpen(true)}
                className="relative p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>

      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={notificationsOpen} 
        onClose={() => setNotificationsOpen(false)}
        notifications={[]}
      />
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <LanguageProvider>
      <LayoutContent children={children} currentPageName={currentPageName} />
    </LanguageProvider>
  );
}