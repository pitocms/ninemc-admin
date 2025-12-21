"use client";
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminWithdrawalsAPI, adminUsersAPI } from '@/lib/adminApi';
import { WITHDRAWAL_STATUS } from '@/constants';
import { exportToCsv } from '@/lib/csvUtils';
import { useTranslation } from '@/hooks/useTranslation';
import WithdrawalTable from '@/components/WithdrawalTable';
import toast from 'react-hot-toast';

function JKWithdrawalsHistoryForm() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const { t } = useTranslation();

  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState(''); // yyyy-mm-dd
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadWithdrawals();
    if (userId) {
      loadUserInfo();
    }
  }, [userId, page, statusFilter, startDate, endDate]);

  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        withdrawalType: 'junket', // Filter for junket withdrawals
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(userId && { userId })
      };
      
      const response = await adminWithdrawalsAPI.getAll(params);
      if (response.data.success) {
        setWithdrawals(response.data.withdrawals || []);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error loading withdrawals:', error);
      toast.error(t('withdrawals.messages.failedToLoadWithdrawals'));
    } finally {
      setLoading(false);
    }
  };

  const loadUserInfo = async () => {
    try {
      const response = await adminUsersAPI.getById(userId);
      if (response.data.success) {
        setUserInfo(response.data.user);
      }
    } catch (error) {
      // ignore
    }
  };

  const filteredByDate = useMemo(() => {
    if (!startDate && !endDate) return withdrawals;
    const startTs = startDate ? new Date(startDate).getTime() : null;
    const endTs = endDate ? new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1 : null;
    return (withdrawals || []).filter((w) => {
      const created = new Date(w.createdAt).getTime();
      if (startTs && created < startTs) return false;
      if (endTs && created > endTs) return false;
      return true;
    });
  }, [withdrawals, startDate, endDate]);

  const handleExportCSV = () => {
    const isUserSpecific = !!userId;

    const headers = isUserSpecific 
      ? [
          t('withdrawals.csvHeaders.date'),
          t('withdrawals.csvHeaders.amount'),
          t('withdrawals.csvHeaders.currency'),
          t('withdrawals.csvHeaders.destination'),
          t('withdrawals.csvHeaders.status'),
          t('withdrawals.csvHeaders.notes')
        ]
      : [
          t('withdrawals.csvHeaders.date'),
          t('withdrawals.csvHeaders.amount'),
          t('withdrawals.csvHeaders.currency'),
          t('withdrawals.csvHeaders.userName'),
          t('withdrawals.csvHeaders.userEmail'),
          t('withdrawals.csvHeaders.destination'),
          t('withdrawals.csvHeaders.status'),
          t('withdrawals.csvHeaders.notes')
        ];

    const rows = filteredByDate.map((w) => {
      const destination = w.currency === 'JPY' 
        ? (w.bankAccount 
            ? `${w.bankAccount.bankName} - ${w.bankAccount.accountNumber}`
            : '')
        : `${w.address} (${w.network})`;

      // For crypto withdrawals, show both amounts; for JPY, show single amount
      const amountDisplay = w.currency === 'JPY' 
        ? `${w.amount} ${w.currency}`
        : `${w.currencyAmount} ${w.currency} (${w.amount} JPY)`;

      const baseRow = [
        new Date(w.createdAt).toISOString(),
        amountDisplay,
        w.currency,
        destination,
        w.status,
        w.notes || ''
      ];

      if (isUserSpecific) {
        return baseRow;
      } else {
        return [
          ...baseRow.slice(0, 3),
          w.user?.name || '',
          w.user?.email || '',
          ...baseRow.slice(3)
        ];
      }
    });

    const filename = userId && userInfo ? `jk-withdrawals-${userInfo.nickname}` : 'jk-withdrawals-all';
    exportToCsv(headers, rows, filename);
  };

  const handleApprove = async (withdrawalId) => {
    try {
      await adminWithdrawalsAPI.approve(withdrawalId);
      toast.success(t('withdrawals.messages.withdrawalApproved'));
      loadWithdrawals();
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      toast.error(error.response?.data?.message || t('withdrawals.messages.failedToApprove'));
    }
  };

  const handleReject = async (withdrawalId, reason) => {
    try {
      await adminWithdrawalsAPI.reject(withdrawalId, reason);
      toast.success(t('withdrawals.messages.withdrawalRejected'));
      loadWithdrawals();
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      toast.error(error.response?.data?.message || t('withdrawals.messages.failedToReject'));
    }
  };

  const handleComplete = async (withdrawalId, notes) => {
    try {
      await adminWithdrawalsAPI.complete(withdrawalId, notes);
      toast.success(t('withdrawals.messages.withdrawalCompleted'));
      loadWithdrawals();
    } catch (error) {
      console.error('Error completing withdrawal:', error);
      toast.error(error.response?.data?.message || t('withdrawals.messages.failedToComplete'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('withdrawals.title')}</h1>
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
            {t('withdrawals.exportCSV')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('withdrawals.filters.status')}</label>
            <select
              value={statusFilter}
              onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">{t('withdrawals.filters.all')}</option>
              {WITHDRAWAL_STATUS.map((status) => (
                <option key={status} value={status}>{t(`withdrawals.status.${status.toLowerCase()}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('withdrawals.filters.startDate')}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('withdrawals.filters.endDate')}</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Withdrawals Table */}
      <WithdrawalTable
        withdrawals={filteredByDate}
        onApprove={handleApprove}
        onReject={handleReject}
        onComplete={handleComplete}
        loading={loading}
        showExportButton={false} // Export button is in header
      />

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="flex space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.previous')}
            </button>
            
            <span className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md">
              {page} / {pagination.totalPages}
            </span>
            
            <button
              onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
              disabled={page === pagination.totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.next')}
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}

export default function JKWithdrawalsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JKWithdrawalsHistoryForm />
    </Suspense>
  );
}