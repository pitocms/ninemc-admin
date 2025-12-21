'use client';
import { useState, useEffect } from 'react';
import { adminUsersAPI } from '@/lib/adminApi';
import { useTranslation } from '@/hooks/useTranslation';
import { formatLevelTitle } from "@/lib/utils";

export default function MkUserEditModal({ isOpen, onClose, user, onSuccess }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    referrerId: "",
    phoneNumber: "",
    casinoUniqueId: "",
    jkRewardPercentage: 0,
    bankAccounts: []
  });
  const [newBankAccount, setNewBankAccount] = useState({
    bankName: '',
    branchName: '',
    accountType: '',
    accountNumber: '',
    accountHolderName: '',
    isPrimary: false
  });

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      if (user) {
        setFormData({
          name: user.name || "",
          referrerId: user.referrerId || "",
          phoneNumber: user.phoneNumber || "",
          casinoUniqueId: user.casinoUniqueId || "",
          jkRewardPercentage: user.jkRewardPercentage || 0,
          bankAccounts: user.bankAccounts || []
        });
      }
    }
  }, [isOpen, user]);

  const loadUsers = async () => {
    try {
      const response = await adminUsersAPI.getAll({ limit: 1000 });
      if (response.data.success && response.data.data?.users) {
        setUsers(response.data.data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await adminUsersAPI.update(user.id, formData);
      if (response.data.success) {
        onSuccess?.();
        onClose();
        alert(t('admin.mkUsers.messages.userUpdated'));
      } else {
        alert(response.data.message || t('admin.mkUsers.messages.userUpdateError'));
      }
    } catch (error) {
      console.error('Error updating MK user:', error);
      alert(t('admin.mkUsers.messages.userUpdateError'));
    } finally {
      setLoading(false);
    }
  };

  const addBankAccount = () => {
    if (newBankAccount.bankName && newBankAccount.accountNumber) {
      setFormData({
        ...formData,
        bankAccounts: [...formData.bankAccounts, { ...newBankAccount }]
      });
      setNewBankAccount({
        bankName: "",
        branchName: "",
        accountType: "",
        accountNumber: "",
        accountHolderName: "",
        isPrimary: false
      });
    }
  };

  const removeBankAccount = (index) => {
    setFormData({
      ...formData,
      bankAccounts: formData.bankAccounts.filter((_, i) => i !== index)
    });
  };

  const updateBankAccount = (index, field, value) => {
    const updatedAccounts = [...formData.bankAccounts];
    updatedAccounts[index] = { ...updatedAccounts[index], [field]: value };
    setFormData({
      ...formData,
      bankAccounts: updatedAccounts
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Title */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-medium text-gray-900">
              {t('admin.mkUsers.modals.editMkUser.title', { name: user?.name })}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Info Section */}
          {user && (
            <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-lg">
              {/* User Avatar/Icon */}
              <div className="flex-shrink-0">
                {user.iconUrl ? (
                  <img
                    src={user.iconUrl}
                    alt={user.name || 'User'}
                    className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={`h-16 w-16 rounded-full bg-purple-300 flex items-center justify-center border-2 border-gray-200 ${user.iconUrl ? 'hidden' : 'flex'}`}
                  style={{ display: user.iconUrl ? 'none' : 'flex' }}
                >
                  <span className="text-xl font-medium text-purple-700">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              
              {/* User Details */}
              <div className="flex-1">
                {/* Line 1: Name (Nickname) */}
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {user.name || 'No Name'}
                  </h4>
                  {user.nickname && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-600">
                        ({user.nickname})
                      </span>
                    </>
                  )}
                </div>
                
                {/* Line 2: Email, Status, Level (Title) */}
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{user.email}</span>
                  <span className="text-gray-400">•</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    user.status === 'general' ? 'bg-gray-100 text-gray-800' :
                    user.status === 'SP' ? 'bg-blue-100 text-blue-800' :
                    user.status === 'MK' ? 'bg-purple-100 text-purple-800' :
                    user.status === 'suspended' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {t(`admin.mkUsers.status.${user.status}`)}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span>{formatLevelTitle(user.level, user.title, t)}</span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Editable Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.mkUsers.fields.name')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.mkUsers.fields.phoneNumber')}
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Referrer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.mkUsers.fields.referrer')}
                </label>
                <select
                  value={formData.referrerId}
                  onChange={(e) => setFormData({ ...formData, referrerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">{t('admin.mkUsers.noReferrer')}</option>
                  {users.filter(u => u.id !== user?.id).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.nickname || u.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* MK-Specific Fields */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Casino Unique ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.mkUsers.fields.casinoUniqueId')}
                  </label>
                  <input
                    type="text"
                    value={formData.casinoUniqueId}
                    onChange={(e) => setFormData({ ...formData, casinoUniqueId: e.target.value })}
                    placeholder="Enter casino unique ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* JK Reward Percentage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.mkUsers.fields.jkRewardPercentage')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.jkRewardPercentage}
                      onChange={(e) => setFormData({ ...formData, jkRewardPercentage: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="absolute right-3 top-2 text-gray-500">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Accounts Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium text-gray-900">{t('admin.users.modals.bankAccounts.title')}</h4>
              </div>

              {/* Existing Bank Accounts */}
              {formData.bankAccounts.map((account, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-medium text-gray-900">
                      {t('admin.users.modals.bankAccounts.accountNumber', { number: index + 1 })}
                      {account.isPrimary && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{t('admin.users.modals.bankAccounts.primary')}</span>}
                    </h5>
                    <button
                      type="button"
                      onClick={() => removeBankAccount(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{t('admin.users.modals.bankAccounts.bankName')}</label>
                      <input
                        type="text"
                        value={account.bankName || ''}
                        onChange={(e) => updateBankAccount(index, 'bankName', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{t('admin.users.modals.bankAccounts.branchName')}</label>
                      <input
                        type="text"
                        value={account.branchName || ''}
                        onChange={(e) => updateBankAccount(index, 'branchName', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{t('admin.users.modals.bankAccounts.accountType')}</label>
                      <select
                        value={account.accountType || ''}
                        onChange={(e) => updateBankAccount(index, 'accountType', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">{t('admin.users.modals.bankAccounts.selectType')}</option>
                        <option value="savings">{t('admin.users.modals.bankAccounts.savings')}</option>
                        <option value="checking">{t('admin.users.modals.bankAccounts.checking')}</option>
                        <option value="current">{t('admin.users.modals.bankAccounts.current')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{t('admin.users.modals.bankAccounts.accountNumberField')}</label>
                      <input
                        type="text"
                        value={account.accountNumber || ''}
                        onChange={(e) => updateBankAccount(index, 'accountNumber', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{t('admin.users.modals.bankAccounts.accountHolderName')}</label>
                      <input
                        type="text"
                        value={account.accountHolderName || ''}
                        onChange={(e) => updateBankAccount(index, 'accountHolderName', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={account.isPrimary || false}
                          onChange={(e) => updateBankAccount(index, 'isPrimary', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-xs font-medium text-gray-600">{t('admin.users.modals.bankAccounts.primaryAccount')}</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add New Bank Account */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-3">{t('admin.users.modals.bankAccounts.addNew')}</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t('admin.users.modals.bankAccounts.bankName')} *</label>
                    <input
                      type="text"
                      value={newBankAccount.bankName}
                      onChange={(e) => setNewBankAccount({ ...newBankAccount, bankName: e.target.value })}
                      placeholder={t('admin.users.modals.bankAccounts.bankNamePlaceholder')}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t('admin.users.modals.bankAccounts.branchName')}</label>
                    <input
                      type="text"
                      value={newBankAccount.branchName}
                      onChange={(e) => setNewBankAccount({ ...newBankAccount, branchName: e.target.value })}
                      placeholder={t('admin.users.modals.bankAccounts.branchNamePlaceholder')}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t('admin.users.modals.bankAccounts.accountType')}</label>
                    <select
                      value={newBankAccount.accountType}
                      onChange={(e) => setNewBankAccount({ ...newBankAccount, accountType: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">{t('admin.users.modals.bankAccounts.selectType')}</option>
                      <option value="savings">{t('admin.users.modals.bankAccounts.savings')}</option>
                      <option value="checking">{t('admin.users.modals.bankAccounts.checking')}</option>
                      <option value="current">{t('admin.users.modals.bankAccounts.current')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t('admin.users.modals.bankAccounts.accountNumberField')} *</label>
                    <input
                      type="text"
                      value={newBankAccount.accountNumber}
                      onChange={(e) => setNewBankAccount({ ...newBankAccount, accountNumber: e.target.value })}
                      placeholder={t('admin.users.modals.bankAccounts.accountNumberFieldPlaceholder')}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t('admin.users.modals.bankAccounts.accountHolderName')}</label>
                    <input
                      type="text"
                      value={newBankAccount.accountHolderName}
                      onChange={(e) => setNewBankAccount({ ...newBankAccount, accountHolderName: e.target.value })}
                      placeholder={t('admin.users.modals.bankAccounts.accountHolderNamePlaceholder')}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newBankAccount.isPrimary}
                        onChange={(e) => setNewBankAccount({ ...newBankAccount, isPrimary: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-xs font-medium text-gray-600">{t('admin.users.modals.bankAccounts.primaryAccount')}</span>
                    </label>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addBankAccount}
                  disabled={!newBankAccount.bankName || !newBankAccount.accountNumber}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {t('admin.users.modals.bankAccounts.addBankAccount')}
                </button>
              </div>
            </div>

            {/* Read-only Fields Display - Only JK-specific balances */}
            {user && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-4">{t('admin.users.modals.readOnlyInfo.title')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">{t('admin.mkUsers.tableHeaders.jkRewardBalance')}</label>
                    <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-700">
                      ¥{user.jkRewardBalance || '0'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">{t('admin.mkUsers.tableHeaders.jkWithdrawableBalance')}</label>
                    <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-700">
                      ¥{user.jkWithdrawableBalance || '0'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? t('forms.saving') : t('admin.mkUsers.modals.editMkUser.update')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}