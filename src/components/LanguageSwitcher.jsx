'use client';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
const LanguageSwitcher = () => {
  const { locale, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const handleLanguageChange = (newLocale) => {
    changeLanguage(newLocale);
    setIsOpen(false);
  };
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' }
  ];
  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-lg transition-all duration-200"
      >
        <span className="mr-2 text-lg">{currentLanguage.flag}</span>
        <span className="hidden sm:inline font-medium">{currentLanguage.name}</span>
        <svg
          className={`ml-1 h-4 w-4 text-gray-400 group-hover:text-gray-500 transition-all duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-20 overflow-hidden">
            <div className="py-1">
              {languages.map((language, index) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={`w-full px-4 py-3 text-left text-sm flex items-center transition-all duration-150 ${
                    locale === language.code 
                      ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-500' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-3 text-lg">{language.flag}</span>
                  <span className="flex-1 font-medium">{language.name}</span>
                  {locale === language.code && (
                    <svg className="ml-2 h-4 w-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default LanguageSwitcher;