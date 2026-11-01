import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { LEARNING_COURSES } from '../../data/courses';
import { AgentType } from '../../types';
import { db } from '../../firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { 
  Sparkles, 
  Mic, 
  BookOpen, 
  ShieldAlert, 
  HelpCircle, 
  FileText, 
  PhoneCall, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  Heart,
  Volume2
} from 'lucide-react';

interface ElderlyDashboardProps {
  onNavigate: (tab: string) => void;
  onOpenChat: (agent?: AgentType, topic?: string) => void;
  onOpenVoice: () => void;
}

export const ElderlyDashboard: React.FC<ElderlyDashboardProps> = ({
  onNavigate,
  onOpenChat,
  onOpenVoice
}) => {
  const { currentUser, userProfile } = useAuth();
  const { language, speak, playTapSound } = useAccessibility();

  const [recentConversations, setRecentConversations] = useState<any[]>([]);
  const [completedCount, setCompletedCount] = useState(0);

  // Load user's recent conversations & progress from Firestore
  useEffect(() => {
    if (!currentUser) return;

    const loadUserData = async () => {
      try {
        // Load recent conversations
        const convQ = query(
          collection(db, 'conversations'),
          where('userId', '==', currentUser.uid),
          limit(3)
        );
        const convSnap = await getDocs(convQ);
        const convs: any[] = [];
        convSnap.forEach(d => convs.push(d.data()));
        setRecentConversations(convs);

        // Load progress count
        const progQ = query(
          collection(db, 'progress'),
          where('userId', '==', currentUser.uid)
        );
        const progSnap = await getDocs(progQ);
        setCompletedCount(progSnap.size);
      } catch (err) {
        console.warn('Dashboard data sync note:', err);
      }
    };

    loadUserData();
  }, [currentUser]);

  const greetingName = userProfile?.name 
    ? userProfile.name 
    : (language === 'hi' ? 'आदरणीय दादाजी / दादीजी' : language === 'mr' ? 'आदरणीय आजोबा / आजी' : 'Dear Friend');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      {/* Warm Elderly Welcome Card */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 md:p-12 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-xs md:text-sm font-extrabold uppercase tracking-wide">
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>
              {language === 'hi' ? 'आपका सुरक्षित डिजिटल घर' : language === 'mr' ? 'आपले सुरक्षित डिजिटल घर' : 'Your Safe Digital Companion'}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            {language === 'hi' && `नमस्ते, ${greetingName}!`}
            {language === 'mr' && `नमस्कार, ${greetingName}!`}
            {language === 'en' && `Namaste, ${greetingName}!`}
          </h1>

          <p className="text-amber-100 text-lg md:text-xl font-medium leading-relaxed">
            {language === 'hi'
              ? 'आज आप क्या सीखना चाहेंगे? किसी भी सवाल के लिए बस नीचे बने बटन को दबाकर पूछें।'
              : language === 'mr'
              ? 'आज आपण काय शिकणार? कोणताही प्रश्न विचारायला खालील बटणावर स्पर्श करा.'
              : 'What would you like to explore today? Tap below to talk or choose a friendly lesson.'}
          </p>

          {/* Big Voice Assistant Launcher */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => { playTapSound(); onOpenVoice(); }}
              className="flex items-center gap-3 bg-white hover:bg-amber-50 text-amber-900 font-black text-lg md:text-xl px-6 md:px-8 py-4 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <Mic className="w-7 h-7 text-red-600 animate-pulse" />
              <span>
                {language === 'hi' ? 'बोलकर पूछें (आवाज साथी)' : language === 'mr' ? 'बोलून विचारा (व्हॉइस साथी)' : 'Press & Speak (Voice Buddy)'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { playTapSound(); onOpenChat('learning'); }}
              className="flex items-center gap-2 bg-black/25 hover:bg-black/35 text-white font-bold text-base md:text-lg px-6 py-4 rounded-2xl border border-white/30 transition-all"
            >
              <span>{language === 'hi' ? 'चैट करें' : language === 'mr' ? 'संवाद सुरू करा' : 'Open Text Chat'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Learning Status / Senior Avatar Graphic */}
        <div className="relative z-10 w-full md:w-auto bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 text-center min-w-[240px]">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center font-black text-3xl mx-auto mb-3 shadow-lg">
            <span>बु</span>
          </div>
          <div className="text-3xl font-black text-amber-200">
            {completedCount} / 10
          </div>
          <div className="text-xs font-bold text-white uppercase tracking-wider">
            {language === 'hi' ? 'पाठ पूरे किए' : language === 'mr' ? 'धडे पूर्ण केले' : 'Lessons Finished'}
          </div>
          <div className="mt-3 text-xs text-amber-100 font-semibold">
            {language === 'hi' ? 'शाबाश! सीखते रहें' : language === 'mr' ? 'शाब्बास! असेच शिकत राहा' : 'Keep up the great work!'}
          </div>
        </div>
      </div>

      {/* Safety Alert of the Day Banner */}
      <div className="p-6 rounded-3xl bg-amber-50 border-3 border-amber-400 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-black">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-800">
              {language === 'hi' ? 'आज का सुरक्षा नियम' : language === 'mr' ? 'आजचा सुरक्षा नियम' : 'Senior Safety Tip of the Day'}
            </span>
            <h3 className="text-lg md:text-xl font-black text-slate-900">
              {language === 'hi'
                ? 'पैसे मिलने के लिए कभी यूपीआई पिन (UPI PIN) नहीं लगता!'
                : language === 'mr'
                ? 'पैसे खात्यात येण्यासाठी कधीही UPI PIN टाकावा लागत नाही!'
                : 'You NEVER need to enter your UPI PIN to RECEIVE money!'}
            </h3>
            <p className="text-slate-600 text-sm mt-0.5 font-medium">
              {language === 'hi'
                ? 'यदि कोई फोन करके कहे कि पेंशन पाने के लिए पिन डालें, तो तुरंत फोन काट दें।'
                : language === 'mr'
                ? 'पैसे मिळवण्यासाठी पिन टाका असे कोणी सांगितल्यास तात्काळ फोन कट करा.'
                : 'Anyone asking you to enter your PIN or scan a QR code to receive a refund or lottery is a fraudster.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => { playTapSound(); onNavigate('safety'); }}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm whitespace-nowrap shadow shrink-0"
        >
          {language === 'hi' ? 'धोखाधड़ी जांचें' : language === 'mr' ? 'तपासणी करा' : 'Check a Suspicious Message'}
        </button>
      </div>

      {/* The 4 Core AI Agents */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">
              {language === 'hi' ? 'बडी एआई के ४ विशेष सहायक' : language === 'mr' ? 'बडी एआय चे ४ खास मदतनीस' : 'Your 4 Dedicated Buddy AI Companions'}
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              {language === 'hi' ? 'अपनी जरूरत के अनुसार सहायक चुनें' : language === 'mr' ? 'आपल्या गरजेनुसार मदतनीस निवडा' : 'Select an agent tailored to your immediate need'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Agent 1: Learning */}
          <div
            onClick={() => { playTapSound(); onOpenChat('learning'); }}
            className="p-6 rounded-3xl bg-white border-2 border-slate-200 hover:border-amber-500 shadow-sm hover:shadow-xl transition-all cursor-pointer space-y-4 flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                {language === 'hi' ? 'शिक्षा सहायक' : language === 'mr' ? 'शिक्षण सहाय्यक' : 'Learning Agent'}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {language === 'hi'
                  ? 'स्मार्टफोन, व्हाट्सएप और कंप्यूटर को बहुत आसान, बिना किसी जल्दबाजी के समझें।'
                  : language === 'mr'
                  ? 'स्मार्टफोन, व्हॉट्सॲप आणि संगणक अगदी सोप्या उदाहरणांनी शिका.'
                  : 'Master smartphones, apps, and digital devices through gentle numbered steps.'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-amber-600 font-extrabold text-sm pt-2">
              <span>{language === 'hi' ? 'सीखना शुरू करें' : language === 'mr' ? 'सुरू करा' : 'Start Learning'}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Agent 2: Safety */}
          <div
            onClick={() => { playTapSound(); onOpenChat('safety'); }}
            className="p-6 rounded-3xl bg-white border-2 border-slate-200 hover:border-red-500 shadow-sm hover:shadow-xl transition-all cursor-pointer space-y-4 flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 group-hover:text-red-600 transition-colors">
                {language === 'hi' ? 'सुरक्षा सहायक' : language === 'mr' ? 'सुरक्षा सहाय्यक' : 'Safety Agent'}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {language === 'hi'
                  ? 'फर्जी संदेश, बिजली बिल की धमकी या बैंक कॉल की सच्चाई तुरंत जांचें।'
                  : language === 'mr'
                  ? 'खोटे मेसेज, लाईट बिल कापण्याची धमकी किंवा बँक कॉलची खात्री करा.'
                  : 'Verify suspicious WhatsApp messages, fake police calls, and UPI fraud threats.'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-red-600 font-extrabold text-sm pt-2">
              <span>{language === 'hi' ? 'सुरक्षा जांचें' : language === 'mr' ? 'तपासा' : 'Check Safety'}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Agent 3: Support */}
          <div
            onClick={() => { playTapSound(); onOpenChat('support'); }}
            className="p-6 rounded-3xl bg-white border-2 border-slate-200 hover:border-teal-500 shadow-sm hover:shadow-xl transition-all cursor-pointer space-y-4 flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <HelpCircle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 group-hover:text-teal-600 transition-colors">
                {language === 'hi' ? 'सहयोग सहायक' : language === 'mr' ? 'मदत सहाय्यक' : 'Support Agent'}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {language === 'hi'
                  ? 'वेबसाइट चलाने, आवाज बड़ा करने या किसी परेशानी में तुरंत मदद पाएं।'
                  : language === 'mr'
                  ? 'वेबसाइट वापरणे किंवा फॉन्ट मोठा करण्यासाठी सोपी मदत.'
                  : 'Patient step-by-step guidance navigating the site and basic device settings.'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-teal-600 font-extrabold text-sm pt-2">
              <span>{language === 'hi' ? 'मदद लें' : language === 'mr' ? 'मदत मिळवा' : 'Get Help'}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Agent 4: Research */}
          <div
            onClick={() => { playTapSound(); onOpenChat('research'); }}
            className="p-6 rounded-3xl bg-white border-2 border-slate-200 hover:border-indigo-500 shadow-sm hover:shadow-xl transition-all cursor-pointer space-y-4 flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                {language === 'hi' ? 'शोध केंद्र' : language === 'mr' ? 'संशोधन कक्ष' : 'Research Agent'}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {language === 'hi'
                  ? 'जेरॉनटेक्नोलॉजी और भारतीय साइबर अपराध के वैज्ञानिक शोध पत्रों से उत्तर पाएं।'
                  : language === 'mr'
                  ? 'ज्येष्ठ नागरिक तंत्रज्ञान आणि सायबर गुन्हेगारीच्या अधिकृत संशोधनातून उत्तरे.'
                  : 'Evidence-based explanations with actual academic and RBI citations.'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-600 font-extrabold text-sm pt-2">
              <span>{language === 'hi' ? 'शोध देखें' : language === 'mr' ? 'पहा' : 'Explore Research'}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Continue Learning Course Row */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-slate-200 shadow-md space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">
              {language === 'hi' ? 'अपनी पढ़ाई जारी रखें' : language === 'mr' ? 'शिकणे सुरू ठेवा' : 'Continue Your Learning'}
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              {language === 'hi' ? 'सरल १० पाठ्यक्रम आपके लिए तैयार हैं' : language === 'mr' ? '१० सोपे अभ्यासक्रम आपल्यासाठी उपलब्ध आहेत' : '10 structured beginner-friendly courses'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => { playTapSound(); onNavigate('learning'); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm shadow transition-all"
          >
            <span>{language === 'hi' ? 'सभी कोर्स देखें' : language === 'mr' ? 'सर्व कोर्सेस पहा' : 'View All 10 Courses'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Featured 3 courses */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {LEARNING_COURSES.slice(0, 3).map((course, cIdx) => (
            <div
              key={course.id}
              onClick={() => { playTapSound(); onNavigate('learning'); }}
              className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 hover:border-amber-400 cursor-pointer transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-amber-700">Course #{cIdx + 1}</span>
                <span className="text-xs font-bold text-slate-400">{course.lessons.length} lessons</span>
              </div>
              <h4 className="text-lg font-black text-slate-900">
                {course.title[language] || course.title.en}
              </h4>
              <p className="text-xs text-slate-600 line-clamp-2">
                {course.description[language] || course.description.en}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Conversations (if any) */}
      {recentConversations.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xl font-black text-slate-900">
            {language === 'hi' ? 'हाल की बातचीत' : language === 'mr' ? 'मागील संवाद' : 'Recent Conversations'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentConversations.map((conv, idx) => (
              <div
                key={idx}
                onClick={() => { playTapSound(); onOpenChat(conv.agentType); }}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-amber-400 cursor-pointer space-y-1"
              >
                <div className="text-xs font-bold text-amber-600 uppercase">{conv.agentType || 'chat'}</div>
                <div className="font-bold text-slate-900 text-sm truncate">{conv.title || 'Conversation'}</div>
                <div className="text-[11px] text-slate-400">Click to resume</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
