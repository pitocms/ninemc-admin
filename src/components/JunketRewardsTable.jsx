'use client';
import { useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { ADMIN_ROUTES } from '@/constants';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function JunketRewardsTable({ 
  rewards = [], 
  loading = false 
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (rewardId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rewardId)) {
      newExpanded.delete(rewardId);
    } else {
      newExpanded.add(rewardId);
    }
    setExpandedRows(newExpanded);
  };

  const formatMonthDisplay = (monthStr) => {
    if (!monthStr || monthStr.length !== 6) return monthStr;
    const year = monthStr.substring(0, 4);
    const month = monthStr.substring(4, 6);
    return `${year}-${month}`;
  };

  const formatAmount = (amount) => {
    const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('ja-JP', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numeric || 0);
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {t(`admin.jkRewards.status.${status}`) || status}
      </span>
    );
  };

  const handleMonthClick = (month) => {
    router.push(ADMIN_ROUTES.JK_DATA_IMPORT);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.jkRewards.tableHeaders.month')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.jkRewards.tableHeaders.userName')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.jkRewards.tableHeaders.amount')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.jkRewards.tableHeaders.status')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.jkRewards.tableHeaders.detail')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rewards.map((reward) => {
              const isExpanded = expandedRows.has(reward.id);
              return (
                <Fragment key={reward.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {reward.import?.month ? (
                        <button
                          onClick={() => handleMonthClick(reward.import.month)}
                          className="text-indigo-600 hover:text-indigo-900 hover:underline"
                        >
                          {formatMonthDisplay(reward.import.month)}
                        </button>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {reward.user ? (
                        <div>
                          <div className="font-medium">{reward.user.name}</div>
                          {reward.user.nickname && (
                            <div className="text-xs text-gray-500">{reward.user.nickname}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatAmount(reward.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getStatusBadge(reward.status)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {reward.description && (
                        <button
                          onClick={() => toggleRow(reward.id)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 mr-1" />
                          ) : (
                            <ChevronRight className="h-4 w-4 mr-1" />
                          )}
                          {t('admin.jkRewards.detail')}
                        </button>
                      )}
                    </td>
                  </tr>
                  {isExpanded && reward.description && (
                    <tr>
                      <td colSpan="5" className="px-4 py-3 bg-gray-50">
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                          <strong>{t('admin.jkRewards.description')}:</strong> {reward.description}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {rewards.length === 0 && (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">
                  {t('admin.jkRewards.messages.noRewardsFound')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
