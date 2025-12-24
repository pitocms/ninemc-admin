'use client';
import { useState, useEffect } from 'react';
import { Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { adminJunketImportAPI } from '@/lib/adminApi';
import { useTranslation } from '@/hooks/useTranslation';
import { ADMIN_ROUTES, JUNKET_DATA_IMPORT_STATUS } from '@/constants';
import ConfirmModal from '@/components/ConfirmModal';
import JunketImportHistoryTable from '@/components/JunketImportHistoryTable';
import toast from 'react-hot-toast';

export default function JkDataImportPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [importHistory, setImportHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    loadImportHistory();
  }, []);

  const loadImportHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await adminJunketImportAPI.getHistory();
      
      if (response && response.data) {
        if (response.data.success && Array.isArray(response.data.data)) {
          setImportHistory(response.data.data);
        } else {
          console.error('API returned invalid response:', response.data);
          const errorMsg = response.data.message || 'admin.jkDataImport.messages.failedToLoadHistory';
          toast.error(typeof errorMsg === 'string' && errorMsg.startsWith('admin.') ? t(errorMsg) : errorMsg);
        }
      } else {
        console.error('Invalid response structure:', response);
        toast.error(t('admin.jkDataImport.messages.failedToLoadHistory'));
      }
    } catch (error) {
      console.error('Error loading import history:', error);
      const errorMsg = error.response?.data?.message || t('admin.jkDataImport.messages.failedToLoadHistory');
      toast.error(typeof errorMsg === 'string' && errorMsg.startsWith('admin.') ? t(errorMsg) : errorMsg);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.toLowerCase().split('.').pop();
      if (ext !== 'csv' && ext !== 'xlsx' && ext !== 'xls') {
        toast.error(t('admin.jkDataImport.messages.invalidFileType'));
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadConfirm = () => {
    if (!selectedFile) {
      toast.error(t('admin.jkDataImport.messages.noFileSelected'));
      return;
    }
    setShowConfirmModal(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error(t('admin.jkDataImport.messages.noFileSelected'));
      return;
    }

    try {
      setUploading(true);
      setShowConfirmModal(false);
      const response = await adminJunketImportAPI.import(selectedFile);
      
      if (response && response.data && response.data.success) {
        const { data } = response.data;
        if (data) {
          // Check calculation status and show appropriate message
          if (data.calculation) {
            if (data.calculation.success) {
              // Build calculation message from data
              let calculationMessage = t('admin.jkDataImport.messages.calculationSuccess');
              calculationMessage = calculationMessage.replace('{{totalCalculations}}', data.calculation.totalCalculations);
              calculationMessage = calculationMessage.replace('{{totalRewardAmount}}', data.calculation.totalRewardAmount.toFixed(0));
              
              // Build full message
              let message = t('admin.jkDataImport.messages.importSuccessWithCalculation');
              message = message.replace('{{total}}', data.totalRecords);
              message = message.replace('{{success}}', data.successRecords);
              message = message.replace('{{failed}}', data.failedRecords);
              message = message.replace('{{calculationMessage}}', calculationMessage);
              toast.success(message);
            } else {
              // Show warning for calculation failure
              let calculationMessage = t('admin.jkDataImport.messages.calculationError');
              calculationMessage = calculationMessage.replace('{{error}}', data.calculation.error || 'Unknown error');
              
              let message = t('admin.jkDataImport.messages.importSuccessWithCalculation');
              message = message.replace('{{total}}', data.totalRecords);
              message = message.replace('{{success}}', data.successRecords);
              message = message.replace('{{failed}}', data.failedRecords);
              message = message.replace('{{calculationMessage}}', calculationMessage);
              toast.error(message, { duration: 6000 });
            }
          } else {
            let message = t('admin.jkDataImport.messages.importSuccess');
            message = message.replace('{{total}}', data.totalRecords);
            message = message.replace('{{success}}', data.successRecords);
            message = message.replace('{{failed}}', data.failedRecords);
            toast.success(message);
          }
          
          setSelectedFile(null);
          // Reset file input
          const fileInput = document.getElementById('file-input');
          if (fileInput) fileInput.value = '';
          
          // Reload history
          loadImportHistory();
        } else {
          toast.error(response.data.message || t('admin.jkDataImport.messages.importFailed'));
        }
      } else {
        // Handle error response
        const errorData = response?.data;
        if (errorData?.error === 'DUPLICATE_IMPORT') {
          let errorMsg = t('admin.jkDataImport.messages.duplicateImport');
          if (errorData.data?.month) {
            errorMsg = errorMsg.replace('{{month}}', errorData.data.month);
          }
          toast.error(errorMsg);
        } else {
          const errorMsg = errorData?.message || t('admin.jkDataImport.messages.importFailed');
          toast.error(errorMsg);
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorData = error.response?.data;
      if (errorData?.error === 'DUPLICATE_IMPORT') {
        let errorMsg = t('admin.jkDataImport.messages.duplicateImport');
        if (errorData.data?.month) {
          errorMsg = errorMsg.replace('{{month}}', errorData.data.month);
        }
        toast.error(errorMsg);
      } else {
        const errorMessage = errorData?.message || t('admin.jkDataImport.messages.importFailed');
        toast.error(errorMessage);
      }
    } finally {
      setUploading(false);
    }
  };

  // Get the latest draft import (status = imported)
  const getLatestDraftImport = () => {
    return importHistory.find(imp => imp.status === JUNKET_DATA_IMPORT_STATUS.IMPORTED) || null;
  };

  // Get change count from localStorage for the latest draft import
  const getChangeCount = () => {
    const latestDraft = getLatestDraftImport();
    if (!latestDraft || typeof window === 'undefined') return 0;
    
    const key = `jkImportLastChanges_${latestDraft.month}`;
    const stored = window.localStorage.getItem(key);
    if (stored) {
      const count = parseInt(stored, 10);
      return Number.isNaN(count) ? 0 : count;
    }
    return 0;
  };

  const handleConfirmImport = async () => {
    const latestDraft = getLatestDraftImport();
    
    if (!latestDraft) {
      toast.error('No draft import found to confirm');
      return;
    }

    const changeCount = getChangeCount();
    const confirmMessage = changeCount > 0
      ? `Confirm import "${latestDraft.fileName}" for month ${latestDraft.month}? (${changeCount} changes saved)`
      : `Confirm import "${latestDraft.fileName}" for month ${latestDraft.month}?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setConfirming(true);
      const response = await adminJunketImportAPI.calculateRewards(latestDraft.id);
      
      if (response.data.success) {
        const { data } = response.data;
        let message = 'Import confirmed successfully';
        if (data && data.totalCalculations !== undefined && data.totalRewardAmount !== undefined) {
          message = `Import confirmed! Calculated ${data.totalCalculations} rewards totaling ${data.totalRewardAmount.toFixed(0)} JPY`;
        }
        toast.success(message);
        
        // Clear the change count from localStorage after successful confirm
        if (typeof window !== 'undefined') {
          const key = `jkImportLastChanges_${latestDraft.month}`;
          window.localStorage.removeItem(key);
        }
        
        // Reload history
        loadImportHistory();
      } else {
        toast.error(response.data.message || 'Failed to confirm import');
      }
    } catch (error) {
      console.error('Error confirming import:', error);
      toast.error(error.response?.data?.message || 'Failed to confirm import');
    } finally {
      setConfirming(false);
    }
  };

  const latestDraftImport = getLatestDraftImport();
  const changeCount = getChangeCount();
  const showConfirmButton = latestDraftImport && latestDraftImport.status === JUNKET_DATA_IMPORT_STATUS.IMPORTED;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.jkDataImport.title')}</h1>
        <div className="flex gap-2">
          {showConfirmButton && (
            <button
              onClick={handleConfirmImport}
              disabled={confirming}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              {confirming 
                ? 'Confirming...' 
                : changeCount > 0 
                  ? `Confirm (${changeCount})` 
                  : 'Confirm Import'}
            </button>
          )}
          <button
            onClick={() => router.push(ADMIN_ROUTES.JK_DATA_IMPORT_RECORDS)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            {t('admin.jkDataImport.viewRecords')}
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('admin.jkDataImport.import.title')}
        </h2>
        
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.jkDataImport.import.selectFile')}
            </label>
            <div className="flex gap-2">
              <input
                id="file-input"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                disabled={uploading}
              />
            </div>
            {selectedFile && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <FileText className="h-4 w-4" />
                <span>{selectedFile.name}</span>
              </div>
            )}
          </div>
          <button
            onClick={handleUploadConfirm}
            disabled={!selectedFile || uploading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t('admin.jkDataImport.import.uploading')}</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>{t('admin.jkDataImport.import.uploadAndImport')}</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> {t('admin.jkDataImport.import.note')}
          </p>
        </div>
      </div>

      {/* Import History */}
      <JunketImportHistoryTable 
        imports={importHistory} 
        loading={historyLoading} 
        onRefresh={loadImportHistory}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleUpload}
        action="import"
        translationKey="admin.jkDataImport"
      />
    </div>
  );
}