import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, X, Plus, Trash2, CheckCircle2, Zap, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { GENERATORS, Generator } from '../lib/productData';
import { assetUrl } from '../lib/assetUtils';
import { useLanguage } from '../lib/LanguageContext';

interface ApplianceItem {
    id: string;
    name: string;
    category: 'residential' | 'commercial' | 'industrial' | 'agricultural' | 'custom';
    runningWatts: number;
    startingSurgeFactor: number;
    quantity: number;
}

const DEFAULT_APPLIANCES: ApplianceItem[] = [
    { id: 'app-1', name: 'LED Lighting (10 bulbs)', category: 'residential', runningWatts: 150, startingSurgeFactor: 1.0, quantity: 2 },
    { id: 'app-2', name: 'Commercial Refrigerator', category: 'residential', runningWatts: 800, startingSurgeFactor: 2.5, quantity: 1 },
    { id: 'app-3', name: 'Air Conditioner (2.0 HP)', category: 'commercial', runningWatts: 2200, startingSurgeFactor: 3.0, quantity: 1 },
    { id: 'app-4', name: 'Water Booster Pump (1.5 HP)', category: 'agricultural', runningWatts: 1200, startingSurgeFactor: 2.8, quantity: 1 },
    { id: 'app-5', name: 'Workstation / Servers', category: 'commercial', runningWatts: 600, startingSurgeFactor: 1.2, quantity: 3 }
];

const PRESETS = [
    {
        name: 'Home / Villa',
        desc: 'Essential lighting, refrigeration, entertainment, and water pumps.',
        items: [
            { id: 'p1', name: 'Lighting & TV', category: 'residential' as const, runningWatts: 400, startingSurgeFactor: 1.0, quantity: 1 },
            { id: 'p2', name: 'Double Refrigerator', category: 'residential' as const, runningWatts: 700, startingSurgeFactor: 2.5, quantity: 1 },
            { id: 'p3', name: 'Water Pump (1 HP)', category: 'residential' as const, runningWatts: 900, startingSurgeFactor: 2.5, quantity: 1 },
            { id: 'p4', name: 'Microwave & Kitchen', category: 'residential' as const, runningWatts: 1500, startingSurgeFactor: 1.2, quantity: 1 }
        ]
    },
    {
        name: 'Office / Clinic',
        desc: 'Computers, servers, LED lighting, and continuous air conditioning.',
        items: [
            { id: 'p5', name: 'Office Workstations (10x)', category: 'commercial' as const, runningWatts: 2500, startingSurgeFactor: 1.2, quantity: 1 },
            { id: 'p6', name: 'Central AC Units (2x)', category: 'commercial' as const, runningWatts: 5000, startingSurgeFactor: 2.8, quantity: 1 },
            { id: 'p7', name: 'Server Rack & Network', category: 'commercial' as const, runningWatts: 1200, startingSurgeFactor: 1.1, quantity: 1 },
            { id: 'p8', name: 'Facility Lighting', category: 'commercial' as const, runningWatts: 800, startingSurgeFactor: 1.0, quantity: 1 }
        ]
    },
    {
        name: 'Workshop / Industrial',
        desc: 'Heavy motors, arc welding, air compressors, and three-phase equipment.',
        items: [
            { id: 'p9', name: 'Arc Welder (Inverter)', category: 'industrial' as const, runningWatts: 7500, startingSurgeFactor: 1.5, quantity: 1 },
            { id: 'p10', name: 'Air Compressor (5 HP)', category: 'industrial' as const, runningWatts: 4500, startingSurgeFactor: 3.0, quantity: 1 },
            { id: 'p11', name: 'Industrial Lathe / Mill', category: 'industrial' as const, runningWatts: 5500, startingSurgeFactor: 2.5, quantity: 1 },
            { id: 'p12', name: 'High-Bay Industrial Lighting', category: 'industrial' as const, runningWatts: 1500, startingSurgeFactor: 1.0, quantity: 1 }
        ]
    }
];

interface SizingCalculatorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectProduct?: (product: Generator) => void;
}

