import React, { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import enTranslations from "./translations/en";
import frTranslations from "./translations/fr";
import esTranslations from "./translations/es";
import deTranslations from "./translations/de";
import ptTranslations from "./translations/pt";

const LanguageContext = createContext();

const allTranslations = {
  en: enTranslations,
  fr: frTranslations,
  es: esTranslations,
  de: deTranslations,
  pt: ptTranslations,
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [translations, setTranslations] = useState({});

  useEffect(() => {
    // Load user's language preference
    base44.auth.me().then(user => {
      if (user?.language) {
        setCurrentLanguage(user.language);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    // Load translations for current language
    setTranslations(allTranslations[currentLanguage] || allTranslations.en);
  }, [currentLanguage]);

  const t = (key) => {
    if (!key) return "";
    
    const keys = key.split(".");
    let value = translations;
    
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        // Return just the last part of the key if translation not found
        return key.split(".").pop();
      }
    }
    
    return typeof value === "string" ? value : key.split(".").pop();
  };

  const changeLanguage = async (lang) => {
    setCurrentLanguage(lang);
    // Save to user preferences
    try {
      await base44.auth.updateMe({ language: lang });
    } catch (error) {
      console.error("Failed to save language preference:", error);
    }
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};