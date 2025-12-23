'use client';
import { useState, useEffect, useMemo, memo, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import Select from 'react-select';
import { formatDecimal } from '@/lib/decimalUtils';
import { useTranslation } from '@/hooks/useTranslation';
import { adminJunketImportAPI } from '@/lib/adminApi';

function JunketRecordsTable({ 
  records, 
  loading, 
  pagination, 
  onPageChange,
  onMatchedUserChange,
  onWinLossChange,
  allMatchedUsers = {},
  allWinLossChanges = {},
  isReadOnly = false
}) {
  const { t } = useTranslation();
  const [mkUsers, setMkUsers] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchInputs, setSearchInputs] = useState({});
  const [searchTimeouts, setSearchTimeouts] = useState({});
  const [loadingDropdowns, setLoadingDropdowns] = useState({});

  // Track if initial load has been done
  const initialLoadDone = useRef(false);
  
  // Load MK users only once on mount
  useEffect(() => {
    if (!initialLoadDone.current) {
      loadMkUsers();
      initialLoadDone.current = true;
    }
  }, []); // Empty dependency array - only run on mount
  
  // Update MK users list when records or matched users change (but don't reload from API)
  useEffect(() => {
    // Ensure all matched users from records are in the list
    const matchedUsersList = records
      .filter(r => r.user)
      .map(r => r.user)
      .filter((user, index, self) => 
        index === self.findIndex(u => String(u.id) === String(user.id))
      );
    
    // Also include users from allMatchedUsers
    const allMatchedUsersList = Object.values(allMatchedUsers)
      .filter(user => user)
      .filter((user, index, self) => 
        index === self.findIndex(u => String(u.id) === String(user.id))
      );
    
    const allUsers = [...matchedUsersList, ...allMatchedUsersList];
    const uniqueUsers = allUsers.filter((user, index, self) => 
      index === self.findIndex(u => String(u.id) === String(user.id))
    );
    
    if (uniqueUsers.length > 0) {
      setMkUsers(prev => {
        const existingIds = new Set(prev.map(u => String(u.id)));
        const newUsers = uniqueUsers.filter(u => !existingIds.has(String(u.id)));
        // Only update if there are actually new users to add
        if (newUsers.length === 0) return prev;
        return [...prev, ...newUsers];
      });
    }
  }, [records, allMatchedUsers]);

  const loadMkUsers = async (search = '', recordId = null) => {
    try {
      if (recordId) {
        setLoadingDropdowns(prev => ({ ...prev, [recordId]: true }));
      } else {
        setInitialLoading(true);
      }
      
      const params = {
        limit: 15,
        ...(search && search.trim() && { search: search.trim() })
      };
      const response = await adminJunketImportAPI.getMkUsers(params);
      if (response.data.success) {
        const newUsers = response.data.data || [];
        if (recordId) {
          // Merge with existing users to keep selected user available
          setMkUsers(prev => {
            const existingIds = new Set(prev.map(u => u.id));
            const newUniqueUsers = newUsers.filter(u => !existingIds.has(u.id));
            return [...prev, ...newUniqueUsers];
          });
        } else {
          setMkUsers(newUsers);
        }
      }
    } catch (error) {
      console.error('Error loading MK users:', error);
    } finally {
      if (recordId) {
        setLoadingDropdowns(prev => ({ ...prev, [recordId]: false }));
      } else {
        setInitialLoading(false);
      }
    }
  };

  const getUserDisplayName = (user) => {
    if (!user) return '';
    return user.name || user.nickname || user.email || '';
  };

  // Prepare options for react-select with better formatting
  const mkUserOptions = useMemo(() => {
    const options = mkUsers.map((user) => {
      const displayName = getUserDisplayName(user);
      const casinoId = user.casinoUniqueId || '';
      return {
        value: user.id, // Keep original ID, getOptionValue will convert to string
        label: displayName,
        casinoId: casinoId,
        fullLabel: casinoId ? `${displayName} • ${casinoId}` : displayName,
        user: user
      };
    });
    return [{ value: '', label: t('admin.jkDataImport.records.notMatched'), fullLabel: t('admin.jkDataImport.records.notMatched'), user: null }, ...options];
  }, [mkUsers, t]);

  // Get the selected option for a record
  const getSelectedOption = (record) => {
    // Use allMatchedUsers from parent if available, otherwise fall back to record.user
    const matchedUser = allMatchedUsers[record.id] !== undefined ? allMatchedUsers[record.id] : record.user;
    
    if (!matchedUser) {
      return mkUserOptions[0]; // "Not Matched" option
    }
    
    // Convert IDs to strings for comparison (handles BigInt)
    const matchedUserId = String(matchedUser.id);
    const found = mkUserOptions.find(opt => String(opt.value) === matchedUserId);
    if (found) {
      return found;
    }
    // If user not found in options, create a temporary option for it
    const displayName = getUserDisplayName(matchedUser);
    const casinoId = matchedUser.casinoUniqueId || '';
    // Ensure value is consistent (use the actual ID, react-select will convert via getOptionValue)
    return {
      value: matchedUser.id,
      label: displayName,
      casinoId: casinoId,
      fullLabel: casinoId ? `${displayName} • ${casinoId}` : displayName,
      user: matchedUser
    };
  };

  const handleInputChange = (inputValue, { action }, recordId) => {
    if (action === 'input-change') {
      setSearchInputs(prev => ({
        ...prev,
        [recordId]: inputValue
      }));
      
      // Clear existing timeout for this record
      if (searchTimeouts[recordId]) {
        clearTimeout(searchTimeouts[recordId]);
      }
      
      // Only search backend if input has at least 2 characters
      if (inputValue.trim().length >= 2) {
        // Debounce the search - wait 300ms after user stops typing
        const timeoutId = setTimeout(() => {
          loadMkUsers(inputValue, recordId);
        }, 300);
        
        setSearchTimeouts(prev => ({
          ...prev,
          [recordId]: timeoutId
        }));
      } else if (inputValue.trim().length === 0) {
        // If input is cleared, reload initial 15 users
        const timeoutId = setTimeout(() => {
          loadMkUsers('', recordId);
        }, 300);
        
        setSearchTimeouts(prev => ({
          ...prev,
          [recordId]: timeoutId
        }));
      }
      // If input is 1 character, do nothing (wait for more input)
    }
  };

  // Custom styles for react-select - more professional
  const customStyles = (isMatched) => ({
    control: (provided, state) => ({
      ...provided,
      borderColor: isMatched ? '#10b981' : '#ef4444',
      backgroundColor: isMatched ? '#d1fae5' : '#fee2e2',
      cursor: 'pointer',
      minHeight: '42px',
      fontSize: '14px',
      fontWeight: 500,
      boxShadow: state.isFocused ? (isMatched ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : '0 0 0 2px rgba(239, 68, 68, 0.2)') : 'none',
      '&:hover': {
        borderColor: isMatched ? '#10b981' : '#ef4444',
      }
    }),
    singleValue: (provided) => ({
      ...provided,
      color: isMatched ? '#059669' : '#dc2626',
      fontWeight: 600,
      fontSize: '15px',
      lineHeight: '1.5',
      display: 'flex',
      alignItems: 'center'
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '6px 12px'
    }),
    input: (provided) => ({
      ...provided,
      cursor: 'text',
      fontSize: '14px',
      color: '#1f2937'
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af',
      fontSize: '14px'
    }),
    indicatorSeparator: () => ({
      display: 'none'
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      cursor: 'pointer',
      color: isMatched ? '#059669' : '#dc2626',
      padding: '8px'
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      marginTop: '4px'
    }),
    menuList: (provided) => ({
      ...provided,
      padding: '4px',
      maxHeight: '300px'
    }),
    option: (provided, state) => ({
      ...provided,
      fontSize: '14px',
      padding: '10px 12px',
      cursor: 'pointer',
      backgroundColor: state.isSelected 
        ? '#3b82f6' 
        : state.isFocused 
        ? '#f3f4f6' 
        : 'white',
      color: state.isSelected ? 'white' : '#1f2937',
      fontWeight: state.isSelected ? 600 : 400,
      '&:active': {
        backgroundColor: state.isSelected ? '#3b82f6' : '#e5e7eb'
      }
    }),
    noOptionsMessage: (provided) => ({
      ...provided,
      fontSize: '14px',
      color: '#6b7280',
      padding: '12px'
    })
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t('admin.jkDataImport.records.tableHeaders.customerNumber')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t('admin.jkDataImport.records.tableHeaders.customerName')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t('admin.jkDataImport.records.tableHeaders.matchedUser')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t('admin.jkDataImport.records.tableHeaders.winLoss')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t('admin.jkDataImport.records.tableHeaders.importDate')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((record) => {
              const selectedOption = getSelectedOption(record);
              const matchedUser = allMatchedUsers[record.id] !== undefined ? allMatchedUsers[record.id] : record.user;
              const isMatched = !!matchedUser;
              return (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900 font-mono">{record.customerNumber}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{record.customerEnglishName}</td>
                <td className="px-4 py-3 text-sm">
                  {initialLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  ) : (
                    <Select
                      key={`select-${record.id}-${matchedUser ? String(matchedUser.id) : 'none'}`}
                      value={selectedOption}
                      options={mkUserOptions}
                      isDisabled={isReadOnly}
                      isSearchable={true}
                      isClearable={false}
                      isLoading={loadingDropdowns[record.id] || false}
                      styles={customStyles(isMatched)}
                      placeholder={t('admin.jkDataImport.records.notMatched')}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      inputValue={searchInputs[record.id] || ''}
                      onInputChange={(inputValue, action) => handleInputChange(inputValue, action, record.id)}
                      formatOptionLabel={({ label, casinoId }, { context }) => {
                        if (context === 'value') {
                          // Display format for selected value (in the control)
                          return (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{label}</span>
                              {casinoId && (
                                <span className="text-xs opacity-75">({casinoId})</span>
                              )}
                            </div>
                          );
                        }
                        // Display format for dropdown options
                        return (
                          <div className="py-1">
                            <div className="font-semibold text-gray-900 text-base">{label}</div>
                            {casinoId && (
                              <div className="text-xs text-gray-500 mt-1 font-mono">ID: {casinoId}</div>
                            )}
                          </div>
                        );
                      }}
                      getOptionLabel={(option) => option.fullLabel || option.label}
                      getOptionValue={(option) => String(option.value)}
                      onChange={(selected) => {
                        // Call parent handler to update matched user
                        if (!selected || selected.value === '') {
                          // "Not Matched" selected
                          if (onMatchedUserChange) {
                            onMatchedUserChange(record.id, null);
                          }
                        } else if (selected.user) {
                          // Ensure selected user is in the options list FIRST
                          setMkUsers(prev => {
                            const exists = prev.find(u => String(u.id) === String(selected.user.id));
                            if (!exists) {
                              return [...prev, selected.user];
                            }
                            return prev;
                          });
                          
                          // Then update matched user via parent
                          if (onMatchedUserChange) {
                            onMatchedUserChange(record.id, selected.user);
                          }
                        }
                      }}
                    />
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <input
                    type="number"
                    step="0.01"
                    value={allWinLossChanges[record.id] !== undefined 
                      ? (allWinLossChanges[record.id] === '' ? '' : allWinLossChanges[record.id])
                      : formatDecimal(record.winLoss, '0')}
                    onChange={(e) => {
                      const value = e.target.value;
                      onWinLossChange && onWinLossChange(record.id, value);
                    }}
                    onBlur={(e) => {
                      // Ensure value is formatted on blur
                      const value = e.target.value;
                      if (value === '' || value === '-') {
                        onWinLossChange && onWinLossChange(record.id, '0');
                      }
                    }}
                    disabled={isReadOnly}
                    className={`w-full px-2 py-1 border rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                      (() => {
                        const currentValue = allWinLossChanges[record.id] !== undefined 
                          ? allWinLossChanges[record.id] 
                          : record.winLoss;
                        const numValue = parseFloat(currentValue);
                        return isNaN(numValue) || numValue >= 0
                          ? 'text-green-600 border-green-300 bg-green-50' 
                          : 'text-red-600 border-red-300 bg-red-50';
                      })()
                    }`}
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(record.createdAt).toLocaleDateString()}
                </td>
              </tr>
              );
            })}
            {records.length === 0 && (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">
                  {t('admin.jkDataImport.records.noRecords')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.previous')}
            </button>
            <button
              onClick={() => onPageChange(Math.min(pagination.pages, pagination.page + 1))}
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Memoize component to prevent unnecessary re-renders
export default memo(JunketRecordsTable);
