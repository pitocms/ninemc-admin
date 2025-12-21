'use client';
import { useTranslation } from '@/hooks/useTranslation';
import { formatDateTime } from '@/lib/utils';

export default function MembershipDetailModal({ isOpen, onClose, request, onApprove, onReject, actionLoading }) {
  const { t } = useTranslation();

  if (!isOpen || !request) return null;

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      general: 'text-gray-600',
      SP: 'text-blue-600',
      MK: 'text-purple-600'
    };
    return colors[status] || 'text-gray-600';
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">{t('admin.membership.modal.title')}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* User Info */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{t('admin.membership.modal.userInfo')}</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">{t('forms.name')}:</span>
                  <span className="ml-2 font-medium text-gray-900">{request.user.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">{t('forms.nickname')}:</span>
                  <span className="ml-2 font-medium text-gray-900">@{request.user.nickname}</span>
                </div>
                <div>
                  <span className="text-gray-500">{t('auth.email')}:</span>
                  <span className="ml-2 font-medium text-gray-900">{request.user.email}</span>
                </div>
                <div>
                  <span className="text-gray-500">{t('membership.currentStatus')}:</span>
                  <span className={`ml-2 font-medium ${getStatusColor(request.currentStatus)}`}>
                    {t(`admin.membership.userStatus.${request.currentStatus}`)}
                  </span>
                </div>
              </div>
            </div>

            {/* Upgrade Info */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{t('admin.membership.modal.upgradeRequest')}</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">{t('admin.membership.modal.from')}:</span>
                  <span className={`ml-2 font-medium ${getStatusColor(request.currentStatus)}`}>
                    {t(`admin.membership.userStatus.${request.currentStatus}`)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">{t('admin.membership.modal.to')}:</span>
                  <span className={`ml-2 font-medium ${getStatusColor(request.targetStatus)}`}>
                    {t(`admin.membership.userStatus.${request.targetStatus}`)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">{t('admin.membership.modal.requested')}:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {request.requestedAt && request.requestedAt !== null && request.requestedAt !== '{}' ? formatDateTime(request.requestedAt) : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">{t('admin.membership.modal.processed')}:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {request.processedAt && request.processedAt !== null && request.processedAt !== '{}' ? formatDateTime(request.processedAt) : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">{t('admin.membership.tableHeaders.status')}:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                    {t(`admin.membership.status.${request.status}`)}
                  </span>
                </div>
              </div>
            </div>

            {/* Advisor/Closer Info */}
            {(request.advisor || request.closer) && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{t('admin.membership.modal.assignedPersonnel')}</h4>
                <div className="space-y-2 text-sm">
                  {request.advisor && (
                    <div>
                      <span className="text-gray-500">{t('membership.advisor')}:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {request.advisor.name} (@{request.advisor.nickname})
                      </span>
                    </div>
                  )}
                  {request.closer && (
                    <div>
                      <span className="text-gray-500">{t('membership.closer')}:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {request.closer.name} (@{request.closer.nickname})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            {request.status === 'pending' && (
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => onApprove(request.id)}
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? t('common.processing') : t('admin.membership.modal.approveRequest')}
                </button>
                <button
                  onClick={() => onReject(request.id)}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? t('common.processing') : t('admin.membership.modal.rejectRequest')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}