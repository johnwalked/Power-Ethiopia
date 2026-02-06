
import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, ArrowRight, Loader2, KeyRound, ArrowLeft, User } from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  GoogleAuthProvider, 
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getFirebaseErrorMessage } from '../lib/firebaseUtils';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [mode, setMode] = useState<'default' | 'forgot-password' | 'reset-sent'>('default');
  
  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { language } = useLanguage();
  const t = translations[language].auth;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsLoading(false);
      setFullName('');
      setEmail('');
      setPassword('');
      setMode('default');
      setActiveTab('signin');
    }
  }, [isOpen]);

  // Clear errors when switching tabs
  useEffect(() => {
    setError(null);
  }, [activeTab, mode]);

  const handleSuccess = () => {
    setIsLoading(false);
    onClose();
    window.location.hash = '#/';
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!email || !password || !fullName) {
      setError('Please fill in all required fields.');
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
        displayName: fullName
      });
      handleSuccess();
    } catch (err: any) {
      console.error(err);
      setError(getFirebaseErrorMessage(err.code));
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password.');
      setIsLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      handleSuccess();
    } catch (err: any) {
      console.error(err);
      setError(getFirebaseErrorMessage(err.code));
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      handleSuccess();
    } catch (err: any) {
      console.error(err);
      setError(getFirebaseErrorMessage(err.code));
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMode('reset-sent');
    } catch (err: any) {
      console.error(err);
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all z-10"
        >
          <X size={20} />
        </button>

        {mode === 'reset-sent' ? (
           <div className="p-8 text-center animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                <Mail className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Check your inbox</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                We have sent a password change link to <br/>
                <span className="font-semibold text-white">{email}</span>.
              </p>
              <button
                onClick={() => {
                  setMode('default');
                  setActiveTab('signin');
                  setPassword('');
                }}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"
              >
                {t.signInBtn}
              </button>
           </div>
        ) : mode === 'forgot-password' ? (
           <div className="p-8 animate-in fade-in slide-in-from-right-8 duration-300">
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-blue-400 border border-blue-500/20">
                  <KeyRound size={24} />
                </div>
                <h2 className="text-2xl font-bold text-white">{t.resetPass}</h2>
                <p className="text-slate-400 mt-2 text-sm">
                  {t.resetDesc}
                </p>
              </div>

              <form onSubmit={handlePasswordReset} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-900/20 border border-red-800/30 text-red-400 text-xs font-medium flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                     {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 ml-1">{t.email}</label>
                  <div className="relative group">
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-white/10 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-300 pl-10 bg-white/5 text-white placeholder:text-slate-500"
                      placeholder="name@company.com"
                      required
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4" />
                      Sending Link...
                    </>
                  ) : (
                    <>
                      {t.getLink}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
              
              <button 
                onClick={() => setMode('default')}
                className="w-full mt-4 py-2 text-sm text-slate-400 hover:text-white font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <ArrowLeft size={14} />
                {t.backToSignIn}
              </button>
           </div>
        ) : (
          <>
            {/* Header Section */}
            <div className="px-8 pt-8 pb-6 text-center">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-emerald-400 border border-emerald-500/20">
                <Lock size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white">
                {activeTab === 'signin' ? t.welcomeBack : t.createAccount}
              </h2>
              <p className="text-slate-400 mt-2 text-sm">
                {activeTab === 'signin' ? t.signInDesc : t.signUpDesc}
              </p>
            </div>

            {/* Tabs */}
            <div className="px-8 flex border-b border-white/10">
              <button
                onClick={() => setActiveTab('signin')}
                className={`flex-1 pb-3 text-sm font-semibold transition-all relative ${
                  activeTab === 'signin' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t.signInBtn}
                {activeTab === 'signin' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-t-full shadow-[0_-2px_8px_rgba(16,185,129,0.5)]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className={`flex-1 pb-3 text-sm font-semibold transition-all relative ${
                  activeTab === 'signup' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t.signUpBtn}
                {activeTab === 'signup' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-t-full shadow-[0_-2px_8px_rgba(16,185,129,0.5)]" />
                )}
              </button>
            </div>

            {/* Form Body */}
            <div className="p-8">
              <form className="space-y-4" onSubmit={activeTab === 'signup' ? handleSignUp : handleSignIn}>
                
                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded-lg bg-red-900/20 border border-red-800/30 text-red-400 text-xs font-medium flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                     {error}
                  </div>
                )}

                {/* Name Field (Sign Up Only) */}
                {activeTab === 'signup' && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-2">
                    <label className="text-xs font-semibold text-slate-400 ml-1">{t.fullName}</label>
                    <div className="relative group">
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-white/10 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all duration-300 pl-10 bg-white/5 text-white placeholder:text-slate-500"
                        placeholder="John Doe"
                        required
                      />
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 ml-1">{t.email}</label>
                  <div className="relative group">
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-white/10 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all duration-300 pl-10 bg-white/5 text-white placeholder:text-slate-500"
                      placeholder="name@company.com"
                      required
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-semibold text-slate-400">{t.password}</label>
                    {activeTab === 'signin' && (
                      <button 
                        type="button"
                        onClick={() => setMode('forgot-password')}
                        className="text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:underline transition-all"
                      >
                        {t.forgotPass}
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-white/10 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all duration-300 pl-10 bg-white/5 text-white placeholder:text-slate-500"
                      placeholder="••••••••"
                      required
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4" />
                      {activeTab === 'signin' ? 'Signing In...' : 'Creating Account...'}
                    </>
                  ) : (
                    <>
                      {activeTab === 'signin' ? t.signInBtn : t.signUpBtn}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-slate-500 font-medium">Or continue with</span>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <button 
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-4 py-2 border border-white/10 rounded-xl hover:bg-white/5 transition-colors text-slate-300 text-sm font-medium gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-white/5"
                  >
                     <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    {activeTab === 'signin' ? t.continueGoogle : t.signUpGoogle}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
        
        {mode !== 'reset-sent' && mode !== 'forgot-password' && (
            <div className="px-8 py-4 bg-white/5 border-t border-white/10 text-center">
                <p className="text-xs text-slate-500">
                    {t.agreement}
                </p>
            </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
