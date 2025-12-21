'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminInquiriesAPI, adminUsersAPI } from '@/lib/adminApi';
import { toast } from 'react-hot-toast';
import { useTranslation } from '@/hooks/useTranslation';
import InquiriesTable from '@/components/InquiriesTable';
import InquiryModal from '@/components/InquiryModal';

export default function AdminInquiriesPage() {
  const { t, isLoading: translationsLoading } = useTranslation();
  const router = useRouter();
  
  const [inquiries, setInquiries] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchInquiries();
    fetchUsers();
  }, [filterStatus]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus && filterStatus !== 'all') {
        params.status = filterStatus;
      }
      
      const response = await adminInquiriesAPI.getAll(params);
      setInquiries(response.data.inquiries || []);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      toast.error(t('messages.error.general'));
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await adminUsersAPI.getAll({ limit: 1000 });
      if (response.data.success && response.data.data?.users) {
        setUsers(response.data.data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleViewDetails = (inquiryId) => {
    router.push(`/inquiries/${inquiryId}`);
  };

  const handleCreateInquiry = async (formData) => {
    try {
      await adminInquiriesAPI.create({
        userId: formData.userId,
        subject: formData.subject,
        message: formData.message
      });
      toast.success(t('messages.success.inquirySubmitted'));
      fetchInquiries();
    } catch (error) {
      console.error('Error creating inquiry:', error);
      toast.error(error.response?.data?.message || t('messages.error.inquirySubmitError'));
      throw error;
    }
  };

  const filteredInquiries = inquiries.filter(inquiry => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      inquiry.subject?.toLowerCase().includes(searchLower) ||
      inquiry.user?.name?.toLowerCase().includes(searchLower) ||
      inquiry.user?.email?.toLowerCase().includes(searchLower)
    );
  });

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

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{t('pages.inquiries.title')}</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {t('pages.inquiries.createInquiry')}
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.search')}
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('pages.inquiries.searchPlaceholder')}
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('pages.inquiries.filterByStatus')}
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">{t('pages.inquiries.allStatus')}</option>
              <option value="open">{t('inquiryStatus.open')}</option>
              <option value="in_progress">{t('inquiryStatus.in_progress')}</option>
              <option value="closed">{t('inquiryStatus.closed')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <InquiriesTable
          inquiries={filteredInquiries}
          isAdmin={true}
          onViewDetails={handleViewDetails}
        />
      </div>

      {/* Create Inquiry Modal */}
      <InquiryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateInquiry}
        isAdmin={true}
        users={users}
      />
    </div>
  );
}