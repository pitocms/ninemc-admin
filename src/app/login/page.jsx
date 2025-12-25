'use client';
import { useState, useEffect } from 'react';
import { ADMIN_ROUTES } from '@/constants';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import Logo from '@/components/Logo';
import { useTranslation } from '@/hooks/useTranslation';

export default function AdminLoginPage() {
  const router = useRouter();
  const { adminLogin } = useAdminAuth();
  const { t, isLoading: translationsLoading } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = `${t('auth.adminLogin')} - NineMC Admin Panel`;
  }, [t]);

  const handleChange = (e) => {    
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError('');

    try {
      // Basic validation
      if (!formData.email || !formData.password) {
        throw new Error(t('validation.required'));
      }


      const result = await adminLogin(formData.email, formData.password);
      
      console.log({
        success: result.success,
        hasAdmin: !!result.admin,
        error: result.error,
      });

      if (result.success) {
        // Redirect to admin users
        router.push(ADMIN_ROUTES.USERS);
      } else {
        const errorMsg = result.message || result.error || t('messages.error.loginFailed');
        setError(errorMsg);
      }
    } catch (err) {
      setError(err.message || t('messages.error.loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (translationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center">
            <Logo />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('auth.adminSignIn')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('auth.adminSignInDescription')}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('auth.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={t('auth.emailPlaceholder')}
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('auth.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={t('auth.passwordPlaceholder')}
                value={formData.password}
                onChange={handleChange}
                style={{ color: '#111827' }}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('auth.signingIn') : t('auth.signInAsAdmin')}
            </button>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {t('auth.adminTestCredentials')}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}