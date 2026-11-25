import React, { useState, useMemo } from 'react';
import { Search, Droplets, X, ArrowRight, Activity, Ruler, ArrowUpDown, ShoppingCart, Zap, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';

import { PUMPS, WaterPump } from '../lib/productData';
import { assetUrl } from '../lib/assetUtils';
import QuotationModal from '../components/QuotationModal';

interface PageProps {
  onNavigate: (path: string) => void;
}

const Solutions: React.FC<PageProps> = () => {
  const { language } = useLanguage();
  const t = translations[language].products;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [powerFilter, setPowerFilter] = useState<'all' | '80-250' | 'under-80' | '250+'>('all');
  const [selectedProduct, setSelectedProduct] = useState<WaterPump | null>(null);
  const [quotationPump, setQuotationPump] = useState<WaterPump | null>(null);

  // Filter Logic
  const filteredPumps = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return PUMPS.filter(pump => {
      const matchesSearch = !q ||
        pump.name.toLowerCase().includes(q) ||
        (pump.brand && pump.brand.toLowerCase().includes(q)) ||
        pump.inletSize.toLowerCase().includes(q) ||
        pump.description.toLowerCase().includes(q);
      const matchesType = selectedType === 'All' || pump.type === selectedType;
      const kw = pump.powerKW || 0;
      const matchesPower =
        powerFilter === 'all' ? true :
        powerFilter === '80-250' ? (kw >= 80 && kw <= 250) :
        powerFilter === 'under-80' ? (kw < 80) :
        (kw > 250);

      return matchesSearch && matchesType && matchesPower;
    });
  }, [searchQuery, selectedType, powerFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('All');
    setPowerFilter('all');
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-28 pb-20 px-3 md:px-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-6 md:mb-10 text-center animate-in slide-in-from-bottom-4 duration-700 flex flex-col items-center">
        <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight mb-2 md:mb-3">
          {t.waterTitle} <span className="text-red-500">{t.solutionsTitle}</span>
        </h1>
        <p className="text-slate-400 max-w-2xl text-sm md:text-base mx-auto">
          {t.pumpDescription}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 mb-6 md:mb-8 glass p-3 md:p-4 rounded-xl md:rounded-2xl sticky top-[76px] md:top-24 z-30 shadow-lg">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96 group">
            <input
              type="text"
              placeholder={t.searchPump}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/70 backdrop-blur-md border border-white/10 rounded-lg md:rounded-xl py-2.5 md:py-3 pl-10 md:pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
            />
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-500 transition-colors" />
          </div>

          <div className="flex flex-wrap gap-1.5 md:gap-2 w-full md:w-auto">
            {[
              { id: 'all', label: t.all },
              { id: '80-250', label: '80–250 kW' },
              { id: 'under-80', label: '< 80 kW' },
              { id: '250+', label: '250+ kW' },
            ].map(pf => (
              <button
                key={pf.id}
                onClick={() => setPowerFilter(pf.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${powerFilter === pf.id
                  ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-900/20'
                  : 'bg-slate-800/80 text-slate-300 border-white/5 hover:text-white hover:bg-slate-700'
                  }`}
              >
                {pf.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
          <div className="flex flex-wrap gap-1.5">
            {['All', 'Diesel', 'High Pressure', 'Industrial'].map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-2.5 md:px-3 py-1 rounded-lg text-[11px] md:text-xs font-semibold whitespace-nowrap transition-all border ${selectedType === type
                  ? 'bg-white/15 text-white border-white/25'
                  : 'bg-white/5 text-slate-400 border-transparent hover:text-white hover:bg-white/10'
                  }`}
              >
                {type === 'All' ? t.all : type}
              </button>
            ))}
          </div>

          <span className="text-slate-400 text-xs">
            {t.showing} <strong className="text-white">{filteredPumps.length}</strong> {t.results}
          </span>
        </div>
      </div>

      {/* Empty State or Grid */}
      {filteredPumps.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-80 flex flex-col items-center justify-center bg-slate-900/30 rounded-3xl border border-white/5 border-dashed"
        >
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-500">
            <Search size={32} />
          </div>
          <h3 className="text-white font-bold text-lg">{t.noResults}</h3>
          <button onClick={clearFilters} className="mt-4 text-red-500 font-bold hover:underline">
            {t.clearFilters}
          </button>
        </motion.div>
      ) : (
        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          <AnimatePresence mode="popLayout">
            {filteredPumps.map((pump, idx) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
                transition={{ duration: 0.35, delay: idx > 15 ? 0 : idx * 0.03 }}
                key={pump.id}
                onClick={() => setSelectedProduct(pump)}
                className="group glass-card rounded-xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col relative"
              >
                {/* Image Area */}
                <div className="relative h-32 md:h-40 studio-stage flex items-center justify-center p-2.5 overflow-hidden">
                  <img
                    src={assetUrl(pump.image)}
                    alt={pump.name}
                    loading="lazy"
                    className="max-w-full max-h-full object-contain drop-shadow-[0_6px_14px_rgba(2,6,23,0.18)] group-hover:scale-105 transition-transform duration-500 will-change-transform"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-slate-900/20 to-transparent" />

                  {/* Type Badge */}
                  <div className="absolute top-2 right-2">
                    <span className="bg-slate-950/80 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded border border-white/15 shadow-sm truncate max-w-[90px]">
                      {pump.type}
                    </span>
                  </div>

                  {/* Power Badge */}
                  {pump.powerKW && (
                    <div className="absolute top-2 left-2">
                      <span className="bg-red-600/95 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-0.5">
                        <Zap size={9} /> {pump.powerKW} kW
                      </span>
                    </div>
                  )}
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
                        <Ruler size={10} className="text-red-500" /> {t.inlet}
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
                      <div className={`w-1.5 h-1.5 rounded-full ${pump.inStock ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 animate-pulse'}`} />
                      <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wide ${pump.inStock ? 'text-green-400' : 'text-red-400'}`}>
                        {pump.inStock ? t.inStock : t.outStock}
                      </span>
                    </div>
                    <ArrowRight size={12} className="text-slate-600 group-hover:text-red-500 transition-colors" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* LIQUID GLASS MODAL */}
      <AnimatePresence>
      {selectedProduct && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-xl"
            onClick={() => setSelectedProduct(null)}
          />

          {/* Modal Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl bg-slate-900/50 backdrop-blur-3xl border border-white/10 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] inner-glow"
          >

            {/* Close Button */}
            <button
              onClick={() => setSelectedProduct(null)}
              aria-label="Close modal"
              className="absolute top-4 right-4 z-20 p-2 bg-black/30 hover:bg-red-600 text-white rounded-full backdrop-blur-md transition-all border border-white/10"
            >
              <X size={20} />
            </button>

            {/* Left: Image Side */}
            <div className="md:w-1/2 relative studio-stage min-h-[250px] md:min-h-full">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(239,68,68,0.08),transparent_70%)] pointer-events-none" />
              <img
                src={assetUrl(selectedProduct.image)}
                alt={selectedProduct.name}
                className="absolute inset-0 w-full h-full object-contain p-8 drop-shadow-[0_20px_40px_rgba(2,6,23,0.22)] transform hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-slate-950/85 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 flex justify-between items-center shadow-lg">
                  <span className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 ${selectedProduct.inStock ? 'text-green-400' : 'text-red-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${selectedProduct.inStock ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                    {selectedProduct.inStock ? t.inStock : t.outStock}
                  </span>
                  <span className="text-white font-mono text-xs md:text-sm font-bold">
                    {selectedProduct.powerKW ? `${selectedProduct.powerKW} kW` : selectedProduct.specs.engineModel}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Details Side */}
            <div className="md:w-1/2 p-6 md:p-10 overflow-y-auto">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-red-500 font-bold tracking-widest text-xs uppercase">{selectedProduct.type} Series</span>
                {selectedProduct.brand && (
                  <span className="text-slate-400 text-xs font-semibold">· {selectedProduct.brand}</span>
                )}
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4 leading-tight">
                {selectedProduct.name}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                {selectedProduct.description}
              </p>

              {/* Specifications Grid */}
              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-8">
                <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/30 transition-colors group">
                  <Droplets className="w-5 h-5 text-red-500 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-[10px] text-slate-500 uppercase font-bold">{t.inlet}</div>
                  <div className="text-base md:text-lg font-bold text-white">{selectedProduct.inletSize}</div>
                </div>
                <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/30 transition-colors group">
                  <ArrowUpDown className="w-5 h-5 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-[10px] text-slate-500 uppercase font-bold">{t.maxHead}</div>
                  <div className="text-base md:text-lg font-bold text-white">{selectedProduct.maxHead}m</div>
                </div>
                <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/30 transition-colors group">
                  <Activity className="w-5 h-5 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-[10px] text-slate-500 uppercase font-bold">{t.flowRate}</div>
                  <div className="text-base md:text-lg font-bold text-white">{selectedProduct.flowRate} m³/h</div>
                </div>
                <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/30 transition-colors group">
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
              <div className="flex flex-col sm:flex-row items-center gap-3 mt-auto">
                <button
                  onClick={() => setQuotationPump(selectedProduct)}
                  className="w-full sm:w-1/2 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-white/15 active:scale-95"
                >
                  <FileText size={18} className="text-red-400" />
                  Official Quote (PDF)
                </button>
                <button
                  onClick={() => {
                    const phone = "251966330309";
                    const msg = encodeURIComponent(`Hello CE Power, I would like to order / get a quotation for: ${selectedProduct.name} (${selectedProduct.inletSize}, ${selectedProduct.flowRate} m³/h, ${selectedProduct.maxHead}m Head). Please share availability from Kality Gabriel.`);
                    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
                  }}
                  className="w-full sm:w-1/2 py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-900/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <ShoppingCart size={18} />
                  {t.orderNow}
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Quotation Modal for Pumps */}
      <QuotationModal
        isOpen={!!quotationPump}
        onClose={() => setQuotationPump(null)}
        generator={quotationPump}
      />

    </div>
  );
};

export default Solutions;
