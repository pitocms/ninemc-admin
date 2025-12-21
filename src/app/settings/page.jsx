'use client';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { adminSettingsAPI } from '@/lib/adminApi';
import ConfirmModal from '@/components/ConfirmModal';
import SettingModal from '@/components/SettingModal';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { t } = useTranslation();

  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedSetting, setSelectedSetting] = useState(null);
  const [showSettingModal, setShowSettingModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [fetchingRate, setFetchingRate] = useState({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await adminSettingsAPI.getAll();
      if (response.data.success && response.data.data) {
        setSettings(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSettings = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return (settings || []).filter(s =>
      (s.settingKey || '').toLowerCase().includes(term) ||
      (s.description || '').toLowerCase().includes(term)
    );
  }, [settings, searchTerm]);

  const handleCreate = () => {
    setSelectedSetting(null);
    setModalMode('create');
    setShowSettingModal(true);
  };

  const handleEdit = (setting) => {
    setSelectedSetting(setting);
    setModalMode('edit');
    setShowSettingModal(true);
  };

  const handleDelete = (setting) => {
    setSelectedSetting(setting);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedSetting) return;
    try {
      await adminSettingsAPI.delete(selectedSetting.id);
      setShowConfirmModal(false);
      setSelectedSetting(null);
      await loadSettings();
    } catch (error) {
      console.error('Error deleting setting:', error);
    }
  };

  const handleFetchRate = async (currency) => {
    try {
      setFetchingRate(prev => ({ ...prev, [currency]: true }));
      const response = await adminSettingsAPI.fetchRate(currency);
      if (response.data.success) {
        toast.success(`Rate fetched successfully: ${response.data.rate} JPY per ${currency}`);
        await loadSettings();
      } else {
        toast.error(response.data.message || 'Failed to fetch rate');
      }
    } catch (error) {
      console.error('Error fetching rate:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch rate from external API');
    } finally {
      setFetchingRate(prev => ({ ...prev, [currency]: false }));
    }
  };

  const isExchangeRateSetting = (settingKey) => {
    return settingKey === 'exchange_rate.JPY_USDT' || settingKey === 'exchange_rate.JPY_USDC';
  };

  const getCurrencyFromSettingKey = (settingKey) => {
    if (settingKey === 'exchange_rate.JPY_USDT') return 'USDT';
    if (settingKey === 'exchange_rate.JPY_USDC') return 'USDC';
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.settings.title', 'System Settings')}</h1>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          {t('admin.settings.createSetting', 'New Setting')}
        </button>
      </div>

      {/* Search Card */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.settings.searchSettings', 'Search Settings')}
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('admin.settings.searchPlaceholder', 'Search by key or description...')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-lg shadow overflow-visible">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.settings.tableHeaders.key', 'Setting Key')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.settings.tableHeaders.variable', 'Setting Variable')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.settings.tableHeaders.description', 'Description')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.updatedAt')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.settings.tableHeaders.management', 'Management')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-gray-500" colSpan={5}>{t('common.loading')}</td>
                </tr>
              ) : filteredSettings.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-gray-500" colSpan={5}>{t('messages.info.noData')}</td>
                </tr>
              ) : (
                filteredSettings.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm text-gray-900 font-mono">{s.settingKey}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 break-all">{s.settingValue ?? ''} <span className="ml-2 text-xs text-gray-500">({s.settingType})</span></td>
                    <td className="px-4 py-4 text-sm text-gray-700">{s.description || '-'}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">{new Date(s.updatedAt).toLocaleString()}</td>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex items-center space-x-3">
                        {isExchangeRateSetting(s.settingKey) && (
                          <button
                            onClick={() => handleFetchRate(getCurrencyFromSettingKey(s.settingKey))}
                            disabled={fetchingRate[getCurrencyFromSettingKey(s.settingKey)]}
                            className="p-1 rounded text-blue-600 hover:text-blue-900 hover:bg-blue-50 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            title="Fetch rate from external API"
                          >
                            <svg 
                              className={`w-4 h-4 ${fetchingRate[getCurrencyFromSettingKey(s.settingKey)] ? 'animate-spin' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth="2" 
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                              />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(s)}
                          className="p-1 rounded text-indigo-600 hover:text-indigo-900"
                          title={t('common.edit')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          className="p-1 rounded text-red-600 hover:text-red-900"
                          title={t('common.delete')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmDelete}
        action="delete"
        translationKey="admin.settings"
      />

      <SettingModal
        isOpen={showSettingModal}
        onClose={() => setShowSettingModal(false)}
        mode={modalMode}
        setting={selectedSetting}
        onSuccess={loadSettings}
      />
    </div>
  );
}

