
import React, { useState, useEffect, Suspense } from 'react';
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
        // Main landing page view
        return <Hero onOpenAuth={openAuthModal} onNavigate={navigate} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200 text-slate-100">
      <BackgroundEffects />

      <div className="relative z-10">
        <Navbar onNavigate={navigate} onOpenAuth={openAuthModal} />
        <main>
          <Suspense fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-emerald-500/50 animate-spin" />
            </div>
          }>
            {renderContent()}
          </Suspense>
        </main>
      </div>

      {/* Voice Assistant - Always visible, handles its own access control */}
      <VoiceAssistant />
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none z-0" />

      <footer className="relative z-10 py-8 px-6 border-t border-white/5 bg-slate-950/50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-200">CE Power</span>
          </div>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} CE Power Systems. All rights reserved.
          </p>
        </div>
      </footer>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};

export default App;
