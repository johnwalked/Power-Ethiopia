
import React, { useState } from 'react';
import { Search, Filter, Droplets, Zap, Check, X, ArrowRight, Gauge, Activity, Ruler, ChevronDown, ArrowUpDown, ShoppingCart } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';

import { PUMPS, WaterPump } from '../lib/productData';

interface PageProps {
  onNavigate: (path: string) => void;
}

const Solutions: React.FC<PageProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const t = translations[language].products;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<WaterPump | null>(null);

  // Filter Logic
  const filteredPumps = PUMPS.filter(pump => {
    const matchesSearch = pump.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'All' || pump.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-slate-950 pt-28 pb-20 px-3 md:px-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-6 md:mb-10 text-center animate-in slide-in-from-bottom-4 duration-700 flex flex-col items-center">
        <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight mb-2 md:mb-3">
          {t.waterTitle} <span className="text-emerald-500">{t.solutionsTitle}</span>
        </h1>
        <p className="text-slate-400 max-w-2xl text-sm md:text-base mx-auto">
          {t.pumpDescription}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-6 md:mb-8 items-center justify-between bg-slate-900/50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5 backdrop-blur-sm sticky top-20 md:top-24 z-30 shadow-lg">
        <div className="relative w-full md:w-96 group">
          <input
            type="text"
            placeholder={t.searchPump}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/50 border border-white/10 rounded-lg md:rounded-xl py-2.5 md:py-3 pl-10 md:pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
          />
          <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
        </div>

        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
          {['All', 'Gasoline', 'Diesel', 'High Pressure', 'Industrial'].map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all border ${selectedType === type
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-900/20'
                : 'bg-slate-800 text-slate-400 border-white/5 hover:text-white hover:bg-slate-700'
                }`}
            >
              {type === 'All' ? t.all : type}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {filteredPumps.map((pump, idx) => (
          <div
            key={pump.id}
            onClick={() => setSelectedProduct(pump)}
            className={`
              group bg-slate-900/40 border border-white/10 rounded-xl overflow-hidden cursor-pointer
              hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-900/10 
              transition-all duration-300 flex flex-col relative
              animate-in fade-in slide-in-from-bottom-8 fill-mode-backwards
            `}
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {/* Image Area */}
            <div className="relative h-28 md:h-40 bg-slate-800/50 overflow-hidden">
              <img
                src={pump.image}
                alt={pump.name}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
              />

              {/* Type Badge */}
              <div className="absolute top-2 right-2">
                <span className="bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/10 shadow-sm truncate max-w-[80px]">
                  {pump.type}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-2.5 md:p-4 flex-1 flex flex-col gap-2">
              <h3 className="text-slate-100 font-bold text-xs md:text-sm leading-snug line-clamp-2 h-[2.5em]">
                {pump.name}
              </h3>

              {/* Key Specs */}
              <div className="space-y-1.5">
                {/* Inlet */}
                <div className="flex items-center justify-between text-[10px] md:text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Ruler size={10} className="text-emerald-500" /> {t.inlet}
                  </span>
                  <span className="text-slate-200 font-mono font-bold">{pump.inletSize}</span>
                </div>

                {/* Flow Rate */}
                <div className="flex items-center justify-between text-[10px] md:text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Droplets size={10} className="text-blue-500" /> {t.flowRate}
                  </span>
                  <span className="text-slate-200 font-mono font-bold">{pump.flowRate} m³/h</span>
                </div>
              </div>

              {/* Footer: Status */}
              <div className="mt-auto pt-2 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${pump.inStock ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                  <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wide ${pump.inStock ? 'text-emerald-500' : 'text-red-500'}`}>
                    {pump.inStock ? t.inStock : t.outStock}
                  </span>
                </div>
                <ArrowRight size={12} className="text-slate-600 group-hover:text-emerald-500 transition-colors" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* LIQUID GLASS MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setSelectedProduct(null)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-4xl bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col md:flex-row max-h-[90vh]">

            {/* Close Button */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all border border-white/10"
            >
              <X size={20} />
            </button>

            {/* Left: Image Side */}
            <div className="md:w-1/2 relative bg-gradient-to-br from-slate-800 to-slate-950 min-h-[300px] md:min-h-full">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent opacity-50" />
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50"
              />
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="absolute inset-0 w-full h-full object-contain p-8 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">{t.inStock}</span>
                  <span className="text-white font-mono font-bold">{t.model}: {selectedProduct.id.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Right: Details Side */}
            <div className="md:w-1/2 p-6 md:p-10 overflow-y-auto">
              <div className="mb-1">
                <span className="text-emerald-500 font-bold tracking-widest text-xs uppercase">{selectedProduct.type} Series</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4 leading-tight">
                {selectedProduct.name}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                {selectedProduct.description}
              </p>

              {/* Specifications Grid */}
              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-8">
                <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-colors group">
                  <Droplets className="w-5 h-5 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-[10px] text-slate-500 uppercase font-bold">{t.inlet}</div>
                  <div className="text-base md:text-lg font-bold text-white">{selectedProduct.inletSize}</div>
                </div>
                <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-colors group">
                  <ArrowUpDown className="w-5 h-5 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-[10px] text-slate-500 uppercase font-bold">{t.maxHead}</div>
                  <div className="text-base md:text-lg font-bold text-white">{selectedProduct.maxHead}m</div>
                </div>
                <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-colors group">
                  <Activity className="w-5 h-5 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-[10px] text-slate-500 uppercase font-bold">{t.flowRate}</div>
                  <div className="text-base md:text-lg font-bold text-white">{selectedProduct.flowRate} m³/h</div>
                </div>
                <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-colors group">
                  <Ruler className="w-5 h-5 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-[10px] text-slate-500 uppercase font-bold">{t.suction}</div>
                  <div className="text-base md:text-lg font-bold text-white">{selectedProduct.specs.suction}</div>
                </div>
              </div>

              <div className="mb-8 p-4 md:p-5 bg-white/5 rounded-2xl border border-white/5">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">{t.engineSpecs}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">{t.model}</span>
                    <span className="text-slate-200 font-mono">{selectedProduct.specs.engineModel}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">{t.fuelTank}</span>
                    <span className="text-slate-200 font-mono">{selectedProduct.specs.fuelTank}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-400">{t.startSystem}</span>
                    <span className="text-slate-200 font-mono">{selectedProduct.specs.startSystem}</span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-4 mt-auto">
                <button className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                  <ShoppingCart size={18} />
                  {t.orderNow}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Solutions;
