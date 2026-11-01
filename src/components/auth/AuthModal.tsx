import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { UserRole, AppLanguage } from '../../types';
import { X, LogIn, UserPlus, KeyRound, AlertCircle, CheckCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithEmail, registerWithEmail, loginWithGoogle, resetPassword } = useAuth();
  const { language, playTapSound } = useAccessibility();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('elderly_user');
  const [prefLang, setPrefLang] = useState<AppLanguage>(language);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    playTapSound();

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        onClose();
      } else if (mode === 'register') {
        if (!name.trim()) throw new Error('Please enter your full name.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');
        await registerWithEmail(name, email, password, role, prefLang);
        onClose();
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccessMessage(
          language === 'hi'
            ? 'पासवर्ड रीसेट लिंक आपके ईमेल पर भेज दिया गया है।'
            : language === 'mr'
            ? 'पासवर्ड रिसेट लिंक तुमच्या ईमेलवर पाठवली गेली आहे.'
            : 'Password reset link sent to your email.'
        );
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err.message || 'Authentication error';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        msg = language === 'hi' 
          ? 'ईमेल या पासवर्ड गलत है। कृपया पुनः जांचें।' 
          : language === 'mr' 
          ? 'ईमेल किंवा पासवर्ड चुकीचा आहे. कृपया पुन्हा तपासा.' 
          : 'Invalid email or password. Please check and try again.';
      } else if (msg.includes('email-already-in-use')) {
        msg = language === 'hi'
          ? 'यह ईमेल पहले से पंजीकृत है। कृपया लॉगिन करें।'
          : language === 'mr'
          ? 'हा ईमेल आधीपासून नोंदणीकृत आहे. कृपया लॉगिन करा.'
          : 'Email is already registered. Please sign in.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    playTapSound();
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border-2 border-amber-300 relative my-8"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with Title and Close button */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black text-xl">
              <span>बु</span>
            </div>
            <div>
              <h2 className="text-2xl font-black">
                {mode === 'login' && (language === 'hi' ? 'लॉगिन करें' : language === 'mr' ? 'लॉगिन करा' : 'Sign In')}
                {mode === 'register' && (language === 'hi' ? 'नया खाता बनाएं' : language === 'mr' ? 'नवीन खाते तयार करा' : 'Create Free Account')}
                {mode === 'forgot' && (language === 'hi' ? 'पासवर्ड रीसेट' : language === 'mr' ? 'पासवर्ड रिसेट करा' : 'Reset Password')}
              </h2>
              <p className="text-amber-100 text-xs font-semibold">Buddy AI - Elderly Learning & Assistance</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => { playTapSound(); setMode('login'); setError(null); }}
            className={`flex-1 py-3 text-center text-sm md:text-base font-bold transition-all ${
              mode === 'login' 
                ? 'text-amber-700 border-b-4 border-amber-500 bg-white' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'hi' ? 'लॉगिन' : language === 'mr' ? 'लॉगिन' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => { playTapSound(); setMode('register'); setError(null); }}
            className={`flex-1 py-3 text-center text-sm md:text-base font-bold transition-all ${
              mode === 'register' 
                ? 'text-amber-700 border-b-4 border-amber-500 bg-white' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'hi' ? 'नया खाता' : language === 'mr' ? 'नवीन नोंदणी' : 'Register'}
          </button>
          <button
            type="button"
            onClick={() => { playTapSound(); setMode('forgot'); setError(null); }}
            className={`flex-1 py-3 text-center text-sm md:text-base font-bold transition-all ${
              mode === 'forgot' 
                ? 'text-amber-700 border-b-4 border-amber-500 bg-white' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'hi' ? 'पासवर्ड भूल गए?' : language === 'mr' ? 'पासवर्ड विसरलात?' : 'Forgot Pass?'}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 space-y-5">
          {/* Reassurance pill */}
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs md:text-sm font-semibold">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              {language === 'hi' 
                ? 'आपकी जानकारी सुरक्षित है। हम कभी बैंक पासवर्ड नहीं मांगते।' 
                : language === 'mr' 
                ? 'तुमची माहिती सुरक्षित आहे. आम्ही कधीही बँक पासवर्ड मागत नाही.' 
                : '100% Secure & Private. We never request banking credentials.'}
            </span>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm font-semibold">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-semibold">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Google Sign-in */}
          {mode !== 'forgot' && (
            <div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl border-2 border-slate-300 hover:border-slate-400 bg-white text-slate-800 font-bold text-base shadow-sm hover:bg-slate-50 transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>
                  {language === 'hi' ? 'गूगल खाते से आगे बढ़ें' : language === 'mr' ? 'गुगल खात्याद्वारे सुरू करा' : 'Continue with Google'}
                </span>
              </button>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-500 font-bold">
                    {language === 'hi' ? 'या ईमेल से' : language === 'mr' ? 'किंवा ईमेलने' : 'Or with Email'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1">
                    {language === 'hi' ? 'आपका पूरा नाम' : language === 'mr' ? 'तुमचे पूर्ण नाव' : 'Full Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kulkarni"
                    className="w-full px-4 py-3 text-base rounded-2xl border-2 border-slate-200 focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>

                {/* Role selection */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1">
                    {language === 'hi' ? 'आपकी भूमिका' : language === 'mr' ? 'तुमची भूमिका' : 'Who is this account for?'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('elderly_user')}
                      className={`p-3 rounded-2xl border-2 text-sm font-bold text-left transition-all ${
                        role === 'elderly_user'
                          ? 'border-amber-500 bg-amber-50 text-amber-900'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-extrabold">{language === 'hi' ? 'वरिष्ठ नागरिक' : language === 'mr' ? 'ज्येष्ठ नागरिक' : 'Senior Learner'}</div>
                      <div className="text-xs text-slate-500 font-normal">{language === 'hi' ? 'सीखने के लिए' : language === 'mr' ? 'शिकण्यासाठी' : 'For myself'}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('caregiver')}
                      className={`p-3 rounded-2xl border-2 text-sm font-bold text-left transition-all ${
                        role === 'caregiver'
                          ? 'border-amber-500 bg-amber-50 text-amber-900'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-extrabold">{language === 'hi' ? 'परिवार / देखभालकर्ता' : language === 'mr' ? 'कुटुंब / काळजीवाहक' : 'Caregiver / Family'}</div>
                      <div className="text-xs text-slate-500 font-normal">{language === 'hi' ? 'बुजुर्गों की मदद के लिए' : language === 'mr' ? 'मदत करण्यासाठी' : 'Assisting seniors'}</div>
                    </button>
                  </div>
                </div>

                {/* Preferred Language */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1">
                    {language === 'hi' ? 'पसंदीदा सीखने की भाषा' : language === 'mr' ? 'शिकण्यासाठी पसंतीची भाषा' : 'Preferred Language'}
                  </label>
                  <select
                    value={prefLang}
                    onChange={(e) => setPrefLang(e.target.value as AppLanguage)}
                    className="w-full px-4 py-3 text-base rounded-2xl border-2 border-slate-200 focus:border-amber-500 focus:outline-none bg-white transition-colors"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिंदी (Hindi)</option>
                    <option value="mr">मराठी (Marathi)</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">
                {language === 'hi' ? 'ईमेल पता' : language === 'mr' ? 'ईमेल पत्ता' : 'Email Address'} *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-3 text-base rounded-2xl border-2 border-slate-200 focus:border-amber-500 focus:outline-none transition-colors"
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  {language === 'hi' ? 'पासवर्ड' : language === 'mr' ? 'पासवर्ड' : 'Password'} *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 text-base rounded-2xl border-2 border-slate-200 focus:border-amber-500 focus:outline-none pr-12 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-lg shadow-lg shadow-amber-500/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-4"
            >
              {loading ? (
                <span>{language === 'hi' ? 'कृपया प्रतीक्षा करें...' : language === 'mr' ? 'कृपया थांबा...' : 'Please wait...'}</span>
              ) : mode === 'login' ? (
                <span>{language === 'hi' ? 'लॉगिन करें' : language === 'mr' ? 'लॉगिन करा' : 'Sign In to Buddy AI'}</span>
              ) : mode === 'register' ? (
                <span>{language === 'hi' ? 'खाता बनाएं' : language === 'mr' ? 'खाते तयार करा' : 'Create Free Account'}</span>
              ) : (
                <span>{language === 'hi' ? 'पासवर्ड लिंक भेजें' : language === 'mr' ? 'पासवर्ड लिंक पाठवा' : 'Send Reset Link'}</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
