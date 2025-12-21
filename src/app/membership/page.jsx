'use client';
import { useState, useEffect } from 'react';
import { adminMembershipAPI } from '@/lib/adminApi';
import { useTranslation } from '@/hooks/useTranslation';
import { formatDateTime } from '@/lib/utils';
import UserViewModal from '@/components/UserViewModal';
import MembershipDetailModal from '@/components/MembershipDetailModal';

export default function AdminMembershipPage() {
  const { t } = useTranslation();
  
  const [membershipRequests, setMembershipRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filters, setFilters] = useState({
    status: 'pending',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchMembershipRequests();
  }, [pagination.page, filters]);

  const fetchMembershipRequests = async () => {
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };

      const response = await adminMembershipAPI.getAll(params);
      if (response.data.success) {
        setMembershipRequests(response.data.data.membershipRequests);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching membership requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    setActionLoading(true);
    try {
      const response = await adminMembershipAPI.approve(requestId);
      if (response.data.success) {
        fetchMembershipRequests();
        setShowModal(false);
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error('Error approving request:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId) => {
    setActionLoading(true);
    try {
      const response = await adminMembershipAPI.reject(requestId);
      if (response.data.success) {
        fetchMembershipRequests();
        setShowModal(false);
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const openUserModal = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

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

  if (loading) {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.membership.title')}</h1>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.membership.statusLabel')}
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">{t('admin.membership.allStatuses')}</option>
              <option value="pending">{t('admin.membership.status.pending')}</option>
              <option value="approved">{t('admin.membership.status.approved')}</option>
              <option value="rejected">{t('admin.membership.status.rejected')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.search')}
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder={t('admin.membership.searchPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: 'pending', search: '' })}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              {t('common.clearFilters')}
            </button>
          </div>
        </div>
      </div>

      {/* Membership Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-visible">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.membership.tableHeaders.user')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.membership.tableHeaders.upgrade')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.membership.tableHeaders.advisorCloser')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.membership.tableHeaders.status')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.membership.tableHeaders.requestedAt')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.membership.tableHeaders.processedAt')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.membership.tableHeaders.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {membershipRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        <button
                          onClick={() => openUserModal(request.user)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          {request.user.name}
                        </button>
                      </div>
                      <div className="text-sm text-gray-500">
                        @{request.user.nickname} • {request.user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${getStatusColor(request.currentStatus)}`}>
                        {t(`admin.membership.userStatus.${request.currentStatus}`)}
                      </span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className={`text-sm font-medium ${getStatusColor(request.targetStatus)}`}>
                        {t(`admin.membership.userStatus.${request.targetStatus}`)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {request.advisor && (
                        <div className="mb-1">
                          <span className="text-gray-500">{t('membership.advisor')}: </span>
                          <button
                            onClick={() => openUserModal(request.advisor)}
                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                          >
                            {request.advisor.name}
                          </button>
                        </div>
                      )}
                      {request.closer && (
                        <div>
                          <span className="text-gray-500">{t('membership.closer')}: </span>
                          <button
                            onClick={() => openUserModal(request.closer)}
                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                          >
                            {request.closer.name}
                          </button>
                        </div>
                      )}
                      {!request.advisor && !request.closer && (
                        <span className="text-gray-400">{t('admin.membership.noneAssigned')}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                      {t(`admin.membership.status.${request.status}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.requestedAt && request.requestedAt !== null && request.requestedAt !== '{}' ? formatDateTime(request.requestedAt) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.processedAt && request.processedAt !== null && request.processedAt !== '{}' ? formatDateTime(request.processedAt) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openModal(request)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      {t('admin.membership.viewDetails')}
                    </button>
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={actionLoading}
                          className="text-green-600 hover:text-green-900 mr-3 disabled:opacity-50"
                        >
                          {t('admin.membership.approve')}
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={actionLoading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          {t('admin.membership.reject')}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                {t('common.showingResults', {
                  start: ((pagination.page - 1) * pagination.limit) + 1,
                  end: Math.min(pagination.page * pagination.limit, pagination.total),
                  total: pagination.total
                })}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.previous')}
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.next')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Membership Detail Modal */}
      <MembershipDetailModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        request={selectedRequest}
        onApprove={handleApprove}
        onReject={handleReject}
        actionLoading={actionLoading}
      />

      {/* User View Modal */}
      <UserViewModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        user={selectedUser}
        mode="simple"
      />
    </div>
  );
}