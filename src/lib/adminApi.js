import axios from 'axios';

// Admin API configuration
const ADMIN_API_CONFIG = {
  BASE_URL: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api') + '/admin',
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

// Create admin axios instance
export const adminApi = axios.create({
  baseURL: ADMIN_API_CONFIG.BASE_URL,
  withCredentials: true,
  headers: ADMIN_API_CONFIG.HEADERS,
});

// Admin API interceptor for authentication
adminApi.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const adminToken = window.localStorage.getItem('adminToken');
      if (adminToken) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${adminToken}`,
        };
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors and token expiration
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log detailed error information
    const errorDetails = {
      status: error.response?.status || 'No status',
      url: error.config?.url || 'No URL',
      message: error.message || 'No message',
      responseData: error.response?.data || null,
      code: error.code || null, // Network error codes like 'ECONNREFUSED', 'ERR_NETWORK', etc.
      error,
    };
    // eslint-disable-next-line no-console
    console.error('Admin API Error:', errorDetails);

    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/admin/login')) {
          window.location.href = '/admin/login';
        }
      }
    }

    // Handle network errors (no response received)
    if (!error.response) {
      // eslint-disable-next-line no-console
      console.error('Network error - backend may be down or unreachable:', error.message);
    }

    return Promise.reject(error);
  }
);

// Admin API methods
export const adminAuthAPI = {
  login: (credentials) => adminApi.post('/auth/login', credentials),
  logout: () => adminApi.post('/auth/logout'),
  verify: () => adminApi.get('/auth/verify'),
};

export const adminUsersAPI = {
  getAll: (params = {}) => adminApi.get('/users', { params }),
  getById: (id) => adminApi.get(`/users/${id}`),
  create: (userData) => adminApi.post('/users', userData),
  update: (id, userData) => adminApi.put(`/users/${id}`, userData),
  delete: (id) => adminApi.delete(`/users/${id}`),
  suspend: (id) => adminApi.post(`/users/${id}/suspend`),
  unsuspend: (id) => adminApi.post(`/users/${id}/unsuspend`),
  updatePassword: (id, passwordData) => adminApi.put(`/users/${id}/password`, passwordData),
  resendVerification: (id) => adminApi.post(`/users/${id}/resend-verification`),
  markVerified: (id) => adminApi.post(`/users/${id}/mark-verified`),
};

export const adminRewardsAPI = {
  getAll: (params = {}) => adminApi.get('/rewards', { params }),
  confirm: (id) => adminApi.post(`/rewards/${id}/confirm`),
  approveAll: () => adminApi.post('/rewards/approveAll'),
};

export const adminJunketRewardsAPI = {
  getAll: (params = {}) => adminApi.get('/junket-rewards', { params }),
  approveImportRewards: (importId) =>
    adminApi.post(`/junket-rewards/approveImportRewards/${importId}`),
};

export const adminWithdrawalsAPI = {
  getAll: (params = {}) => adminApi.get('/withdrawals', { params }),
  approve: (id) => adminApi.post(`/withdrawals/${id}/approve`),
  reject: (id, reason) => adminApi.post(`/withdrawals/${id}/reject`, { reason }),
  complete: (id, notes) => adminApi.post(`/withdrawals/${id}/complete`, { notes }),
};

export const adminInquiriesAPI = {
  getAll: (params = {}) => adminApi.get('/inquiries', { params }),
  getById: (id) => adminApi.get(`/inquiries/${id}`),
  create: (inquiryData) => adminApi.post('/inquiries', inquiryData),
  addMessage: (id, message) => adminApi.post(`/inquiries/${id}/messages`, { message }),
  updateStatus: (id, status) => adminApi.put(`/inquiries/${id}/status`, { status }),
  delete: (id) => adminApi.delete(`/inquiries/${id}`),
};

export const adminAdministratorsAPI = {
  getAll: (params = {}) => adminApi.get('/administrators', { params }),
  getById: (id) => adminApi.get(`/administrators/${id}`),
  create: (adminData) => adminApi.post('/administrators', adminData),
  update: (id, adminData) => adminApi.put(`/administrators/${id}`, adminData),
  delete: (id) => adminApi.delete(`/administrators/${id}`),
};

export const adminUploadsAPI = {
  uploadFile: (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return adminApi.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getAll: (params = {}) => adminApi.get('/uploads', { params }),
  delete: (id) => adminApi.delete(`/uploads/${id}`),
};

// System Settings
export const adminSettingsAPI = {
  getAll: (params = {}) => adminApi.get('/settings', { params }),
  create: (data) => adminApi.post('/settings', data),
  update: (id, data) => adminApi.put(`/settings/${id}`, data),
  delete: (id) => adminApi.delete(`/settings/${id}`),
  fetchRate: (currency) => adminApi.post(`/settings/fetch-rate/${currency}`),
};

// Membership
export const adminMembershipAPI = {
  getAll: (params = {}) => adminApi.get('/membership', { params }),
  approve: (id) => adminApi.put(`/membership/${id}/approve`),
  reject: (id) => adminApi.put(`/membership/${id}/reject`),
};

// JK Data Import
export const adminJunketImportAPI = {
  import: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return adminApi.post('/junket-import/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getAll: (params = {}) => adminApi.get('/junket-import', { params }),
  getHistory: () => adminApi.get('/junket-import/history'),
  calculateRewards: (importId) => adminApi.post(`/junket-import/${importId}/calculate-rewards`),
  getMkUsers: (params = {}) => adminApi.get('/junket-import/mk-users', { params }),
  bulkUpdateRecords: (updates) => adminApi.put('/junket-import/records/bulk-update', { updates }),
  cancelImport: (importId) => adminApi.delete(`/junket-import/${importId}`),
};



