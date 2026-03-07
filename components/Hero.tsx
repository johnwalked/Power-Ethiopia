import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import StreamingVideo from './StreamingVideo';

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  return (
    <div className="relative w-full flex flex-col items-center justify-center min-h-[90vh] overflow-hidden">
      {/* Optimized Background Video Layer */}
      <StreamingVideo src="/videos/hero-bg.mp4" overlayOpacity={0.6} />

      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 pt-48 pb-20 px-6 flex flex-col items-center justify-center text-center max-w-7xl mx-auto w-full"
      >
        {!user && (
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-10 cursor-default shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          >
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
            <span className="text-[11px] font-bold text-emerald-400 tracking-widest uppercase">
              {t.badge}
            </span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {user ? (
            <motion.div
              key="welcome-user"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              className="mb-12"
            >
              <h1 className="max-w-5xl text-5xl md:text-8xl font-extrabold tracking-tight text-white leading-[1.1]">
                {t.welcome} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200">
                  {getFirstName()}
                </span>
              </h1>
            </motion.div>
          ) : (
            <motion.h1
              key="headline-guest"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              className="max-w-5xl text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-12 leading-[1.15]"
            >
              {t.headline} <br />
              <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-emerald-400 bg-[length:200%_auto] animate-[pulse_5s_ease-in-out_infinite] pb-2 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                {t.headlineSpan}
              </span>
            </motion.h1>
          )}
        </AnimatePresence>

        <motion.p
          variants={itemVariants}
          className="max-w-2xl text-xl text-slate-400 mb-16 leading-relaxed font-medium"
        >
          {t.subheadline}
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="w-full flex justify-center mb-12 min-h-[56px] relative z-20"
        >
          {loading ? (
            <div className="flex items-center justify-center px-12 py-3">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin opacity-50" />
            </div>
          ) : !user && (
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenAuth}
              className="group px-10 py-4 rounded-full text-white font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-500 bg-emerald-600 flex items-center justify-center gap-2 text-base border border-emerald-500/50 overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <LogIn className="w-5 h-5" />
              {t.cta}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          )}
        </motion.div>
      </motion.section>
    </div>
  );
};

export default Hero;
