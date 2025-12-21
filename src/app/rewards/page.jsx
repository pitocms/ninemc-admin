"use client";
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminRewardsAPI, adminUsersAPI } from '@/lib/adminApi';
import { REWARD_STATUS, REWARD_TYPES } from '@/constants';
import { exportToCsv } from '@/lib/csvUtils';
import { useTranslation } from '@/hooks/useTranslation';
import UserViewModal from '@/components/UserViewModal';

function RewardsHistoryForm() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const { t } = useTranslation();

  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Modal states
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserViewModal, setShowUserViewModal] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState(''); // yyyy-mm-dd
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadRewards();
    if (userId) {
      loadUserInfo();
    } else {
      setUserInfo(null);
    }
  }, [userId, page, typeFilter, statusFilter]);

  const loadRewards = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 }; // MLM Rewards: all types (JUNKET is now in separate table)
      if (userId) params.userId = userId;
      if (typeFilter !== 'all') {
        params.rewardType = typeFilter; // Single reward type filter
      }
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await adminRewardsAPI.getAll(params);
      if (response.data.success) {
        setRewards(response.data.rewards || []);
        setPagination(response.data.pagination || null);
      }
    } catch (error) {
      console.error('Failed to load rewards', error);
      alert(t('admin.rewards.messages.failedToLoadRewards'));
    } finally {
      setLoading(false);
    }
  };

  const loadUserInfo = async () => {
    try {
      const response = await adminUsersAPI.getById(userId);
      if (response.data.success) {
        setUserInfo(response.data.data);
      }
    } catch (error) {
      // ignore
    }
  };

  const openUserViewModal = (user) => {
    setSelectedUser(user);
    setShowUserViewModal(true);
  };

  const formatCurrency = (amount) => {
    const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(numeric || 0);
  };

  const filteredByDate = useMemo(() => {
    if (!startDate && !endDate) return rewards;
    const startTs = startDate ? new Date(startDate).getTime() : null;
    const endTs = endDate ? new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1 : null;
    return (rewards || []).filter((r) => {
      const created = new Date(r.createdAt).getTime();
      if (startTs && created < startTs) return false;
      if (endTs && created > endTs) return false;
      return true;
    });
  }, [rewards, startDate, endDate]);

  const handleExportCSV = () => {
    const isUserSpecific = !!userId;

    const headers = isUserSpecific 
      ? [
          t('admin.rewards.csvHeaders.date'),
          t('admin.rewards.csvHeaders.amount'),
          t('admin.rewards.csvHeaders.type'),
          t('admin.rewards.csvHeaders.sourceUserName'),
          t('admin.rewards.csvHeaders.sourceUserEmail'),
          t('admin.rewards.csvHeaders.description'),
          t('admin.rewards.csvHeaders.status'),
          t('admin.rewards.csvHeaders.period')
        ]
      : [
          t('admin.rewards.csvHeaders.date'),
          t('admin.rewards.csvHeaders.amount'),
          t('admin.rewards.csvHeaders.type'),
          t('admin.rewards.csvHeaders.userName'),
          t('admin.rewards.csvHeaders.userEmail'),
          t('admin.rewards.csvHeaders.sourceUserName'),
          t('admin.rewards.csvHeaders.sourceUserEmail'),
          t('admin.rewards.csvHeaders.description'),
          t('admin.rewards.csvHeaders.status'),
          t('admin.rewards.csvHeaders.period')
        ];

    const rows = filteredByDate.map((r) => {
      const baseRow = [
        new Date(r.createdAt).toISOString(),
        typeof r.amount === 'string' ? r.amount : (r.amount ?? 0),
        r.rewardType,
      ];

      if (isUserSpecific) {
        return [
          ...baseRow,
          r.sourceUser?.name || '',
          r.sourceUser?.email || '',
          r.description || '',
          r.status,
          r.periodStart ? new Date(r.periodStart).toISOString().slice(0, 7) : ''
        ];
      } else {
        return [
          ...baseRow,
          r.user?.name || '',
          r.user?.email || '',
          r.sourceUser?.name || '',
          r.sourceUser?.email || '',
          r.description || '',
          r.status,
          r.periodStart ? new Date(r.periodStart).toISOString().slice(0, 7) : ''
        ];
      }
    });

    const filename = userId && userInfo ? `reward_history_${userInfo.nickname}` : 'reward_history_all';
    exportToCsv(headers, rows, filename);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="ml-4 text-gray-600">{t('admin.rewards.messages.loadingRewards')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.rewards.title')}</h1>
          {userInfo && (
            <div className="mt-2 text-md text-gray-500">
              <span className="font-semibold text-gray-700">{userInfo.name}</span>
              <span className="mx-2 text-gray-400">•</span>
              <span className="text-gray-500">@{userInfo.nickname}</span>
              <span className="mx-2 text-gray-400">•</span>
              <span className="text-gray-500">{userInfo.email}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            {t('admin.rewards.exportCSV')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.rewards.filters.type')}</label>
            <select
              value={typeFilter}
              onChange={(e) => { setPage(1); setTypeFilter(e.target.value); }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">{t('admin.rewards.filters.all')}</option>
              {REWARD_TYPES.map((type) => (
                <option key={type} value={type}>{t('admin.rewards.types.' + type)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.rewards.filters.status')}</label>
            <select
              value={statusFilter}
              onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">{t('admin.rewards.filters.all')}</option>
              {REWARD_STATUS.map((s) => (
                <option key={s} value={s}>{t('admin.rewards.status.' + s)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.rewards.filters.startDate')}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.rewards.filters.endDate')}</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Rewards Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.rewards.tableHeaders.date')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.rewards.tableHeaders.user')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.rewards.tableHeaders.sourceUser')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.rewards.tableHeaders.amount')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.rewards.tableHeaders.type')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.rewards.tableHeaders.description')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.rewards.tableHeaders.status')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredByDate.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">{t('admin.rewards.messages.noRewardsFound')}</td>
                </tr>
              ) : (
                filteredByDate.map((reward) => (
                  <tr key={reward.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(reward.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reward.user ? (
                        <button
                          onClick={() => openUserViewModal(reward.user)}
                          className="text-indigo-600 hover:text-indigo-900 hover:underline"
                        >
                          {reward.user.name}
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reward.sourceUser ? (
                        <button
                          onClick={() => openUserViewModal(reward.sourceUser)}
                          className="text-indigo-600 hover:text-indigo-900 hover:underline"
                        >
                          {reward.sourceUser.name}
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(reward.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {t('admin.rewards.types.' + reward.rewardType) || reward.rewardType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reward.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        reward.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {t('admin.rewards.status.' + reward.status) || reward.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.previous')}
          </button>
          <span className="text-sm text-gray-700">Page {page} of {pagination.pages}</span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.next')}
          </button>
        </div>
      )}

      {/* User View Modal */}
      <UserViewModal
        isOpen={showUserViewModal}
        onClose={() => setShowUserViewModal(false)}
        user={selectedUser}
        mode="full"
      />
    </div>
  );
}

export default function RewardsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RewardsHistoryForm />
    </Suspense>
  );
}