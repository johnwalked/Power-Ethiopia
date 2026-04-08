
import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import BackgroundEffects from './components/ui/BackgroundEffects';
import AuthModal from './components/AuthModal';
import VoiceAssistant from './components/VoiceAssistant';
import { Loader2, Zap, MapPin, Phone, Mail, ArrowUp, MessageCircle } from 'lucide-react';

// Auth
import { useAuth } from './lib/AuthContext';
import { useLanguage } from './lib/LanguageContext';
import { translations } from './lib/translations';

// Lazy Load Pages for Performance
const Product = React.lazy(() => import('./pages/Product'));
const Solutions = React.lazy(() => import('./pages/Solutions'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Pricing = React.lazy(() => import('./pages/Pricing'));
const Support = React.lazy(() => import('./pages/Support'));

const App: React.FC = () => {
  const getHashPath = () => window.location.hash.slice(1) || '/';

  const [currentPath, setCurrentPath] = useState(getHashPath());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const { loading } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    const onHashChange = () => {
      setCurrentPath(getHashPath());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Back to top visibility
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  const openAuthModal = () => {
    setIsAuthModalOpen(true);
  };

  const renderContent = () => {
    switch (currentPath) {
      case '/product':
        return <Product onNavigate={navigate} />;
      case '/solutions':
        return <Solutions onNavigate={navigate} />;
      case '/dashboard':
        return <Dashboard onNavigate={navigate} />;
      case '/pricing':
        return <Pricing onNavigate={navigate} />;
      case '/support':
        return <Support onNavigate={navigate} />;
      case '/':
      default:
        return <Hero onOpenAuth={openAuthModal} onNavigate={navigate} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden selection:bg-red-500/30 selection:text-red-200 text-slate-100 bg-slate-950">
      <BackgroundEffects />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar onNavigate={navigate} onOpenAuth={openAuthModal} />

        <main className="flex-grow">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPath}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              <Suspense fallback={
                <div className="min-h-[60vh] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-red-500/50 animate-spin" />
                </div>
              }>
                {renderContent()}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ===== PREMIUM GLASS FOOTER ===== */}
        <footer className="relative z-10 py-8 px-6 border-t border-white/5 glass-heavy">
          <div className="max-w-7xl mx-auto">
            {/* Footer Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10 mb-6">

              {/* Brand Column */}
              <div className="lg:col-span-1">
                <div className="flex items-center gap-2.5 mb-5 group cursor-default">
                  <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:rotate-12 transition-transform">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-extrabold text-xl text-slate-100 tracking-tight">CE Power</span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  {t.footer.desc}
                </p>
                <div className="flex items-center gap-3">
                  {['facebook', 'telegram', 'youtube'].map((social) => (
                    <a
                      key={social}
                      href="#"
                      className="w-9 h-9 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-white hover:border-red-500/30 transition-all text-xs font-bold uppercase"
                    >
                      {social[0].toUpperCase()}
                    </a>
                  ))}
                </div>
              </div>

              {/* Products */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">{t.footer.products}</h4>
                <ul className="space-y-3">
                  {[
                    { name: t.nav.generators, path: '/product' },
                    { name: t.nav.waterPumps, path: '/solutions' },
                    { name: t.pricing.badge, path: '/pricing' },
                  ].map(link => (
                    <li key={link.path}>
                      <a
                        href={`#${link.path}`}
                        onClick={(e) => { e.preventDefault(); navigate(link.path); }}
                        className="text-slate-400 hover:text-white text-sm transition-colors duration-200 flex items-center gap-2 group"
                      >
                        <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-red-500 transition-colors" />
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">{t.footer.company}</h4>
                <ul className="space-y-3">
                  {[
                    { name: t.nav.dashboard, path: '/dashboard' },
                  ].map(link => (
                    <li key={link.path}>
                      <a
                        href={`#${link.path}`}
                        onClick={(e) => { e.preventDefault(); navigate(link.path); }}
                        className="text-slate-400 hover:text-white text-sm transition-colors duration-200 flex items-center gap-2 group"
                      >
                        <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-red-500 transition-colors" />
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">{t.footer.contact}</h4>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <Phone size={16} className="text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-white text-sm font-bold">09 66 33 03 09</p>
                      <p className="text-slate-500 text-xs">{t.footer.time}</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <MapPin size={16} className="text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-white text-sm font-medium">{t.footer.address}</p>
                      <p className="text-slate-500 text-xs">{t.footer.city}</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Mail size={16} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-slate-400 text-sm">info@cepower.et</p>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-2">
              <p className="text-xs text-slate-500">
                {t.footer.copyright.replace('{year}', new Date().getFullYear())}
              </p>
              <p className="text-xs text-slate-600">
                {t.footer.est}
              </p>
            </div>
          </div>
        </footer>
      </div>

      <VoiceAssistant />
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none z-0" />

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/251966330309"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-6 z-[90] w-14 h-14 rounded-full bg-green-600 hover:bg-green-500 flex items-center justify-center shadow-lg shadow-green-900/40 hover:scale-110 active:scale-95 transition-all group"
        title="Chat on WhatsApp"
      >
        <MessageCircle className="w-6 h-6 text-white" fill="currentColor" />
        <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-20 pointer-events-none" />
      </a>

      {/* Back to Top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 left-6 z-[90] w-10 h-10 rounded-full glass flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <ArrowUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};

export default App;
