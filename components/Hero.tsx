import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, LogIn, ArrowRight, Zap, Droplets, ShieldCheck, Factory, Gauge } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { GENERATORS, PUMPS } from '../lib/productData';
import { assetUrl } from '../lib/assetUtils';
import StreamingVideo from './StreamingVideo';

const Generator3D = React.lazy(() => import('./Generator3D'));

interface HeroProps {
  onOpenAuth: () => void;
  onNavigate: (path: string) => void;
}

const Hero: React.FC<HeroProps> = ({ onOpenAuth, onNavigate }) => {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const fullT = translations[language];
  const t = fullT.hero;

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

  const featuredGenerators = [
    GENERATORS.find(g => g.id === 'weichai-500kw') || GENERATORS[0],
    GENERATORS.find(g => g.id === 'yuchai-200kw-md200') || GENERATORS[1],
  ].filter(Boolean);

  const featuredPumps = [
    PUMPS.find(p => p.id === 'yuchai-80kw-pump') || PUMPS[0],
    PUMPS.find(p => p.id === 'weichai-250kw-pump') || PUMPS[1],
  ].filter(Boolean);

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Above-the-fold Hero Video Section */}
      <div className="relative w-full flex flex-col items-center justify-center min-h-[88vh] overflow-hidden">
        {/* Background Video */}
        <StreamingVideo src="/videos/hero-bg.mp4" poster="/videos/hero-poster.webp" overlayOpacity={0.6} />

        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 pt-36 md:pt-44 pb-16 px-6 flex flex-col items-center justify-center text-center max-w-7xl mx-auto w-full"
        >
        {/* Badge */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 backdrop-blur-xl border border-red-500/20 mb-10 cursor-default shadow-[0_0_15px_rgba(239,68,68,0.15)]"
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
      </div>

      {/* ===== ENGINEERING METRICS & CAPABILITY STRIP ===== */}
      <section className="w-full max-w-7xl mx-auto px-4 md:px-6 -mt-8 relative z-20 mb-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[
            { icon: <Factory className="w-5 h-5 text-red-400" />, val: '10,000+', label: fullT.stats.unitsSold },
            { icon: <Zap className="w-5 h-5 text-amber-400" />, val: '2.2 – 3,000 kW', label: fullT.nav.generators },
            { icon: <Droplets className="w-5 h-5 text-blue-400" />, val: '80 – 250 kW', label: fullT.nav.waterPumps },
            { icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />, val: 'Est. 1958', label: fullT.stats.warranty },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              className="glass-heavy rounded-2xl p-4 md:p-5 flex items-center gap-3.5 hover:border-red-500/30 transition-all"
            >
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                {stat.icon}
              </div>
              <div className="min-w-0">
                <div className="text-base md:text-xl font-black text-white tracking-tight truncate">{stat.val}</div>
                <div className="text-[11px] md:text-xs text-slate-400 font-medium truncate">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== FEATURED KALITY EQUIPMENT SHOWCASE ===== */}
      <section className="w-full max-w-7xl mx-auto px-4 md:px-6 mb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-red-400 mb-2">
              <Gauge size={14} /> Kality Gabriel Factory Stock
            </span>
            <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
              {fullT.products.title}
            </h2>
            <p className="text-slate-400 text-sm md:text-base mt-1">{fullT.products.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onNavigate('/product')}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 transition-all"
            >
              {fullT.nav.generators} <ArrowRight size={14} className="text-red-400" />
            </button>
            <button
              onClick={() => onNavigate('/solutions')}
              className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-xs font-bold text-red-300 hover:text-white flex items-center gap-1.5 transition-all"
            >
              {fullT.nav.waterPumps} <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredGenerators.map((gen, idx) => (
            <motion.div
              key={gen.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              onClick={() => onNavigate('/product')}
              className="group glass-card rounded-2xl overflow-hidden cursor-pointer flex flex-col"
            >
              <div className="relative h-44 studio-stage p-4 flex items-center justify-center overflow-hidden">
                <img
                  src={assetUrl(gen.image)}
                  alt={gen.name}
                  loading="lazy"
                  className="max-w-full max-h-full object-contain drop-shadow-[0_10px_20px_rgba(2,6,23,0.2)] group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-slate-950/80 text-white text-[10px] font-bold border border-white/15">
                  {gen.brand}
                </span>
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold flex items-center gap-1">
                  <Zap size={10} /> {gen.powerKW} kW
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <h3 className="font-bold text-white text-sm line-clamp-1">{gen.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{gen.description}</p>
                </div>
                <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className={`font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 ${gen.inStock ? 'text-green-400' : 'text-red-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${gen.inStock ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                    {gen.inStock ? fullT.products.inStock : fullT.products.outStock}
                  </span>
                  <span className="text-slate-300 group-hover:text-white flex items-center gap-1 font-semibold">
                    {fullT.products.viewDetails} <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}

          {featuredPumps.map((pump, idx) => (
            <motion.div
              key={pump.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.4, delay: (idx + 2) * 0.08 }}
              onClick={() => onNavigate('/solutions')}
              className="group glass-card rounded-2xl overflow-hidden cursor-pointer flex flex-col"
            >
              <div className="relative h-44 studio-stage p-4 flex items-center justify-center overflow-hidden">
                <img
                  src={assetUrl(pump.image)}
                  alt={pump.name}
                  loading="lazy"
                  className="max-w-full max-h-full object-contain drop-shadow-[0_10px_20px_rgba(2,6,23,0.2)] group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-slate-950/80 text-white text-[10px] font-bold border border-white/15">
                  {pump.inletSize}
                </span>
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold flex items-center gap-1">
                  <Droplets size={10} /> {pump.powerKW ? `${pump.powerKW} kW` : `${pump.flowRate} m³/h`}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <h3 className="font-bold text-white text-sm line-clamp-1">{pump.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{pump.description}</p>
                </div>
                <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-blue-400 font-bold uppercase tracking-wider text-[10px]">{pump.flowRate} m³/h · {pump.maxHead}m</span>
                  <span className="text-slate-300 group-hover:text-white flex items-center gap-1 font-semibold">
                    {fullT.products.viewDetails} <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== TESTIMONIAL & CTA BANNER ===== */}
      <section className="w-full max-w-5xl mx-auto px-4 md:px-6 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="glass-heavy rounded-3xl p-8 md:p-12 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
          <p className="text-slate-300 italic text-sm md:text-base max-w-2xl mx-auto mb-3">
            “{fullT.stats.quote}”
          </p>
          <p className="text-xs text-red-400 font-bold uppercase tracking-widest mb-8">
            — {fullT.stats.role}
          </p>

          <h3 className="text-2xl md:text-3xl font-black text-white mb-3">{fullT.cta.title}</h3>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto mb-8">
            {fullT.cta.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('/product')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-lg shadow-red-900/40 flex items-center justify-center gap-2"
            >
              {fullT.cta.catalogBtn} <ArrowRight size={16} />
            </button>
            {!user && (
              <button
                onClick={onOpenAuth}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl glass hover:bg-white/10 text-white font-bold text-sm transition-all"
              >
                {fullT.cta.dealerBtn}
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-6">{fullT.cta.footer}</p>
        </motion.div>
      </section>

      {/* 3D Generator Overlay */}
      <AnimatePresence>
        {show3D && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[200] flex flex-col bg-slate-950"
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
              className="absolute top-6 right-6 md:top-10 md:right-10 z-[210] bg-slate-900/80 backdrop-blur-md p-3 md:p-4 rounded-full border border-white/10 text-white hover:bg-red-600 hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all duration-300 group"
            >
              <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Interactive hint */}
            <div className="absolute top-6 left-6 md:top-10 md:left-10 z-[210] pointer-events-none">
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
