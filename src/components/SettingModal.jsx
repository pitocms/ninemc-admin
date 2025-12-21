'use client';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { adminSettingsAPI } from '@/lib/adminApi';

export default function SettingModal({ isOpen, onClose, mode = 'create', setting = null, onSuccess }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    settingKey: '',
    settingValue: '',
    settingType: 'string',
    description: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && setting) {
        setFormData({
          settingKey: setting.settingKey || '',
          settingValue: setting.settingValue ?? '',
          settingType: setting.settingType || 'string',
          description: setting.description || ''
        });
      } else {
        setFormData({ settingKey: '', settingValue: '', settingType: 'string', description: '' });
      }
    }
  }, [isOpen, mode, setting]);

  if (!isOpen) return null;

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.settingKey) return;

    try {
      setSaving(true);
      if (mode === 'create') {
        await adminSettingsAPI.create(formData);
      } else if (mode === 'edit' && setting) {
        await adminSettingsAPI.update(setting.id, formData);
      }
      if (onSuccess) await onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving setting:', error);
    } finally {
      setSaving(false);
    }
  };

  const title = mode === 'edit'
    ? t('admin.settings.modals.edit.title', 'Edit Setting')
    : t('admin.settings.modals.create.title', 'Create Setting');

  const submitLabel = mode === 'edit'
    ? t('admin.settings.modals.edit.update', 'Update')
    : t('admin.settings.modals.create.create', 'Create');

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.settings.fields.key', 'Setting Key')}</label>
            <input
              name="settingKey"
              type="text"
              value={formData.settingKey}
              onChange={onChange}
              disabled={mode === 'edit'}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              placeholder="reward.subscription.amount"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.settings.fields.type', 'Type')}</label>
            <select name="settingType" value={formData.settingType} onChange={onChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900">
              <option value="string">string</option>
              <option value="number">number</option>
              <option value="boolean">boolean</option>
              <option value="json">json</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.settings.fields.value', 'Value')}</label>
            <input
              name="settingValue"
              type="text"
              value={formData.settingValue}
              onChange={onChange}
              className="w-full border border-gray-300 rounded px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              placeholder={t('admin.settings.fields.valuePlaceholder', 'Enter value (string/number/json/bool)')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.settings.fields.description', 'Description')}</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={onChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">
              {saving ? t('common.saving') : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

