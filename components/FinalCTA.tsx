
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';

interface FinalCTAProps {
    onOpenAuth: () => void;
}

const FinalCTA: React.FC<FinalCTAProps> = ({ onOpenAuth }) => {
  const { language } = useLanguage();
  const t = translations[language].cta;

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
            {t.title}
          </h2>
          <p className="text-slate-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            {t.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
                onClick={onOpenAuth}
                className="px-10 py-4 bg-emerald-600 text-white rounded-full font-bold text-lg hover:bg-emerald-500 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-900/30 flex items-center gap-2"
            >
                {t.dealerBtn}
                <ArrowRight size={20} />
            </button>
            <button className="px-10 py-4 bg-white/10 text-white rounded-full font-bold text-lg hover:bg-white/20 transition-all backdrop-blur-sm border border-white/10">
                {t.catalogBtn}
            </button>
          </div>
          <p className="mt-8 text-slate-400 text-sm font-medium">{t.footer}</p>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
