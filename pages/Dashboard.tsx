
import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { LogOut, FileText, DownloadCloud, Search, Shield, HardDrive, Zap, LayoutGrid, Eye } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import FilePreviewModal from '../components/FilePreviewModal';

// --- Types ---
interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  mimeType: string;
  downloadURL: string;
  createdAt: string;
}

interface DashboardProps {
  onNavigate: (path: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const { language } = useLanguage();
  const t = translations[language].dashboard;

  // Static Data since Firestore is not yet connected
  const files: FileItem[] = [
      { id: '1', name: 'CE_Power_Company_Profile.pdf', size: 5800000, type: 'pdf', mimeType: 'application/pdf', downloadURL: 'https://pdfobject.com/pdf/sample.pdf', createdAt: new Date().toISOString() },
      { id: '2', name: 'Dealer_Price_List_2026.pdf', size: 450000, type: 'pdf', mimeType: 'application/pdf', downloadURL: 'https://pdfobject.com/pdf/sample.pdf', createdAt: new Date().toISOString() },
  ];

  const handleSignOut = async () => {
    await signOut();
    onNavigate('/');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 pt-32 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
         <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                <LayoutGrid className="text-emerald-500" />
                {t.title}
            </h1>
            <p className="text-slate-400">{t.subtitle}</p>
         </div>
         <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
                <div className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                    {(user?.email || 'U').substring(0,2).toUpperCase()}
                </div>
                <div className="text-sm">
                    <p className="font-bold text-slate-200 leading-none">{user?.displayName || t.partner}</p>
                    <p className="text-[10px] text-emerald-400 font-medium">{t.dealer}</p>
                </div>
             </div>
             <button 
                onClick={handleSignOut}
                className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                title="Sign Out"
             >
                <LogOut size={20} />
             </button>
         </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-sm backdrop-blur-md">
            <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/10">
                    <Shield size={20} />
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/10">Active</span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium mb-1">{t.status}</h3>
            <p className="text-2xl font-bold text-white">{t.verified}</p>
        </div>
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-sm backdrop-blur-md">
            <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/10">
                    <HardDrive size={20} />
                </div>
            </div>
            <h3 className="text-slate-400 text-sm font-medium mb-1">{t.resources}</h3>
            <p className="text-2xl font-bold text-white">{files.length} {t.docs}</p>
        </div>
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-sm backdrop-blur-md">
            <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/10">
                    <Zap size={20} />
                </div>
            </div>
            <h3 className="text-slate-400 text-sm font-medium mb-1">{t.update}</h3>
            <p className="text-2xl font-bold text-white">v2.4 Catalog</p>
        </div>
      </div>

      {/* File List */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
         <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
             <h2 className="text-lg font-bold text-white">{t.factoryResources}</h2>
             <div className="relative w-full md:w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                 <input 
                    type="text" 
                    placeholder={t.search}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-emerald-500 outline-none text-white placeholder:text-slate-500 backdrop-blur-sm"
                 />
             </div>
         </div>
         
         <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
                 <thead className="bg-white/5 text-slate-400 font-semibold uppercase text-xs">
                     <tr>
                         <th className="px-6 py-4">{t.table.name}</th>
                         <th className="px-6 py-4">{t.table.date}</th>
                         <th className="px-6 py-4">{t.table.size}</th>
                         <th className="px-6 py-4 text-right">{t.table.action}</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-white/10">
                     {filteredFiles.length === 0 ? (
                         <tr>
                             <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                 No documents found.
                             </td>
                         </tr>
                     ) : (
                         filteredFiles.map((file) => (
                             <tr key={file.id} className="hover:bg-white/5 transition-colors group">
                                 <td className="px-6 py-4">
                                     <div className="flex items-center gap-3">
                                         <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/10">
                                             <FileText size={16} />
                                         </div>
                                         <span className="font-medium text-slate-200 group-hover:text-white transition-colors">{file.name}</span>
                                     </div>
                                 </td>
                                 <td className="px-6 py-4 text-slate-500">
                                     {new Date(file.createdAt).toLocaleDateString()}
                                 </td>
                                 <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                     {formatFileSize(file.size)}
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                     <div className="flex items-center justify-end gap-2">
                                        <button 
                                            onClick={() => setPreviewFile(file)}
                                            className="text-white hover:text-emerald-300 font-medium text-xs bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg transition-all inline-flex items-center gap-2 shadow-lg shadow-emerald-900/40"
                                        >
                                            <Eye size={14} /> {t.table.view || "Preview"}
                                        </button>
                                        <button 
                                            onClick={() => window.open(file.downloadURL, '_blank')}
                                            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                                            title={t.table.download}
                                        >
                                            <DownloadCloud size={16} />
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

      {/* File Preview Modal */}
      {previewFile && (
          <FilePreviewModal 
            file={previewFile} 
            onClose={() => setPreviewFile(null)} 
          />
      )}
    </div>
  );
};

export default Dashboard;
