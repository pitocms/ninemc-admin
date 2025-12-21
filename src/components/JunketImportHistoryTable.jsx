'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { ADMIN_ROUTES, JUNKET_DATA_IMPORT_STATUS } from '@/constants';
import { adminJunketRewardsAPI, adminJunketImportAPI } from '@/lib/adminApi';
import toast from 'react-hot-toast';

export default function JunketImportHistoryTable({ imports, loading, onRefresh }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [approving, setApproving] = useState({});
  const [calculating, setCalculating] = useState({});

  const formatMonthDisplay = (monthStr) => {
    if (!monthStr || monthStr.length !== 6) return monthStr;
    const year = monthStr.substring(0, 4);
    const month = monthStr.substring(4, 6);
    return `${year}-${month}`;
  };

  const handleMonthClick = (month) => {
    router.push(`${ADMIN_ROUTES.JK_DATA_IMPORT_RECORDS}?month=${month}`);
  };

  const handleApprove = async (importId, event) => {
    event.stopPropagation(); // Prevent any row click events
    
    if (!confirm(t('admin.jkDataImport.history.confirmApprove'))) {
      return;
    }

    try {
      setApproving(prev => ({ ...prev, [importId]: true }));
      const response = await adminJunketRewardsAPI.approveImportRewards(importId);
      
      if (response.data.success) {
        toast.success(t('admin.jkDataImport.history.approveSuccess'));
        // Wait a bit for the database transaction to commit, then refresh
        if (onRefresh) {
          setTimeout(() => {
            onRefresh();
          }, 500);
        }
      } else {
        toast.error(response.data.message || t('admin.jkDataImport.history.approveError'));
      }
    } catch (error) {
      console.error('Error approving junket rewards:', error);
      toast.error(error.response?.data?.message || t('admin.jkDataImport.history.approveError'));
    } finally {
      setApproving(prev => ({ ...prev, [importId]: false }));
    }
  };

  const hasPendingRewards = (imp) => {
    // Check if there are pending rewards (status: PENDING)
    return imp.junketRewards && imp.junketRewards.length > 0;
  };

  const hasRewards = (imp) => {
    // Check if any rewards exist for this import
    const count = imp._count?.junketRewards || 0;
    return count > 0;
  };

  const handleCalculateRewards = async (importId, event) => {
    event.stopPropagation(); // Prevent any row click events
    
    if (!confirm(t('admin.jkDataImport.history.confirmCalculate'))) {
      return;
    }

    try {
      setCalculating(prev => ({ ...prev, [importId]: true }));
      const response = await adminJunketImportAPI.calculateRewards(importId);
      
      if (response.data.success) {
        const { data } = response.data;
        if (data && data.totalCalculations !== undefined && data.totalRewardAmount !== undefined) {
          // Show detailed success message with calculation results
          let message = t('admin.jkDataImport.history.calculateSuccess');
          message = message.replace('{{totalCalculations}}', data.totalCalculations);
          message = message.replace('{{totalRewardAmount}}', data.totalRewardAmount.toFixed(0));
          toast.success(message);
        } else {
          // Fallback to generic success message
          toast.success(t('admin.jkDataImport.history.calculateSuccess').replace('{{totalCalculations}}', '0').replace('{{totalRewardAmount}}', '0'));
        }
        // Wait a bit for the database transaction to commit, then refresh
        if (onRefresh) {
          setTimeout(() => {
            onRefresh();
          }, 500);
        }
      } else {
        toast.error(response.data.message || t('admin.jkDataImport.history.calculateError'));
      }
    } catch (error) {
      console.error('Error calculating junket rewards:', error);
      toast.error(error.response?.data?.message || t('admin.jkDataImport.history.calculateError'));
    } finally {
      setCalculating(prev => ({ ...prev, [importId]: false }));
    }
  };

  const safeFileName = (fileName) => {
    if (!fileName) return '-';
    try {
      // Try to decode if it's URL encoded or handle special characters
      try {
        // First try decodeURIComponent for URL-encoded strings
        const decoded = decodeURIComponent(fileName);
        return decoded;
      } catch {
        // If decodeURIComponent fails, try decodeURI (more lenient)
        try {
          return decodeURI(fileName);
        } catch {
          // If both fail, return as-is (might already be correct)
          return fileName;
        }
      }
    } catch {
      return fileName;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {t('admin.jkDataImport.history.title')}
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t('admin.jkDataImport.history.tableHeaders.fileName')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t('admin.jkDataImport.history.tableHeaders.month')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t('admin.jkDataImport.history.tableHeaders.totalRecords')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t('admin.jkDataImport.history.tableHeaders.success')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t('admin.jkDataImport.history.tableHeaders.failed')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t('admin.jkDataImport.history.tableHeaders.createdAt')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t('admin.jkDataImport.history.tableHeaders.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {imports.map((imp) => (
              <tr key={imp.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{safeFileName(imp.fileName)}</td>
                <td className="px-4 py-3 text-sm">
                  <button
                    onClick={() => handleMonthClick(imp.month)}
                    className="text-indigo-600 hover:text-indigo-900 hover:underline"
                  >
                    {formatMonthDisplay(imp.month)}
                  </button>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{imp.totalRecords}</td>
                <td className="px-4 py-3 text-sm text-green-600 font-medium">{imp.successRecords}</td>
                <td className="px-4 py-3 text-sm text-red-600 font-medium">{imp.failedRecords}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(imp.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  <div className="flex gap-2 items-center">
                    {imp.status === JUNKET_DATA_IMPORT_STATUS.IMPORTED && (
                      <button
                        onClick={(e) => handleCalculateRewards(imp.id, e)}
                        disabled={calculating[imp.id]}
                        className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-xs hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={t('admin.jkDataImport.history.calculateTooltip')}
                      >
                        {calculating[imp.id] ? t('admin.jkDataImport.history.calculating') : t('admin.jkDataImport.history.calculate')}
                      </button>
                    )}
                    {imp.status === JUNKET_DATA_IMPORT_STATUS.CALCULATED && hasPendingRewards(imp) && (
                      <button
                        onClick={(e) => handleApprove(imp.id, e)}
                        disabled={approving[imp.id]}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {approving[imp.id] ? t('admin.jkDataImport.history.approving') : t('admin.jkDataImport.history.approve')}
                      </button>
                    )}
                    {imp.status === JUNKET_DATA_IMPORT_STATUS.APPROVED && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {t('admin.jkDataImport.history.approved')}
                      </span>
                    )}
                    {imp.status === JUNKET_DATA_IMPORT_STATUS.CALCULATED && !hasPendingRewards(imp) && !hasRewards(imp) && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                        {t('admin.jkDataImport.history.noRewards')}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {imports.length === 0 && (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-sm text-gray-500">
                  {t('admin.jkDataImport.history.noHistory')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
