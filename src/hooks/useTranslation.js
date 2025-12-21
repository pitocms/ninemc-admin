'use client';

import { useLanguage } from '../contexts/LanguageContext';

export const useTranslation = () => {
  return useLanguage();
};

export default useTranslation;