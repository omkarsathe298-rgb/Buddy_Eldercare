import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { AppLanguage, FontSize } from '../../types';
import { 
  Languages, 
  Eye, 
  PhoneCall, 
  LogOut, 
  User as UserIcon, 
  LogIn, 
  Volume2, 
  VolumeX,
  Sparkles,
  ShieldAlert,
  BookOpen,
  Users,
  Settings
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openAuthModal: () => void;
  openVoiceAssistant: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  openAuthModal,
  openVoiceAssistant
}) => {
  const { currentUser, userProfile, logout, isAdmin, isCaregiver } = useAuth();
  const { 
    language, 
    setLanguage, 
    fontSize, 
    setFontSize, 
    highContrast, 
    toggleHighContrast,
    isSpeaking,
    stopSpeaking,
    playTapSound
  } = useAccessibility();

  const handleTabChange = (tab: string) => {
    playTapSound();
    setCurrentTab(tab);
  };

  const languageLabels: Record<AppLanguage, { native: string; label: string }> = {
    en: { native: 'English', label: 'English' },
    hi: { native: 'हिंदी', label: 'Hindi' },
    mr: { native: 'मराठी', label: 'Marathi' }
  };

  const navItems = [
    { id: 'dashboard', label: { en: 'Home', hi: 'मुख्य पृष्ठ', mr: 'मुख्य पृष्ठ' }, icon: Sparkles },
    { id: 'learning', label: { en: 'Learn', hi: 'सीखें', mr: 'शिका' }, icon: BookOpen },
    { id: 'safety', label: { en: 'Safety Shield', hi: 'सुरक्षा कवच', mr: 'सुरक्षा कवच' }, icon: ShieldAlert },
    { id: 'research', label: { en: 'Research Hub', hi: 'शोध केंद्र', mr: 'संशोधन कक्ष' }, icon: Eye },
    { id: 'caregiver', label: { en: 'Family', hi: 'परिवार', mr: 'कुटुंब' }, icon: Users },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', label: { en: 'Admin', hi: 'व्यवस्थापक', mr: 'प्रशासक' }, icon: Settings });
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-amber-200/70 shadow-sm transition-colors">
      {/* Top Accessibility & Emergency Bar */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white px-3 py-1.5 text-sm font-medium">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Emergency Toll-Free Quick Dial Notice */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 bg-red-600/90 text-white px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
              <PhoneCall className="w-3.5 h-3.5" />
              {language === 'hi' ? 'आपातकाल' : language === 'mr' ? 'तातडीची मदत' : 'Helpline'}
            </span>
            <span className="text-xs md:text-sm font-semibold">
              {language === 'hi' 
                ? 'वरिष्ठ नागरिक: 14567 | साइबर धोखाधड़ी: 1930 | पुलिस: 112' 
                : language === 'mr' 
                ? 'ज्येष्ठ नागरिक: १४५६७ | सायबर फसवणूक: १९३० | पोलीस: ११२' 
                : 'Senior Helpline: 14567 | Cyber Fraud: 1930 | Emergency: 112'}
            </span>
          </div>

          {/* Accessibility Quick Controls */}
          <div className="flex items-center gap-3">
            {/* Text Size Controls */}
            <div className="flex items-center bg-black/20 rounded-lg p-0.5" title="Adjust Text Size">
              <span className="text-xs font-semibold px-1.5 opacity-80">A</span>
              <button
                type="button"
                onClick={() => { playTapSound(); setFontSize('normal'); }}
                className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                  fontSize === 'normal' ? 'bg-white text-amber-900 shadow' : 'hover:bg-white/20'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => { playTapSound(); setFontSize('large'); }}
                className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                  fontSize === 'large' ? 'bg-white text-amber-900 shadow' : 'hover:bg-white/20'
                }`}
              >
                Large
              </button>
              <button
                type="button"
                onClick={() => { playTapSound(); setFontSize('extra-large'); }}
                className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                  fontSize === 'extra-large' ? 'bg-white text-amber-900 shadow' : 'hover:bg-white/20'
                }`}
              >
                XL
              </button>
            </div>

            {/* High Contrast Toggle */}
            <button
              type="button"
              onClick={() => { playTapSound(); toggleHighContrast(); }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all border ${
                highContrast 
                  ? 'bg-yellow-400 text-black border-yellow-300 font-extrabold' 
                  : 'bg-black/20 text-white border-white/30 hover:bg-black/30'
              }`}
              title="Toggle High Contrast"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{highContrast ? 'High Contrast ON' : 'Contrast'}</span>
            </button>

            {/* Stop Speech Button if playing */}
            {isSpeaking && (
              <button
                type="button"
                onClick={stopSpeaking}
                className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 rounded text-xs font-bold animate-bounce"
                title="Stop Reading"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>Stop Voice</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo & Senior Greeting */}
        <div 
          onClick={() => handleTabChange('dashboard')} 
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center font-black text-2xl shadow-md border-2 border-white group-hover:scale-105 transition-transform">
            <span>बु</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-slate-900">
                Buddy <span className="text-amber-600">AI</span>
              </span>
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-md font-bold border border-amber-300">
                {language === 'hi' ? 'साथी' : language === 'mr' ? 'सखा' : 'Companion'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {language === 'hi'
                ? 'वरिष्ठ नागरिकों का डिजिटल मित्र'
                : language === 'mr'
                ? 'ज्येष्ठ नागरिकांचा हक्काचा मार्गदर्शक'
                : 'Digital Learning & Safety for Seniors'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabChange(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-base font-bold transition-all ${
                  active 
                    ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30' 
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label[language] || item.label.en}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Section: Language Switcher, Voice Assistant Launcher, User Profile / Login */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Quick Voice Assistant Button */}
          <button
            type="button"
            onClick={() => { playTapSound(); openVoiceAssistant(); }}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold px-3 md:px-4 py-2.5 rounded-xl shadow-md border border-amber-300 transition-all hover:scale-105 active:scale-95"
            title="Open Voice Assistant"
          >
            <Volume2 className="w-5 h-5 animate-pulse" />
            <span className="hidden sm:inline text-sm md:text-base">
              {language === 'hi' ? 'बोलकर पूछें' : language === 'mr' ? 'बोलून विचारा' : 'Voice Buddy'}
            </span>
          </button>

          {/* Language Switcher Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200" title="Change Language">
            {(['en', 'hi', 'mr'] as AppLanguage[]).map(langCode => (
              <button
                key={langCode}
                type="button"
                onClick={() => { playTapSound(); setLanguage(langCode); }}
                className={`px-2.5 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
                  language === langCode 
                    ? 'bg-white text-amber-700 shadow border border-amber-200' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {languageLabels[langCode].native}
              </button>
            ))}
          </div>

          {/* User Auth Info / Login Button */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-sm font-bold text-slate-800 leading-tight">
                  {userProfile?.name || currentUser.displayName || 'Elderly Learner'}
                </span>
                <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
                  {userProfile?.role === 'admin' 
                    ? 'Admin' 
                    : userProfile?.role === 'caregiver' 
                    ? 'Caregiver' 
                    : 'Learner'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => { playTapSound(); logout(); }}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => { playTapSound(); openAuthModal(); }}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 md:px-4 py-2.5 rounded-xl text-sm md:text-base shadow-sm transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>{language === 'hi' ? 'लॉगिन करें' : language === 'mr' ? 'लॉगिन करा' : 'Sign In'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden flex items-center justify-around bg-slate-50 border-t border-slate-200 px-2 py-2 overflow-x-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTabChange(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-bold transition-all ${
                active ? 'text-amber-600' : 'text-slate-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="truncate max-w-[70px]">{item.label[language] || item.label.en}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
