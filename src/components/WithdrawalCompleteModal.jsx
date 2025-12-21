'use client';
import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { formatCurrency } from '@/lib/decimalUtils';

export default function WithdrawalCompleteModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  withdrawal, 
  loading = false 
}) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState(withdrawal?.notes || '');

  const handleSubmit = () => {
    onSubmit(notes);
  };

  const handleClose = () => {
    setNotes(withdrawal?.notes || '');
    onClose();
  };

  if (!isOpen || !withdrawal) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t('withdrawals.completeWithdrawal')}
          </h3>
          
          {/* Withdrawal Details */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>{t('withdrawals.amount')}:</strong> {
                withdrawal.currency === 'JPY' ? (
                  formatCurrency(withdrawal.amount, withdrawal.currency)
                ) : (
                  <span>
                    {formatCurrency(withdrawal.currencyAmount, withdrawal.currency)}
                    <span className="text-xs text-gray-500 ml-2">
                      ({formatCurrency(withdrawal.amount, 'JPY')})
                    </span>
                  </span>
                )
              }
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>{t('withdrawals.user')}:</strong> {withdrawal.user?.name} ({withdrawal.user?.nickname})
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <strong>{t('withdrawals.destination')}:</strong> {
                withdrawal.currency === 'JPY' 
                  ? `${withdrawal.bankAccount?.bankName} - ${withdrawal.bankAccount?.accountNumber}`
                  : `${withdrawal.address} (${withdrawal.network})`
              }
            </p>
          </div>
          
          {/* Notes Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {t('withdrawals.completionNotes')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 !text-gray-900 placeholder-gray-500"
              placeholder="Add any notes about the completion..."
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? t('withdrawals.completing') : t('withdrawals.completeWithdrawal')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}