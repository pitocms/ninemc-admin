'use client';
import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { adminAdministratorsAPI } from '@/lib/adminApi';
import AdministratorEditModal from '@/components/AdministratorEditModal';
import ConfirmModal from '@/components/ConfirmModal';
import ChangePasswordModal from '@/components/ChangePasswordModal';

export default function AdministratorsPage() {
  const { t } = useTranslation();
  const { admin: currentAdmin } = useAdminAuth();

  const [administrators, setAdministrators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminModalMode, setAdminModalMode] = useState('edit');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    loadAdministrators();
  }, []);

  const loadAdministrators = async () => {
    try {
      setLoading(true);
      const response = await adminAdministratorsAPI.getAll();

      if (response.data.success && response.data.data) {
        setAdministrators(response.data.data || []);
      } else {
        console.error('Failed to load administrators');
      }
    } catch (error) {
      console.error('Error loading administrators:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAdministrators = administrators.filter(admin =>
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateAdmin = () => {
    setSelectedAdmin(null);
    setAdminModalMode('create');
    setShowAdminModal(true);
  };

  const handleEditAdmin = (admin) => {
    setSelectedAdmin(admin);
    setAdminModalMode('edit');
    setShowAdminModal(true);
  };

  const handleChangePassword = (admin) => {
    setSelectedAdmin(admin);
    setShowPasswordModal(true);
  };

  const handleDeleteAdmin = () => {
    setShowConfirmModal(true);
  };

  const confirmDeleteAdmin = async () => {
    try {
      await adminAdministratorsAPI.delete(selectedAdmin.id);
      setShowConfirmModal(false);
      loadAdministrators();
    } catch (error) {
      console.error('Error deleting administrator:', error);
    }
  };

  const handlePasswordChange = async (newPassword) => {
    try {
      await adminAdministratorsAPI.update(selectedAdmin.id, {
        password: newPassword
      });
      setShowPasswordModal(false);
      loadAdministrators();
    } catch (error) {
      console.error('Error changing password:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: t('admin.administrators.status.active') },
      inactive: { bg: 'bg-red-100', text: 'text-red-800', label: t('admin.administrators.status.inactive') }
    };
    
    const config = statusConfig[status] || statusConfig.inactive;
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('admin.administrators.messages.loadingAdministrators')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.administrators.title')}</h1>
        <button
          onClick={handleCreateAdmin}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {t('admin.administrators.addAdministrator')}
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.administrators.searchAdministrators')}
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('admin.administrators.searchPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Administrators Table */}
      <div className="bg-white rounded-lg shadow overflow-visible">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.administrators.tableHeaders.email')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.administrators.tableHeaders.status')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.administrators.tableHeaders.management')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAdministrators.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                    {t('admin.administrators.messages.noAdministrators')}
                  </td>
                </tr>
              ) : (
                filteredAdministrators.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {admin.email}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(admin.status)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleEditAdmin(admin)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                          title={t('admin.administrators.management.edit')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Change Password Button */}
                        <button
                          onClick={() => handleChangePassword(admin)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title={t('admin.administrators.management.changePassword')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            setSelectedAdmin(admin);
                            handleDeleteAdmin();
                          }}
                          disabled={admin.id === currentAdmin?.id}
                          className={`p-1 rounded ${
                            admin.id === currentAdmin?.id
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-red-600 hover:text-red-900'
                          }`}
                          title={
                            admin.id === currentAdmin?.id
                              ? t('admin.administrators.management.cannotDeleteSelf')
                              : t('admin.administrators.management.delete')
                          }
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shared Modals */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmDeleteAdmin}
        action="delete"
        translationKey="admin.administrators"
      />

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handlePasswordChange}
        translationKey="admin.administrators"
      />

      <AdministratorEditModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        administrator={selectedAdmin}
        mode={adminModalMode}
        onSuccess={loadAdministrators}
      />
    </div>
  );
}