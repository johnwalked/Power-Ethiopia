
import React, { useState, useMemo, useEffect } from 'react';
import { Filter, ChevronDown, Search, Zap, Check, SlidersHorizontal, X, ShoppingCart, ArrowUpDown, ArrowRight, Gauge, Battery, Activity, Scale, Box, Info, ArrowLeftRight } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';

import { GENERATORS, Generator } from '../lib/productData.ts';

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

const Product: React.FC<PageProps> = ({ onNavigate }) => {
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

  // Comparison State
  const [compareList, setCompareList] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Derived Data
  const filteredProducts = useMemo(() => {
    return GENERATORS.filter(product => {
      // Search
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Brand Filter
      if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) return false;

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
          {t.generatorTitle} <span className="text-emerald-500">{t.inventory}</span>
        </h1>
        <p className="text-slate-400 max-w-2xl text-sm md:text-base mx-auto">
          {t.genDescription}
        </p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-6 md:mb-8 items-center justify-between bg-slate-900/50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5 backdrop-blur-sm sticky top-20 md:top-24 z-30 shadow-lg">

        {/* Search */}
        <div className="relative w-full md:w-96 group">
          <input
            type="text"
            placeholder={t.searchGen}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/50 border border-white/10 rounded-lg md:rounded-xl py-2.5 md:py-3 pl-10 md:pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
          />
          <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
        </div>

        {/* Actions Right */}
        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
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
              className="w-full md:w-48 appearance-none bg-slate-800/50 border border-white/10 rounded-lg md:rounded-xl py-2.5 md:py-3 pl-9 pr-8 text-sm text-slate-200 focus:border-emerald-500 outline-none cursor-pointer hover:bg-slate-800 transition-colors"
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
              <SlidersHorizontal size={18} className="text-emerald-500" /> {t.filters}
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
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${filters.powerRanges.includes(range) ? 'bg-emerald-600 border-emerald-600' : 'border-slate-700 bg-slate-800/50 group-hover:border-slate-600'}`}>
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
            {['Yunnei', 'Weichai', 'Yuchai', 'United Power', 'Last', 'Kefo', 'Cummins', 'Perkins', 'Volvo', 'MTU', 'Kohler', 'Jichai'].map(brand => (
              <label key={brand} className="flex items-center gap-3 group cursor-pointer">
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${filters.brands.includes(brand) ? 'bg-emerald-600 border-emerald-600' : 'border-slate-700 bg-slate-800/50 group-hover:border-slate-600'}`}>
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
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${filters.types.includes(type) ? 'bg-emerald-600 border-emerald-600' : 'border-slate-700 bg-slate-800/50 group-hover:border-slate-600'}`}>
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
                      <input type="checkbox" checked={filters.powerRanges.includes(range)} onChange={() => toggleFilter('powerRanges', range)} className="w-5 h-5 rounded accent-emerald-500" />
                      <span className="text-slate-200 text-sm font-medium">{range === '400+' ? '400kW +' : `${range} kW`}</span>
                    </label>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.brand}</h4>
                  {['Yunnei', 'Weichai', 'Yuchai', 'United Power', 'Last', 'Kefo', 'Cummins', 'Perkins', 'Volvo', 'MTU', 'Kohler', 'Jichai'].map(brand => (
                    <label key={brand} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-white/5 active:bg-slate-800">
                      <input type="checkbox" checked={filters.brands.includes(brand)} onChange={() => toggleFilter('brands', brand)} className="w-5 h-5 rounded accent-emerald-500" />
                      <span className="text-slate-200 text-sm font-medium">{brand}</span>
                    </label>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.type}</h4>
                  {['Silent', 'Open', 'Portable'].map(type => (
                    <label key={type} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-white/5 active:bg-slate-800">
                      <input type="checkbox" checked={filters.types.includes(type)} onChange={() => toggleFilter('types', type)} className="w-5 h-5 rounded accent-emerald-500" />
                      <span className="text-slate-200 text-sm font-medium">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="sticky bottom-0 pt-6 mt-6 border-t border-white/10 bg-slate-900">
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg"
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
            <div className="h-96 flex flex-col items-center justify-center bg-slate-900/30 rounded-3xl border border-white/5 border-dashed">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-500">
                <Search size={32} />
              </div>
              <h3 className="text-white font-bold text-lg">{t.noResults}</h3>
              <button onClick={clearFilters} className="mt-6 text-emerald-500 font-bold hover:underline">
                {t.clearFilters}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {filteredProducts.map((product, idx) => (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className={`
                    group bg-slate-900/40 border border-white/10 rounded-xl overflow-hidden cursor-pointer
                    hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-900/10 
                    transition-all duration-300 flex flex-col relative
                    ${compareList.includes(product.id) ? 'ring-1 ring-emerald-500 bg-emerald-900/10' : ''}
                  `}
                >
                  {/* Image & Compare Checkbox Overlay */}
                  <div className="relative h-28 md:h-40 bg-slate-800/50 overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                    />

                    {/* Brand Badge */}
                    <div className="absolute top-2 right-2">
                      <span className="bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/10 shadow-sm">
                        {product.brand}
                      </span>
                    </div>

                    {/* Compare Checkbox */}
                    <div
                      className="absolute top-2 left-2 z-10 p-1 -m-1" // Increase hit area
                      onClick={(e) => toggleCompare(e, product.id)}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all shadow-sm ${compareList.includes(product.id) ? 'bg-emerald-500 border-emerald-500' : 'bg-black/40 border-white/30 hover:bg-black/60'}`}>
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
                          <Zap size={10} className="text-emerald-500" /> {t.powerOutput}
                        </span>
                        <span className="text-slate-200 font-mono font-bold">{product.powerKW} kW</span>
                      </div>

                      {/* Engine */}
                      <div className="flex items-center justify-between text-[10px] md:text-xs">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Activity size={10} className="text-blue-500" /> {t.engineModel}
                        </span>
                        <span className="text-slate-200 font-mono truncate max-w-[80px] text-right" title={product.engineModel}>
                          {product.engineModel}
                        </span>
                      </div>
                    </div>

                    {/* Footer: Status */}
                    <div className="mt-auto pt-2 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${product.inStock ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                        <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wide ${product.inStock ? 'text-emerald-500' : 'text-red-500'}`}>
                          {product.inStock ? t.inStock : t.outStock}
                        </span>
                      </div>
                      <ArrowRight size={12} className="text-slate-600 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comparison Floating Bar */}
      {compareList.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 border border-emerald-500/50 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] py-3 px-6 flex items-center gap-4 animate-in slide-in-from-bottom-10 fade-in w-[90%] md:w-auto justify-between md:justify-start">
          <span className="text-white text-sm font-bold whitespace-nowrap hidden md:inline">
            {compareList.length} {t.selected}
          </span>
          <span className="text-white text-xs font-bold whitespace-nowrap md:hidden bg-emerald-500/20 px-2 py-0.5 rounded-full">
            {compareList.length}
          </span>

          <div className="h-6 w-px bg-white/10 hidden md:block" />

          <button
            onClick={() => setIsCompareModalOpen(true)}
            className="text-emerald-400 hover:text-white font-bold text-sm flex items-center gap-2"
          >
            <ArrowLeftRight size={16} /> {t.compare} <span className="hidden md:inline">Now</span>
          </button>

          <button
            onClick={() => setCompareList([])}
            className="ml-2 text-slate-500 hover:text-red-400 p-1 rounded-full hover:bg-white/5"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* COMPARISON MODAL */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 md:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsCompareModalOpen(false)} />
          <div className="relative bg-slate-900 border border-white/10 w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <ArrowLeftRight className="text-emerald-500" /> {t.compareModels}
              </h2>
              <button onClick={() => setIsCompareModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            <div className="overflow-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-slate-900 z-10 p-4 border-b border-r border-white/10 text-slate-400 font-medium min-w-[140px]">{t.spec}</th>
                    {getCompareProducts().map(p => (
                      <th key={p.id} className="p-4 border-b border-white/10 min-w-[200px] md:min-w-[250px] bg-slate-900/50">
                        <div className="flex flex-col items-center text-center gap-3">
                          <img src={p.image} className="w-24 h-24 object-cover rounded-lg border border-white/10" alt={p.name} />
                          <div>
                            <div className="text-emerald-500 text-xs font-bold uppercase mb-1">{p.brand}</div>
                            <div className="text-white font-bold text-sm leading-tight">{p.name}</div>
                          </div>
                          <button
                            onClick={() => toggleCompare({ stopPropagation: () => { } } as any, p.id)}
                            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 mt-1"
                          >
                            <X size={12} /> {t.remove}
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-sm md:text-base">
                  {[
                    { label: t.powerOutput, key: 'powerKW', suffix: ' kW', icon: <Zap size={16} /> },
                    { label: t.engineModel, key: 'engineModel', icon: <Activity size={16} /> },
                    { label: t.voltage, key: 'voltage', icon: <Gauge size={16} /> },
                    { label: t.frequency, key: 'frequency', icon: <Activity size={16} /> },
                    { label: t.phase, key: 'phase', icon: <Zap size={16} /> },
                    { label: t.fuelCons, key: 'fuelConsumption', icon: <Battery size={16} /> },
                    { label: t.dimensions, key: 'dimensions', suffix: ' mm', icon: <Box size={16} /> },
                    { label: t.weight, key: 'weight', icon: <Scale size={16} /> },
                    { label: t.type, key: 'type', icon: <Info size={16} /> },
                  ].map((row) => (
                    <tr key={row.label} className="hover:bg-white/5 transition-colors">
                      <td className="sticky left-0 bg-slate-900 p-4 border-b border-r border-white/10 text-slate-400 font-medium flex items-center gap-2">
                        {row.icon} {row.label}
                      </td>
                      {getCompareProducts().map(p => (
                        <td key={p.id} className="p-4 border-b border-white/10 text-center text-white font-mono">
                          {(p as any)[row.key]} {row.suffix || ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* LIQUID GLASS MODAL (Product Details) */}
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
                  <span className="text-white font-mono font-bold">{t.brand}: {selectedProduct.brand}</span>
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
                {selectedProduct.description || "High-performance industrial generator designed for reliability and efficiency. Featuring advanced cooling systems and heavy-duty components for continuous operation."}
              </p>

              {/* Specifications Grid */}
              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-8">
                <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-colors group">
                  <Zap className="w-5 h-5 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-[10px] text-slate-500 uppercase font-bold">{t.powerOutput}</div>
                  <div className="text-base md:text-lg font-bold text-white">{selectedProduct.powerKW} KW</div>
                </div>
                <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-colors group">
                  <Activity className="w-5 h-5 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-[10px] text-slate-500 uppercase font-bold">{t.engineModel}</div>
                  <div className="text-base md:text-lg font-bold text-white">{selectedProduct.engineModel}</div>
                </div>
                <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-colors group">
                  <Gauge className="w-5 h-5 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-[10px] text-slate-500 uppercase font-bold">{t.voltage}</div>
                  <div className="text-base md:text-lg font-bold text-white">{selectedProduct.voltage}</div>
                </div>
                <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-colors group">
                  <Battery className="w-5 h-5 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-[10px] text-slate-500 uppercase font-bold">{t.fuelCons}</div>
                  <div className="text-base md:text-lg font-bold text-white">{selectedProduct.fuelConsumption}</div>
                </div>
                <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-colors group">
                  <Box className="w-5 h-5 text-pink-500 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-[10px] text-slate-500 uppercase font-bold">{t.dimensions}</div>
                  <div className="text-sm md:text-base font-bold text-white truncate">{selectedProduct.dimensions}</div>
                </div>
                <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-colors group">
                  <Scale className="w-5 h-5 text-yellow-500 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-[10px] text-slate-500 uppercase font-bold">{t.weight}</div>
                  <div className="text-base md:text-lg font-bold text-white">{selectedProduct.weight}</div>
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

export default Product;
