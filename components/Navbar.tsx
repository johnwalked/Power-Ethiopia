
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Menu, X, Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage, Language } from '../lib/LanguageContext';
import { translations } from '../lib/translations';

interface NavbarProps {
  currentPath?: string;
  onNavigate: (path: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPath = '/', onNavigate }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const { language, setLanguage } = useLanguage();
  const langMenuRef = useRef<HTMLDivElement>(null);

  const t = translations[language].nav;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navLinks = [
    { name: t.generators, path: '/product' },
    { name: t.waterPumps, path: '/solutions' },
    { name: t.support || 'Support', path: '/support' },
    { name: t.pricing || 'Pricing', path: '/pricing' },
  ];

  const languages: Language[] = ['Amharic', 'English', 'Chinese', 'Tigregna', 'Affan Oromo'];

  const handleNavClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    onNavigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -100, x: "-50%", opacity: 0 }}
      animate={{ y: 0, x: "-50%", opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-4 md:top-6 left-1/2 z-50 w-[calc(100%-1.5rem)] md:w-[calc(100%-3rem)] max-w-6xl rounded-2xl transition-all duration-300 border ring-1 ring-inset ${isScrolled
        ? 'bg-slate-950/85 backdrop-blur-2xl border-white/15 ring-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.65)] py-2.5 md:py-3'
        : 'bg-slate-950/35 backdrop-blur-xl border-white/10 ring-white/5 shadow-none py-3 md:py-4'
        }`}
    >
      <div className="px-4 md:px-8 flex items-center justify-between">
        {/* Logo */}
        <motion.a
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          href="#/"
          onClick={(e) => handleNavClick(e, '/')}
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <div className="relative flex items-center justify-center">
            <Zap className="w-7 h-7 text-red-500 fill-red-500/10 group-hover:fill-red-500/20 transition-all duration-300 transform group-hover:rotate-12" />
            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-[18px] font-extrabold tracking-tight text-slate-100">
            CE Power
          </span>
        </motion.a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 lg:gap-10">
          {navLinks.map((link) => {
            const isActive = currentPath === link.path;
            return (
              <a
                key={link.path}
                href={`#${link.path}`}
                onClick={(e) => handleNavClick(e, link.path)}
                className={`relative text-[14px] font-bold transition-colors duration-200 group tracking-tight py-1 ${isActive ? 'text-white' : 'text-slate-300 hover:text-white'}`}
              >
                {link.name}
                {isActive ? (
                  <motion.span
                    layoutId="nav-underline"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="absolute -bottom-1 left-0 w-full h-[2px] bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                  />
                ) : (
                  <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-red-500/70 transition-all duration-300 group-hover:w-full rounded-full" />
                )}
              </a>
            );
          })}
        </div>

        {/* CTA Button & Language */}
        <div className="hidden md:flex items-center gap-3">

          {/* Language Selector */}
          <div className="relative" ref={langMenuRef}>
            <motion.button
              whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white transition-all text-[13px] font-medium border border-transparent hover:border-white/5"
            >
              <Globe size={16} />
              <span>{language}</span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${isLangMenuOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
              {isLangMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-2 w-40 bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[60]"
                >
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang);
                        setIsLangMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-red-500/10 flex items-center justify-between group"
                    >
                      {lang}
                      {language === lang && <Check size={14} className="text-red-500" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-[calc(100%+1rem)] left-0 right-0 bg-slate-900/50 backdrop-blur-3xl border border-white/10 p-6 md:hidden flex flex-col gap-4 shadow-2xl rounded-3xl z-40 overflow-hidden"
          >
            {navLinks.map((link) => (
              <a
                key={link.path}
                href={`#${link.path}`}
                className={`font-bold py-3 text-lg transition-colors border-b border-white/5 last:border-0 text-center ${currentPath === link.path ? 'text-red-400' : 'text-slate-300 hover:text-red-400'}`}
                onClick={(e) => handleNavClick(e, link.path)}
              >
                {link.name}
              </a>
            ))}

            {/* Mobile Language Selector */}
            <div className="py-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center mb-4">{t.selectLanguage}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {languages.map(lang => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${language === lang ? 'bg-red-500/10 border-red-500 text-red-400' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
