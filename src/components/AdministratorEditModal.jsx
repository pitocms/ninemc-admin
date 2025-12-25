'use client';
import { useState, useEffect } from 'react';
import { adminAdministratorsAPI } from '@/lib/adminApi';
import { useTranslation } from '@/hooks/useTranslation';

export default function AdministratorEditModal({ 
  isOpen, 
  onClose, 
  administrator = null, 
  onSuccess,
  mode = 'edit' // 'create' or 'edit'
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    status: "active"
  });
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false
  });

  useEffect(() => {
    if (isOpen) {
      if (administrator && mode === "edit") {
        setFormData({
          email: administrator.email || "",
          password: "",
          status: administrator.status || "active"
        });
      } else if (mode === "create") {
        setFormData({
          email: "",
          password: "",
          status: "active"
        });
      }
    }
  }, [isOpen, administrator, mode]);

  const validatePassword = (password) => {
    const validation = {
      minLength: password.length >= 6,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password)
    };
    setPasswordValidation(validation);
    return Object.values(validation).every(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate password if provided
      if (formData.password && !validatePassword(formData.password)) {
        alert(t('validation.passwordTooWeak'));
        setLoading(false);
        return;
      }

      let response;
      if (mode === "create") {
        // For create mode, password is required
        if (!formData.password) {
          alert(t('validation.required'));
          setLoading(false);
          return;
        }
        response = await adminAdministratorsAPI.create(formData);
      } else {
        // For edit mode, only send password if it's been changed
        const updateData = {
          email: formData.email,
          status: formData.status
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        response = await adminAdministratorsAPI.update(administrator.id, updateData);
      }

      if (response.data.success) {
        onSuccess?.();
        onClose();
        alert(mode === 'create' 
          ? t('admin.administrators.messages.adminCreated') 
          : t('admin.administrators.messages.adminUpdated'));
      } else {
        alert(response.data.message || 
          (mode === 'create' 
            ? t('admin.administrators.messages.adminCreateError') 
            : t('admin.administrators.messages.adminUpdateError')));
      }
    } catch (error) {
      console.error('Error saving administrator:', error);
      alert(error.response?.data?.message || 
        (mode === 'create' 
          ? t('admin.administrators.messages.adminCreateError') 
          : t('admin.administrators.messages.adminUpdateError')));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validate password on change
    if (name === 'password') {
      validatePassword(value);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Title */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-medium text-gray-900">
              {mode === 'create' ? t('admin.administrators.modals.createAdmin.title') : t('admin.administrators.modals.editAdmin.title')}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.administrators.modals.editAdmin.email')} *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder={t('admin.administrators.modals.editAdmin.emailPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.administrators.modals.editAdmin.password')} {mode === 'create' ? '*' : `(${t('admin.administrators.modals.editAdmin.leaveBlankToKeep')})`}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required={mode === 'create'}
                placeholder={t('admin.administrators.modals.editAdmin.passwordPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              
              {/* Password Requirements */}
              {formData.password && (
                <div className="mt-2">
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li className={`flex items-center ${
                      passwordValidation.minLength ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      <span className={`mr-2 ${
                        passwordValidation.minLength ? 'text-green-500' : 'text-gray-400'
                      }`}>
                        {passwordValidation.minLength ? '✓' : '○'}
                      </span>
                      {t('validation.passwordMinLength')}
                    </li>
                    <li className={`flex items-center ${
                      passwordValidation.hasUppercase ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      <span className={`mr-2 ${
                        passwordValidation.hasUppercase ? 'text-green-500' : 'text-gray-400'
                      }`}>
                        {passwordValidation.hasUppercase ? '✓' : '○'}
                      </span>
                      {t('validation.passwordHasUppercase')}
                    </li>
                    <li className={`flex items-center ${
                      passwordValidation.hasLowercase ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      <span className={`mr-2 ${
                        passwordValidation.hasLowercase ? 'text-green-500' : 'text-gray-400'
                      }`}>
                        {passwordValidation.hasLowercase ? '✓' : '○'}
                      </span>
                      {t('validation.passwordHasLowercase')}
                    </li>
                    <li className={`flex items-center ${
                      passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      <span className={`mr-2 ${
                        passwordValidation.hasNumber ? 'text-green-500' : 'text-gray-400'
                      }`}>
                        {passwordValidation.hasNumber ? '✓' : '○'}
                      </span>
                      {t('validation.passwordHasNumber')}
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Status Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.administrators.modals.editAdmin.status')}
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">{t('admin.administrators.status.active')}</option>
                <option value="inactive">{t('admin.administrators.status.inactive')}</option>
              </select>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {t('admin.administrators.modals.editAdmin.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading 
                  ? t('admin.administrators.modals.editAdmin.saving') 
                  : (mode === 'create' 
                    ? t('admin.administrators.modals.editAdmin.create') 
                    : t('admin.administrators.modals.editAdmin.update'))}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}