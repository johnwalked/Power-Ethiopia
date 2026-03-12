import React from 'react';
import { X, DownloadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileItem {
    id: string;
    name: string;
    size: number;
    type: string;
    mimeType: string;
    downloadURL: string;
    createdAt: string;
}

interface FilePreviewModalProps {
    file: FileItem;
    onClose: () => void;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                        <h3 className="text-lg font-bold text-white truncate pr-4">{file.name}</h3>
                        <div className="flex items-center gap-2">
                            <a
                                href={file.downloadURL}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                <DownloadCloud size={16} />
                                Download
                            </a>
                            <button
                                onClick={onClose}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title="Close Preview"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-slate-950 relative">
                        {file.type === 'pdf' ? (
                            <iframe
                                src={`${file.downloadURL}#toolbar=0`}
                                className="w-full h-full border-0"
                                title={file.name}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <p>Preview not available for this file type.</p>
                                <p className="text-sm mt-2">Please download the file to view it.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FilePreviewModal;
