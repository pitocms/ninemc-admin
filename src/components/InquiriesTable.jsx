'use client';
import { useTranslation } from '@/hooks/useTranslation';
import { formatDate } from '@/lib/dateUtils';

export default function InquiriesTable({ 
  inquiries, 
  isAdmin,
  onViewDetails 
}) {
  const { t } = useTranslation();

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLastUpdatedDate = (inquiry) => {
    if (!inquiry.messages || inquiry.messages.length === 0) {
      return inquiry.createdAt;
    }
    // Get the last message's createdAt date
    const lastMessage = inquiry.messages[inquiry.messages.length - 1];
    return lastMessage.createdAt;
  };

  if (inquiries.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        {t('pages.inquiries.noInquiries')}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('pages.inquiries.subject')}
            </th>
            {isAdmin && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('forms.name')}
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('pages.inquiries.status')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('pages.inquiries.createdAt')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('pages.inquiries.lastUpdated')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('common.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {inquiries.map((inquiry) => (
            <tr key={inquiry.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 min-w-[200px] max-w-[300px]">
                <div className="text-sm font-medium text-gray-900 truncate" title={inquiry.subject}>
                  {inquiry.subject}
                </div>
                <div className="text-sm text-gray-500">
                  {inquiry.messages?.length || 0} {t('pages.inquiries.messages').toLowerCase()}
                </div>
              </td>
              {isAdmin && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{inquiry.user?.name}</div>
                  <div className="text-sm text-gray-500">{inquiry.user?.email}</div>
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(inquiry.status)}`}>
                  {t(`inquiryStatus.${inquiry.status}`)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(inquiry.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(getLastUpdatedDate(inquiry))}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => onViewDetails(inquiry.id)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  {t('pages.inquiries.viewDetails')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}