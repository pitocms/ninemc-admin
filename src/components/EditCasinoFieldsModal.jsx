'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

export default function EditCasinoFieldsModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  user,
  translationKey 
}) {
  const { t } = useTranslation();
  const [jkRewardPercentage, setJkRewardPercentage] = useState(0);
  const [casinoUniqueId, setCasinoUniqueId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setJkRewardPercentage(user.jkRewardPercentage || 0);
      setCasinoUniqueId(user.casinoUniqueId || '');
    }
  }, [user, isOpen]);

  const validateFields = () => {
    const percentage = parseFloat(jkRewardPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      setError(t(`${translationKey}.modals.editCasinoFields.percentageError`));
      return false;
    }
    if (!casinoUniqueId || casinoUniqueId.trim() === '') {
      setError(t(`${translationKey}.modals.editCasinoFields.casinoIdRequired`));
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = () => {
    if (!validateFields()) {
      return;
    }
    onSubmit({
      jkRewardPercentage: parseFloat(jkRewardPercentage),
      casinoUniqueId: casinoUniqueId.trim()
    });
    resetFields();
  };

  const resetFields = () => {
    setJkRewardPercentage(0);
    setCasinoUniqueId('');
    setError('');
  };

  const handleClose = () => {
    resetFields();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t(`${translationKey}.modals.editCasinoFields.title`)}
          </h3>
          
          {/* JK Reward Percentage */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t(`${translationKey}.fields.jkRewardPercentage`)} (0-100)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={jkRewardPercentage}
              onChange={(e) => {
                setJkRewardPercentage(e.target.value);
                setError('');
              }}
              placeholder="0"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
              }`}
            />
          </div>

          {/* Casino Unique ID */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t(`${translationKey}.fields.casinoUniqueId`)} *
            </label>
            <input
              type="text"
              value={casinoUniqueId}
              onChange={(e) => {
                setCasinoUniqueId(e.target.value);
                setError('');
              }}
              placeholder={t(`${translationKey}.modals.editCasinoFields.casinoIdPlaceholder`)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
              }`}
            />
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              {t(`${translationKey}.modals.editCasinoFields.cancel`)}
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              {t(`${translationKey}.modals.editCasinoFields.update`)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
