
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Menu, X, LogOut, User, Globe, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useLanguage, Language } from '../lib/LanguageContext';
import { translations } from '../lib/translations';

interface NavbarProps {
  onNavigate: (path: string) => void;
  onOpenAuth: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, onOpenAuth }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const { user, signOut } = useAuth();
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
  ];

  const languages: Language[] = ['Amharic', 'English', 'Chinese', 'Tigregna', 'Affan Oromo'];

  const handleNavClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    onNavigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    onNavigate('/');
    setIsMobileMenuOpen(false);
  };

  const getFirstName = () => {
    if (user?.displayName) return user.displayName.split(' ')[0];
    return 'Partner';
  };

  return (
    <motion.nav
      initial={{ y: -100, x: "-50%", opacity: 0 }}
      animate={{ y: 0, x: "-50%", opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-6 left-1/2 z-50 w-[calc(100%-3rem)] max-w-6xl rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] border ring-1 ring-inset ${isScrolled
        ? 'bg-slate-900/40 backdrop-blur-xl border-white/20 ring-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.3)] py-3'
        : 'bg-white/0 backdrop-blur-md border-white/10 ring-white/5 shadow-none py-4'
        }`}
    >
      <div className="px-8 flex items-center justify-between">
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
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={`#${link.path}`}
              onClick={(e) => handleNavClick(e, link.path)}
              className="relative text-[14px] font-bold text-slate-300 hover:text-white transition-colors duration-300 group tracking-tight"
            >
              {link.name}
              <motion.span
                layoutId="nav-underline"
                className="absolute -bottom-1 left-0 w-0 h-[2px] bg-red-500 transition-all duration-300 group-hover:w-full rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]"
              />
            </a>
          ))}
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
                  className="absolute top-full right-0 mt-2 w-40 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[60]"
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

          {user ? (
            <div className="flex items-center gap-4 pl-4 border-l border-white/10">
              <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-red-500">
                  <User size={16} />
                </div>
                <span>{getFirstName()}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all rounded-xl"
                title={t.signOut}
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenAuth}
              className="relative overflow-hidden rounded-xl bg-red-600 px-6 py-2.5 text-[13px] font-bold text-white transition-all duration-300 hover:bg-red-500 hover:shadow-[0_4px_12px_rgba(239,68,68,0.4)] ml-2 border border-red-500/30"
            >
              {t.login}
            </motion.button>
          )}
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
            className="absolute top-[calc(100%+1rem)] left-0 right-0 bg-slate-900/90 backdrop-blur-3xl border border-white/10 p-6 md:hidden flex flex-col gap-4 shadow-2xl rounded-3xl z-40 overflow-hidden"
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={`#${link.path}`}
                className="text-slate-300 hover:text-red-400 font-bold py-3 text-lg transition-colors border-b border-white/5 last:border-0 text-center"
                onClick={(e) => handleNavClick(e, link.path)}
              >
                {link.name}
              </a>
            ))}

            {/* Mobile Language Selector */}
            <div className="py-2 border-b border-white/5">
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

            {user ? (
              <div className="pt-2 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-slate-200 font-bold mb-2">
                  Hi, {user.displayName || 'Partner'}
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full rounded-xl border border-white/10 px-6 py-4 text-sm font-bold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut size={16} />
                  {t.signOut}
                </button>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="w-full mt-2 rounded-xl bg-red-600 px-6 py-5 text-sm font-bold text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-900/50"
              >
                {t.login}
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
