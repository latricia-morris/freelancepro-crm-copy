import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { User, Building2, CreditCard, Bell, Shield, Save, Check, Globe, Upload, Image as ImageIcon } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Settings() {
  const { t, currentLanguage, changeLanguage } = useLanguage();
  const [user, setUser] = useState(null);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    timezone: "America/New_York",
    profile_photo_url: "",
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [business, setBusiness] = useState({
    business_name: "",
    business_type: "individual",
    tax_id: "",
    address: "",
    country: "US",
    custom_country: "",
    tax_label: "TVA",
    currency: "USD",
    currency_position: "after",
    default_hourly_rate: 100,
    default_payment_terms: "Net 30",
    logo_url: "",
  });
  const [notifications, setNotifications] = useState({
    email_invoices: true,
    email_payments: true,
    email_reminders: true,
    email_weekly_summary: false,
  });

  useEffect(() => {
    base44.auth.me().then(userData => {
      setUser(userData);
      setProfile({
        full_name: userData.full_name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        timezone: userData.timezone || "America/New_York",
        profile_photo_url: userData.profile_photo_url || "",
      });
      if (userData.business) {
        setBusiness(prev => ({ ...prev, ...userData.business }));
      }
      if (userData.notifications) {
        setNotifications(prev => ({ ...prev, ...userData.notifications }));
      }
    });
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfile(p => ({ ...p, profile_photo_url: file_url }));
      await base44.auth.updateMe({ profile_photo_url: file_url });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setBusiness(b => ({ ...b, logo_url: file_url }));
      await base44.auth.updateMe({ business: { ...business, logo_url: file_url } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploadingLogo(false);
    }
  };

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSaveProfile = () => {
    updateMutation.mutate({
      phone: profile.phone,
      timezone: profile.timezone,
    });
  };

  const handleSaveBusiness = () => {
    updateMutation.mutate({ business });
  };

  const handleSaveNotifications = () => {
    updateMutation.mutate({ notifications });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">{t("settings.title")}</h1>
        <p className="text-slate-500 mt-1">{t("settings.subtitle")}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" /> {t("settings.profile")}
            </TabsTrigger>
            <TabsTrigger value="business" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" /> {t("settings.business")}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" /> {t("settings.notifications")}
            </TabsTrigger>
            <TabsTrigger value="language" className="flex items-center gap-2">
              <Globe className="w-4 h-4" /> {t("settings.language")}
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.profile")} Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Photo */}
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    {profile.profile_photo_url && <AvatarImage src={profile.profile_photo_url} />}
                    <AvatarFallback className="bg-indigo-100 text-indigo-600 text-2xl">
                      {profile.full_name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Label htmlFor="photo-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                        {uploadingPhoto ? (
                          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Upload className="w-4 h-4 text-slate-600" />
                        )}
                        <span className="text-sm text-slate-700">
                          {uploadingPhoto ? "Upload..." : "Change Photo"}
                        </span>
                      </div>
                    </Label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-slate-500 mt-1">JPG, PNG ou GIF (max. 2MB)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={profile.full_name}
                      disabled
                      className="bg-slate-50"
                    />
                    <p className="text-xs text-slate-500">Name cannot be changed here</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={profile.email}
                      disabled
                      className="bg-slate-50"
                    />
                    <p className="text-xs text-slate-500">Email cannot be changed</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={profile.phone}
                      onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select value={profile.timezone} onValueChange={(v) => setProfile(p => ({ ...p, timezone: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={updateMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {saved ? <><Check className="w-4 h-4 mr-2" /> {t("settings.saved")}</> : <><Save className="w-4 h-4 mr-2" /> {t("settings.saveChanges")}</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Tab */}
          <TabsContent value="business">
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.business")} Information</CardTitle>
                <CardDescription>Configure your business details for invoices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Upload */}
                <div className="flex items-center gap-6">
                  <div className="h-24 w-24 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {business.logo_url ? (
                      <img src={business.logo_url} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                        {uploadingLogo ? (
                          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Upload className="w-4 h-4 text-slate-600" />
                        )}
                        <span className="text-sm text-slate-700">
                          {uploadingLogo ? "Upload..." : "Upload Logo"}
                        </span>
                      </div>
                    </Label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-slate-500 mt-1">Apparaît sur les devis et factures</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Business Name</Label>
                    <Input
                      value={business.business_name}
                      onChange={(e) => setBusiness(b => ({ ...b, business_name: e.target.value }))}
                      placeholder="Your Company LLC"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Business Type</Label>
                    <Select value={business.business_type} onValueChange={(v) => setBusiness(b => ({ ...b, business_type: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual / Sole Proprietor</SelectItem>
                        <SelectItem value="llc">LLC</SelectItem>
                        <SelectItem value="corporation">Corporation</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tax ID / EIN</Label>
                    <Input
                      value={business.tax_id}
                      onChange={(e) => setBusiness(b => ({ ...b, tax_id: e.target.value }))}
                      placeholder="XX-XXXXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Select value={business.country} onValueChange={(v) => setBusiness(b => ({ ...b, country: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                        <SelectItem value="DE">Germany</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="OTHER">Autre (personnalisé)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {business.country === "OTHER" && (
                    <div className="space-y-2 md:col-span-2">
                      <Label>Nom du pays</Label>
                      <Input
                        value={business.custom_country}
                        onChange={(e) => setBusiness(b => ({ ...b, custom_country: e.target.value }))}
                        placeholder="Entrez le nom de votre pays"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Libellé de taxe</Label>
                    <Input
                      value={business.tax_label}
                      onChange={(e) => setBusiness(b => ({ ...b, tax_label: e.target.value }))}
                      placeholder="TVA, GST, Sales Tax..."
                    />
                    <p className="text-xs text-slate-500">Ex: TVA pour la France, GST pour le Canada</p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Business Address</Label>
                    <Textarea
                      value={business.address}
                      onChange={(e) => setBusiness(b => ({ ...b, address: e.target.value }))}
                      placeholder="123 Business St, Suite 100&#10;City, State 12345"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Currency</Label>
                    <Select value={business.currency} onValueChange={(v) => setBusiness(b => ({ ...b, currency: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="CAD">CAD ($)</SelectItem>
                        <SelectItem value="AUD">AUD ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Position de la devise</Label>
                    <Select value={business.currency_position} onValueChange={(v) => setBusiness(b => ({ ...b, currency_position: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="before">Avant ($ 100)</SelectItem>
                        <SelectItem value="after">Après (100 $)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Default Hourly Rate</Label>
                    <Input
                      type="number"
                      min="0"
                      value={business.default_hourly_rate}
                      onChange={(e) => setBusiness(b => ({ ...b, default_hourly_rate: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Payment Terms</Label>
                    <Select value={business.default_payment_terms} onValueChange={(v) => setBusiness(b => ({ ...b, default_payment_terms: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                        <SelectItem value="Net 7">Net 7</SelectItem>
                        <SelectItem value="Net 15">Net 15</SelectItem>
                        <SelectItem value="Net 30">Net 30</SelectItem>
                        <SelectItem value="Net 60">Net 60</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveBusiness}
                    disabled={updateMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {saved ? <><Check className="w-4 h-4 mr-2" /> {t("settings.saved")}</> : <><Save className="w-4 h-4 mr-2" /> {t("settings.saveChanges")}</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.notifications")} Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <div>
                      <p className="font-medium text-slate-900">Invoice Updates</p>
                      <p className="text-sm text-slate-500">Get notified when invoices are viewed or paid</p>
                    </div>
                    <Switch
                      checked={notifications.email_invoices}
                      onCheckedChange={(v) => setNotifications(n => ({ ...n, email_invoices: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <div>
                      <p className="font-medium text-slate-900">Payment Notifications</p>
                      <p className="text-sm text-slate-500">Receive alerts when payments are received</p>
                    </div>
                    <Switch
                      checked={notifications.email_payments}
                      onCheckedChange={(v) => setNotifications(n => ({ ...n, email_payments: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <div>
                      <p className="font-medium text-slate-900">Task Reminders</p>
                      <p className="text-sm text-slate-500">Get reminded about upcoming deadlines</p>
                    </div>
                    <Switch
                      checked={notifications.email_reminders}
                      onCheckedChange={(v) => setNotifications(n => ({ ...n, email_reminders: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-slate-900">Weekly Summary</p>
                      <p className="text-sm text-slate-500">Receive a weekly business summary email</p>
                    </div>
                    <Switch
                      checked={notifications.email_weekly_summary}
                      onCheckedChange={(v) => setNotifications(n => ({ ...n, email_weekly_summary: v }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveNotifications}
                    disabled={updateMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {saved ? <><Check className="w-4 h-4 mr-2" /> {t("settings.saved")}</> : <><Save className="w-4 h-4 mr-2" /> {t("settings.saveChanges")}</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Language Tab */}
          <TabsContent value="language">
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.languageLabel")}</CardTitle>
                <CardDescription>{t("settings.languageDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="language">{t("settings.language")}</Label>
                  <Select value={currentLanguage} onValueChange={changeLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    Changes will be applied immediately
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}