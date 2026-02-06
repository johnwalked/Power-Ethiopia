
import React, { useState } from 'react';
import { X, Upload, RotateCcw, Clock, FileText, Loader2, AlertTriangle } from 'lucide-react';

interface FileVersion {
  id: string;
  name: string;
  size: number;
  type: string;
  storagePath: string;
  downloadURL: string;
  archivedAt: any;
}

interface FileVersionModalProps {
  file: {
    id: string;
    name: string;
    size: number;
    type: string;
    mimeType: string;
    storagePath: string;
    downloadURL: string;
  } | null;
  userId: string;
  onClose: () => void;
}

const FileVersionModal: React.FC<FileVersionModalProps> = ({ file, userId, onClose }) => {
  const [versions, setVersions] = useState<FileVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Placeholder functionality since DB is disconnected
  const handleUploadNewVersion = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("Versioning is currently disabled.");
  };

  const handleRestore = async (version: FileVersion) => {
    setError("Restore functionality is currently disabled.");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!file) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
           <div>
             <h3 className="font-bold text-slate-900 flex items-center gap-2">
               <Clock size={18} className="text-emerald-600" />
               Version History
             </h3>
             <p className="text-xs text-slate-500 mt-1 max-w-[250px] truncate">{file.name}</p>
           </div>
           <button 
             onClick={onClose}
             className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
           >
             <X size={18} />
           </button>
        </div>

        {/* Actions Area */}
        <div className="p-6 border-b border-slate-100 bg-white">
            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs font-medium flex items-center gap-2">
                    <AlertTriangle size={14} />
                    {error}
                </div>
            )}

            <div className="flex items-center gap-4">
                <button 
                    disabled={true}
                    className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <Upload size={16} />
                    Upload New Version (Disabled)
                </button>
            </div>
        </div>

        {/* Versions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            <div className="text-center py-12">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                    <Clock size={20} />
                </div>
                <p className="text-sm text-slate-500">History unavailable.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FileVersionModal;
