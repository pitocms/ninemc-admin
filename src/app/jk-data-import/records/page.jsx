'use client';
import { useState, useEffect, Suspense, useCallback, useMemo, useRef } from 'react';
import { Search, Calendar, ArrowLeft, Save } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminJunketImportAPI } from '@/lib/adminApi';
import { useTranslation } from '@/hooks/useTranslation';
import { ADMIN_ROUTES, JUNKET_DATA_IMPORT_STATUS } from '@/constants';
import JunketRecordsTable from '@/components/JunketRecordsTable';
import toast from 'react-hot-toast';

function JkDataImportRecordsContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [records, setRecords] = useState([]);
  const [importHistory, setImportHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImportId, setSelectedImportId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Persistent state for all changes across pagination
  const [allMatchedUsers, setAllMatchedUsers] = useState({}); // { recordId: user }
  const [allWinLossChanges, setAllWinLossChanges] = useState({}); // { recordId: winLoss }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Load changes from localStorage on mount and when importId changes
  // ONLY use importId - never use month for localStorage keys
  useEffect(() => {
    if (!selectedImportId || typeof window === 'undefined') return;
    
    const matchedUsersKey = `jkImportMatchedUsers_${selectedImportId}`;
    const winLossChangesKey = `jkImportWinLossChanges_${selectedImportId}`;
    
    try {
      const matchedUsersStr = window.localStorage.getItem(matchedUsersKey);
      const winLossChangesStr = window.localStorage.getItem(winLossChangesKey);
      
      if (matchedUsersStr) {
        const parsed = JSON.parse(matchedUsersStr);
        // Convert stored user data back to user objects
        const userObjects = {};
        Object.entries(parsed).forEach(([recordId, userData]) => {
          if (userData && typeof userData === 'object') {
            userObjects[recordId] = userData; // Already a user object
          } else if (userData) {
            // If it's just an ID, we'll need to fetch it later or reconstruct from records
            // For now, store as is and it will be merged with actual records
            userObjects[recordId] = { id: userData };
          }
        });
        setAllMatchedUsers(userObjects);
      }
      if (winLossChangesStr) {
        const parsed = JSON.parse(winLossChangesStr);
        setAllWinLossChanges(parsed);
      }
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  }, [selectedImportId]);
  
  // Save changes to localStorage whenever they change
  // ONLY use importId - never use month for localStorage keys
  useEffect(() => {
    if (!selectedImportId || typeof window === 'undefined') return;
    
    const matchedUsersKey = `jkImportMatchedUsers_${selectedImportId}`;
    const winLossChangesKey = `jkImportWinLossChanges_${selectedImportId}`;
    const changeCountKey = `jkImportLastChanges_${selectedImportId}`;
    
    try {
      const changeCount = Object.keys(allMatchedUsers).length + Object.keys(allWinLossChanges).length;
      
      if (changeCount > 0) {
        // Store matched users (store minimal user info: id, name, nickname, email, casinoUniqueId)
        const matchedUsersToStore = {};
        Object.entries(allMatchedUsers).forEach(([recordId, user]) => {
          if (user) {
            matchedUsersToStore[recordId] = {
              id: user.id,
              name: user.name,
              nickname: user.nickname,
              email: user.email,
              casinoUniqueId: user.casinoUniqueId
            };
          } else {
            matchedUsersToStore[recordId] = null;
          }
        });
        window.localStorage.setItem(matchedUsersKey, JSON.stringify(matchedUsersToStore));
        
        window.localStorage.setItem(winLossChangesKey, JSON.stringify(allWinLossChanges));
        window.localStorage.setItem(changeCountKey, String(changeCount));
        
        // Dispatch custom event to notify other components (like history table)
        window.dispatchEvent(new Event('localStorageChange'));
      } else {
        // Clear if no changes
        window.localStorage.removeItem(matchedUsersKey);
        window.localStorage.removeItem(winLossChangesKey);
        window.localStorage.removeItem(changeCountKey);
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new Event('localStorageChange'));
      }
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }, [allMatchedUsers, allWinLossChanges, selectedImportId]);
  
  // Use refs to access current values without triggering re-renders
  const allMatchedUsersRef = useRef(allMatchedUsers);
  const allWinLossChangesRef = useRef(allWinLossChanges);
  
  // Keep refs in sync with state
  useEffect(() => {
    allMatchedUsersRef.current = allMatchedUsers;
  }, [allMatchedUsers]);
  
  useEffect(() => {
    allWinLossChangesRef.current = allWinLossChanges;
  }, [allWinLossChanges]);

  const loadImportHistory = async () => {
    try {
      const response = await adminJunketImportAPI.getHistory();
      if (response.data && response.data.success) {
        setImportHistory(response.data.data || []);
        
        // Check for importId parameter from URL (preferred)
        const importIdParam = searchParams.get('importId');
        const monthParam = searchParams.get('month');
        
        if (importIdParam) {
          // If importId is provided, use it and also set the month for the dropdown
          setSelectedImportId(importIdParam);
          const importRecord = response.data.data.find(imp => imp.id.toString() === importIdParam);
          if (importRecord) {
            setSelectedMonth(importRecord.month);
          }
        } else if (monthParam) {
          // If only month is provided, use month filtering
          setSelectedMonth(monthParam);
          setSelectedImportId(''); // Clear importId to use month filtering
        } else if (response.data.data?.length > 0) {
          // Set default to latest import
          setSelectedImportId(response.data.data[0].id.toString());
          setSelectedMonth(response.data.data[0].month);
        }
      } else {
        console.error('Invalid response structure:', response.data);
        toast.error(t('admin.jkDataImport.messages.failedToLoadHistory'));
      }
    } catch (error) {
      console.error('Error loading import history:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          t('admin.jkDataImport.messages.failedToLoadHistory');
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    loadImportHistory();
  }, [searchParams]);

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        // Use importId if available, otherwise use month
        ...(selectedImportId && { importId: selectedImportId }),
        ...(!selectedImportId && selectedMonth && { month: selectedMonth }),
        ...(searchKeyword && { keyword: searchKeyword })
      };

      const response = await adminJunketImportAPI.getAll(params);
      if (response.data.success) {
        const newRecords = response.data.data.records || [];
        
        // Merge current page records with saved changes - use refs to access current values
        setRecords(prevRecords => {
          // Access current values from refs (won't trigger re-renders)
          const currentMatchedUsers = allMatchedUsersRef.current;
          const currentWinLossChanges = allWinLossChangesRef.current;
          
          // Merge records with current unsaved changes
          const mergedRecords = newRecords.map(record => {
            const matchedUser = currentMatchedUsers[record.id];
            const winLoss = currentWinLossChanges[record.id] !== undefined 
              ? currentWinLossChanges[record.id] 
              : record.winLoss;
            
            return {
              ...record,
              user: matchedUser !== undefined ? matchedUser : record.user,
              winLoss: winLoss
            };
          });
          
          // Only update if records actually changed
          const recordsChanged = mergedRecords.length !== prevRecords.length ||
            mergedRecords.some((r, i) => {
              const prev = prevRecords[i];
              return !prev || r.id !== prev.id || r.user?.id !== prev.user?.id || r.winLoss !== prev.winLoss;
            });
          
          return recordsChanged ? mergedRecords : prevRecords;
        });
        
        setPagination(prev => {
          const newPagination = {
            ...prev,
            total: response.data.data.pagination.total,
            pages: response.data.data.pagination.pages
          };
          // Only update if pagination changed
          return prev.total !== newPagination.total || prev.pages !== newPagination.pages 
            ? newPagination 
            : prev;
        });
      }
    } catch (error) {
      console.error('Error loading records:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          t('admin.jkDataImport.messages.failedToLoadRecords');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedImportId, selectedMonth, searchKeyword, pagination.page, pagination.limit, t]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Handle matched user change - memoized to prevent unnecessary re-renders
  const handleMatchedUserChange = useCallback((recordId, user) => {
    setAllMatchedUsers(prev => {
      // Only update if value actually changed
      if (prev[recordId]?.id === user?.id) {
        return prev;
      }
      return {
        ...prev,
        [recordId]: user
      };
    });
    setHasUnsavedChanges(true);
    
    // Update current records immediately for UI - only update the specific record
    setRecords(prev => {
      const recordIndex = prev.findIndex(r => String(r.id) === String(recordId));
      if (recordIndex === -1) return prev;
      
      const updatedRecord = { ...prev[recordIndex], user: user || null };
      const newRecords = [...prev];
      newRecords[recordIndex] = updatedRecord;
      return newRecords;
    });
  }, []);

  // Debounce timer for win/loss changes
  const winLossDebounceTimers = useMemo(() => ({}), []);
  
  // Handle win/loss change - with debouncing for smoother UX
  const handleWinLossChange = useCallback((recordId, winLoss) => {
    // Clear existing timer for this record
    if (winLossDebounceTimers[recordId]) {
      clearTimeout(winLossDebounceTimers[recordId]);
    }
    
    // Update UI immediately (optimistic update)
    setRecords(prev => {
      const recordIndex = prev.findIndex(r => String(r.id) === String(recordId));
      if (recordIndex === -1) return prev;
      
      const updatedRecord = { ...prev[recordIndex], winLoss: winLoss === '' ? '' : (parseFloat(winLoss) || 0) };
      const newRecords = [...prev];
      newRecords[recordIndex] = updatedRecord;
      return newRecords;
    });
    
    // Debounce the persistent state update
    winLossDebounceTimers[recordId] = setTimeout(() => {
      setAllWinLossChanges(prev => {
        // Only update if value actually changed
        const currentValue = prev[recordId];
        const newValue = winLoss === '' ? undefined : winLoss;
        if (currentValue === newValue) {
          return prev;
        }
        const updated = { ...prev };
        if (newValue === undefined) {
          delete updated[recordId];
        } else {
          updated[recordId] = newValue;
        }
        return updated;
      });
      setHasUnsavedChanges(true);
    }, 300); // 300ms debounce
  }, [winLossDebounceTimers]);

  // Submit all changes
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Prepare updates array
      const updates = [];
      
      // Add matched user changes
      Object.entries(allMatchedUsers).forEach(([recordId, user]) => {
        updates.push({
          id: recordId,
          userId: user ? user.id : null
        });
      });
      
      // Add win/loss changes
      Object.entries(allWinLossChanges).forEach(([recordId, winLoss]) => {
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
      
      if (updates.length === 0) {
        toast.error('No changes to save');
        return;
      }
      
      const response = await adminJunketImportAPI.bulkUpdateRecords(updates);
      
      if (response.data.success) {
        toast.success(`Successfully saved ${updates.length} change(s)`);
        // Changes are already persisted in localStorage via useEffect
        // Clear saved changes from state (but keep in localStorage for confirm button)
        setAllMatchedUsers({});
        setAllWinLossChanges({});
        setHasUnsavedChanges(false);
        // Reload records to get updated data
        loadRecords();
      } else {
        toast.error(response.data.message || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Error submitting changes:', error);
      toast.error(error.response?.data?.message || 'Failed to save changes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableImports = () => {
    return importHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const getAvailableYearMonths = () => {
    // Get unique year-month combinations, sorted by most recent first
    const yearMonths = new Set();
    const monthMap = new Map();
    
    importHistory.forEach(imp => {
      if (imp.month) {
        yearMonths.add(imp.month);
        // Store the most recent import for each month
        if (!monthMap.has(imp.month)) {
          monthMap.set(imp.month, imp);
        } else {
          const existing = monthMap.get(imp.month);
          if (new Date(imp.createdAt) > new Date(existing.createdAt)) {
            monthMap.set(imp.month, imp);
          }
        }
      }
    });
    
    // Convert to array and sort by month descending (YYYYMM format)
    return Array.from(yearMonths).sort((a, b) => b.localeCompare(a));
  };

  const getCurrentImport = () => {
    if (selectedImportId) {
      // If importId is selected, find that specific import
      return importHistory.find(imp => imp.id.toString() === selectedImportId) || null;
    } else if (selectedMonth) {
      // If month is selected, get the most recent import for that month
      const importsForMonth = importHistory
        .filter(imp => imp.month === selectedMonth)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return importsForMonth.length > 0 ? importsForMonth[0] : null;
    }
    return null;
  };

  const currentImport = getCurrentImport();
  const isApprovedImport = currentImport?.status === JUNKET_DATA_IMPORT_STATUS.APPROVED;
  const isEditableImport = !currentImport || currentImport.status === JUNKET_DATA_IMPORT_STATUS.IMPORTED || currentImport.status === JUNKET_DATA_IMPORT_STATUS.CONFIRMED;

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
        <div className="flex gap-2">
          {/* Save Changes button commented out
          {hasUnsavedChanges && isEditableImport && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Saving...' : `Save Changes (${Object.keys(allMatchedUsers).length + Object.keys(allWinLossChanges).length})`}
            </button>
          )}
          */}
          <button
            onClick={() => router.push(ADMIN_ROUTES.JK_DATA_IMPORT)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            {t('admin.jkDataImport.import.title')}
          </button>
        </div>
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
                const newMonth = e.target.value;
                setSelectedMonth(newMonth);
                // When user selects a month from dropdown, clear importId to use month filtering
                setSelectedImportId('');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">{t('admin.jkDataImport.filters.allMonths')}</option>
              {getAvailableYearMonths().map(month => {
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
          onMatchedUserChange={handleMatchedUserChange}
          onWinLossChange={handleWinLossChange}
          allMatchedUsers={allMatchedUsers}
          allWinLossChanges={allWinLossChanges}
          isReadOnly={isApprovedImport || !isEditableImport}
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
