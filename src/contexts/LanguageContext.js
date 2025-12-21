'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Return a default context instead of throwing error
    return {
      t: (key, options = key) => {
        // Handle interpolation in fallback
        if (typeof options === 'object' && options !== null && !Array.isArray(options)) {
          const hasVariables = Object.keys(options).some(k => k !== 'fallback');
          if (hasVariables) {
            let result = typeof options.fallback === 'string' ? options.fallback : key;
            result = result.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
              return options[varName] !== undefined ? String(options[varName]) : match;
            });
            return result;
          }
        }
        return typeof options === 'string' ? options : key;
      },
      locale: 'en',
      changeLanguage: () => {},
      isLoading: false
    };
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState('en');
  const [translations, setTranslations] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Get locale from localStorage or default to 'en'
    const savedLocale = typeof window !== 'undefined' ? localStorage.getItem('locale') || 'en' : 'en';
    setLocale(savedLocale);
    loadTranslations(savedLocale);
  }, []);

  const loadTranslations = async (locale) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/locales/${locale}/common.json`);
      if (response.ok) {
        const data = await response.json();
        setTranslations(data);
      } else {
        // Fallback to English if locale file not found
        const fallbackResponse = await fetch('/locales/en/common.json');
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setTranslations(fallbackData);
        }
      }
    } catch (error) {
      console.error('Error loading translations:', error);
      // Set empty translations as fallback
      setTranslations({});
    } finally {
      setIsLoading(false);
    }
  };

  const t = (key, options = key) => {
    if (isLoading) return typeof options === 'string' ? options : key;
    
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // If options is a string, it's a fallback; otherwise return key
        return typeof options === 'string' ? options : key;
      }
    }
    
    let result = typeof value === 'string' ? value : (typeof options === 'string' ? options : key);
    
    // Handle interpolation if options is an object with variables
    if (typeof options === 'object' && options !== null && !Array.isArray(options)) {
      // Check if options has interpolation variables (not just a fallback string)
      const hasVariables = Object.keys(options).some(k => k !== 'fallback');
      if (hasVariables) {
        // Replace {{variable}} placeholders with actual values
        result = result.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
          return options[varName] !== undefined ? String(options[varName]) : match;
        });
      }
    }
    
    return result;
  };

  const changeLanguage = (newLocale) => {
    setLocale(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
    loadTranslations(newLocale);
  };

  const value = {
    t,
    locale,
    changeLanguage,
    isLoading
  };

  return React.createElement(LanguageContext.Provider, { value }, children);
};