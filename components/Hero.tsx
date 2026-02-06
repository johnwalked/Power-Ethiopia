
import React from 'react';
import { Loader2, LogIn } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';

interface HeroProps {
  onOpenAuth: () => void;
  onNavigate: (path: string) => void;
}

const Hero: React.FC<HeroProps> = ({ onOpenAuth, onNavigate }) => {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const t = translations[language].hero;

  const getFirstName = () => {
    if (user?.displayName) return user.displayName;
    return user?.email?.split('@')[0] || 'Partner';
  };

  return (
    <section className="relative pt-48 pb-20 px-6 flex flex-col items-center justify-center text-center max-w-7xl mx-auto min-h-[60vh]">
      
      {!user && (
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-10 cursor-default animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
          <span className="text-[11px] font-bold text-emerald-400 tracking-widest uppercase">
            {t.badge}
          </span>
        </div>
      )}

      {user ? (
        <div className="animate-in fade-in zoom-in duration-700 mb-12">
            <h1 className="max-w-5xl text-5xl md:text-8xl font-extrabold tracking-tight text-white leading-[1.1]">
              {t.welcome} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200">
                {getFirstName()}
              </span>
            </h1>
        </div>
      ) : (
        <h1 className="max-w-5xl text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100 leading-[1.15]">
          {t.headline} <br />
          <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-emerald-400 bg-[length:200%_auto] animate-[pulse_5s_ease-in-out_infinite] pb-2 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            {t.headlineSpan}
          </span>
        </h1>
      )}

      <p className="max-w-2xl text-xl text-slate-400 mb-16 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
        {t.subheadline}
      </p>

      <div className="w-full flex justify-center mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 min-h-[56px] relative z-20">
        {loading ? (
          <div className="flex items-center justify-center px-12 py-3">
             <Loader2 className="w-6 h-6 text-emerald-500 animate-spin opacity-50" />
          </div>
        ) : !user && (
          <button 
            onClick={onOpenAuth}
            className="px-10 py-4 rounded-full text-white font-bold shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:-translate-y-1 transition-all duration-500 bg-emerald-600 flex items-center justify-center gap-2 active:scale-95 text-base border border-emerald-500/50"
          >
            <LogIn className="w-5 h-5" />
            {t.cta}
          </button>
        )}
      </div>

    </section>
  );
};

export default Hero;
