'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminUsersAPI } from '@/lib/adminApi';
import UserEditModal from '@/components/UserEditModal';
import UserViewModal from '@/components/UserViewModal';
import { formatDecimal } from '@/lib/decimalUtils';
import { formatLevelTitle } from "@/lib/utils";
import { useTranslation } from '@/hooks/useTranslation';
import ConfirmModal from "@/components/ConfirmModal";
import ChangePasswordModal from "@/components/ChangePasswordModal";

export default function UsersPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState('all');

  const [selectedUser, setSelectedUser] = useState(null);
  const [showManagePopup, setShowManagePopup] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, right: 0 });
  const [showUserModal, setShowUserModal] = useState(false);
  const [showUserViewModal, setShowUserViewModal] = useState(false);
  const [userModalMode, setUserModalMode] = useState('edit');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalAction, setConfirmModalAction] = useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = { limit: 100 };
      if (emailVerifiedFilter !== 'all') {
        params.emailVerified = emailVerifiedFilter;
      }
      const response = await adminUsersAPI.getAll(params);

      if (response.data.success && response.data.data?.users) {
        setUsers(response.data.data.users || []);
      } else {
        // Handle error or empty response
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [emailVerifiedFilter]);

  const filteredUsers = (users || []).filter(user => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handlePasswordChange = async (newPassword) => {
    try {
      await adminUsersAPI.updatePassword(selectedUser.id, { password: newPassword });
      setShowPasswordModal(false);
      loadUsers();
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
        setConfirmModalAction(null);
        loadUsers(); // Reload users
        alert(t('admin.users.messages.userSuspended'));
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      alert(t('admin.users.messages.userSuspendError'));
    }
  };

  const handleResendVerification = async () => {
    if (!selectedUser) return;

    try {
      const response = await adminUsersAPI.resendVerification(selectedUser.id);
      if (response.data.success) {
        setShowConfirmModal(false);
        setSelectedUser(null);
        setShowManagePopup(null);
        setConfirmModalAction(null);
        loadUsers(); // Reload users
        alert(t('admin.users.messages.verificationEmailSent'));
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
      alert(t('admin.users.messages.resendVerificationError'));
    }
  };

  const handleMarkVerified = async () => {
    if (!selectedUser) return;

    try {
      const response = await adminUsersAPI.markVerified(selectedUser.id);
      if (response.data.success) {
        setShowConfirmModal(false);
        setSelectedUser(null);
        setShowManagePopup(null);
        setConfirmModalAction(null);
        loadUsers(); // Reload users
        alert(t('admin.users.messages.emailMarkedVerified'));
      }
    } catch (error) {
      console.error('Error marking email as verified:', error);
      alert(t('admin.users.messages.markVerifiedError'));
    }
  };

  const handleConfirmAction = () => {
    if (confirmModalAction === 'suspend') {
      handleSuspendUser();
    } else if (confirmModalAction === 'resendVerification') {
      handleResendVerification();
    } else if (confirmModalAction === 'markVerified') {
      handleMarkVerified();
    }
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
    setShowManagePopup(null);
  };

  const openUserViewModal = (user) => {
    setSelectedUser(user);
    setShowUserViewModal(true);
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      general: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('admin.users.status.general') },
      SP: { bg: 'bg-blue-100', text: 'text-blue-800', label: t('admin.users.status.SP') },
      MK: { bg: 'bg-purple-100', text: 'text-purple-800', label: t('admin.users.status.MK') },
      suspended: { bg: 'bg-red-100', text: 'text-red-800', label: t('admin.users.status.suspended') }
    };
    
    const config = statusConfig[status] || statusConfig.general;
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getEmailVerifiedBadge = (emailVerified) => {
    if (emailVerified) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          {t('admin.users.emailVerified.verified')}
        </span>
      );
    } else {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          {t('admin.users.emailVerified.unverified')}
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('admin.users.messages.loadingUsers')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.users.title')}</h1>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.users.searchUsers')}
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('admin.users.searchPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.users.filterByStatus')}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">{t('admin.users.allStatus')}</option>
              <option value="general">{t('admin.users.status.general')}</option>
              <option value="SP">{t('admin.users.status.SP')}</option>
              <option value="MK">{t('admin.users.status.MK')}</option>
              <option value="suspended">{t('admin.users.status.suspended')}</option>
            </select>
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.users.filterByEmailVerification')}
            </label>
            <select
              value={emailVerifiedFilter}
              onChange={(e) => setEmailVerifiedFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">{t('admin.users.allEmailVerification')}</option>
              <option value="true">{t('admin.users.emailVerified.verified')}</option>
              <option value="false">{t('admin.users.emailVerified.unverified')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-visible">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.users.tableHeaders.name')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.users.tableHeaders.nickname')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.users.tableHeaders.referrer')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.users.tableHeaders.email')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.users.tableHeaders.emailVerification')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.users.tableHeaders.levelTitle')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.users.tableHeaders.balance')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.users.tableHeaders.withdrawable')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.users.tableHeaders.status')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.users.tableHeaders.management')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-700">
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
                        onClick={() => {
                          const referrerUser = users.find(u => u.id === user.referrer.id);
                          if (referrerUser) {
                            openUserViewModal(referrerUser);
                          }
                        }}
                        className="text-indigo-600 hover:text-indigo-900 hover:underline"
                      >
                        {user.referrer.name}
                      </button>
                    ) : (
                      t('admin.users.noReferrer')
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getEmailVerifiedBadge(user.emailVerified)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatLevelTitle(user.level, user.title, t)}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    ¥{formatDecimal(user.balance, '0')}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    ¥{formatDecimal(user.withdrawableBalance, '0')}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getStatusBadge(user.status)}
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
                          <div className="fixed w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20" style={{ top: `${popupPosition.top}px`, right: `${popupPosition.right}px` }}>
                            <div className="py-1">
                              {!user.emailVerified && (
                                <>
                                  <button
                                    onClick={() => { setSelectedUser(user); setConfirmModalAction('resendVerification'); setShowConfirmModal(true); setShowManagePopup(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                  >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    {t('admin.users.management.resendVerification')}
                                  </button>
                                  <button
                                    onClick={() => { setSelectedUser(user); setConfirmModalAction('markVerified'); setShowConfirmModal(true); setShowManagePopup(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                  >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {t('admin.users.management.markVerified')}
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => { setSelectedUser(user); setConfirmModalAction('suspend'); setShowConfirmModal(true); setShowManagePopup(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                </svg>
                                {t('admin.users.management.suspend')}
                              </button>
                              <button
                                onClick={() => openPasswordModal(user)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                                {t('admin.users.management.changePassword')}
                              </button>
                              <button
                                onClick={() => router.push(`/admin/rewards?userId=${user.id}`)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                {t('admin.users.management.rewardHistory')}
                              </button>
                              <button
                                onClick={() => router.push(`/admin/withdrawals?userId=${user.id}`)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                {t('admin.users.management.withdrawalHistory')}
                              </button>
                              <button
                                onClick={() => { setSelectedUser(user); setUserModalMode("edit"); setShowUserModal(true); setShowManagePopup(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                {t('admin.users.management.editUser')}
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
        translationKey="admin.users"
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => { setShowConfirmModal(false); setConfirmModalAction(null); }}
        onConfirm={handleConfirmAction}
        action={confirmModalAction || 'suspend'}
        translationKey="admin.users"
      />

      <UserEditModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        user={selectedUser}
        mode={userModalMode}
        onSuccess={loadUsers}
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