
import React, { useState, useEffect } from 'react';
import { X, Download, ExternalLink, Loader2, FileText, Image as ImageIcon, ChevronRight, Award, Zap, Settings, ShieldCheck, Factory, Globe } from 'lucide-react';

interface FilePreviewModalProps {
  file: {
    name: string;
    type: string;
    mimeType: string;
    downloadURL: string;
  } | null;
  onClose: () => void;
}

const CompanyProfileContent = () => {
  return (
    <div className="w-full h-full bg-slate-50 overflow-y-auto text-slate-900 scroll-smooth">
      {/* Page 1: Cover / Intro */}
      <div className="max-w-4xl mx-auto bg-white shadow-xl min-h-[1100px] mb-8 relative overflow-hidden">
         {/* Hero Header */}
         <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-12">
                   <div className="text-3xl font-extrabold tracking-tighter">CE Power</div>
                   <div className="text-right">
                       <p className="text-sm font-bold opacity-80">SINCE 1958</p>
                       <p className="text-[10px] tracking-widest uppercase opacity-60">China Famous Trade Mark | 832395 Stock Code</p>
                   </div>
                </div>
                <h1 className="text-6xl font-black mb-6 leading-tight">INTRODUCTION</h1>
                <div className="w-24 h-2 bg-orange-500 mb-8"></div>
                <p className="text-xl font-light text-blue-100 max-w-xl leading-relaxed">
                   Guangdong MINDONG Electric Co., Ltd. <br/>
                   Premium Generator Manufacturing & Power Solutions.
                </p>
            </div>
            
            {/* Abstract Chevron Decoration */}
            <div className="absolute top-0 right-0 w-64 h-full opacity-10">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full fill-white">
                    <path d="M0 0 L50 0 L100 50 L50 100 L0 100 L50 50 Z" />
                </svg>
            </div>
         </div>

         {/* Content Grid */}
         <div className="p-16 grid md:grid-cols-2 gap-16">
            <div className="space-y-12">
                <div>
                    <h2 className="text-2xl font-bold text-orange-500 mb-2 flex items-center gap-2">
                        <Globe className="w-5 h-5" /> ENTERPRISE VISION
                    </h2>
                    <p className="text-slate-700 font-medium text-lg border-l-4 border-slate-200 pl-4">Making the world better.</p>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-orange-500 mb-2 flex items-center gap-2">
                        <Zap className="w-5 h-5" /> MISSION
                    </h2>
                    <p className="text-slate-700 font-medium text-lg border-l-4 border-slate-200 pl-4">MINDONG ELECTRIC generators into every corner of world.</p>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-orange-500 mb-2 flex items-center gap-2">
                        <Award className="w-5 h-5" /> VALUES
                    </h2>
                    <p className="text-slate-700 font-medium text-lg border-l-4 border-slate-200 pl-4">Pragmatic cooperation, enterprising integrity, efficient refinement, and innovation.</p>
                </div>
            </div>
            
            <div className="text-sm text-slate-500 leading-relaxed space-y-6 font-light text-justify">
                <p>
                    <strong className="text-slate-900">Guangdong MINDONG Electric Co., Ltd.</strong> is a branch of Fujian Mindong Electric Co., Ltd, located in Dongguan city, Guangdong Province, China, which is a state-owned public enterprise and listed company with 60-year histories.
                </p>
                <p>
                    Guangdong MINDONG Electric is one of the factories of MINDONG ELECTRIC group, specializing in generators, silent generators, high voltage generators, and marine generators, etc. Our products power size are from <strong className="text-slate-900">10KVa to 2500KVa</strong>.
                </p>
                <p>
                    With a wide range, good quality, reasonable prices and stylish designs, our products are extensively used in and other industries. Our products are widely recognized and trusted by users and can meet continuously changing economic and social needs.
                </p>
                <p>
                    We insist consistently the high standard of product, according to the market rules and enterprise development principle. We promote development on the root of honesty, seek progress on the basis of credit, do work pragmatically.
                </p>
            </div>
         </div>
      </div>

      {/* Page 2: Production Process */}
      <div className="max-w-4xl mx-auto bg-white shadow-xl min-h-[1100px] mb-8 relative">
         <div className="p-16 border-b border-slate-100">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-4xl font-black text-blue-900">PRODUCTION PROCESS</h2>
                <div className="flex gap-2">
                   <div className="w-3 h-3 rounded-full bg-blue-900"></div>
                   <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                   <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                </div>
            </div>
            <p className="text-slate-400 font-medium tracking-wide">STATE OF THE ART MANUFACTURING</p>
         </div>

         <div className="p-16 space-y-2">
            {[
                { step: "01", icon: <Settings />, title: "CUTTING", desc: "We use the most advanced laser cutting machine to make our silent canopy." },
                { step: "02", icon: <Zap />, title: "WELDING", desc: "High efficiency & Automatic Welding ensures structural rigidity and durability." },
                { step: "03", icon: <Factory />, title: "ASSEMBLY", desc: "Precise assembly techniques relative with generator performance optimization." },
                { step: "04", icon: <Settings />, title: "WIRING", desc: "Expert technical wiring for high capacity 1500kVa generators." },
                { step: "05", icon: <ShieldCheck />, title: "LOAD TEST", desc: "Rigorous testing: 25%, 50%, 75%, 100% and 110% load test before departure." }
            ].map((item, idx) => (
                <div key={item.step} className="flex group relative pl-8 pb-12 last:pb-0 border-l-2 border-slate-100 last:border-l-0">
                    <div className="absolute left-[-17px] top-0 w-8 h-8 rounded-full bg-white border-4 border-slate-200 group-hover:border-orange-500 transition-colors flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-orange-500"></div>
                    </div>
                    <div className="ml-8 flex-1 bg-slate-50 p-6 rounded-xl group-hover:bg-blue-50 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <span className="text-blue-900">{item.title}</span>
                            </h3>
                            <span className="text-4xl font-black text-slate-200 group-hover:text-blue-200">{item.step}</span>
                        </div>
                        <p className="text-slate-600 text-sm">{item.desc}</p>
                    </div>
                </div>
            ))}
         </div>
         
         <div className="bg-slate-900 p-12 text-center text-white">
             <h3 className="font-bold text-lg mb-6 tracking-widest">CERTIFICATIONS</h3>
             <div className="flex flex-wrap justify-center gap-4">
                 {['ISO9001', 'ISO14001', 'CE', 'IEC', 'TÜV Rheinland', 'IQNet'].map(cert => (
                     <div key={cert} className="px-6 py-3 border border-white/20 rounded hover:bg-white/10 transition-colors font-bold text-sm">
                         {cert}
                     </div>
                 ))}
             </div>
         </div>
      </div>

      {/* Page 3: Product Portfolio */}
      <div className="max-w-4xl mx-auto bg-white shadow-xl min-h-[1100px] mb-8 relative p-16">
         <div className="text-center mb-16">
             <h2 className="text-4xl font-black text-blue-900 mb-4">PRODUCT SERIES</h2>
             <div className="w-16 h-1 bg-orange-500 mx-auto"></div>
         </div>

         <div className="grid md:grid-cols-2 gap-8 mb-16">
             <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-8 rounded-2xl border border-slate-200">
                 <div className="w-12 h-12 bg-blue-900 text-white rounded-lg flex items-center justify-center mb-6">
                    <ShieldCheck />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">Silent Generator Set</h3>
                 <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                    Adopt multiple excellent noise reduction equipment. Noise level reduced by 15-35 dB(A). Ideal for hospitals, hotels, and residential areas.
                 </p>
                 <div className="flex flex-wrap gap-2">
                     <span className="text-[10px] font-bold bg-white px-2 py-1 rounded border">Soundproof Canopy</span>
                     <span className="text-[10px] font-bold bg-white px-2 py-1 rounded border">50°C Radiator</span>
                 </div>
             </div>

             <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-8 rounded-2xl border border-slate-200">
                 <div className="w-12 h-12 bg-orange-500 text-white rounded-lg flex items-center justify-center mb-6">
                    <Zap />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">Mobile Generating Set</h3>
                 <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                    Also called "LunTuo". Features strong mobility and adaptability. Perfect for rescue emergency power supply and remote areas.
                 </p>
                 <div className="flex flex-wrap gap-2">
                     <span className="text-[10px] font-bold bg-white px-2 py-1 rounded border">Rainproof</span>
                     <span className="text-[10px] font-bold bg-white px-2 py-1 rounded border">High Mobility</span>
                 </div>
             </div>
             
             <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-8 rounded-2xl border border-slate-200 md:col-span-2">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-slate-800 text-white rounded-lg flex items-center justify-center">
                        <Factory />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">World Class Engine Partners</h3>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {['CUMMINS', 'PERKINS', 'MTU', 'VOLVO', 'YUCHAI', 'WEICHAI', 'YUNNEI', 'HONDA'].map(brand => (
                         <div key={brand} className="bg-white p-4 rounded text-center font-bold text-slate-700 text-sm border hover:border-blue-500 transition-colors shadow-sm">
                             {brand}
                         </div>
                     ))}
                 </div>
             </div>
         </div>
         
         <div className="border-t border-slate-100 pt-8 text-center text-slate-400 text-sm">
             <p>© 2024 CE Power Systems (Mindong Electric). All rights reserved.</p>
         </div>
      </div>
    </div>
  );
};

