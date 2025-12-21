'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminUsersAPI } from '@/lib/adminApi';
import MkUserEditModal from '@/components/MkUserEditModal';
import UserViewModal from '@/components/UserViewModal';
import { formatDecimal } from '@/lib/decimalUtils';
import { useTranslation } from '@/hooks/useTranslation';
import ConfirmModal from "@/components/ConfirmModal";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import EditCasinoFieldsModal from "@/components/EditCasinoFieldsModal";

export default function MkUsersPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [mkUsers, setMkUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedUser, setSelectedUser] = useState(null);
  const [showManagePopup, setShowManagePopup] = useState(null);
  const [showMkUserModal, setShowMkUserModal] = useState(false);
  const [showUserViewModal, setShowUserViewModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCasinoFieldsModal, setShowCasinoFieldsModal] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, right: 0 });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  useEffect(() => {
    loadMkUsers();
  }, []);

  const loadMkUsers = async () => {
    try {
      setLoading(true);
      // Filter only MK users (status='MK')
      const response = await adminUsersAPI.getAll({ limit: 1000, status: 'MK' });

      if (response.data.success && response.data.data?.users) {
        // Filter MK users on client side as well
        const mkUsersData = (response.data.data.users || []).filter(user => user.status === 'MK');
        setMkUsers(mkUsersData);
      }
    } catch (error) {
      console.error('Error loading MK users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMkUsers = (mkUsers || []).filter(user => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.casinoUniqueId?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handlePasswordChange = async (newPassword) => {
    try {
      await adminUsersAPI.updatePassword(selectedUser.id, { password: newPassword });
      setShowPasswordModal(false);
      loadMkUsers();
    } catch (error) {
      console.error('Error changing password:', error);
    }
  };

  const handleSuspendUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await adminUsersAPI.update(selectedUser.id, { status: 'suspended' });
      if (response.data.success) {
        setShowConfirmModal(false);
        setSelectedUser(null);
        setShowManagePopup(null);
        loadMkUsers(); // Reload users
        alert(t('admin.mkUsers.messages.userSuspended'));
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      alert(t('admin.mkUsers.messages.userSuspendError'));
    }
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
    setShowManagePopup(null);
  };

  const openCasinoFieldsModal = (user) => {
    setSelectedUser(user);
    setShowCasinoFieldsModal(true);
    setShowManagePopup(null);
  };

  const handleCasinoFieldsUpdate = async (fields) => {
    try {
      await adminUsersAPI.update(selectedUser.id, fields);
      setShowCasinoFieldsModal(false);
      loadMkUsers();
    } catch (error) {
      console.error('Error updating casino fields:', error);
      alert(t('admin.mkUsers.messages.userUpdateError'));
    }
  };

  const openUserViewModal = async (user) => {
    try {
      // If the user is already in mkUsers, use it directly
      const existingUser = mkUsers.find(u => u.id === user.id);
      if (existingUser) {
        setSelectedUser(existingUser);
        setShowUserViewModal(true);
        return;
      }
      
      // Otherwise, fetch the user by ID
      const response = await adminUsersAPI.getById(user.id);
      if (response.data.success) {
        setSelectedUser(response.data.data);
        setShowUserViewModal(true);
      } else {
        // Fallback: use the user data we have
        setSelectedUser(user);
        setShowUserViewModal(true);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      // Fallback: use the user data we have
      setSelectedUser(user);
      setShowUserViewModal(true);
    }
  };

  const toggleManagePopup = (userId, event) => {
    if (showManagePopup === userId) {
      setShowManagePopup(null);
    } else {
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      setPopupPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
      setShowManagePopup(userId);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('admin.mkUsers.messages.loadingUsers')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.mkUsers.title')}</h1>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.mkUsers.searchUsers')}
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('admin.mkUsers.searchPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* MK Users Table */}
      <div className="bg-white rounded-lg shadow overflow-visible">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.mkUsers.tableHeaders.name')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.mkUsers.tableHeaders.nickname')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.mkUsers.tableHeaders.referrer')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.mkUsers.tableHeaders.email')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.mkUsers.tableHeaders.casinoUniqueId')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.mkUsers.tableHeaders.jkRewardPercentage')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.mkUsers.tableHeaders.jkRewardBalance')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.mkUsers.tableHeaders.jkWithdrawableBalance')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.mkUsers.tableHeaders.management')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMkUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-purple-300 flex items-center justify-center">
                        <span className="text-xs font-medium text-purple-700">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || 'No Name'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.nickname || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.referrer ? (
                      <button
                        onClick={() => openUserViewModal(user.referrer)}
                        className="text-indigo-600 hover:text-indigo-900 hover:underline"
                      >
                        {user.referrer.name}
                      </button>
                    ) : (
                      t('admin.mkUsers.noReferrer')
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.casinoUniqueId || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.jkRewardPercentage != null ? `${user.jkRewardPercentage}%` : '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    ¥{formatDecimal(user.jkRewardBalance, '0')}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    ¥{formatDecimal(user.jkWithdrawableBalance, '0')}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="relative">
                      <button
                        onClick={(e) => toggleManagePopup(user.id, e)}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                      
                      {/* Management Popup */}
                      {showManagePopup === user.id && (
                        <>
                          {/* Backdrop */}
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowManagePopup(null)}
                          />
                          
                          {/* Popup Menu */}
                          <div className="fixed w-56 bg-white border border-gray-200 rounded-md shadow-lg z-20" style={{ top: `${popupPosition.top}px`, right: `${popupPosition.right}px` }}>
                            <div className="py-1">
                              <button
                                onClick={() => { setSelectedUser(user); setShowConfirmModal(true); setShowManagePopup(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                </svg>
                                {t('admin.mkUsers.management.suspend')}
                              </button>
                              <button
                                onClick={() => openPasswordModal(user)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                                {t('admin.mkUsers.management.changePassword')}
                              </button>
                              <button
                                onClick={() => router.push(`/admin/jk-rewards?userId=${user.id}`)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                {t('admin.mkUsers.management.jkRewardHistory')}
                              </button>
                              <button
                                onClick={() => router.push(`/admin/jk-withdrawals?userId=${user.id}`)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                {t('admin.mkUsers.management.jkWithdrawalHistory')}
                              </button>
                              <button
                                onClick={() => { setSelectedUser(user); setShowMkUserModal(true); setShowManagePopup(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                {t('admin.mkUsers.management.editMkUser')}
                              </button>
                              <button
                                onClick={() => openCasinoFieldsModal(user)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                                {t('admin.mkUsers.management.editCasinoFields')}
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handlePasswordChange}
        translationKey="admin.mkUsers"
      />

      {/* Casino Fields Modal */}
      <EditCasinoFieldsModal
        isOpen={showCasinoFieldsModal}
        onClose={() => setShowCasinoFieldsModal(false)}
        onSubmit={handleCasinoFieldsUpdate}
        user={selectedUser}
        translationKey="admin.mkUsers"
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleSuspendUser}
        action="suspend"
        translationKey="admin.mkUsers"
      />

      <MkUserEditModal
        isOpen={showMkUserModal}
        onClose={() => setShowMkUserModal(false)}
        user={selectedUser}
        onSuccess={loadMkUsers}
      />

      <UserViewModal
        isOpen={showUserViewModal}
        onClose={() => setShowUserViewModal(false)}
        user={selectedUser}
        mode="full"
      />
    </div>
  );
}