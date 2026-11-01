import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { sendMessageToAI } from '../../services/api';
import { ChatMessage, AgentType, AppLanguage } from '../../types';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, addDoc, getDocs, query, where, orderBy, doc, setDoc } from 'firebase/firestore';
import { 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  Sparkles, 
  ShieldAlert, 
  HelpCircle, 
  BookOpen, 
  FileText,
  MessageSquare,
  Bot,
  User as UserIcon,
  CheckCircle,
  Clock
} from 'lucide-react';

interface AgentChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
  defaultAgent?: AgentType;
}

export const AgentChatModal: React.FC<AgentChatModalProps> = ({
  isOpen,
  onClose,
  initialTopic,
  defaultAgent = 'learning'
}) => {
  const { currentUser } = useAuth();
  const { 
    language, 
    setLanguage, 
    speak, 
    stopSpeaking, 
    isSpeaking, 
    speechSpeed, 
    setSpeechSpeed, 
    playTapSound 
  } = useAccessibility();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AgentType | 'auto'>(defaultAgent || 'auto');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(true);
  const [feedbackGivenMap, setFeedbackGivenMap] = useState<Record<string, boolean>>({});
  const [activeConversationId, setActiveConversationId] = useState<string>(() => `conv-${Date.now()}`);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Suggested questions for senior users in each language
  const SUGGESTED_QUERIES: Record<AppLanguage, string[]> = {
    en: [
      'Solve & explain: Does receiving UPI money need a PIN?',
      'How do I send a WhatsApp voice message?',
      'Solve & explain: What to do if fake police video call occurs?',
      'How to make words on my phone larger?',
      'Solve & explain: How to submit Jeevan Pramaan from home?'
    ],
    hi: [
      'हल करें: क्या पैसे पाने के लिए UPI पिन चाहिए?',
      'व्हाट्सएप पर बोलकर आवाज कैसे भेजें?',
      'हल करें: बिजली बिल कटने का मेसेज आने पर क्या करें?',
      'फोन के अक्षरों को बड़ा कैसे करें?',
      'हल करें: घर बैठे पेंशन जीवन प्रमाण पत्र कैसे दें?'
    ],
    mr: [
      'उत्तर सोडवून सांगा: पैसे मिळवण्यासाठी UPI पिन लागतो का?',
      'व्हॉट्सॲपवर आवाज रेकॉर्ड करून कसा पाठवावा?',
      'उत्तर सोडवून सांगा: बनावट पोलीस व्हिडिओ कॉल आल्यास काय करावे?',
      'मोबाईलचे अक्षर मोठे कसे करावे?',
      'उत्तर सोडवून सांगा: घरी बसून जीवन प्रमाणपत्र कसे द्यावे?'
    ]
  };

  // Scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle initial topic injection
  useEffect(() => {
    if (isOpen) {
      if (initialTopic) {
        handleSendMessage(initialTopic);
      } else if (messages.length === 0) {
        // Welcome greeting
        const welcomeText = language === 'hi'
          ? 'नमस्ते! मैं आपका डिजिटल साथी बडी हूँ। आप मुझसे स्मार्टफोन, व्हाट्सएप, यूपीआई सुरक्षा या किसी भी डिजिटल विषय के बारे में पूछ सकते हैं। आप टाइप कर सकते हैं या माइक दबाकर बोल भी सकते हैं।'
          : language === 'mr'
          ? 'नमस्कार! मी तुमचा डिजिटल मित्र बडी आहे. तुम्ही मला स्मार्टफोन, व्हॉट्सॲप, UPI सुरक्षा किंवा कोणत्याही विषयाबद्दल विचारू शकता. तुम्ही लिहू शकता किंवा माइक दाबून बोलू शकता.'
          : 'Namaste! I am your Buddy AI companion. Feel free to ask me anything about using your smartphone, WhatsApp, staying safe from scams, or learning new technology. You can type or tap the microphone to speak.';
        
        setMessages([{
          id: 'welcome-msg',
          sender: 'agent',
          text: welcomeText,
          agentType: 'learning',
          timestamp: new Date().toISOString()
        }]);
      }
    }
  }, [isOpen, initialTopic]);

  // Speech Recognition setup (Web Speech API)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setInputText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechRecognitionSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleRecording = () => {
    playTapSound();
    if (!speechRecognitionSupported) {
      alert(language === 'hi' ? 'आपके ब्राउज़र में आवाज पहचान समर्थित नहीं है।' : 'Voice recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        // Configure recognition language
        recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';
        try {
          recognitionRef.current.start();
          setIsRecording(true);
        } catch (e) {
          console.warn('Speech start error:', e);
        }
      }
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const text = (customText || inputText).trim();
    if (!text || loading) return;

    playTapSound();
    setInputText('');

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString()
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setLoading(true);

    try {
      const response = await sendMessageToAI({
        message: text,
        history: newHistory,
        language,
        agentType: selectedAgent === 'auto' ? undefined : selectedAgent,
        userId: currentUser?.uid || 'guest_elder',
        conversationId: activeConversationId
      });

      const agentMsg: ChatMessage = {
        id: `agt-${Date.now()}`,
        sender: 'agent',
        text: response.text,
        agentType: response.agentType,
        sources: response.citations,
        timestamp: response.timestamp
      };

      setMessages(prev => [...prev, agentMsg]);

      // Speak answer automatically if short and elder hasn't stopped
      // or provide one-tap play button

      // Persist in Firestore if user is authenticated
      if (currentUser) {
        try {
          const convRef = doc(db, 'conversations', activeConversationId);
          await setDoc(convRef, {
            id: activeConversationId,
            userId: currentUser.uid,
            agentType: response.agentType,
            title: text.slice(0, 40),
            language,
            updatedAt: new Date().toISOString()
          }, { merge: true });

          await addDoc(collection(db, 'conversations', activeConversationId, 'messages'), {
            id: agentMsg.id,
            conversationId: activeConversationId,
            userId: currentUser.uid,
            sender: 'agent',
            text: agentMsg.text,
            agentType: agentMsg.agentType,
            createdAt: agentMsg.timestamp
          });
        } catch (dbErr) {
          console.warn('Firestore message save note:', dbErr);
        }
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'agent',
        text: language === 'hi'
          ? 'माफ़ कीजिये, संपर्क में बाधा आई। कृपया दोबारा पूछें।'
          : language === 'mr'
          ? 'क्षमस्व, संपर्क होऊ शकला नाही. कृपया पुन्हा विचारा.'
          : 'I apologize, could you please ask that once again?',
        agentType: selectedAgent === 'auto' ? 'support' : selectedAgent,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (msgId: string, rating: number, isHelpful: boolean) => {
    playTapSound();
    setFeedbackGivenMap(prev => ({ ...prev, [msgId]: true }));

    if (currentUser) {
      try {
        await addDoc(collection(db, 'feedback'), {
          userId: currentUser.uid,
          conversationId: activeConversationId,
          rating,
          isHelpful,
          agentType: selectedAgent === 'auto' ? 'feedback' : selectedAgent,
          createdAt: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Feedback save check:', e);
      }
    }
  };

  const handleStartNewConversation = () => {
    playTapSound();
    stopSpeaking();
    setActiveConversationId(`conv-${Date.now()}`);
    setMessages([]);
    setInputText('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 md:p-4 overflow-hidden">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full h-[92vh] flex flex-col overflow-hidden border-2 border-amber-300 relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-4 md:p-6 text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-2xl border border-white/30">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black">Buddy AI</h2>
                <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {selectedAgent.toUpperCase()} AGENT
                </span>
              </div>
              <p className="text-amber-100 text-xs md:text-sm font-semibold">
                {language === 'hi' ? 'आदरणीय वरिष्ठ नागरिकों के लिए सहज व धैर्यवान साथी' : language === 'mr' ? 'ज्येष्ठ नागरिकांसाठी प्रेमळ व मार्गदर्शक मित्र' : 'Your patient companion for simple digital learning'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartNewConversation}
              className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all"
              title="Start New Chat"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'नई बात' : language === 'mr' ? 'नवीन संवाद' : 'New Chat'}</span>
            </button>

            <button
              type="button"
              onClick={() => { stopSpeaking(); onClose(); }}
              className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              title="Close Chat"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Specialized Agent Selector Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
            {language === 'hi' ? 'मोड:' : language === 'mr' ? 'मोड:' : 'Mode:'}
          </span>
          {[
            { id: 'auto', label: { en: '⚡ Auto Routing', hi: '⚡ स्मार्ट चयन', mr: '⚡ स्मार्ट निवड' }, icon: Sparkles },
            { id: 'learning', label: { en: 'Learning', hi: 'शिक्षा', mr: 'शिक्षण' }, icon: BookOpen },
            { id: 'safety', label: { en: 'Safety Shield', hi: 'सुरक्षा', mr: 'सुरक्षा' }, icon: ShieldAlert },
            { id: 'support', label: { en: 'Support', hi: 'सहयोग', mr: 'मदत' }, icon: HelpCircle },
            { id: 'research', label: { en: 'Research', hi: 'शोध', mr: 'संशोधन' }, icon: FileText },
            { id: 'general', label: { en: 'General', hi: 'सामान्य ज्ञान', mr: 'सामान्य' }, icon: Bot },
            { id: 'feedback', label: { en: 'Feedback', hi: 'प्रतिक्रिया', mr: 'अभिप्राय' }, icon: MessageSquare },
          ].map(tab => {
            const Icon = tab.icon;
            const active = selectedAgent === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => { playTapSound(); setSelectedAgent(tab.id as any); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all ${
                  active 
                    ? 'bg-amber-500 text-white shadow-sm' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label[language] || tab.label.en}</span>
              </button>
            );
          })}
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/60">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const feedbackGiven = !!feedbackGivenMap[msg.id];

            return (
              <div 
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow text-sm font-black ${
                  isUser 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white'
                }`}>
                  {isUser ? <UserIcon className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>

                {/* Message Bubble */}
                <div className={`rounded-3xl p-5 shadow-sm space-y-3 ${
                  isUser 
                    ? 'bg-slate-900 text-white rounded-tr-none' 
                    : 'bg-white text-slate-900 border-2 border-slate-200 rounded-tl-none'
                }`}>
                  {/* Sender badge & Agent tag */}
                  <div className="flex items-center justify-between gap-3 text-xs opacity-75">
                    <span className="font-bold">
                      {isUser ? (language === 'hi' ? 'आप' : language === 'mr' ? 'तुम्ही' : 'You') : 'Buddy AI'}
                    </span>
                    {!isUser && msg.agentType && (
                      <span className={`uppercase text-[10px] font-black tracking-wider px-2.5 py-0.5 rounded-full border ${
                        msg.agentType === 'safety'
                          ? 'bg-red-100 text-red-900 border-red-300'
                          : msg.agentType === 'support'
                          ? 'bg-teal-100 text-teal-900 border-teal-300'
                          : msg.agentType === 'research'
                          ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                          : msg.agentType === 'general'
                          ? 'bg-purple-100 text-purple-900 border-purple-300'
                          : msg.agentType === 'feedback'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}>
                        {msg.agentType} AGENT
                      </span>
                    )}
                  </div>

                  {/* Message Text with accessible whitespace */}
                  <div className="text-base md:text-lg leading-relaxed whitespace-pre-line font-medium">
                    {msg.text}
                  </div>

                  {/* Research Citations (if present) */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 bg-amber-50/60 p-3 rounded-2xl space-y-1.5 text-xs">
                      <span className="font-black text-amber-900 uppercase tracking-wider flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {language === 'hi' ? 'प्रामाणिक शोध संदर्भ:' : language === 'mr' ? 'अधिकृत संशोधन संदर्भ:' : 'Verified Research Citations:'}
                      </span>
                      {msg.sources.map((src, sIdx) => (
                        <div key={sIdx} className="text-slate-700 font-semibold pl-2 border-l-2 border-amber-400">
                          "{src.title}" {src.author && `— ${src.author}`} ({src.year})
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Bar for Agent Messages: Read Aloud & Feedback */}
                  {!isUser && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                      {/* Audio Playback Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => { playTapSound(); speak(msg.text, language, speechSpeed); }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold border border-amber-300 transition-all"
                          title="Read this message aloud"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                          <span>{language === 'hi' ? 'सुनें' : language === 'mr' ? 'ऐका' : 'Listen'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const newSpeed = speechSpeed === 0.75 ? 0.85 : speechSpeed === 0.85 ? 1.0 : 0.75;
                            setSpeechSpeed(newSpeed);
                            playTapSound();
                          }}
                          className="px-2 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                          title="Adjust reading speed"
                        >
                          {speechSpeed}x speed
                        </button>
                      </div>

                      {/* Helpful Rating / Feedback */}
                      {!feedbackGiven ? (
                        <div className="flex items-center gap-1 text-slate-500 font-bold">
                          <span className="text-[11px] mr-1">
                            {language === 'hi' ? 'क्या यह मददगार था?' : language === 'mr' ? 'मदत झाली का?' : 'Helpful?'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleFeedback(msg.id, 5, true)}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                            title="Yes, helpful"
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFeedback(msg.id, 2, false)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="Needs improvement"
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{language === 'hi' ? 'धन्यवाद!' : language === 'mr' ? 'धन्यवाद!' : 'Thank you!'}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200 max-w-sm">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center animate-spin">
                <Bot className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-slate-700 animate-pulse">
                {language === 'hi' ? 'बडी एआई सोच रहा है...' : language === 'mr' ? 'बडी एआय विचार करत आहे...' : 'Buddy AI is thinking...'}
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Question Chips */}
        <div className="bg-white border-t border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="text-xs font-bold text-slate-400 shrink-0">
            {language === 'hi' ? 'सुझाव:' : language === 'mr' ? 'सुझाव:' : 'Try asking:'}
          </span>
          {SUGGESTED_QUERIES[language]?.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(q)}
              className="text-xs md:text-sm font-semibold bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 whitespace-nowrap transition-all"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Voice Transcript Preview if recording */}
        {isRecording && (
          <div className="bg-red-50 border-t border-red-200 px-4 py-2 flex items-center justify-between text-red-900 font-bold text-sm animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600 animate-ping"></span>
              <span>
                {language === 'hi' ? 'बोलिए, हम सुन रहे हैं...' : language === 'mr' ? 'बोला, आम्ही ऐकत आहोत...' : 'Listening... Speak clearly into your mic'}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleRecording}
              className="text-xs font-black underline"
            >
              Done Speaking
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <div className="flex items-center gap-2 md:gap-3">
            {/* Microphone Button */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-3.5 md:p-4 rounded-2xl font-black transition-all shadow-md flex items-center justify-center shrink-0 ${
                isRecording 
                  ? 'bg-red-600 text-white animate-pulse shadow-red-500/50 scale-105' 
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-amber-300'
              }`}
              title="Speak your question"
            >
              {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6 text-amber-800" />}
            </button>

            {/* Input Box */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                language === 'hi'
                  ? 'अपना सवाल यहाँ लिखें या माइक दबाकर बोलें...'
                  : language === 'mr'
                  ? 'येथे प्रश्न विचारा किंवा माइक दाबून बोला...'
                  : 'Type your question or tap mic to speak...'
              }
              className="flex-1 px-4 py-3.5 md:py-4 text-base md:text-lg rounded-2xl border-2 border-slate-300 focus:border-amber-500 focus:outline-none transition-colors"
            />

            {/* Send Button */}
            <button
              type="button"
              disabled={loading || !inputText.trim()}
              onClick={() => handleSendMessage()}
              className="p-3.5 md:p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black shadow-lg shadow-amber-500/30 disabled:opacity-40 transition-all hover:scale-105 shrink-0"
              title="Send Message"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
