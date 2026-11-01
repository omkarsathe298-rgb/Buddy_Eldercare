import React, { useState, useEffect, useRef } from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { sendMessageToAI } from '../../services/api';
import { 
  X, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Bot, 
  Send, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ isOpen, onClose }) => {
  const { language, speak, stopSpeaking, isSpeaking, speechSpeed, setSpeechSpeed, playTapSound } = useAccessibility();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        const text = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setTranscript(text);
      };

      recognition.onerror = (event: any) => {
        console.warn('Voice modal recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMessage(language === 'hi' ? 'माइक्रोफ़ोन अनुमति अस्वीकृत है।' : 'Microphone permission denied.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const startListening = () => {
    playTapSound();
    stopSpeaking();
    setErrorMessage(null);
    setTranscript('');
    setAiResponse('');

    if (recognitionRef.current) {
      recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Speech start error:', e);
      }
    } else {
      setErrorMessage(language === 'hi' ? 'इस ब्राउज़र में आवाज पहचान उपलब्ध नहीं है।' : 'Voice recognition not available.');
    }
  };

  const stopListeningAndAsk = async () => {
    playTapSound();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);

    if (!transcript.trim()) return;

    setProcessing(true);
    try {
      const res = await sendMessageToAI({
        message: transcript,
        language
      });
      setAiResponse(res.text);
      speak(res.text, language, speechSpeed);
    } catch (err: any) {
      const fallback = language === 'hi'
        ? 'माफ़ कीजिये, मैं समझ नहीं पाया। कृपया दोबारा बोलें।'
        : language === 'mr'
        ? 'क्षमस्व, मला नीट ऐकू आले नाही. कृपया पुन्हा बोला.'
        : 'I apologize, could you please repeat that?';
      setAiResponse(fallback);
      speak(fallback, language, speechSpeed);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div 
        className="bg-slate-900 rounded-3xl border-4 border-amber-400 p-6 md:p-10 max-w-2xl w-full text-white shadow-2xl space-y-8 relative text-center"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={() => { stopSpeaking(); onClose(); }}
          className="absolute right-5 top-5 p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          title="Close Voice Assistant"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-4 py-1.5 rounded-full text-sm font-bold border border-amber-400/30">
            <Sparkles className="w-4 h-4" />
            <span>
              {language === 'hi' ? 'वरिष्ठ नागरिक आवाज सहायक' : language === 'mr' ? 'ज्येष्ठ नागरिक व्हॉइस असिस्टंट' : 'Senior Voice Assistant'}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black">
            {language === 'hi' ? 'बस बोलिए, हम सुन रहे हैं' : language === 'mr' ? 'फक्त बोला, आम्ही ऐकत आहोत' : 'Speak to Buddy AI'}
          </h2>
          <p className="text-slate-300 text-base font-medium">
            {language === 'hi' ? 'माइक बटन दबाएं और अपना सवाल अपनी भाषा में पूछें' : language === 'mr' ? 'माइकचे बटन दाबा आणि आपल्या भाषेत विचारा' : 'Press the microphone and speak in Hindi, Marathi, or English'}
          </p>
        </div>

        {/* Giant Microphone Button */}
        <div className="py-4 flex flex-col items-center justify-center">
          <button
            type="button"
            onClick={isListening ? stopListeningAndAsk : startListening}
            className={`w-36 h-36 md:w-44 md:h-44 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 relative group ${
              isListening
                ? 'bg-red-600 scale-110 shadow-red-500/80 animate-pulse'
                : 'bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 hover:scale-105 shadow-amber-500/50'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-16 h-16 text-white mb-1" />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  {language === 'hi' ? 'रोकें व पूछें' : language === 'mr' ? 'थांबवा व विचारा' : 'Tap to Finish'}
                </span>
              </>
            ) : (
              <>
                <Mic className="w-16 h-16 text-white mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  {language === 'hi' ? 'बोलने के लिए दबाएं' : language === 'mr' ? 'बोलण्यासाठी दाबा' : 'Tap & Speak'}
                </span>
              </>
            )}
          </button>

          {isListening && (
            <div className="mt-4 flex items-center gap-1">
              {[40, 70, 90, 50, 80, 100, 60, 85, 45].map((h, i) => (
                <span 
                  key={i} 
                  className="w-1.5 bg-amber-400 rounded-full animate-bounce"
                  style={{ height: `${h * 0.3}px`, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Spoken Query Display */}
        {transcript && (
          <div className="p-4 rounded-2xl bg-slate-800 border-2 border-slate-700 text-left space-y-1">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
              {language === 'hi' ? 'आपने पूछा:' : language === 'mr' ? 'तुम्ही विचारले:' : 'You said:'}
            </span>
            <p className="text-xl font-bold text-white leading-relaxed">
              "{transcript}"
            </p>
          </div>
        )}

        {/* AI Answer Display */}
        {processing && (
          <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-lg animate-pulse">
            {language === 'hi' ? 'बडी एआई उत्तर तैयार कर रहा है...' : language === 'mr' ? 'बडी एआय उत्तर तयार करत आहे...' : 'Buddy AI is preparing your answer...'}
          </div>
        )}

        {aiResponse && !processing && (
          <div className="p-6 rounded-2xl bg-slate-800 border-2 border-amber-400/60 text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="w-4 h-4" />
                Buddy AI Answer:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => speak(aiResponse, language, speechSpeed)}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'दोबारा सुनें' : language === 'mr' ? 'पुन्हा ऐका' : 'Repeat'}</span>
                </button>
                {isSpeaking && (
                  <button
                    type="button"
                    onClick={stopSpeaking}
                    className="p-1 rounded-lg bg-red-600 text-white"
                    title="Stop speech"
                  >
                    <VolumeX className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-lg md:text-xl font-medium text-slate-100 leading-relaxed">
              {aiResponse}
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500 text-rose-300 text-sm font-bold">
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
};
