import React, { useState, useEffect } from 'react';
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

const Hero: React.FC<HeroProps> = ({ onOpenAuth }) => {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const t = translations[language].hero;

  // Pull rotating data from translations
  const headlines: { line: string; span: string }[] = t.headlines || [{ line: t.headline, span: t.headlineSpan }];
  const subtexts: string[] = t.subtexts || [t.subheadline];

  const [headlineIndex, setHeadlineIndex] = useState(0);

  // Rotate headlines every 8 seconds (slower for better readability)
  useEffect(() => {
    if (user) return;
    const interval = setInterval(() => {
      setHeadlineIndex(prev => (prev + 1) % headlines.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [user, headlines.length]);

  const getFirstName = () => {
    if (user?.displayName) return user.displayName;
    return user?.email?.split('@')[0] || 'Partner';
  };

  // Stagger entrance animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  // Per-word animation for headlines
  const wordVariants = {
    hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.8, // Slightly slower (was 0.6)
        delay: i * 0.1, // Slightly more stagger (was 0.08)
        ease: [0.16, 1, 0.3, 1] as const
      }
    }),
    exit: { opacity: 0, y: -20, filter: 'blur(4px)', transition: { duration: 0.4 } } // Slower exit (was 0.3)
  };

  const currentHeadline = headlines[headlineIndex];
  const currentSubtext = subtexts[headlineIndex];

  return (
    <div className="relative w-full flex flex-col items-center justify-center min-h-[90vh] overflow-hidden">
      {/* Background Video */}
      <StreamingVideo src="/videos/hero-bg.mp4" overlayOpacity={0.6} />

      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 pt-48 pb-20 px-6 flex flex-col items-center justify-center text-center max-w-7xl mx-auto w-full"
      >
        {/* Badge */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-10 cursor-default shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          >
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            <span className="text-[11px] font-bold text-emerald-400 tracking-widest uppercase">
              {t.badge}
            </span>
          </motion.div>
        )}

        {/* Main Headline — Rotating */}
        <div className="min-h-[180px] md:min-h-[220px] flex items-center justify-center mb-12">
          <AnimatePresence mode="wait">
            {user ? (
              <motion.div
                key="welcome-user"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
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
                key={`headline-${headlineIndex}`}
                className="max-w-5xl text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.15]"
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* Animate each word separately for a staggered reveal */}
                {currentHeadline.line.split(' ').map((word, i) => (
                  <motion.span
                    key={`line-${headlineIndex}-${i}`}
                    custom={i}
                    variants={wordVariants}
                    className="inline-block mr-[0.3em]"
                  >
                    {word}
                  </motion.span>
                ))}
                <br />
                {currentHeadline.span.split(' ').map((word, i) => (
                  <motion.span
                    key={`span-${headlineIndex}-${i}`}
                    custom={i + currentHeadline.line.split(' ').length}
                    variants={wordVariants}
                    className="inline-block mr-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-emerald-400 pb-2 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.h1>
            )}
          </AnimatePresence>
        </div>

        {/* Subtext — Rotating */}
        <div className="min-h-[80px] flex items-center justify-center mb-16">
          <AnimatePresence mode="wait">
            <motion.p
              key={`sub-${headlineIndex}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
              className="max-w-2xl text-lg md:text-xl text-slate-400 leading-relaxed font-medium"
            >
              {user ? t.subheadline : currentSubtext}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
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

        {/* Page indicator dots */}
        {!user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex items-center gap-2"
          >
            {headlines.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeadlineIndex(i)}
                className={`rounded-full transition-all duration-500 ${i === headlineIndex
                  ? 'w-8 h-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                  : 'w-2 h-2 bg-slate-600 hover:bg-slate-500'
                  }`}
              />
            ))}
          </motion.div>
        )}
      </motion.section>
    </div>
  );
};

export default Hero;
