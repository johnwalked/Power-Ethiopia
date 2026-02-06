
import React from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';

const Stats: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language].stats;

  return (
    <section className="py-20 bg-slate-900/30 border-t border-white/5 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/5">
          <div className="p-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <div className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">50k+</div>
            <div className="text-emerald-500 font-medium tracking-wide uppercase text-sm">{t.unitsSold}</div>
          </div>
          <div className="p-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <div className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">200+</div>
            <div className="text-emerald-500 font-medium tracking-wide uppercase text-sm">{t.serviceCenters}</div>
          </div>
          <div className="p-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <div className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">5 Year</div>
            <div className="text-emerald-500 font-medium tracking-wide uppercase text-sm">{t.warranty}</div>
          </div>
        </div>
        
        {/* Optional Quote */}
        <div className="mt-16 text-center max-w-2xl mx-auto">
            <p className="text-lg text-slate-300 italic">"{t.quote}"</p>
            <div className="mt-4 flex items-center justify-center gap-3">
                <div className="w-8 h-8 bg-slate-700 rounded-full border border-slate-600" />
                <div className="text-sm font-bold text-white">Mike Thompson, {t.role}</div>
            </div>
        </div>
      </div>
    </section>
  );
};

export default Stats;
