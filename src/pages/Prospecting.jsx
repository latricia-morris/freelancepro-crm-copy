import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Search, MapPin, Phone, Globe, Star, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Prospecting() {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);

  const queryClient = useQueryClient();

  const createContactMutation = useMutation({
    mutationFn: (data) => base44.entities.Contact.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  const handleSearch = async () => {
    if (!searchQuery || !location) return;

    setSearching(true);
    try {
      const prompt = `Recherche des entreprises "${searchQuery}" dans la région "${location}". 
      Pour chaque entreprise trouvée, fournis les informations suivantes au format JSON:
      - name (nom de l'entreprise)
      - address (adresse complète)
      - phone (numéro de téléphone)
      - website (site web si disponible)
      - rating (note Google si disponible, sinon null)
      - category (type d'activité)
      
      Limite les résultats aux 10 premiers résultats pertinents.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  address: { type: "string" },
                  phone: { type: "string" },
                  website: { type: "string" },
                  rating: { type: "number" },
                  category: { type: "string" }
                }
              }
            }
          }
        }
      });

      setResults(response.results || []);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const addToContacts = async (business) => {
    const contactData = {
      first_name: business.name.split(" ")[0] || business.name,
      last_name: business.name.split(" ").slice(1).join(" ") || "",
      company: business.name,
      email: "", // To be filled manually
      phone: business.phone || "",
      address: business.address || "",
      website: business.website || "",
      status: "prospect",
      tags: ["prospection", business.category || ""].filter(Boolean),
      notes: `Trouvé via prospection Google\nNote: ${business.rating || "N/A"}\nCatégorie: ${business.category || "N/A"}`,
    };

    await createContactMutation.mutateAsync(contactData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Prospection Google</h1>
        <p className="text-slate-500 mt-1">Trouvez des prospects qualifiés via Google</p>
      </motion.div>

      {/* Search Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-600" />
              Recherche de prospects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Type d'entreprise *</Label>
                <Input
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ex: restaurants, agences web, boutiques..."
                  className="text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Localisation *</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Paris, Lyon, Marseille..."
                  className="text-base"
                />
              </div>
            </div>
            <Button
              onClick={handleSearch}
              disabled={!searchQuery || !location || searching}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              size="lg"
            >
              {searching ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Recherche en cours...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Rechercher des prospects
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Results */}
      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold text-slate-900">
            {results.length} résultat(s) trouvé(s)
          </h2>
          <div className="grid gap-4">
            {results.map((business, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg text-slate-900 mb-1">
                            {business.name}
                          </h3>
                          {business.category && (
                            <Badge variant="outline" className="mb-2">
                              {business.category}
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-2 text-sm text-slate-600">
                          {business.address && (
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
                              <span>{business.address}</span>
                            </div>
                          )}
                          {business.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 flex-shrink-0 text-slate-400" />
                              <a href={`tel:${business.phone}`} className="hover:text-indigo-600 transition-colors">
                                {business.phone}
                              </a>
                            </div>
                          )}
                          {business.website && (
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 flex-shrink-0 text-slate-400" />
                              <a
                                href={business.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-indigo-600 transition-colors truncate"
                              >
                                {business.website}
                              </a>
                            </div>
                          )}
                          {business.rating && (
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 flex-shrink-0 text-amber-400 fill-amber-400" />
                              <span className="font-medium text-slate-900">{business.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => addToContacts(business)}
                        disabled={createContactMutation.isPending}
                        variant="outline"
                        className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!searching && results.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">Commencez votre prospection</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Entrez le type d'entreprise et la localisation pour trouver des prospects qualifiés
          </p>
        </motion.div>
      )}
    </div>
  );
}