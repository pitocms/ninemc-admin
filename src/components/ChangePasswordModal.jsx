'use client';
import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

export default function ChangePasswordModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  translationKey 
}) {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false
  });

  const validatePassword = (password) => {
    const validation = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password)
    };
    setPasswordValidation(validation);
    return Object.values(validation).every(Boolean);
  };

  const resetPasswordValidation = () => {
    setNewPassword('');
    setPasswordError('');
    setPasswordValidation({
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false
    });
  };

  const handleSubmit = () => {
    if (!validatePassword(newPassword)) {
      setPasswordError(t('validation.passwordRequirementsNotMet'));
      return;
    }
    onSubmit(newPassword);
    resetPasswordValidation();
  };

  const handleClose = () => {
    resetPasswordValidation();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t(`${translationKey}.modals.changePassword.title`)}
          </h3>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              validatePassword(e.target.value);
              setPasswordError('');
            }}
            placeholder={t(`${translationKey}.modals.changePassword.newPasswordPlaceholder`)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 mb-4 ${
              passwordError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
            }`}
            style={{ color: '#111827' }}
          />
          
          {/* Password Requirements */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t('validation.passwordRequirements')}</h4>
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
          
          {/* Error Message */}
          {passwordError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{passwordError}</p>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              {t(`${translationKey}.modals.changePassword.cancel`)}
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              {t(`${translationKey}.modals.changePassword.updatePassword`)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}