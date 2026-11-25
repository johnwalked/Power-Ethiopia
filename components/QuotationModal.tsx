import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Printer, Download, X, CheckCircle, Zap, Shield, Building2 } from 'lucide-react';
import { Generator, WaterPump } from '../lib/productData';

interface QuotationModalProps {
    isOpen: boolean;
    onClose: () => void;
    generator: (Generator | WaterPump) | null;
}

export const QuotationModal: React.FC<QuotationModalProps> = ({ isOpen, onClose, generator }) => {
    const [clientName, setClientName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [isPrinted, setIsPrinted] = useState(false);

    if (!isOpen || !generator) return null;

    const isPump = 'inletSize' in generator;
    const ratingKW = generator.powerKW || 0;
    const brandName = generator.brand || 'CE Power';

    const quoteId = `CEP-${Date.now().toString().slice(-6)}`;
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const validityDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    const handlePrint = () => {
        setIsPrinted(true);
        setTimeout(() => {
            window.print();
        }, 150);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 md:p-6 bg-slate-950/85 backdrop-blur-xl overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
                >
                    {/* Modal Controls Header */}
                    <div className="flex items-center justify-between p-4 md:px-6 bg-slate-950 border-b border-white/10 text-white print:hidden">
                        <div className="flex items-center gap-2.5">
                            <FileText className="text-red-500 w-5 h-5" />
                            <h3 className="font-bold text-sm md:text-base">Official Equipment Quotation Generator</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrint}
                                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-red-900/30"
                            >
                                <Printer size={15} /> Print / Save as PDF
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Quotation Sheet Body */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white text-slate-900 print:p-0 print:m-0 print:text-black">

                        {/* Printable Quote Sheet */}
                        <div className="max-w-3xl mx-auto space-y-6">

                            {/* Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-red-600 pb-5 gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-lg">
                                            ⚡
                                        </div>
                                        <h1 className="text-2xl font-black tracking-tight text-slate-900">CE POWER</h1>
                                    </div>
                                    <p className="text-xs font-bold text-red-600 uppercase tracking-widest">
                                        Guangdong MINDONG Electric Co., Ltd. (Ethiopia Branch)
                                    </p>
                                    <p className="text-xs text-slate-600 mt-1">
                                        Kality Gabriel Industrial Zone, Addis Ababa, Ethiopia<br />
                                        Tel: +251 966 33 03 09 · Web: www.cepower.et · Email: info@cepower.et
                                    </p>
                                </div>

                                <div className="text-left sm:text-right text-xs space-y-1">
                                    <span className="inline-block px-2.5 py-1 rounded bg-red-100 text-red-700 font-mono font-bold text-xs uppercase mb-1">
                                        OFFICIAL QUOTATION
                                    </span>
                                    <p><span className="font-bold text-slate-600">Quote Ref:</span> <span className="font-mono font-bold">{quoteId}</span></p>
                                    <p><span className="font-bold text-slate-600">Date Issued:</span> {today}</p>
                                    <p><span className="font-bold text-slate-600">Valid Until:</span> {validityDate} (30 Days)</p>
                                </div>
                            </div>

                            {/* Client Info (Inputs before print, flat text in print) */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Prepared For / Client Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Ato Bekele Tadesse"
                                        value={clientName}
                                        onChange={e => setClientName(e.target.value)}
                                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-red-600 print:border-none print:p-0 print:font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Company / Organization</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Apex Construction PLC"
                                        value={companyName}
                                        onChange={e => setCompanyName(e.target.value)}
                                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-red-600 print:border-none print:p-0 print:font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        placeholder="+251 9..."
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-red-600 print:border-none print:p-0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Email / Project Location</label>
                                    <input
                                        type="text"
                                        placeholder="Addis Ababa, Hawassa, etc."
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-red-600 print:border-none print:p-0"
                                    />
                                </div>
                            </div>

                            {/* Equipment Line Item */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                                        <tr>
                                            <th className="p-3">Equipment Description</th>
                                            <th className="p-3 text-center">Type</th>
                                            <th className="p-3 text-center">Power Rating</th>
                                            <th className="p-3 text-center">Stock Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <tr>
                                            <td className="p-3.5">
                                                <p className="font-extrabold text-sm text-slate-900">{generator.name}</p>
                                                <p className="text-slate-600 text-[11px] mt-0.5">{generator.description || 'Heavy-duty industrial power solution engineered for continuous operation.'}</p>
                                            </td>
                                            <td className="p-3.5 text-center font-bold text-slate-700">{generator.type} {isPump ? 'Pump' : 'Canopy'}</td>
                                            <td className="p-3.5 text-center font-extrabold text-red-600 text-sm">
                                                {ratingKW > 0 ? `${ratingKW} kW` : (isPump ? (generator as WaterPump).inletSize : 'Std')} <br />
                                                <span className="text-[10px] text-slate-500 font-normal">
                                                    {isPump
                                                        ? `${(generator as WaterPump).flowRate} m³/h · ${(generator as WaterPump).maxHead}m Head`
                                                        : `(${(ratingKW / 0.8).toFixed(1)} kVA)`}
                                                </span>
                                            </td>
                                            <td className="p-3.5 text-center">
                                                <span className={`px-2 py-0.5 font-bold text-[10px] rounded-full ${generator.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {generator.inStock ? 'In Factory Stock' : 'Out of Stock'}
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Detailed Engineering Specifications */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">Factory Technical Specifications</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                                        <span className="text-[10px] text-slate-500 block">Engine Brand</span>
                                        <span className="font-bold text-slate-800">{brandName}</span>
                                    </div>
                                    {isPump ? (
                                        <>
                                            <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                                                <span className="text-[10px] text-slate-500 block">Inlet / Outlet</span>
                                                <span className="font-bold text-slate-800">{(generator as WaterPump).inletSize}</span>
                                            </div>
                                            <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                                                <span className="text-[10px] text-slate-500 block">Flow & Max Head</span>
                                                <span className="font-bold text-slate-800">{(generator as WaterPump).flowRate} m³/h · {(generator as WaterPump).maxHead}m</span>
                                            </div>
                                            <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                                                <span className="text-[10px] text-slate-500 block">Engine / Start</span>
                                                <span className="font-bold text-slate-800">{(generator as WaterPump).specs.engineModel}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                                                <span className="text-[10px] text-slate-500 block">Voltage / Phase</span>
                                                <span className="font-bold text-slate-800">{(generator as Generator).voltage || '400V / 230V'} ({(generator as Generator).phase || '3-Phase'})</span>
                                            </div>
                                            <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                                                <span className="text-[10px] text-slate-500 block">Fuel Consumption</span>
                                                <span className="font-bold text-slate-800">{(generator as Generator).fuelConsumption || 'Economy Diesel'}</span>
                                            </div>
                                            <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                                                <span className="text-[10px] text-slate-500 block">Weight</span>
                                                <span className="font-bold text-slate-800">{(generator as Generator).weight || 'Industrial Spec'}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Terms & Conditions */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
                                <h5 className="font-bold text-slate-800 uppercase tracking-wider text-xs mb-1">Standard Commercial Terms</h5>
                                <p>• <strong>Factory Warranty:</strong> 12 Months or 1,000 running hours against manufacturing defects.</p>
                                <p>• <strong>Certifications:</strong> ISO 9001, ISO 14001, CE, and TÜV Rheinland compliant.</p>
                                <p>• <strong>Service & Parts:</strong> Full inventory of spare parts and 24/7 technical field support available in Addis Ababa and all regional states.</p>
                                <p>• <strong>Delivery & Installation:</strong> Available directly to project site upon contract agreement.</p>
                            </div>

                            {/* Signature Footer */}
                            <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-xs">
                                <div>
                                    <p className="font-bold text-slate-900">Authorized Signature & Seal</p>
                                    <p className="text-slate-500 text-[11px]">CE Power Sales & Engineering Dept.</p>
                                    <div className="mt-4 font-script text-red-600 text-lg font-bold">CE Power Ethiopia</div>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-500 text-[10px]">Direct Sales Inquiry:</p>
                                    <p className="font-bold text-slate-800">09 66 33 03 09</p>
                                    <p className="text-slate-500 text-[10px]">info@cepower.et</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default QuotationModal;
