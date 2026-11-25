import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { LogOut, FileText, DownloadCloud, Search, Shield, HardDrive, Zap, LayoutGrid, Eye, Plus, Send, CheckCircle, Clock, MapPin, Building, Phone, X } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import FilePreviewModal, { FileItem } from '../components/FilePreviewModal';
import { GENERATORS, PUMPS } from '../lib/productData';

// --- Types ---
interface DealerInquiry {
  id: string;
  modelName: string;
  quantity: number;
  region: string;
  status: 'Pending Review' | 'Pro-Forma Dispatched' | 'Stock Allocated';
  date: string;
  notes?: string;
}

interface DashboardProps {
  onNavigate: (path: string) => void;
}

const DEFAULT_INQUIRIES: DealerInquiry[] = [
  {
    id: 'INQ-9481',
    modelName: 'Yuchai MDZ240YC Industrial (24.5 kW)',
    quantity: 2,
    region: 'Addis Ababa (Kality)',
    status: 'Stock Allocated',
    date: '2026-11-20',
    notes: 'Urgent delivery for commercial building backup'
  },
  {
    id: 'INQ-9482',
    modelName: 'Dongfeng Cummins MDZ30DK (24 kW)',
    quantity: 1,
    region: 'Hawassa Industrial Park',
    status: 'Pro-Forma Dispatched',
    date: '2026-11-22',
    notes: 'Standard silent canopy configuration'
  }
];

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [activeTab, setActiveTab] = useState<'resources' | 'inquiries'>('resources');
  
  // Inquiry Form State
  const [isNewInquiryOpen, setIsNewInquiryOpen] = useState(false);
  const [selectedGenId, setSelectedGenId] = useState(GENERATORS[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [deliveryRegion, setDeliveryRegion] = useState('Addis Ababa');
  const [inquiryNotes, setInquiryNotes] = useState('');
  const [inquirySuccess, setInquirySuccess] = useState(false);

  // Inquiries State
  const [inquiries, setInquiries] = useState<DealerInquiry[]>(() => {
    try {
      const saved = localStorage.getItem('ce_dealer_inquiries');
      return saved ? JSON.parse(saved) : DEFAULT_INQUIRIES;
    } catch {
      return DEFAULT_INQUIRIES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ce_dealer_inquiries', JSON.stringify(inquiries));
    } catch {}
  }, [inquiries]);

  const { language } = useLanguage();
  const t = translations[language].dashboard;

  const files: FileItem[] = [
      {
        id: '1',
        name: 'CE_Power_Company_Profile.pdf',
        size: 5800000,
        type: 'pdf',
        mimeType: 'application/pdf',
        createdAt: '2026-01-15T00:00:00.000Z',
        category: 'Corporate',
        summary: 'Official corporate profile of CE Power Ethiopia — direct factory branch of Guangdong MINDONG Electric Co., Ltd. (established 1958), supplying ISO9001 and TUV-certified diesel generators and water pumps across Ethiopia.',
        sections: [
          {
            heading: 'Factory Facility & Capabilities',
            points: [
              'Kality Gabriel Industrial Compound, Addis Ababa: Direct showroom, load-bank testing facility, and spare parts center.',
              'Over 65 years of rotating electrical machinery heritage (Est. 1958) with >10,000 commercial deployments.',
              'Certified to ISO 9001, ISO 14001, CE, IEC, and TÜV Rheinland quality benchmarks.'
            ]
          },
          {
            heading: 'Core Equipment Portfolios',
            points: [
              'Diesel Generators (2.2 kW – 3,000 kW): Weichai, Yuchai, Yunnei, KOFO, Weifang, United Power, and Cummins KTA50.',
              'Heavy-Duty Water Pumps (11 kW – 600 kW, featuring 80 kW – 250 kW agricultural & irrigation range).'
            ]
          }
        ]
      },
      {
        id: '2',
        name: 'Kality_Live_Stock_&_Specification_Matrix_2026.pdf',
        size: 450000,
        type: 'pdf',
        mimeType: 'application/pdf',
        createdAt: '2026-02-01T00:00:00.000Z',
        category: 'Inventory & Specs',
        summary: 'Current verified Addis Ababa warehouse stock levels and power output combinations for immediate dispatch and dealer allocation.',
        sections: [
          {
            heading: 'In-Stock Diesel Generator Sets',
            points: [
              'Weichai Silent Series: 200kW, 300kW, 400kW, 500kW, 600kW (400V / 50Hz / 3-Phase).',
              'Yuchai Series: 60kW, 80kW, 100kW, 120kW, 150kW, 200kW, 250kW, 300kW, 360kW, 400kW, 450kW.',
              'Yunnei Commercial Workhorse: 15kW, 20kW, 30kW, 50kW, 60kW, 80kW, 100kW, 120kW.',
              'KOFO (200kW), Weifang (50kW, 100kW, 120kW, 150kW), and United Power (2.2kW – 11kW).'
            ]
          },
          {
            heading: 'High-Capacity Water Pumps (80kW – 250kW)',
            points: [
              'Direct diesel pump sets & centrifugal units: 80kW (Yuchai), 100kW (Yunnei), 120kW (Yunnei), 150kW (Weifang), 180kW (Kefo), 200kW (Last/Weichai), 250kW (Weichai Mega Flow).',
              'Heads from 75m up to 110m and flow rates up to 750–800 m³/h for irrigation and dewatering.'
            ]
          }
        ]
      },
      {
        id: '3',
        name: 'CE_Power_Factory_Warranty_Terms.pdf',
        size: 820000,
        type: 'pdf',
        mimeType: 'application/pdf',
        createdAt: '2026-03-10T00:00:00.000Z',
        category: 'Warranty',
        summary: 'Standard factory warranty terms protecting every authorized distributor and end customer against material or workmanship defects.',
        sections: [
          {
            heading: 'Coverage & Service Commitments',
            points: [
              'Standard Coverage: 12 Months from commissioning or 1,000 operating hours (whichever comes first).',
              'Free delivery inside Addis Ababa municipal boundaries + nation-wide freight forwarding support.',
              'Genuine filters, AVRs, fuel injectors, and SmartGen/DeepSea controllers stocked at Kality Gabriel.'
            ]
          }
        ]
      },
      {
        id: '4',
        name: 'Altitude_Derating_&_Pump_Sizing_Guide.pdf',
        size: 3400000,
        type: 'pdf',
        mimeType: 'application/pdf',
        createdAt: '2026-04-05T00:00:00.000Z',
        category: 'Technical',
        summary: 'Ethiopian engineering guide for generator derating in highland cities (Addis Ababa ~2,355m) and matching generators to 80kW–250kW water pumps.',
        sections: [
          {
            heading: 'Addis Ababa Elevation Derating & Margin Rules',
            points: [
              'At ~2,355m altitude, lower air density reduces diesel aspirated air output by ~10–12%.',
              'Apply a mandatory 20–25% headroom buffer on continuous kW load calculations.',
              'For 80kW–250kW electric pumps without soft-starters, account for 2.5x–3.0x locked-rotor inrush surge.'
            ]
          }
        ]
      },
  ];

  const handleSignOut = async () => {
    await signOut();
    onNavigate('/');
  };

  const handleCreateInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    const gen = GENERATORS.find(g => g.id === selectedGenId);
    const pump = PUMPS.find(p => p.id === selectedGenId);
    const selectedName = gen ? `${gen.name} (${gen.powerKW} kW)` : pump ? `${pump.name} (${pump.flowRate} m³/h)` : '';
    if (!selectedName) return;

    const newInquiry: DealerInquiry = {
      id: `INQ-${Math.floor(1000 + Math.random() * 9000)}`,
      modelName: selectedName,
      quantity: Math.max(1, quantity),
      region: deliveryRegion,
      status: 'Pending Review',
      date: new Date().toISOString().split('T')[0],
      notes: inquiryNotes
    };

    setInquiries(prev => [newInquiry, ...prev]);
    setInquirySuccess(true);
    setInquiryNotes('');
    setTimeout(() => {
      setInquirySuccess(false);
      setIsNewInquiryOpen(false);
      setActiveTab('inquiries');
    }, 1200);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
         <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                <LayoutGrid className="text-red-500" />
                {t.title}
            </h1>
            <p className="text-slate-400">{t.subtitle}</p>
         </div>
         <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
                <div className="w-8 h-8 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center font-bold text-xs border border-red-500/30">
                    {(user?.email || 'U').substring(0,2).toUpperCase()}
                </div>
                <div className="text-sm">
                    <p className="font-bold text-slate-200 leading-none">{user?.displayName || t.partner}</p>
                    <p className="text-[10px] text-red-400 font-medium">{t.dealer}</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 shadow-sm backdrop-blur-md">
            <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-red-500/10 text-red-400 rounded-lg border border-red-500/10">
                    <Shield size={18} />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${user ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'}`}>
                  {user ? 'Tier-1 Authorized' : 'Guest Preview'}
                </span>
            </div>
            <h3 className="text-slate-400 text-xs font-medium mb-1">{t.status}</h3>
            <p className="text-xl font-bold text-white">{user ? t.verified : 'Preview Access'}</p>
        </div>

        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 shadow-sm backdrop-blur-md">
            <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/10">
                    <HardDrive size={18} />
                </div>
            </div>
            <h3 className="text-slate-400 text-xs font-medium mb-1">{t.resources}</h3>
            <p className="text-xl font-bold text-white">{files.length} Technical Docs</p>
        </div>

        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 shadow-sm backdrop-blur-md">
            <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-green-500/10 text-green-400 rounded-lg border border-green-500/10">
                    <CheckCircle size={18} />
                </div>
            </div>
            <h3 className="text-slate-400 text-xs font-medium mb-1">Active Inquiries</h3>
            <p className="text-xl font-bold text-white">{inquiries.length} In Progress</p>
        </div>

        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 shadow-sm backdrop-blur-md">
            <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/10">
                    <Zap size={18} />
                </div>
            </div>
            <h3 className="text-slate-400 text-xs font-medium mb-1">{t.update}</h3>
            <p className="text-xl font-bold text-white">v2.4 Catalog</p>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
            <button
                onClick={() => setActiveTab('resources')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'resources' 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-900/30' 
                    : 'bg-white/5 text-slate-400 hover:text-white'}`}
            >
                📁 Factory Documentation ({files.length})
            </button>
            <button
                onClick={() => setActiveTab('inquiries')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'inquiries' 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-900/30' 
                    : 'bg-white/5 text-slate-400 hover:text-white'}`}
            >
                📝 Stock Inquiries & Orders ({inquiries.length})
            </button>
        </div>

        <button
            onClick={() => setIsNewInquiryOpen(true)}
            className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-95"
        >
            <Plus size={15} /> Request Stock / Pro-Forma
        </button>
      </div>

      {/* TAB 1: Resources Table */}
      {activeTab === 'resources' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
            <div className="p-5 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-base font-bold text-white">{t.factoryResources}</h2>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder={t.search}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs focus:border-red-500 outline-none text-white placeholder:text-slate-500 backdrop-blur-sm"
                    />
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-slate-400 font-semibold uppercase text-[11px]">
                        <tr>
                            <th className="px-6 py-3.5">{t.table.name}</th>
                            <th className="px-6 py-3.5">Category</th>
                            <th className="px-6 py-3.5">{t.table.date}</th>
                            <th className="px-6 py-3.5">{t.table.size}</th>
                            <th className="px-6 py-3.5 text-right">{t.table.action}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {filteredFiles.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                    No documents found.
                                </td>
                            </tr>
                        ) : (
                            filteredFiles.map((file) => (
                                <tr key={file.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/10">
                                                <FileText size={16} />
                                            </div>
                                            <span className="font-medium text-slate-200 group-hover:text-white transition-colors">{file.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3.5 text-slate-400">
                                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[10px]">
                                            {file.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3.5 text-slate-500 font-mono">
                                        {new Date(file.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-3.5 text-slate-500 font-mono">
                                        {formatFileSize(file.size)}
                                    </td>
                                    <td className="px-6 py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => setPreviewFile(file)}
                                                className="text-white hover:text-red-300 font-medium text-xs bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1.5 shadow-md shadow-red-900/30"
                                            >
                                                <Eye size={13} /> {t.table.view || "Preview"}
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
      )}

      {/* TAB 2: Live Inquiries Table */}
      {activeTab === 'inquiries' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
            <div className="p-5 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-base font-bold text-white">Registered Distributor Stock Inquiries</h2>
                <span className="text-xs text-slate-400">{inquiries.length} recorded inquiries</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-slate-400 font-semibold uppercase text-[11px]">
                        <tr>
                            <th className="px-6 py-3.5">Inquiry Ref</th>
                            <th className="px-6 py-3.5">Generator Model</th>
                            <th className="px-6 py-3.5">Qty</th>
                            <th className="px-6 py-3.5">Destination Region</th>
                            <th className="px-6 py-3.5">Status</th>
                            <th className="px-6 py-3.5">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {inquiries.map((inq) => (
                            <tr key={inq.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-3.5 font-mono font-bold text-red-400">
                                    {inq.id}
                                </td>
                                <td className="px-6 py-3.5 font-medium text-white">
                                    {inq.modelName}
                                    {inq.notes && <span className="block text-[10px] text-slate-500 font-normal">{inq.notes}</span>}
                                </td>
                                <td className="px-6 py-3.5 font-bold text-white">
                                    {inq.quantity} unit(s)
                                </td>
                                <td className="px-6 py-3.5 text-slate-300">
                                    {inq.region}
                                </td>
                                <td className="px-6 py-3.5">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        inq.status === 'Stock Allocated' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                        inq.status === 'Pro-Forma Dispatched' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                        'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                    }`}>
                                        {inq.status}
                                    </span>
                                </td>
                                <td className="px-6 py-3.5 text-slate-500 font-mono">
                                    {inq.date}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* New Inquiry Modal Form */}
      {isNewInquiryOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
            <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 text-white space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="font-bold text-base flex items-center gap-2">
                        <Send size={16} className="text-red-500" />
                        Submit Stock / Pro-Forma Request
                    </h3>
                    <button onClick={() => setIsNewInquiryOpen(false)} className="text-slate-400 hover:text-white">
                        <X size={18} />
                    </button>
                </div>

                {inquirySuccess ? (
                    <div className="py-8 text-center space-y-2">
                        <CheckCircle size={40} className="text-green-400 mx-auto animate-bounce" />
                        <h4 className="font-bold text-lg text-white">Inquiry Submitted Successfully</h4>
                        <p className="text-xs text-slate-400">Our Kality sales engineering desk has received your request.</p>
                    </div>
                ) : (
                    <form onSubmit={handleCreateInquiry} className="space-y-3.5 text-xs">
                        <div>
                            <label className="block text-slate-400 mb-1 font-bold">Select Equipment (Generator or Pump)</label>
                            <select
                                value={selectedGenId}
                                onChange={e => setSelectedGenId(e.target.value)}
                                className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                            >
                                <optgroup label="Diesel Generators">
                                  {GENERATORS.map(g => (
                                      <option key={g.id} value={g.id}>
                                          {g.name} ({g.powerKW} kW - {g.brand})
                                      </option>
                                  ))}
                                </optgroup>
                                <optgroup label="Water Pumps (80–250 kW & Farm Series)">
                                  {PUMPS.map(p => (
                                      <option key={p.id} value={p.id}>
                                          {p.name} ({p.powerKW ? `${p.powerKW} kW · ` : ''}{p.inletSize})
                                      </option>
                                  ))}
                                </optgroup>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-slate-400 mb-1 font-bold">Required Units</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={50}
                                    value={quantity}
                                    onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 mb-1 font-bold">Project Delivery Region</label>
                                <select
                                    value={deliveryRegion}
                                    onChange={e => setDeliveryRegion(e.target.value)}
                                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                                >
                                    {['Addis Ababa', 'Oromia', 'Amhara', 'Tigray', 'Sidama / Hawassa', 'Dire Dawa', 'Afar', 'Somali', 'Benishangul'].map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-slate-400 mb-1 font-bold">Project Notes / Voltage Requirements (Optional)</label>
                            <textarea
                                rows={3}
                                placeholder="Specify ATS panel, sound enclosure, or project timeline..."
                                value={inquiryNotes}
                                onChange={e => setInquiryNotes(e.target.value)}
                                className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-red-500 placeholder:text-slate-600"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-lg shadow-red-900/40 flex items-center justify-center gap-2"
                        >
                            <Send size={15} /> Submit to Factory Desk
                        </button>
                    </form>
                )}
            </div>
        </div>
      )}

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
