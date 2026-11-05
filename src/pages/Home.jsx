import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { 
  ArrowRight, 
  Building2, 
  Users, 
  BarChart3, 
  FileText, 
  Clock, 
  Target,
  CheckCircle,
  Zap,
  Shield,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const features = [
    {
      icon: Users,
      title: "Gestion des Contacts",
      description: "Centralisez tous vos clients et prospects en un seul endroit"
    },
    {
      icon: Target,
      title: "Pipeline de Vente",
      description: "Suivez vos opportunités du premier contact jusqu'à la signature"
    },
    {
      icon: FileText,
      title: "Devis & Factures",
      description: "Créez et envoyez vos documents professionnels en quelques clics"
    },
    {
      icon: BarChart3,
      title: "Rapports Détaillés",
      description: "Analysez vos performances avec des tableaux de bord intuitifs"
    },
    {
      icon: Clock,
      title: "Suivi du Temps",
      description: "Enregistrez votre temps de travail et facturez précisément"
    },
    {
      icon: TrendingUp,
      title: "Prospection Google",
      description: "Trouvez des prospects qualifiés directement via Google"
    }
  ];

  const benefits = [
    "Interface intuitive et moderne",
    "Accès sécurisé pour vos clients",
    "Synchronisation en temps réel",
    "Support multi-devises",
    "Rapports automatisés",
    "Gestion des dépenses"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                FreelancePro
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
            Le CRM pensé pour les
            <span className="block bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mt-2">
              Freelances & PME
            </span>
          </h1>
          <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto">
            Gérez vos clients, projets, factures et suivez votre activité en toute simplicité.
            Une solution complète pour développer votre business.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link to={createPageUrl("Dashboard")}>
              <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-200 px-8 py-6 text-lg">
                <Building2 className="w-5 h-5 mr-2" />
                Accès Entreprise
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to={createPageUrl("ClientPortal")}>
              <Button size="lg" variant="outline" className="border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 px-8 py-6 text-lg">
                <Shield className="w-5 h-5 mr-2" />
                Portail Client
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
            >
              <div className="text-4xl font-bold text-indigo-600 mb-2">10+</div>
              <div className="text-slate-600">Modules Intégrés</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
            >
              <div className="text-4xl font-bold text-indigo-600 mb-2">100%</div>
              <div className="text-slate-600">Sécurisé</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
            >
              <div className="text-4xl font-bold text-indigo-600 mb-2">24/7</div>
              <div className="text-slate-600">Disponible</div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white/50 rounded-3xl my-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            Fonctionnalités
          </div>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Une suite complète d'outils pour gérer votre activité de freelance ou PME
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <Card className="border-slate-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">
              <CheckCircle className="w-4 h-4" />
              Avantages
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-6">
              Pourquoi choisir FreelancePro ?
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Une solution complète et intuitive pour gérer votre activité professionnelle efficacement.
            </p>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-slate-700">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl p-8 shadow-2xl">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-white/20 rounded w-3/4"></div>
                    <div className="h-2 bg-white/10 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-20 bg-white/10 rounded-lg"></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="h-2 bg-white/20 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-white/30 rounded w-3/4"></div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="h-2 bg-white/20 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-white/30 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-12 text-center shadow-2xl"
        >
          <h2 className="text-4xl font-bold text-white mb-6">
            Prêt à démarrer ?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Accédez à votre espace et commencez à gérer votre activité professionnelle dès maintenant
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl("Dashboard")}>
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-6 text-lg shadow-xl">
                <Building2 className="w-5 h-5 mr-2" />
                Accéder au CRM
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to={createPageUrl("ClientPortal")}>
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
                <Shield className="w-5 h-5 mr-2" />
                Espace Client
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-md mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">F</span>
              </div>
              <span className="font-semibold text-slate-900">FreelancePro</span>
            </div>
            <p className="text-sm text-slate-500">
              © 2025 FreelancePro. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}