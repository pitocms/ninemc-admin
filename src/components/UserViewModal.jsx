'use client';
import { useTranslation } from '@/hooks/useTranslation';
import { formatDateTime } from '@/lib/utils';

export default function UserViewModal({ isOpen, onClose, user, mode = 'full' }) {
  const { t } = useTranslation();

  if (!isOpen || !user) return null;

  const isSimpleMode = mode === 'simple';

  const getStatusBadge = (status) => {
    const badges = {
      general: 'bg-gray-100 text-gray-800',
      SP: 'bg-blue-100 text-blue-800',
      MK: 'bg-purple-100 text-purple-800',
      suspended: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getTitleColor = (title) => {
    const colors = {
      NA: 'text-gray-600',
      Jack: 'text-yellow-600',
      Queen: 'text-pink-600',
      King: 'text-red-600',
      Spade: 'text-black',
      Diamond: 'text-blue-600',
      Clover: 'text-green-600',
      Heart: 'text-red-600',
      Joker: 'text-purple-600'
    };
    return colors[title] || 'text-gray-600';
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {t('admin.users.modals.viewUser.title')}
            </h3>
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
            {/* Basic Information */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">{t('admin.users.modals.viewUser.basicInfo')}</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">{t('forms.name')}:</span>
                  <span className="ml-2 font-medium text-gray-900">{user.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">{t('forms.nickname')}:</span>
                  <span className="ml-2 font-medium text-gray-900">@{user.nickname}</span>
                </div>
                <div>
                  <span className="text-gray-500">{t('auth.email')}:</span>
                  <span className="ml-2 font-medium text-gray-900">{user.email}</span>
                </div>
                <div>
                  <span className="text-gray-500">{t('admin.users.tableHeaders.status')}:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(user.status || 'general')}`}>
                    {user.status ? t(`admin.users.status.${user.status}`) : '-'}
                  </span>
                </div>
                {!isSimpleMode && (
                  <>
                    <div>
                      <span className="text-gray-500">{t('forms.phoneNumber')}:</span>
                      <span className="ml-2 font-medium text-gray-900">{user.phoneNumber || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('admin.users.tableHeaders.levelTitle')}:</span>
                      <span className={`ml-2 font-medium ${getTitleColor(user.title || 'NA')}`}>
                        {user.title ? t(`admin.users.titles.${user.title}`) : '-'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {!isSimpleMode && (
              <>
                {/* Account Information */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">{t('admin.users.modals.viewUser.accountInfo')}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">{t('admin.users.tableHeaders.balance')}:</span>
                      <span className="ml-2 font-medium text-green-600">
                        {user.balance && !isNaN(Number(user.balance)) ? `¥${Number(user.balance).toLocaleString()}` : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('admin.users.tableHeaders.withdrawable')}:</span>
                      <span className="ml-2 font-medium text-blue-600">
                        {user.withdrawableBalance && !isNaN(Number(user.withdrawableBalance)) ? `¥${Number(user.withdrawableBalance).toLocaleString()}` : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('common.createdAt')}:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {user.createdAt ? formatDateTime(user.createdAt) : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('common.updatedAt')}:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {user.updatedAt ? formatDateTime(user.updatedAt) : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Referral Information */}
                {user.referrer && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">{t('admin.users.modals.viewUser.referralInfo')}</h4>
                    <div className="text-sm">
                      <div>
                        <span className="text-gray-500">{t('admin.users.tableHeaders.referrer')}:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {user.referrer.name} (@{user.referrer.nickname})
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}