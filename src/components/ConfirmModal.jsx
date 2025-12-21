'use client';
import { useTranslation } from '@/hooks/useTranslation';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  action, 
  translationKey 
}) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t(`${translationKey}.modals.confirm.title`)}
          </h3>
          <p className="text-gray-600 mb-4">
            {t(`${translationKey}.modals.confirm.${action}Message`)}
          </p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              {t(`${translationKey}.modals.confirm.cancel`)}
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              {t(`${translationKey}.modals.confirm.confirm`)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}