import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppLanguage, FontSize } from '../types';

interface AccessibilityContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  toggleHighContrast: () => void;
  speechSpeed: number;
  setSpeechSpeed: (speed: number) => void;
  speak: (text: string, customLang?: AppLanguage, customSpeed?: number) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  playTapSound: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    return (localStorage.getItem('buddy_lang') as AppLanguage) || 'en';
  });

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    return (localStorage.getItem('buddy_font_size') as FontSize) || 'large';
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    return localStorage.getItem('buddy_high_contrast') === 'true';
  });

  const [speechSpeed, setSpeechSpeedState] = useState<number>(() => {
    return Number(localStorage.getItem('buddy_speech_speed')) || 0.85; // 0.85x recommended by research for elderly comprehension
  });

  const [isSpeaking, setIsSpeaking] = useState(false);

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('buddy_lang', lang);
  };

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem('buddy_font_size', size);
  };

  const setHighContrast = (val: boolean) => {
    setHighContrastState(val);
    localStorage.setItem('buddy_high_contrast', String(val));
  };

  const toggleHighContrast = () => {
    setHighContrast(!highContrast);
  };

  const setSpeechSpeed = (speed: number) => {
    setSpeechSpeedState(speed);
    localStorage.setItem('buddy_speech_speed', String(speed));
  };

  // Tactile audio chime for elderly confirmation on click
  const playTapSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 gentle tone
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // AudioContext unavailable or blocked
    }
  };

  // Text-to-Speech function
  const speak = (text: string, customLang?: AppLanguage, customSpeed?: number) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    // Clean markdown symbols for natural reading
    const cleanText = text
      .replace(/[#*`_~]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/\n+/g, '. ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const targetLang = customLang || language;
    utterance.rate = customSpeed ?? speechSpeed;
    utterance.pitch = 1.0;

    if (targetLang === 'hi') {
      utterance.lang = 'hi-IN';
    } else if (targetLang === 'mr') {
      utterance.lang = 'mr-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    // Try finding exact localized voice if available
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find(v => v.lang.startsWith(utterance.lang) || v.lang.includes(targetLang));
    if (match) {
      utterance.voice = match;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Keep voices loaded
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Update HTML body root class for font size and contrast
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('font-normal', 'font-large', 'font-xlarge', 'high-contrast-mode');
    if (fontSize === 'normal') root.classList.add('font-normal');
    if (fontSize === 'large') root.classList.add('font-large');
    if (fontSize === 'extra-large') root.classList.add('font-xlarge');
    if (highContrast) root.classList.add('high-contrast-mode');
  }, [fontSize, highContrast]);

  return (
    <AccessibilityContext.Provider
      value={{
        language,
        setLanguage,
        fontSize,
        setFontSize,
        highContrast,
        setHighContrast,
        toggleHighContrast,
        speechSpeed,
        setSpeechSpeed,
        speak,
        stopSpeaking,
        isSpeaking,
        playTapSound
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};
