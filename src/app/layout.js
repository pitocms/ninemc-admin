"use client";
import "./globals.css";
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { AdminAuthProvider, useAdminAuth } from '../contexts/AdminAuthContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';
import { adminRewardsAPI } from '../lib/adminApi';
import { ADMIN_ROUTES } from '../constants';
import Logo from '../components/Logo';
import LanguageSwitcher from '../components/LanguageSwitcher';

function AppShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, logoutAdmin, loading } = useAdminAuth();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isConfirmingRewards, setIsConfirmingRewards] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (pathname === ADMIN_ROUTES.LOGIN) return;
    if (!loading && !admin) {
      router.push(ADMIN_ROUTES.LOGIN);
    }
  }, [admin, loading, router, pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const handleLogout = () => {
    logoutAdmin();
    router.push(ADMIN_ROUTES.LOGIN);
  };

  const handleRewardConfirmation = async () => {
    if (isConfirmingRewards) return;
    const confirmed = window.confirm(
      t('admin.rewards.confirmAllMessage', 'Are you sure you want to approve all pending rewards? This action cannot be undone.')
    );
    if (!confirmed) return;
    try {
      setIsConfirmingRewards(true);
      const response = await adminRewardsAPI.approveAll();
      if (response.data.success) {
        alert(t('admin.rewards.confirmationSuccess', `Successfully approved ${response.data.approvedCount} rewards`));
        window.location.reload();
      } else {
        alert(t('admin.rewards.confirmationError', 'Failed to approve rewards. Please try again.'));
      }
    } catch (error) {
      console.error('Error confirming rewards:', error);
      alert(t('admin.rewards.confirmationError', 'Failed to approve rewards. Please try again.'));
    } finally {
      setIsConfirmingRewards(false);
    }
  };

  if (!mounted) return null;
  if (pathname === ADMIN_ROUTES.LOGIN) return <>{children}</>;
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }
  if (!admin) return null;

  const navigation = [
    { name: t('navigation.mlmUser'), children: [
      { name: t('navigation.users'), href: '/users' },
      { name: t('navigation.membership'), href: '/membership' },
      { name: t('navigation.rewards'), href: '/rewards' },
      { name: t('navigation.withdrawals'), href: '/withdrawals' },
    ]},
    { name: t('navigation.junket'), children: [
      { name: 'MK ' + t('navigation.users'), href: '/mk-users' },
      { name: t('navigation.jkDataImport'), href: '/jk-data-import' },
      { name: t('navigation.rewards'), href: '/jk-rewards' },
      { name: t('navigation.withdrawals'), href: '/jk-withdrawals' },
    ]},
    { name: t('navigation.common'), children: [
      { name: t('navigation.inquiries'), href: '/inquiries' },
      { name: t('navigation.administrators'), href: '/administrators' },
      { name: t('navigation.settings'), href: '/settings' },
    ]},
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Backdrop overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 overflow-y-auto transition duration-300 ease-in-out transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 bg-gray-900 px-4">
          <div className="flex items-center justify-center flex-1">
            <Logo size={32} className="mr-2" />
            <span className="text-white text-xl font-semibold">{t('navigation.adminPanel')}</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="text-gray-400 hover:text-white focus:outline-none focus:text-white md:hidden"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="mt-10">
          {navigation.map((item, index) => (
            <div key={index} className="mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">{item.name}</h3>
              {item.children.map((child) => (
                <a key={child.name} href={child.href} className={`flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white ${pathname === child.href ? 'bg-gray-700 text-white' : ''}`}>
                  {child.name}
                </a>
              ))}
            </div>
          ))}
        </nav>
      </div>
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : ''}`}>
        <header className="flex items-center justify-between px-6 h-16 bg-white border-b border-gray-200">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700">
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={handleRewardConfirmation} disabled={isConfirmingRewards} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{isConfirmingRewards ? t('admin.rewards.processing', 'Processing...') : t('navigation.rewardConfirmation')}</span>
            </button>
            <LanguageSwitcher />
            <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center space-x-2 focus:outline-none">
                <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">{admin.email.charAt(0).toUpperCase()}</span>
                </div>
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{t('navigation.admin')}</p>
                      <p className="text-sm text-gray-500">{admin.email}</p>
                    </div>
                    <div className="py-1">
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                        </svg>
                        {t('navigation.logout')}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <LanguageProvider>
          <AdminAuthProvider>
            <AppShell>{children}</AppShell>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: { background: '#363636', color: '#fff' },
                success: { duration: 3000, style: { background: '#10b981' } },
                error: { duration: 4000, style: { background: '#ef4444' } },
              }}
            />
          </AdminAuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}