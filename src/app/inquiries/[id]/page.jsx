'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminInquiriesAPI } from '@/lib/adminApi';
import { toast } from 'react-hot-toast';
import { useTranslation } from '@/hooks/useTranslation';
import InquiryDetailPage from '@/components/InquiryDetailPage';

export default function AdminInquiryDetailRoutePage() {
  const { id } = useParams();
  const router = useRouter();
  const { t, isLoading: translationsLoading } = useTranslation();

  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    if (id) {
      fetchInquiryDetails();
    }
  }, [id]);

  const fetchInquiryDetails = async () => {
    try {
      setLoading(true);
      const response = await adminInquiriesAPI.getById(id);
      setInquiry(response.data.inquiry);
    } catch (error) {
      console.error('Error fetching inquiry details:', error);
      toast.error(t('messages.error.general'));
      router.push('/inquiries'); // Redirect back to list on error
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!inquiry || !replyMessage.trim()) return;

    try {
      await adminInquiriesAPI.addMessage(inquiry.id, replyMessage);
      toast.success(t('messages.success.messageSent'));
      setReplyMessage('');
      fetchInquiryDetails(); // Refresh details
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error(error.response?.data?.message || t('messages.error.messageSendError'));
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!inquiry) return;

    try {
      await adminInquiriesAPI.updateStatus(inquiry.id, status);
      toast.success(t('messages.success.inquiryUpdated'));
      fetchInquiryDetails(); // Refresh details
    } catch (error) {
      console.error('Error updating inquiry status:', error);
      toast.error(error.response?.data?.message || t('messages.error.inquiryUpdateError'));
    }
  };

  if (translationsLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!inquiry) {
    return <div className="container mx-auto p-6 text-center text-gray-500">{t('pages.inquiries.noInquiryFound')}</div>;
  }

  return (
    <InquiryDetailPage
      inquiry={inquiry}
      isAdmin={true}
      onBack={() => router.push('/inquiries')}
      onUpdateStatus={handleUpdateStatus}
      onSendReply={handleSendReply}
      replyMessage={replyMessage}
      setReplyMessage={setReplyMessage}
    />
  );
}