export const SizingCalculator: React.FC<SizingCalculatorProps> = ({ isOpen, onClose, onSelectProduct }) => {
    const [appliances, setAppliances] = useState<ApplianceItem[]>(DEFAULT_APPLIANCES);
    const [safetyMargin, setSafetyMargin] = useState<number>(20); // 20% standard margin
    const [customName, setCustomName] = useState('');
    const [customWatts, setCustomWatts] = useState('');
    const [customSurge, setCustomSurge] = useState('2.0');

    // Calculations
    const calculations = useMemo(() => {
        let totalRunning = 0;
        let peakSurge = 0;

        appliances.forEach(item => {
            const itemRunning = item.runningWatts * item.quantity;
            const itemStarting = itemRunning * item.startingSurgeFactor;
            totalRunning += itemRunning;
            if (itemStarting > peakSurge) {
                peakSurge = itemStarting;
            }
        });

        // Recommended running capacity with safety buffer
        const recommendedRunningWatts = totalRunning * (1 + safetyMargin / 100);
        // Required peak start capacity
        const totalStartingWatts = totalRunning - (appliances.length > 0 ? appliances[0].runningWatts : 0) + peakSurge;
        const recommendedPeakWatts = totalStartingWatts * (1 + safetyMargin / 100);

        const recommendedKW = Math.ceil(Math.max(recommendedRunningWatts, recommendedPeakWatts) / 1000);
        // 0.8 power factor for industrial 3-phase kVA
        const recommendedKVA = (recommendedKW / 0.8).toFixed(1);

        // Find matching CE Power generators
        const matched = GENERATORS
            .filter(g => g.powerKW >= recommendedKW * 0.95)
            .sort((a, b) => a.powerKW - b.powerKW)
            .slice(0, 3);

        return {
            totalRunningWatts: Math.round(totalRunning),
            recommendedKW,
            recommendedKVA,
            matchedGenerators: matched
        };
    }, [appliances, safetyMargin]);

    const handleAddCustom = (e: React.FormEvent) => {
        e.preventDefault();
        const watts = parseFloat(customWatts);
        const surge = parseFloat(customSurge);
        if (!customName || isNaN(watts) || watts <= 0) return;

        const newItem: ApplianceItem = {
            id: `custom-${Date.now()}`,
            name: customName,
            category: 'custom',
            runningWatts: watts,
            startingSurgeFactor: isNaN(surge) || surge < 1 ? 1 : surge,
            quantity: 1
        };

        setAppliances(prev => [...prev, newItem]);
        setCustomName('');
        setCustomWatts('');
        setCustomSurge('2.0');
    };

    const updateQuantity = (id: string, delta: number) => {
        setAppliances(prev => prev.map(item => {
            if (item.id === id) {
                const newQ = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQ };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const removeAppliance = (id: string) => {
        setAppliances(prev => prev.filter(item => item.id !== id));
    };

    const applyPreset = (presetItems: ApplianceItem[]) => {
        setAppliances(presetItems.map(item => ({ ...item, id: `${item.id}-${Date.now()}` })));
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-xl overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-5xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 md:p-6 border-b border-white/10 bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/40">
                                <Calculator className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-extrabold text-white">Power Load Sizing Calculator</h3>
                                <p className="text-xs text-slate-400">Calculate electrical load and discover recommended industrial generators</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Presets Bar */}
                    <div className="p-4 md:px-6 bg-slate-950/40 border-b border-white/5 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Quick Presets:</span>
                        {PRESETS.map((preset, i) => (
                            <button
                                key={i}
                                onClick={() => applyPreset(preset.items)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-red-600 hover:text-white text-slate-300 transition-all border border-white/5"
                                title={preset.desc}
                            >
                                ⚡ {preset.name}
                            </button>
                        ))}
                    </div>

                    {/* Body Grid */}
                    <div className="flex-1 overflow-y-auto p-5 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

                        {/* Left: Appliance List & Add form */}
                        <div className="lg:col-span-7 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Connected Loads & Equipment</h4>
                                <span className="text-xs text-slate-400">{appliances.length} items configured</span>
                            </div>

                            {/* Appliance Cards */}
                            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                {appliances.map(item => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all text-xs"
                                    >
                                        <div className="flex-1 pr-3">
                                            <p className="font-bold text-slate-100">{item.name}</p>
                                            <p className="text-[11px] text-slate-400">
                                                {item.runningWatts} W each · Surge factor {item.startingSurgeFactor}x
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-white/10">
                                                <button
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                    className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white"
                                                >
                                                    -
                                                </button>
                                                <span className="w-7 text-center font-bold text-white">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                    className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <div className="w-16 text-right font-mono font-bold text-red-400">
                                                {(item.runningWatts * item.quantity).toLocaleString()} W
                                            </div>

                                            <button
                                                onClick={() => removeAppliance(item.id)}
                                                className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {appliances.length === 0 && (
                                    <div className="text-center py-8 text-slate-500 text-xs">
                                        No appliances added. Pick a preset above or add custom loads below.
                                    </div>
                                )}
                            </div>

                            {/* Add Custom Form */}
                            <form onSubmit={handleAddCustom} className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-3">
                                <span className="text-xs font-bold text-slate-300 block">Add Custom Equipment / Motor</span>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <input
                                        type="text"
                                        placeholder="Name (e.g. Grain Mill)"
                                        value={customName}
                                        onChange={e => setCustomName(e.target.value)}
                                        className="px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Running Watts (W)"
                                        value={customWatts}
                                        onChange={e => setCustomWatts(e.target.value)}
                                        className="px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500"
                                    />
                                    <div className="flex gap-2">
                                        <select
                                            value={customSurge}
                                            onChange={e => setCustomSurge(e.target.value)}
                                            className="px-2 py-2 rounded-lg bg-slate-800 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-red-500 flex-1"
                                            title="Motor Start Surge Multiplier"
                                        >
                                            <option value="1.0">1.0x (Resistive)</option>
                                            <option value="1.5">1.5x (Electronic)</option>
                                            <option value="2.0">2.0x (Light Motor)</option>
                                            <option value="2.5">2.5x (Pump/Compressor)</option>
                                            <option value="3.0">3.0x (Heavy Inductive)</option>
                                        </select>
                                        <button
                                            type="submit"
                                            className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors flex items-center justify-center shrink-0"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Right: Recommendation Panel */}
                        <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/80 border border-white/10 shadow-lg">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sizing Results</h4>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                        <span>Buffer:</span>
                                        <select
                                            value={safetyMargin}
                                            onChange={e => setSafetyMargin(Number(e.target.value))}
                                            className="bg-slate-800 border border-white/10 text-white text-xs rounded px-1.5 py-0.5"
                                        >
                                            <option value={15}>15%</option>
                                            <option value={20}>20% (Std)</option>
                                            <option value={25}>25%</option>
                                            <option value={30}>30%</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Main Metric Highlight */}
                                <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-center mb-5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 text-red-500/20">
                                        <Zap size={60} />
                                    </div>
                                    <p className="text-xs text-red-300 font-bold uppercase tracking-wider mb-1">Recommended Generator Rating</p>
                                    <div className="text-4xl font-extrabold text-white tracking-tight my-1">
                                        {calculations.recommendedKW} <span className="text-red-400 text-2xl font-bold">kW</span>
                                    </div>
                                    <p className="text-xs text-slate-400 font-mono">
                                        ≈ {calculations.recommendedKVA} kVA (3-Phase 0.8 PF) · Base Load: {(calculations.totalRunningWatts / 1000).toFixed(1)} kW
                                    </p>
                                </div>

                                {/* Matched In-Stock Generators */}
                                <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                    <ShieldCheck className="text-green-400 w-4 h-4" />
                                    Top Matching CE Power Units:
                                </h5>

                                <div className="space-y-2 mb-4">
                                    {calculations.matchedGenerators.map(gen => (
                                        <div
                                            key={gen.id}
                                            className="p-3 rounded-xl bg-slate-900/90 border border-white/10 hover:border-red-500/40 transition-all flex items-center justify-between group cursor-pointer"
                                            onClick={() => {
                                                onClose();
                                                window.location.hash = '#/product';
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <img src={assetUrl(gen.image)} alt={gen.name} className="w-10 h-10 rounded-lg object-contain bg-slate-800 p-1" />
                                                <div>
                                                    <p className="text-xs font-bold text-white group-hover:text-red-400 transition-colors truncate max-w-[170px]">{gen.name}</p>
                                                    <p className="text-[10px] text-slate-400">{gen.brand} · {gen.type} Frame</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-extrabold text-white">{gen.powerKW} kW</span>
                                                <span className={`block text-[10px] font-bold ${gen.inStock ? 'text-green-400' : 'text-red-400'}`}>
                                                    {gen.inStock ? 'In Stock' : 'Out of Stock'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    onClose();
                                    window.location.hash = '#/product';
                                }}
                                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-900/40 flex items-center justify-center gap-2"
                            >
                                Browse All Matching Generators <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default SizingCalculator;
