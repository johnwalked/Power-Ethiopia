
import React from 'react';
import { Check, Zap, Droplets, Fuel } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';

interface PricingPreviewProps {
    onNavigate: (path: string) => void;
}

const PricingPreview: React.FC<PricingPreviewProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const t = translations[language].products;

  return (
    <section className="py-24 px-6 relative bg-transparent border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t.title}</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">{t.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Product 1 */}
          <div className="p-8 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-lg hover:border-emerald-500/30 transition-all flex flex-col">
            <div className="mb-4">
               <div className="w-12 h-12 bg-blue-900/30 text-blue-400 rounded-xl flex items-center justify-center mb-4 border border-blue-500/20">
                  <Droplets size={24} />
               </div>
               <h3 className="text-lg font-bold text-slate-100">WP-20 Water Pump</h3>
               <div className="text-3xl font-bold text-white mt-2">$299.00</div>
            </div>
            <p className="text-sm text-slate-400 mb-6">2-Inch High Pressure Pump.</p>
            <div className="space-y-3 mb-8 flex-1">
               <div className="flex items-center gap-2 text-sm text-slate-300"><Check size={16} className="text-emerald-500"/> 158 GPM Capacity</div>
               <div className="flex items-center gap-2 text-sm text-slate-300"><Check size={16} className="text-emerald-500"/> 212cc Engine</div>
               <div className="flex items-center gap-2 text-sm text-slate-300"><Check size={16} className="text-emerald-500"/> Cast Iron Volute</div>
            </div>
            <button onClick={() => onNavigate('/solutions')} className="w-full py-2.5 rounded-xl border border-white/10 text-slate-300 font-bold text-sm hover:bg-white/10 hover:text-white transition-colors">{t.viewDetails}</button>
          </div>

          {/* Product 2 */}
          <div className="p-8 bg-white/10 backdrop-blur-lg rounded-3xl border border-emerald-500/30 shadow-2xl relative overflow-hidden group flex flex-col transform md:-translate-y-4 hover:-translate-y-5 transition-transform duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <div className="w-32 h-32 bg-emerald-500 rounded-full blur-3xl" />
            </div>
            <div className="mb-4 relative z-10">
               <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mb-4 border border-emerald-500/20">
                      <Zap size={24} />
                  </div>
                  <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-emerald-500/20">{t.bestSeller}</span>
               </div>
               <h3 className="text-lg font-bold text-white">CE-5500 Generator</h3>
               <div className="text-3xl font-bold text-white mt-2">$599.00</div>
            </div>
            <p className="text-sm text-slate-300 mb-6 relative z-10">Reliable home backup power.</p>
             <div className="space-y-3 mb-8 relative z-10 flex-1">
               <div className="flex items-center gap-2 text-sm text-slate-200"><Check size={16} className="text-emerald-400"/> 5500 Starting Watts</div>
               <div className="flex items-center gap-2 text-sm text-slate-200"><Check size={16} className="text-emerald-400"/> 8.5 Hr Run Time</div>
               <div className="flex items-center gap-2 text-sm text-slate-200"><Check size={16} className="text-emerald-400"/> Wheel Kit Included</div>
               <div className="flex items-center gap-2 text-sm text-slate-200"><Check size={16} className="text-emerald-400"/> Electric Start</div>
            </div>
            <button onClick={() => onNavigate('/product')} className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 transition-colors relative z-10 shadow-lg shadow-emerald-900/40">{t.buyNow}</button>
          </div>

          {/* Product 3 */}
           <div className="p-8 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-lg hover:border-emerald-500/30 transition-all flex flex-col">
            <div className="mb-4">
               <div className="w-12 h-12 bg-orange-900/30 text-orange-400 rounded-xl flex items-center justify-center mb-4 border border-orange-500/20">
                  <Fuel size={24} />
               </div>
               <h3 className="text-lg font-bold text-slate-100">Diesel Pro 7000</h3>
               <div className="text-3xl font-bold text-white mt-2">$1,299.00</div>
            </div>
            <p className="text-sm text-slate-400 mb-6">Heavy-duty industrial diesel.</p>
             <div className="space-y-3 mb-8 flex-1">
               <div className="flex items-center gap-2 text-sm text-slate-300"><Check size={16} className="text-emerald-500"/> 7000 Watt Output</div>
               <div className="flex items-center gap-2 text-sm text-slate-300"><Check size={16} className="text-emerald-500"/> Low Oil Shutdown</div>
               <div className="flex items-center gap-2 text-sm text-slate-300"><Check size={16} className="text-emerald-500"/> Silent Enclosure</div>
            </div>
            <button onClick={() => onNavigate('/pricing')} className="w-full py-2.5 rounded-xl border border-white/10 text-slate-300 font-bold text-sm hover:bg-white/10 hover:text-white transition-colors">{t.contactDealer}</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingPreview;
