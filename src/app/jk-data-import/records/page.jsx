'use client';
import { useState, useEffect, Suspense } from 'react';
import { Search, Calendar, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminJunketImportAPI } from '@/lib/adminApi';
import { useTranslation } from '@/hooks/useTranslation';
import { ADMIN_ROUTES } from '@/constants';
import JunketRecordsTable from '@/components/JunketRecordsTable';
import toast from 'react-hot-toast';

function JkDataImportRecordsContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [records, setRecords] = useState([]);
  const [importHistory, setImportHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    // Check for month parameter from URL
    const monthParam = searchParams.get('month');
    if (monthParam) {
      setSelectedMonth(monthParam);
    }
    loadImportHistory();
  }, [searchParams]);

  useEffect(() => {
    loadRecords();
  }, [selectedMonth, searchKeyword, pagination.page]);

  const loadImportHistory = async () => {
    try {
      const response = await adminJunketImportAPI.getHistory();
      if (response.data && response.data.success) {
        setImportHistory(response.data.data || []);
        
        // Set default month to latest import or previous month (only if not set from URL)
        if (!selectedMonth && response.data.data?.length > 0) {
          setSelectedMonth(response.data.data[0].month);
        } else if (!selectedMonth) {
          // Set to previous month in YYYYMM format
          const now = new Date();
          const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const year = prevMonth.getFullYear();
          const month = String(prevMonth.getMonth() + 1).padStart(2, '0');
          setSelectedMonth(`${year}${month}`);
        }
      } else {
        console.error('Invalid response structure:', response.data);
        toast.error(t('admin.jkDataImport.messages.failedToLoadHistory'));
      }
    } catch (error) {
      console.error('Error loading import history:', error);
      toast.error(t('admin.jkDataImport.messages.failedToLoadHistory'));
    }
  };

  const loadRecords = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(selectedMonth && { month: selectedMonth }),
        ...(searchKeyword && { keyword: searchKeyword })
      };

      const response = await adminJunketImportAPI.getAll(params);
      if (response.data.success) {
        setRecords(response.data.data.records || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination.total,
          pages: response.data.data.pagination.pages
        }));
      }
    } catch (error) {
      console.error('Error loading records:', error);
      toast.error(t('admin.jkDataImport.messages.failedToLoadRecords'));
    } finally {
      setLoading(false);
    }
  };

  const getAvailableMonths = () => {
    const months = importHistory.map(imp => imp.month).filter(Boolean);
    const uniqueMonths = [...new Set(months)].sort().reverse();
    return uniqueMonths;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(ADMIN_ROUTES.JK_DATA_IMPORT)}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.jkDataImport.records.title')}</h1>
        </div>
        <button
          onClick={() => router.push(ADMIN_ROUTES.JK_DATA_IMPORT)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          {t('admin.jkDataImport.import.title')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              {t('admin.jkDataImport.filters.monthFilter')}
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">{t('admin.jkDataImport.filters.allMonths')}</option>
              {getAvailableMonths().map(month => {
                const year = month.substring(0, 4);
                const monthNum = month.substring(4, 6);
                return (
                  <option key={month} value={month}>
                    {year}-{monthNum}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="h-4 w-4 inline mr-1" />
              {t('admin.jkDataImport.filters.search')}
            </label>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              placeholder={t('admin.jkDataImport.filters.searchPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <JunketRecordsTable 
          records={records}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        />
      </div>
    </div>
  );
}

export default function JkDataImportRecordsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <JkDataImportRecordsContent />
    </Suspense>
  );
}
