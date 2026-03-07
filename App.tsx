
import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import BackgroundEffects from './components/ui/BackgroundEffects';
import AuthModal from './components/AuthModal';
import VoiceAssistant from './components/VoiceAssistant';
import { Loader2, Zap } from 'lucide-react';

// Auth
import { useAuth } from './lib/AuthContext';

// Lazy Load Pages for Performance
const Product = React.lazy(() => import('./pages/Product'));
const Solutions = React.lazy(() => import('./pages/Solutions'));

const App: React.FC = () => {
  const getHashPath = () => window.location.hash.slice(1) || '/';

  const [currentPath, setCurrentPath] = useState(getHashPath());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { user, loading } = useAuth();

  useEffect(() => {
    const onHashChange = () => {
      setCurrentPath(getHashPath());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
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
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200 text-slate-100 bg-slate-950">
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
                  <Loader2 className="w-8 h-8 text-emerald-500/50 animate-spin" />
                </div>
              }>
                {renderContent()}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="relative z-10 py-12 px-6 border-t border-white/5 bg-slate-950/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 group cursor-default">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:rotate-12 transition-transform">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-200 tracking-tight">CE Power</span>
            </div>
            <div className="flex flex-col items-center md:items-end gap-2">
              <p className="text-sm text-slate-400 font-medium">
                Premium Power Solutions for Ethiopia
              </p>
              <p className="text-xs text-slate-600">
                © {new Date().getFullYear()} CE Power Systems. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>

      <VoiceAssistant />
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none z-0" />

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};

export default App;
