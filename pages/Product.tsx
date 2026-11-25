
import React, { useState, useMemo, useEffect } from 'react';
import { Filter, ChevronDown, Search, Zap, Check, SlidersHorizontal, X, ShoppingCart, ArrowUpDown, ArrowRight, Gauge, Battery, Activity, Scale, Box, Info, ArrowLeftRight, Calculator, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';

import { GENERATORS, Generator } from '../lib/productData.ts';
import { assetUrl } from '../lib/assetUtils';
import SizingCalculator from '../components/SizingCalculator';
import QuotationModal from '../components/QuotationModal';

// --- Types ---
// Interface moved to lib/productData.ts or kept for local use if needed, 
// but using the imported one for consistency.
type Product = Generator;

interface FilterState {
  brands: string[];
  types: string[];
  powerRanges: string[]; // "0-50", "50-150", "150-400", "400+"
}

type SortOption = 'power-asc' | 'power-desc' | 'name-asc';

interface PageProps {
  onNavigate: (path: string) => void;
}

const Product: React.FC<PageProps> = () => {
  const { language } = useLanguage();
  const t = translations[language].products;

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    brands: [],
    types: [],
    powerRanges: []
  });
  const [sortOption, setSortOption] = useState<SortOption>('power-asc');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Comparison & Modal States
  const [compareList, setCompareList] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [quotationProduct, setQuotationProduct] = useState<Product | null>(null);

  // Derived Data
  const filteredProducts = useMemo(() => {
    return GENERATORS.filter(product => {
      // Search
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Brand Filter (with KOFO/Kefo equivalence)
      if (filters.brands.length > 0) {
        const matchesBrand = filters.brands.some(b => {
          if (b.toLowerCase() === 'kofo' || b.toLowerCase() === 'kefo') {
            return product.brand.toLowerCase() === 'kofo' || product.brand.toLowerCase() === 'kefo';
          }
          return product.brand.toLowerCase() === b.toLowerCase();
        });
        if (!matchesBrand) return false;
      }

      // Type Filter
      if (filters.types.length > 0 && !filters.types.includes(product.type)) return false;

      // Power Range Filter
      if (filters.powerRanges.length > 0) {
        const matchesRange = filters.powerRanges.some(range => {
          if (range === '0-50') return product.powerKW <= 50;
          if (range === '50-150') return product.powerKW > 50 && product.powerKW <= 150;
          if (range === '150-400') return product.powerKW > 150 && product.powerKW <= 400;
          if (range === '400+') return product.powerKW > 400;
          return false;
        });
        if (!matchesRange) return false;
      }

      return true;
    }).sort((a, b) => {
      switch (sortOption) {
        case 'power-asc': return a.powerKW - b.powerKW;
        case 'power-desc': return b.powerKW - a.powerKW;
        case 'name-asc': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });
  }, [searchQuery, filters, sortOption]);

  useEffect(() => {
    setVisibleCount(filteredProducts.length);
  }, [filteredProducts]);

  // Handlers
  const toggleFilter = (category: keyof FilterState, value: string) => {
    setFilters(prev => {
      const current = prev[category];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  const clearFilters = () => {
    setFilters({ brands: [], types: [], powerRanges: [] });
    setSearchQuery('');
  };

  const toggleCompare = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setCompareList(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      if (prev.length >= 4) {
        // Optional: Alert max limit
        return prev;
      }
      return [...prev, id];
    });
  };

  const getCompareProducts = () => {
    return GENERATORS.filter(p => compareList.includes(p.id));
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-28 pb-20 px-3 md:px-8 max-w-7xl mx-auto">

      {/* Page Header */}
      <div className="mb-6 md:mb-10 text-center animate-in slide-in-from-bottom-4 duration-700 flex flex-col items-center">
        <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight mb-2 md:mb-3">
          {t.generatorTitle} <span className="text-red-500">{t.inventory}</span>
        </h1>
        <p className="text-slate-400 max-w-2xl text-sm md:text-base mx-auto">
          {t.genDescription}
        </p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-6 md:mb-8 items-center justify-between glass p-3 md:p-4 rounded-xl md:rounded-2xl sticky top-[76px] md:top-24 z-30 shadow-lg">

        {/* Search */}
        <div className="relative w-full md:w-96 group">
          <input
            type="text"
            placeholder={t.searchGen}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/70 backdrop-blur-md border border-white/10 rounded-lg md:rounded-xl py-2.5 md:py-3 pl-10 md:pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
          />
          <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-500 transition-colors" />
        </div>

        {/* Actions Right */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsCalculatorOpen(true)}
            className="flex items-center gap-1.5 px-3 md:px-4 py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 transition-all shadow-md active:scale-95"
            title="Calculate required power kW"
          >
            <Calculator size={16} /> Sizing Calculator
          </button>

          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className="md:hidden flex-1 flex items-center justify-center gap-2 bg-slate-800 text-slate-200 px-4 py-2.5 rounded-lg font-medium text-sm border border-white/10 active:scale-95 transition-transform"
          >
            <Filter size={16} /> {t.filters}
          </button>

          <div className="relative flex-1 md:flex-none">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <ArrowUpDown size={14} className="text-slate-500" />
            </div>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="w-full md:w-48 appearance-none bg-slate-800/50 border border-white/10 rounded-lg md:rounded-xl py-2.5 md:py-3 pl-9 pr-8 text-sm text-slate-200 focus:border-red-500 outline-none cursor-pointer hover:bg-slate-800 transition-colors"
            >
              <option value="power-asc">{t.powerOutput} (Low to High)</option>
              <option value="power-desc">{t.powerOutput} (High to Low)</option>
              <option value="name-asc">Name (A-Z)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 relative">

        {/* Sidebar (Desktop) */}
        <aside className="hidden md:block w-64 shrink-0 space-y-8 h-fit sticky top-48">

          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-white flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-red-500" /> {t.filters}
            </h3>
            {(filters.brands.length > 0 || filters.types.length > 0 || filters.powerRanges.length > 0) && (
              <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-white hover:underline">
                {t.reset}
              </button>
            )}
          </div>

          {/* Power Range Filter */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.powerOutput} (kW)</h4>
            {['0-50', '50-150', '150-400', '400+'].map(range => (
              <label key={range} className="flex items-center gap-3 group cursor-pointer">
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${filters.powerRanges.includes(range) ? 'bg-red-600 border-red-600' : 'border-slate-700 bg-slate-800/50 group-hover:border-slate-600'}`}>
                  {filters.powerRanges.includes(range) && <Check size={14} className="text-white" />}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={filters.powerRanges.includes(range)}
                  onChange={() => toggleFilter('powerRanges', range)}
                />
                <span className={`text-sm transition-colors ${filters.powerRanges.includes(range) ? 'text-white font-medium' : 'text-slate-400 group-hover:text-slate-300'}`}>
                  {range === '400+' ? '400kW +' : `${range} kW`}
                </span>
              </label>
            ))}
          </div>

          <div className="h-px bg-white/5" />

          {/* Brand Filter */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.brand}</h4>
            {['Weichai', 'Yuchai', 'Yunnei', 'KOFO', 'Weifang', 'United Power', 'Cummins', 'Last'].map(brand => (
              <label key={brand} className="flex items-center gap-3 group cursor-pointer">
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${filters.brands.includes(brand) ? 'bg-red-600 border-red-600' : 'border-slate-700 bg-slate-800/50 group-hover:border-slate-600'}`}>
                  {filters.brands.includes(brand) && <Check size={14} className="text-white" />}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={filters.brands.includes(brand)}
                  onChange={() => toggleFilter('brands', brand)}
                />
                <span className={`text-sm transition-colors ${filters.brands.includes(brand) ? 'text-white font-medium' : 'text-slate-400 group-hover:text-slate-300'}`}>
                  {brand}
                </span>
              </label>
            ))}
          </div>

          <div className="h-px bg-white/5" />

          {/* Type Filter */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.type}</h4>
            {['Silent', 'Open', 'Portable'].map(type => (
              <label key={type} className="flex items-center gap-3 group cursor-pointer">
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${filters.types.includes(type) ? 'bg-red-600 border-red-600' : 'border-slate-700 bg-slate-800/50 group-hover:border-slate-600'}`}>
                  {filters.types.includes(type) && <Check size={14} className="text-white" />}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={filters.types.includes(type)}
                  onChange={() => toggleFilter('types', type)}
                />
                <span className={`text-sm transition-colors ${filters.types.includes(type) ? 'text-white font-medium' : 'text-slate-400 group-hover:text-slate-300'}`}>
                  {type}
                </span>
              </label>
            ))}
          </div>
        </aside>

        {/* Mobile Filter Drawer */}
        {isMobileFiltersOpen && (
          <div className="fixed inset-0 z-[100] md:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileFiltersOpen(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-slate-900 border-l border-white/10 p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-white text-lg">{t.filters}</h3>
                <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.powerOutput}</h4>
                  {['0-50', '50-150', '150-400', '400+'].map(range => (
                    <label key={range} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-white/5 active:bg-slate-800">
                      <input type="checkbox" checked={filters.powerRanges.includes(range)} onChange={() => toggleFilter('powerRanges', range)} className="w-5 h-5 rounded accent-red-500" />
                      <span className="text-slate-200 text-sm font-medium">{range === '400+' ? '400kW +' : `${range} kW`}</span>
                    </label>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.brand}</h4>
                  {['Weichai', 'Yuchai', 'Yunnei', 'KOFO', 'Weifang', 'United Power', 'Cummins', 'Last'].map(brand => (
                    <label key={brand} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-white/5 active:bg-slate-800">
                      <input type="checkbox" checked={filters.brands.includes(brand)} onChange={() => toggleFilter('brands', brand)} className="w-5 h-5 rounded accent-red-500" />
                      <span className="text-slate-200 text-sm font-medium">{brand}</span>
                    </label>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.type}</h4>
                  {['Silent', 'Open', 'Portable'].map(type => (
                    <label key={type} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-white/5 active:bg-slate-800">
                      <input type="checkbox" checked={filters.types.includes(type)} onChange={() => toggleFilter('types', type)} className="w-5 h-5 rounded accent-red-500" />
                      <span className="text-slate-200 text-sm font-medium">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="sticky bottom-0 pt-6 mt-6 border-t border-white/10 bg-slate-900">
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-full py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg"
                >
                  Show Results
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between px-1">
            <span className="text-slate-400 text-xs md:text-sm">{t.showing} <strong className="text-white">{visibleCount}</strong> {t.results}</span>
          </div>

          {filteredProducts.length === 0 ? (
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="h-96 flex flex-col items-center justify-center bg-slate-900/30 rounded-3xl border border-white/5 border-dashed"
            >
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-500">
                <Search size={32} />
              </div>
              <h3 className="text-white font-bold text-lg">{t.noResults}</h3>
              <button onClick={clearFilters} className="mt-6 text-red-500 font-bold hover:underline">
                {t.clearFilters}
              </button>
            </motion.div>
          ) : (
            <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              <AnimatePresence mode='popLayout'>
                {filteredProducts.map((product, idx) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.4, delay: idx > 15 ? 0 : idx * 0.04 }}
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={`
                      group glass-card rounded-xl overflow-hidden cursor-pointer
                      transition-all duration-300 flex flex-col relative
                      ${compareList.includes(product.id) ? 'ring-1 ring-red-500 !bg-red-900/15' : ''}
                    `}
                  >
                  {/* Image & Compare Checkbox Overlay */}
                  <div className="relative h-32 md:h-40 studio-stage flex items-center justify-center p-2.5 overflow-hidden">
                    <img
                      src={assetUrl(product.image)}
                      alt={product.name}
                      loading="lazy"
                      className="max-w-full max-h-full object-contain drop-shadow-[0_6px_14px_rgba(2,6,23,0.18)] group-hover:scale-105 transition-transform duration-500 will-change-transform"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-slate-900/20 to-transparent" />

                    {/* Brand Badge */}
                    <div className="absolute top-2 right-2">
                      <span className="bg-slate-950/80 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded border border-white/15 shadow-sm">
                        {product.brand}
                      </span>
                    </div>

                    {/* Compare Checkbox */}
                    <div
                      className="absolute top-2 left-2 z-10 p-1 -m-1"
                      onClick={(e) => toggleCompare(e, product.id)}
                      title={t.compare}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all shadow-sm ${compareList.includes(product.id) ? 'bg-red-600 border-red-500' : 'bg-slate-950/70 border-white/40 hover:bg-slate-950/90'}`}>
                        {compareList.includes(product.id) && <Check size={12} className="text-white" />}
                      </div>
                    </div>
                  </div>

                  {/* Content - Compact Layout */}
                  <div className="p-2.5 md:p-4 flex-1 flex flex-col gap-2">
                    <h3 className="text-slate-100 font-bold text-xs md:text-sm leading-snug line-clamp-2 h-[2.5em]">
                      {product.name}
                    </h3>

                    {/* Key Specs */}
                    <div className="space-y-1.5">
                      {/* Power */}
                      <div className="flex items-center justify-between text-[10px] md:text-xs">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Zap size={10} className="text-red-500" /> {t.powerOutput}
                        </span>
                        <span className="text-slate-200 font-mono font-bold">{product.powerKW} kW</span>
                      </div>

                      {/* Engine */}
                      <div className="flex items-center justify-between text-[10px] md:text-xs">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Activity size={10} className="text-blue-500" /> {t.engineModel}
                        </span>
                        <span className="text-slate-200 font-mono truncate max-w-[95px] text-right" title={product.engineModel}>
                          {product.engineModel || 'Industrial'}
                        </span>
                      </div>
                    </div>

                    {/* Footer: Status */}
                    <div className="mt-auto pt-2 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${product.inStock ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 animate-pulse'}`} />
                        <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wide ${product.inStock ? 'text-green-400' : 'text-red-400'}`}>
                          {product.inStock ? t.inStock : t.outStock}
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
      </div>
    </div>

      {/* Comparison Floating Bar */}
      <AnimatePresence>
      {compareList.length > 0 && (
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-24 sm:bottom-6 left-4 right-24 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-[85] bg-slate-900/95 backdrop-blur-xl border border-red-500/50 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.65)] py-2.5 px-4 sm:py-3 sm:px-6 flex items-center gap-3 sm:gap-4 sm:w-auto sm:max-w-[calc(100vw-13rem)] justify-between sm:justify-start"
        >
          <span className="text-white text-sm font-bold whitespace-nowrap hidden md:inline">
            {compareList.length} {t.selected}
          </span>
          <span className="text-white text-xs font-bold whitespace-nowrap md:hidden bg-red-500/20 px-2.5 py-0.5 rounded-full border border-red-500/30">
            {compareList.length}
          </span>

          <div className="h-5 w-px bg-white/10 hidden md:block" />

          <button
            onClick={() => setIsCompareModalOpen(true)}
            className="text-red-400 hover:text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 whitespace-nowrap"
          >
            <ArrowLeftRight size={15} /> {t.compare} <span className="hidden md:inline">Now</span>
          </button>

          <button
            onClick={() => setCompareList([])}
            aria-label="Clear comparison"
            className="ml-1 text-slate-400 hover:text-red-400 p-1 rounded-full hover:bg-white/5"
          >
            <X size={15} />
          </button>
        </motion.div>
      )}
      </AnimatePresence>

      {/* COMPARISON MODAL */}
      <AnimatePresence>
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 md:p-6">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={() => setIsCompareModalOpen(false)} 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-slate-900 border border-white/10 w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
              <div>
                <h2 className="text-white font-bold text-base md:text-lg flex items-center gap-2">
                  <ArrowLeftRight className="text-red-500" size={18} /> {t.compareModels}
                </h2>
                {getCompareProducts().length > 1 && (
                  <p className="text-[11px] text-slate-400 md:hidden mt-0.5">← Swipe horizontally to compare →</p>
                )}
              </div>
              <button onClick={() => setIsCompareModalOpen(false)} className="text-slate-400 hover:text-white p-1"><X size={20} /></button>
            </div>

            <div className="overflow-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-slate-900 z-10 p-2.5 md:p-4 border-b border-r border-white/10 text-slate-400 font-medium text-xs md:text-sm min-w-[104px] md:min-w-[150px]">{t.spec}</th>
                    {getCompareProducts().map(p => (
                      <th key={p.id} className="p-2.5 md:p-4 border-b border-white/10 min-w-[155px] md:min-w-[230px] bg-slate-900/50">
                        <div className="flex flex-col items-center text-center gap-2 md:gap-3">
                          <div className="w-20 h-20 md:w-24 md:h-24 studio-stage rounded-lg border border-white/10 p-1.5 flex items-center justify-center">
                            <img src={assetUrl(p.image)} loading="lazy" className="max-w-full max-h-full object-contain" alt={p.name} />
                          </div>
                          <div>
                            <div className="text-red-500 text-[10px] md:text-xs font-bold uppercase mb-0.5">{p.brand}</div>
                            <div className="text-white font-bold text-xs md:text-sm leading-tight">{p.name}</div>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <button
                              onClick={() => {
                                setIsCompareModalOpen(false);
                                setQuotationProduct(p);
                              }}
                              className="px-2.5 py-1 bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white rounded-lg text-[11px] font-bold transition-all border border-red-500/30 flex items-center gap-1"
                            >
                              <FileText size={11} /> Quote
                            </button>
                            <button
                              onClick={() => toggleCompare({ stopPropagation: () => { } } as any, p.id)}
                              className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 p-1"
                              title="Remove from comparison"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-xs md:text-sm">
                  {[
                    { label: t.powerOutput, key: 'powerKW', suffix: ' kW', icon: <Zap size={14} /> },
                    { label: t.engineModel, key: 'engineModel', icon: <Activity size={14} /> },
                    { label: t.voltage, key: 'voltage', icon: <Gauge size={14} /> },
                    { label: t.frequency, key: 'frequency', icon: <Activity size={14} /> },
                    { label: t.phase, key: 'phase', icon: <Zap size={14} /> },
                    { label: t.fuelCons, key: 'fuelConsumption', icon: <Battery size={14} /> },
                    { label: t.dimensions, key: 'dimensions', icon: <Box size={14} /> },
                    { label: t.weight, key: 'weight', icon: <Scale size={14} /> },
                    { label: t.type, key: 'type', icon: <Info size={14} /> },
                  ].map((row) => (
                    <tr key={row.label} className="hover:bg-white/5 transition-colors">
                      <td className="sticky left-0 bg-slate-900 p-2.5 md:p-4 border-b border-r border-white/10 text-slate-400 font-medium flex items-center gap-1.5 md:gap-2">
                        {row.icon} <span className="truncate">{row.label}</span>
                      </td>
                      {getCompareProducts().map(p => {
                        const rawVal = (p as any)[row.key];
                        return (
                          <td key={p.id} className="p-2.5 md:p-4 border-b border-white/10 text-center text-white font-mono">
                            {rawVal ? `${rawVal}${row.suffix || ''}` : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* LIQUID GLASS MODAL (Product Details) */}
      <AnimatePresence>
      {selectedProduct && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl"
            onClick={() => setSelectedProduct(null)}
          />

          {/* Modal Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] inner-glow"
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all border border-white/10"
            >
              <X size={20} />
            </button>

            {/* Left: Image Side */}
            <div className="md:w-1/2 relative studio-stage min-h-[260px] md:min-h-full">
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
                  <span className="text-white font-mono text-xs md:text-sm font-bold">{t.brand}: {selectedProduct.brand}</span>
                </div>
              </div>
            </div>

            {/* Right: Details Side */}
            <div className="md:w-1/2 p-6 md:p-10 overflow-y-auto">
              <div className="mb-1">
                <span className="text-red-500 font-bold tracking-widest text-xs uppercase">{selectedProduct.type} Series</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4 leading-tight">
                {selectedProduct.name}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                {selectedProduct.description || "High-performance industrial generator designed for reliability and efficiency. Featuring advanced cooling systems and heavy-duty components for continuous operation."}
              </p>

              {/* Specifications Grid */}
              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-8">
                <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/30 transition-colors group">
                  <Zap className="w-5 h-5 text-red-500 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-[10px] text-slate-500 uppercase font-bold">{t.powerOutput}</div>
                  <div className="text-base md:text-lg font-bold text-white">{selectedProduct.powerKW} KW</div>
                </div>
                <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/30 transition-colors group">
                  <Activity className="w-5 h-5 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-[10px] text-slate-500 uppercase font-bold">{t.engineModel}</div>
                  <div className="text-base md:text-lg font-bold text-white">{selectedProduct.engineModel || 'Industrial'}</div>
                </div>
                <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/30 transition-colors group">
                  <Gauge className="w-5 h-5 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-[10px] text-slate-500 uppercase font-bold">{t.voltage}</div>
                  <div className="text-base md:text-lg font-bold text-white">{selectedProduct.voltage}</div>
                </div>
                <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/30 transition-colors group">
                  <Battery className="w-5 h-5 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-[10px] text-slate-500 uppercase font-bold">{t.fuelCons}</div>
                  <div className="text-base md:text-lg font-bold text-white">{selectedProduct.fuelConsumption}</div>
                </div>
                <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/30 transition-colors group">
                  <Box className="w-5 h-5 text-pink-500 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-[10px] text-slate-500 uppercase font-bold">{t.dimensions}</div>
                  <div className="text-sm md:text-base font-bold text-white truncate">{selectedProduct.dimensions}</div>
                </div>
                <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/30 transition-colors group">
                  <Scale className="w-5 h-5 text-yellow-500 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-[10px] text-slate-500 uppercase font-bold">{t.weight}</div>
                  <div className="text-base md:text-lg font-bold text-white">{selectedProduct.weight}</div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-3 mt-auto">
                <button
                  onClick={() => setQuotationProduct(selectedProduct)}
                  className="w-full sm:w-1/2 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-white/15 active:scale-98"
                >
                  <FileText size={18} className="text-red-400" />
                  Official Quote (PDF)
                </button>
                <button
                  onClick={() => {
                    const phone = "251966330309";
                    const msg = encodeURIComponent(`Hello CE Power, I would like to inquire about: ${selectedProduct.name} (${selectedProduct.powerKW} kW, ${selectedProduct.type} frame). Please provide current stock availability and pro-forma invoice.`);
                    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
                  }}
                  className="w-full sm:w-1/2 py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-900/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 active:scale-98"
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

      {/* Sizing Calculator Modal */}
      <SizingCalculator
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />

      {/* Quotation Generator Modal */}
      <QuotationModal
        isOpen={!!quotationProduct}
        onClose={() => setQuotationProduct(null)}
        generator={quotationProduct}
      />

    </div>
  );
};

export default Product;
