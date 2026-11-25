import React from 'react';
import { X, Printer, ShieldCheck, CheckCircle2, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FileItem {
    id: string;
    name: string;
    size: number;
    type: string;
    mimeType: string;
    downloadURL?: string;
    createdAt: string;
    category?: string;
    summary?: string;
    sections?: { heading: string; points: string[] }[];
}

interface FilePreviewModalProps {
    file: FileItem;
    onClose: () => void;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 print:hidden">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <FileText size={18} className="text-red-400 shrink-0" />
                            <h3 className="text-base md:text-lg font-bold text-white truncate">{file.name}</h3>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs md:text-sm font-bold rounded-lg transition-colors shadow-md shadow-red-900/30"
                            >
                                <Printer size={15} />
                                Print / Save PDF
                            </button>
                            <button
                                onClick={onClose}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title="Close Preview"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Local Built-In Factory Datasheet Content (Works 100% offline with zero broken external URLs) */}
                    <div className="flex-1 overflow-y-auto bg-white text-slate-900 p-6 md:p-10">
                        <div className="max-w-3xl mx-auto space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-red-600 pb-4 gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded bg-red-600 text-white font-black text-xs">CE POWER</span>
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{file.category || 'Official Document'}</span>
                                    </div>
                                    <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-1.5">{file.name.replace(/_/g, ' ').replace('.pdf', '')}</h1>
                                </div>
                                <div className="text-xs text-slate-500 sm:text-right">
                                    <p className="font-bold text-slate-700">Guangdong MINDONG Electric Co., Ltd.</p>
                                    <p>Kality Gabriel Branch, Addis Ababa</p>
                                    <p>Updated: {new Date(file.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {file.summary && (
                                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    {file.summary}
                                </p>
                            )}

                            {file.sections && file.sections.map((sec, idx) => (
                                <div key={idx} className="space-y-2.5">
                                    <h2 className="text-sm font-extrabold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <ShieldCheck size={16} /> {sec.heading}
                                    </h2>
                                    <ul className="space-y-2 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                                        {sec.points.map((pt, i) => (
                                            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                                                <CheckCircle2 size={15} className="text-red-500 mt-0.5 shrink-0" />
                                                <span>{pt}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}

                            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between text-xs text-slate-500 gap-2">
                                <span>ISO 9001 · ISO 14001 · CE · TÜV Rheinland Certified Factory</span>
                                <span className="font-bold text-slate-700">Hotline: +251 966 33 03 09 · info@cepower.et</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FilePreviewModal;
