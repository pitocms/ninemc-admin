'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { ADMIN_ROUTES, JUNKET_DATA_IMPORT_STATUS } from '@/constants';
import { adminJunketRewardsAPI, adminJunketImportAPI } from '@/lib/adminApi';
import toast from 'react-hot-toast';

// Helper to get changes from localStorage (supports both importId and month for backward compatibility)
function getChangesFromLocalStorage(importId) {
  if (typeof window === 'undefined') return { matchedUsers: {}, winLossChanges: {} };
  
  // Convert importId to string to match localStorage key format
  const importIdStr = importId ? String(importId) : null;
  
  // Use importId ONLY (not month) to ensure each import has its own unique changes
  // This prevents different imports with the same month from sharing changes
  const matchedUsersKey = importIdStr ? `jkImportMatchedUsers_${importIdStr}` : null;
  const winLossChangesKey = importIdStr ? `jkImportWinLossChanges_${importIdStr}` : null;
  
  const matchedUsers = {};
  let winLossChanges = {};
  
  try {
    // Get matched users using importId only
    if (matchedUsersKey) {
      const matchedUsersStr = window.localStorage.getItem(matchedUsersKey);
      if (matchedUsersStr) {
        const parsed = JSON.parse(matchedUsersStr);
        Object.entries(parsed).forEach(([recordId, userData]) => {
          if (userData && typeof userData === 'object' && userData.id) {
            matchedUsers[recordId] = userData.id; // Store just the userId
          } else if (userData) {
            matchedUsers[recordId] = userData; // Already an ID
          } else {
            matchedUsers[recordId] = null;
          }
        });
      }
    }
    
    // Get winLoss changes using importId only
    if (winLossChangesKey) {
      const winLossChangesStr = window.localStorage.getItem(winLossChangesKey);
      if (winLossChangesStr) {
        winLossChanges = JSON.parse(winLossChangesStr);
      }
    }
  } catch (e) {
    console.error('Error reading from localStorage:', e);
  }
  
  return { matchedUsers, winLossChanges };
}

// Helper to clear changes from localStorage (supports both importId and month for backward compatibility)
function clearChangesFromLocalStorage(importId, month) {
  if (typeof window === 'undefined') return;
  
  // Try importId first (preferred), then fallback to month for backward compatibility
  const matchedUsersKey = importId ? `jkImportMatchedUsers_${importId}` : `jkImportMatchedUsers_${month}`;
  const winLossChangesKey = importId ? `jkImportWinLossChanges_${importId}` : `jkImportWinLossChanges_${month}`;
  const changeCountKey = importId ? `jkImportLastChanges_${importId}` : `jkImportLastChanges_${month}`;
  
  try {
    window.localStorage.removeItem(matchedUsersKey);
    window.localStorage.removeItem(winLossChangesKey);
    window.localStorage.removeItem(changeCountKey);
  } catch (e) {
    console.error('Error clearing localStorage:', e);
  }
}

