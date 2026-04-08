import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import StreamingVideo from './StreamingVideo';

const Generator3D = React.lazy(() => import('./Generator3D'));

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
  const [show3D, setShow3D] = useState(false);

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
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/8 backdrop-blur-xl border border-red-500/15 mb-10 cursor-default shadow-[0_0_15px_rgba(239,68,68,0.15)]"
          >
            <span className="flex h-2 w-2 rounded-full bg-red-400 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
            <span className="text-[11px] font-bold text-red-400 tracking-widest uppercase">
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
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-200">
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
                    className="inline-block mr-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-200 to-red-400 pb-2 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]"
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
          className="w-full flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 min-h-[56px] relative z-20"
        >
          {loading ? (
            <div className="flex items-center justify-center px-12 py-3">
              <Loader2 className="w-6 h-6 text-red-500 animate-spin opacity-50" />
            </div>
          ) : (
            <>
              {!user && (
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onOpenAuth}
                  className="group px-10 py-4 rounded-full text-white font-bold shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all duration-500 bg-red-600 flex items-center justify-center gap-2 text-base border border-red-500/50 overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <LogIn className="w-5 h-5" />
                  {t.cta}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShow3D(true)}
                className="group px-8 py-4 rounded-full text-white font-medium shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] transition-all duration-500 bg-slate-800/30 backdrop-blur-xl flex items-center justify-center gap-2 text-base border border-blue-500/20 overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <svg className="w-5 h-5 text-blue-400 group-hover:rotate-12 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {translations[language].hero3d.playDemo}
              </motion.button>
            </>
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
                  ? 'w-8 h-2 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                  : 'w-2 h-2 bg-slate-600 hover:bg-slate-500'
                  }`}
              />
            ))}
          </motion.div>
        )}
      </motion.section>

      {/* 3D Generator Overlay */}
      <AnimatePresence>
        {show3D && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[100] flex flex-col bg-slate-950"
          >
            <React.Suspense fallback={
              <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 gap-4">
                <div className="w-12 h-12 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-slate-400 font-medium">{translations[language].hero3d.initializing}</span>
              </div>
            }>
              <Generator3D />
            </React.Suspense>
            
            <button 
              onClick={() => setShow3D(false)}
              className="absolute top-6 right-6 md:top-10 md:right-10 z-[110] bg-slate-900/80 backdrop-blur-md p-3 md:p-4 rounded-full border border-white/10 text-white hover:bg-red-600 hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all duration-300 group"
            >
              <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Interactive hint */}
            <div className="absolute bottom-10 left-0 right-0 z-[110] flex justify-center pointer-events-none">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 1 }}
                className="bg-slate-900/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 text-slate-300 text-sm font-medium flex items-center gap-3 shadow-2xl"
              >
                <svg className="w-5 h-5 animate-pulse text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                {translations[language].hero3d.hint}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Hero;
