'use client';
import { useState, useEffect, Suspense } from 'react';
import { adminJunketRewardsAPI, adminJunketImportAPI } from '@/lib/adminApi';
import { useTranslation } from '@/hooks/useTranslation';
import { REWARD_STATUS } from '@/constants';
import { exportToCsv } from '@/lib/csvUtils';
import JunketRewardsTable from '@/components/JunketRewardsTable';
import toast from 'react-hot-toast';

function JKRewardsForm() {
  const { t } = useTranslation();
  
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [importHistory, setImportHistory] = useState([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    loadImportHistory();
  }, []);

  useEffect(() => {
    loadRewards();
  }, [page, statusFilter, monthFilter, searchKeyword]);

  const loadImportHistory = async () => {
    try {
      const response = await adminJunketImportAPI.getHistory();
      if (response.data && response.data.success) {
        setImportHistory(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading import history:', error);
    }
  };

  const loadRewards = async () => {
    try {
      setLoading(true);
      const params = { 
        page, 
        limit: 20 
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (monthFilter !== 'all') {
        params.month = monthFilter;
      }
      
      if (searchKeyword.trim()) {
        params.search = searchKeyword.trim();
      }
      
      const response = await adminJunketRewardsAPI.getAll(params);
      if (response.data.success) {
        setRewards(response.data.rewards || []);
        setPagination(response.data.pagination || null);
      }
    } catch (error) {
      console.error('Error loading junket rewards:', error);
      toast.error(t('admin.jkRewards.messages.failedToLoadRewards'));
    } finally {
      setLoading(false);
    }
  };

  const getAvailableMonths = () => {
    const months = importHistory.map(imp => imp.month).filter(Boolean);
    const uniqueMonths = [...new Set(months)].sort().reverse();
    return uniqueMonths;
  };

  const formatMonthDisplay = (monthStr) => {
    if (!monthStr || monthStr.length !== 6) return monthStr;
    const year = monthStr.substring(0, 4);
    const month = monthStr.substring(4, 6);
    return `${year}-${month}`;
  };

  const handleExportCSV = async () => {
    try {
      // Fetch all rewards matching current filters (not just current page)
      const params = { 
        page: 1, 
        limit: 10000 // Large limit to get all records
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (monthFilter !== 'all') {
        params.month = monthFilter;
      }
      
      if (searchKeyword.trim()) {
        params.search = searchKeyword.trim();
      }
      
      const response = await adminJunketRewardsAPI.getAll(params);
      if (!response.data.success) {
        toast.error(t('admin.jkRewards.messages.failedToLoadRewards'));
        return;
      }

      const allRewards = response.data.rewards || [];

      const headers = [
        t('admin.jkRewards.csvHeaders.month'),
        t('admin.jkRewards.csvHeaders.userName'),
        t('admin.jkRewards.csvHeaders.userNickname'),
        t('admin.jkRewards.csvHeaders.amount'),
        t('admin.jkRewards.csvHeaders.status'),
        t('admin.jkRewards.csvHeaders.description'),
        t('admin.jkRewards.csvHeaders.createdAt'),
        t('admin.jkRewards.csvHeaders.approvedAt')
      ];

      const rows = allRewards.map((r) => {
        const month = r.import?.month ? formatMonthDisplay(r.import.month) : (r.month ? formatMonthDisplay(r.month) : '');
        return [
          month,
          r.user?.name || '',
          r.user?.nickname || '',
          Number(r.amount || 0),
          r.status || '',
          r.description || '',
          r.createdAt ? new Date(r.createdAt).toISOString() : '',
          r.approvedAt ? new Date(r.approvedAt).toISOString() : ''
        ];
      });

      const filename = `junket_rewards_${new Date().toISOString().split('T')[0]}`;
      exportToCsv(headers, rows, filename);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error(t('admin.jkRewards.messages.exportError') || 'Failed to export CSV');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('admin.jkRewards.title')}
        </h1>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          {t('admin.jkRewards.exportCSV')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.jkRewards.filters.status')}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => { 
                setPage(1); 
                setStatusFilter(e.target.value); 
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">{t('admin.jkRewards.filters.all')}</option>
              {REWARD_STATUS.map((s) => (
                <option key={s} value={s}>
                  {t(`admin.jkRewards.status.${s}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.jkRewards.filters.month')}
            </label>
            <select
              value={monthFilter}
              onChange={(e) => { 
                setPage(1); 
                setMonthFilter(e.target.value); 
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">{t('admin.jkRewards.filters.allMonths')}</option>
              {getAvailableMonths().map(month => (
                <option key={month} value={month}>
                  {formatMonthDisplay(month)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.jkRewards.filters.search')}
            </label>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => { 
                setPage(1); 
                setSearchKeyword(e.target.value); 
              }}
              placeholder={t('admin.jkRewards.filters.searchPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Rewards Table */}
      <JunketRewardsTable rewards={rewards} loading={loading} />

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
          <span className="text-sm text-gray-700">
            Page {page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.next')}
          </button>
        </div>
      )}
    </div>
  );
}

export default function JKRewardsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JKRewardsForm />
    </Suspense>
  );
}