export default function JunketImportHistoryTable({ imports, loading, onRefresh }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [approving, setApproving] = useState({});
  const [cancelling, setCancelling] = useState({});
  const [confirming, setConfirming] = useState({});
  const [calculating, setCalculating] = useState({});
  const [changeCounts, setChangeCounts] = useState({});
  
  // Function to calculate change count for a specific import
  const getChangeCount = (importId) => {
    if (typeof window === 'undefined' || !importId) return 0;
    const importIdKey = `jkImportLastChanges_${importId}`;
    const stored = window.localStorage.getItem(importIdKey);
    if (stored) {
      const count = parseInt(stored, 10);
      return Number.isNaN(count) ? 0 : count;
    }
    return 0;
  };
  
  // Update change counts when imports change or component mounts
  useEffect(() => {
    const counts = {};
    imports.forEach(imp => {
      if (imp.status === JUNKET_DATA_IMPORT_STATUS.CONFIRMED) {
        counts[imp.id] = getChangeCount(imp.id);
      }
    });
    setChangeCounts(counts);
  }, [imports]);
  
  // Listen for storage events (when localStorage changes from another tab/page)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleStorageChange = (e) => {
      // Check if the change is related to our imports
      if (e.key && e.key.startsWith('jkImportLastChanges_')) {
        const importId = e.key.replace('jkImportLastChanges_', '');
        const count = getChangeCount(importId);
        setChangeCounts(prev => ({ ...prev, [importId]: count }));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (for same-tab updates)
    const handleCustomStorageChange = () => {
      const counts = {};
      imports.forEach(imp => {
        if (imp.status === JUNKET_DATA_IMPORT_STATUS.CONFIRMED) {
          counts[imp.id] = getChangeCount(imp.id);
        }
      });
      setChangeCounts(counts);
    };
    
    // Listen for focus event to refresh when user returns to tab
    window.addEventListener('focus', handleCustomStorageChange);
    
    // Custom event listener for same-tab localStorage updates
    window.addEventListener('localStorageChange', handleCustomStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleCustomStorageChange);
      window.removeEventListener('localStorageChange', handleCustomStorageChange);
    };
  }, [imports]);

  const formatMonthDisplay = (monthStr) => {
    if (!monthStr || monthStr.length !== 6) return monthStr;
    const year = monthStr.substring(0, 4);
    const month = monthStr.substring(4, 6);
    return `${year}-${month}`;
  };

  const handleMonthClick = (month) => {
    router.push(`${ADMIN_ROUTES.JK_DATA_IMPORT_RECORDS}?month=${month}`);
  };

  const handleImportClick = (importId) => {
    router.push(`${ADMIN_ROUTES.JK_DATA_IMPORT_RECORDS}?importId=${importId}`);
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

  const handleConfirm = async (importId, month, event) => {
    event.stopPropagation();

    // Get changes from localStorage (use importId, fallback to month for backward compatibility)
      const { matchedUsers, winLossChanges } = getChangesFromLocalStorage(importId);
    const changeCount = Object.keys(matchedUsers).length + Object.keys(winLossChanges).length;


    const confirmMessage = changeCount > 0
      ? `Confirm this import? (${changeCount} changes will be applied)`
      : 'Confirm this import?';

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setConfirming(prev => ({ ...prev, [importId]: true }));
      
      // Bulk update records (will also update status from confirmed to imported)
      const updates = [];
      
      // Add matched user changes
      Object.entries(matchedUsers).forEach(([recordId, userId]) => {
        updates.push({
          id: recordId,
          userId: userId || null
        });
      });
      
      // Add win/loss changes
      Object.entries(winLossChanges).forEach(([recordId, winLoss]) => {
        const existingUpdate = updates.find(u => u.id === recordId);
        if (existingUpdate) {
          existingUpdate.winLoss = winLoss;
        } else {
          updates.push({
            id: recordId,
            winLoss: winLoss
          });
        }
      });
      
      console.log('Updates array to send:', updates);
      
      // If no updates, still call the API to update status (but with empty array, backend should handle this)
      if (updates.length === 0) {
        console.warn('No updates found in localStorage. Still calling API to update status.');
      }
      
      // Call bulk-update API with importId to update records and status
      const response = await adminJunketImportAPI.bulkUpdateRecords(updates, importId);

      if (response.data.success) {
        let message = 'Import confirmed successfully.';
        if (updates.length > 0) {
          message = `Applied ${updates.length} change(s) and confirmed import.`;
        }
        toast.success(message, { duration: 6000 });

        // Clear changes from localStorage after successful confirm - clear both importId and month keys
        clearChangesFromLocalStorage(importId, month);
        console.log('LocalStorage cleared after successful confirm');

        if (onRefresh) {
          setTimeout(() => {
            onRefresh();
          }, 500);
        }
      } else {
        toast.error(response.data.message || 'Failed to confirm import');
      }
    } catch (error) {
      console.error('Error confirming junket import:', error);
      toast.error(error.response?.data?.message || 'Failed to confirm import');
    } finally {
      setConfirming(prev => ({ ...prev, [importId]: false }));
    }
  };

  const handleCancel = async (importId, event) => {
    event.stopPropagation();

    if (!confirm(t('admin.jkDataImport.history.confirmCancel', 'Are you sure you want to cancel and delete this draft import?'))) {
      return;
    }

    try {
      setCancelling(prev => ({ ...prev, [importId]: true }));
      const response = await adminJunketImportAPI.cancelImport(importId);

      if (response.data?.success) {
        toast.success(t('admin.jkDataImport.history.cancelSuccess', 'Draft import deleted successfully'));
        if (onRefresh) {
          setTimeout(() => {
            onRefresh();
          }, 500);
        }
      } else {
        toast.error(response.data?.message || t('admin.jkDataImport.history.cancelError', 'Failed to delete draft import'));
      }
    } catch (error) {
      console.error('Error cancelling junket import:', error);
      toast.error(error.response?.data?.message || t('admin.jkDataImport.history.cancelError', 'Failed to delete draft import'));
    } finally {
      setCancelling(prev => ({ ...prev, [importId]: false }));
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
                    onClick={() => handleImportClick(imp.id)}
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
                    {imp.status === JUNKET_DATA_IMPORT_STATUS.CONFIRMED && (
                      <>
                        <button
                          onClick={(e) => handleConfirm(imp.id, imp.month, e)}
                          disabled={confirming[imp.id] || cancelling[imp.id]}
                          className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-xs hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {confirming[imp.id]
                            ? t('admin.jkDataImport.history.confirming', 'Confirming...')
                            : (changeCounts[imp.id] || 0) > 0
                              ? t('admin.jkDataImport.history.confirm', `Confirm (${changeCounts[imp.id] || 0})`)
                              : t('admin.jkDataImport.history.confirm', 'Confirm')}
                        </button>
                        <button
                          onClick={(e) => handleCancel(imp.id, e)}
                          disabled={cancelling[imp.id] || confirming[imp.id]}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cancelling[imp.id]
                            ? t('admin.jkDataImport.history.cancelling', 'Deleting...')
                            : t('admin.jkDataImport.history.cancel', 'Delete')}
                        </button>
                      </>
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
