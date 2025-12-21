'use client';
import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { exportToCsv } from '@/lib/csvUtils';
import { formatCurrency } from '@/lib/decimalUtils';
import WithdrawalCompleteModal from './WithdrawalCompleteModal';

export default function WithdrawalTable({ 
  withdrawals = [], 
  onApprove, 
  onReject, 
  onComplete, 
  loading = false,
  showExportButton = true
}) {
  const { t } = useTranslation();
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800'
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleApprove = async (withdrawalId) => {
    try {
      await onApprove(withdrawalId);
    } catch (error) {
      console.error('Error approving withdrawal:', error);
    }
  };

  const handleReject = async (withdrawalId) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;

    try {
      await onReject(withdrawalId, reason);
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
    }
  };

  const handleComplete = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowCompleteModal(true);
  };

  const handleCompleteSubmit = async (notes) => {
    try {
      await onComplete(selectedWithdrawal.id, notes);
      setShowCompleteModal(false);
      setSelectedWithdrawal(null);
    } catch (error) {
      console.error('Error completing withdrawal:', error);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      t('withdrawals.csvHeaders.date'),
      t('withdrawals.csvHeaders.amount'),
      t('withdrawals.csvHeaders.currency'),
      t('withdrawals.csvHeaders.userName'),
      t('withdrawals.csvHeaders.userEmail'),
      t('withdrawals.csvHeaders.destination'),
      t('withdrawals.csvHeaders.status'),
      t('withdrawals.csvHeaders.notes')
    ];

    const rows = withdrawals.map((withdrawal) => {
      const destination = withdrawal.currency === 'JPY' 
        ? (withdrawal.bankAccount 
            ? `${withdrawal.bankAccount.bankName} - ${withdrawal.bankAccount.accountNumber}`
            : '')
        : `${withdrawal.address} (${withdrawal.network})`;

      return [
        new Date(withdrawal.createdAt).toISOString(),
        withdrawal.amount,
        withdrawal.currency,
        withdrawal.user?.name || '',
        withdrawal.user?.email || '',
        destination,
        withdrawal.status,
        withdrawal.notes || ''
      ];
    });

    const filename = 'withdrawal_history';
    exportToCsv(headers, rows, filename);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <>
      {/* Export Button */}
      {showExportButton && withdrawals.length > 0 && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t('withdrawals.exportCSV')}
          </button>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('withdrawals.tableHeaders.id')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('withdrawals.tableHeaders.user')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('withdrawals.tableHeaders.amount')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('withdrawals.tableHeaders.destination')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('withdrawals.tableHeaders.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('withdrawals.tableHeaders.created')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('withdrawals.tableHeaders.updated')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('withdrawals.tableHeaders.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                    {t('withdrawals.messages.noWithdrawalsFound')}
                  </td>
                </tr>
              ) : (
                withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{withdrawal.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {withdrawal.user?.name} ({withdrawal.user?.nickname})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {withdrawal.currency === 'JPY' ? (
                        // For JPY, show single amount (amount and currencyAmount are the same)
                        formatCurrency(withdrawal.amount, withdrawal.currency)
                      ) : (
                        // For crypto, show both amounts
                        <div>
                          <div>{formatCurrency(withdrawal.currencyAmount, withdrawal.currency)}</div>
                          <div className="text-xs text-gray-500">
                            ({formatCurrency(withdrawal.amount, 'JPY')})
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {withdrawal.currency === 'JPY' 
                        ? (withdrawal.bankAccount 
                            ? `${withdrawal.bankAccount.bankName} - ${withdrawal.bankAccount.accountNumber}`
                            : '-')
                        : `${withdrawal.address} (${withdrawal.network})`
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        statusColors[withdrawal.status] || 'bg-gray-100 text-gray-800'
                      }`}>
                        {t(`withdrawals.status.${withdrawal.status.toLowerCase()}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(withdrawal.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(withdrawal.lastUpdatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        {withdrawal.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(withdrawal.id)}
                              className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs hover:bg-green-200"
                            >
                              {t('withdrawals.actions.approve')}
                            </button>
                            <button
                              onClick={() => handleReject(withdrawal.id)}
                              className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200"
                            >
                              {t('withdrawals.actions.reject')}
                            </button>
                          </>
                        )}
                        {withdrawal.status === 'APPROVED' && (
                          <button
                            onClick={() => handleComplete(withdrawal)}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200"
                          >
                            {t('withdrawals.actions.complete')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complete Modal */}
      <WithdrawalCompleteModal
        isOpen={showCompleteModal}
        onClose={() => {
          setShowCompleteModal(false);
          setSelectedWithdrawal(null);
        }}
        onSubmit={handleCompleteSubmit}
        withdrawal={selectedWithdrawal}
        loading={false}
      />
    </>
  );
}