const PriceListContent = () => (
  <div className="w-full h-full bg-white overflow-y-auto text-slate-900 p-8 md:p-16">
    <div className="max-w-5xl mx-auto shadow-xl bg-white min-h-[1000px] border border-slate-200 rounded-sm p-12">
      {/* Header */}
      <div className="flex justify-between items-start mb-12 border-b-2 border-slate-900 pb-8">
         <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2 uppercase tracking-tight">Dealer Price List</h1>
            <p className="text-lg text-emerald-600 font-bold">2026 Official Catalogue</p>
         </div>
         <div className="text-right">
             <div className="text-2xl font-bold text-slate-900">CE Power</div>
             <p className="text-sm text-slate-500">Mindong Electric Co., Ltd</p>
             <p className="text-xs text-slate-400 mt-1">Effective Date: Jan 1, 2026</p>
         </div>
      </div>

      {/* Intro Text */}
      <div className="mb-8 p-4 bg-slate-50 rounded border-l-4 border-emerald-500">
        <p className="text-sm text-slate-600 italic">
            This document outlines the wholesale pricing for Engine and Water Pump sets. All prices are in Ethiopian Birr (ETB) and are subject to change without prior notice.
        </p>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="p-4 font-bold border-r border-slate-700 w-1/4">Engine brand</th>
              <th className="p-4 font-bold border-r border-slate-700 w-1/4">Engine power</th>
              <th className="p-4 font-bold border-r border-slate-700 w-1/4">Pump power</th>
              <th className="p-4 font-bold text-right w-1/4">Last Price (ETB)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {[
                { brand: "Yunnie", engine: "90 kw", pump: "55 kw", price: "2,450,000" },
                { brand: "Yunnie", engine: "120 kw", pump: "75 kw", price: "2,700,000" },
                { brand: "Yuchai", engine: "120 kw/138 kw", pump: "90 kw", price: "3,300,000" },
                { brand: "yuchai", engine: "159kw/176 kw", pump: "110 kw", price: "3,900,000" },
                { brand: "yuchai", engine: "200 kw/225 kw", pump: "132 kw", price: "4,750,000" },
                { brand: "yuchai", engine: "250 kw/280 kw", pump: "150 kw", price: "5,400,000" },
                { brand: "Weifan(last)", engine: "100kw/110 kw", pump: "75 kw", price: "2,600,000" },
                { brand: "kofo", engine: "120 kw/138 kw", pump: "90 kw", price: "2,900,000" },
                { brand: "kofo", engine: "150 kw/176 kw", pump: "110 kw", price: "3,400,000" },
            ].map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="p-4 border-r border-slate-200 font-medium text-slate-800 capitalize">{row.brand}</td>
                    <td className="p-4 border-r border-slate-200 text-slate-600">{row.engine}</td>
                    <td className="p-4 border-r border-slate-200 text-slate-600">{row.pump}</td>
                    <td className="p-4 text-right font-bold text-slate-900 font-mono">{row.price}</td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-16 pt-8 border-t border-slate-200 flex justify-between items-end text-sm text-slate-500">
         <div>
             <p className="font-bold text-slate-900">Terms & Conditions:</p>
             <ul className="list-disc pl-4 mt-1 space-y-1 text-xs">
                 <li>Prices include standard accessories.</li>
                 <li>Delivery time dependent on stock availability.</li>
                 <li>Payment terms: 50% advance, 50% before delivery.</li>
             </ul>
         </div>
         <div className="text-right">
             <div className="w-24 h-24 border-2 border-slate-900 rounded-full flex items-center justify-center opacity-20 transform -rotate-12">
                 <span className="font-black text-xs uppercase tracking-widest text-center">Official<br/>Document</span>
             </div>
         </div>
      </div>
    </div>
  </div>
);

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (file) {
      setIsLoading(true);
      // If it's the mock file, stop loading immediately
      if (file.name === 'CE_Power_Company_Profile.pdf' || file.name === 'Dealer_Price_List_2026.pdf') {
          setIsLoading(false);
      }
    }
  }, [file]);

  if (!file) return null;

  const isCompanyProfile = file.name === 'CE_Power_Company_Profile.pdf';
  const isPriceList = file.name === 'Dealer_Price_List_2026.pdf';
  const isImage = file.type === 'image' || file.mimeType.startsWith('image/');
  const isPDF = file.type === 'pdf' || file.mimeType === 'application/pdf';

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(file.downloadURL, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl h-[85vh] bg-transparent flex flex-col animate-in zoom-in-95 duration-200 pointer-events-none">
        
        {/* Header (Floating) */}
        <div className="flex items-center justify-between mb-4 pointer-events-auto px-2">
          <div className="flex items-center gap-3 text-white overflow-hidden">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
              {isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <h3 className="font-semibold text-lg truncate drop-shadow-md">{file.name}</h3>
          </div>
          
          <div className="flex items-center gap-2">
            {!isCompanyProfile && !isPriceList && (
                <>
                <button 
                onClick={handleDownload}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
                title="Download / Open Original"
                >
                <Download size={20} />
                </button>
                <button 
                onClick={() => window.open(file.downloadURL, '_blank')}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
                title="Open in New Tab"
                >
                <ExternalLink size={20} />
                </button>
                <div className="w-px h-6 bg-white/20 mx-2" />
                </>
            )}
            
            <button 
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-red-500/20 rounded-full transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-black/40 backdrop-blur-xl rounded-2xl overflow-hidden relative border border-white/10 shadow-2xl pointer-events-auto flex items-center justify-center">
            
            {isLoading && !isCompanyProfile && !isPriceList && (
              <div className="absolute inset-0 flex items-center justify-center text-emerald-500 z-0">
                <Loader2 className="w-10 h-10 animate-spin" />
              </div>
            )}

            {isCompanyProfile ? (
                 <CompanyProfileContent />
            ) : isPriceList ? (
                 <PriceListContent />
            ) : isImage ? (
              <img 
                src={file.downloadURL} 
                alt={file.name}
                className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setIsLoading(false)}
              />
            ) : isPDF ? (
              <iframe 
                src={`${file.downloadURL}#toolbar=0`}
                title={file.name}
                className="w-full h-full bg-white"
                onLoad={() => setIsLoading(false)}
              />
            ) : (
               <div className="text-center text-slate-400">
                 <p className="mb-4">Preview not available for this file type.</p>
                 <button 
                   onClick={handleDownload}
                   className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-500 transition-colors"
                 >
                   Download File
                 </button>
               </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
