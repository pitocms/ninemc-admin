'use client';
import { useTranslation } from '@/hooks/useTranslation';
import { formatDate } from '@/lib/dateUtils';

export default function InquiryDetailPage({ 
  inquiry, 
  isAdmin,
  onBack,
  onUpdateStatus,
  onSendReply,
  replyMessage,
  setReplyMessage
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

  if (!inquiry) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-500">Loading inquiry details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={onBack}
          className="text-indigo-600 hover:text-indigo-800 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('forms.back')}
        </button>
        {isAdmin && (
          <div className="flex space-x-2">
            {inquiry.status !== 'in_progress' && (
              <button
                onClick={() => onUpdateStatus('in_progress')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                {t('pages.inquiries.markInProgress')}
              </button>
            )}
            {inquiry.status !== 'closed' && (
              <button
                onClick={() => onUpdateStatus('closed')}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                {t('pages.inquiries.closeInquiry')}
              </button>
            )}
            {inquiry.status === 'closed' && (
              <button
                onClick={() => onUpdateStatus('open')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                {t('pages.inquiries.reopenInquiry')}
              </button>
            )}
          </div>
        )}
        {!isAdmin && inquiry.status !== 'closed' && (
          <div className="flex space-x-2">
            <button
              onClick={() => onUpdateStatus('closed')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              {t('pages.inquiries.closeInquiry')}
            </button>
          </div>
        )}
        {!isAdmin && inquiry.status === 'closed' && (
          <div className="flex space-x-2">
            <button
              onClick={() => onUpdateStatus('open')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              {t('pages.inquiries.reopenInquiry')}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="border-b pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{inquiry.subject}</h1>
              {isAdmin && (
                <p className="text-sm text-gray-500 mt-1">
                  {t('forms.name')}: {inquiry.user?.name} ({inquiry.user?.email})
                </p>
              )}
              <p className="text-sm text-gray-500">
                {t('pages.inquiries.createdAt')}: {formatDate(inquiry.createdAt)}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(inquiry.status)}`}>
              {t(`inquiryStatus.${inquiry.status}`)}
            </span>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-800">{t('pages.inquiries.messages')}</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {inquiry.messages && inquiry.messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 rounded-lg ${msg.isAdmin ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-gray-800">
                    {msg.isAdmin ? 'Admin' : (isAdmin ? 'User' : 'You')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(msg.createdAt)}
                  </span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{msg.message}</p>
              </div>
            ))}
          </div>
        </div>

        {inquiry.status !== 'closed' && (
          <form onSubmit={onSendReply} className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('pages.inquiries.replyToInquiry')}
            </label>
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder={t('pages.inquiries.writeYourMessage')}
              rows="4"
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              required
            />
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {t('pages.inquiries.sendMessage')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}