import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { ShieldCheck, PhoneCall, Heart, Lock, BookOpen } from 'lucide-react';

export const Footer: React.FC = () => {
  const { language } = useAccessibility();

  return (
    <footer className="bg-slate-900 text-slate-200 border-t-4 border-amber-500 pt-12 pb-8 px-4 mt-16 transition-colors">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Brand & Purpose */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xl shadow">
              <span>बु</span>
            </div>
            <span className="text-2xl font-black text-white">Buddy AI</span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            {language === 'hi'
              ? 'वरिष्ठ नागरिकों के लिए भारत का सबसे सरल और सुरक्षित डिजिटल शिक्षा एवं सहायता मंच।'
              : language === 'mr'
              ? 'ज्येष्ठ नागरिकांसाठी भारतातील सर्वात सोपा आणि सुरक्षित डिजिटल शिक्षण व सहाय्य मंच.'
              : 'India’s most accessible and patient AI digital learning, cyber safety, and companion platform for senior citizens.'}
          </p>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {language === 'hi'
                ? '१००% सुरक्षित: हम कभी बैंक पिन या ओटीपी नहीं मांगते।'
                : language === 'mr'
                ? '१००% सुरक्षित: आम्ही कधीही बँक पिन किंवा ओटीपी मागत नाही.'
                : '100% Safe: We never ask for bank PINs or OTPs.'}
            </span>
          </div>
        </div>

        {/* Verified Indian Helplines */}
        <div>
          <h3 className="text-base font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <PhoneCall className="w-4 h-4" />
            {language === 'hi' ? 'महत्वपूर्ण हेल्पलाइन' : language === 'mr' ? 'महत्त्वाचे हेल्पलाइन क्रमांक' : 'National Helplines'}
          </h3>
          <ul className="space-y-3 text-sm">
            <li>
              <a href="tel:14567" className="flex items-center justify-between p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold transition-all">
                <span>{language === 'hi' ? 'वरिष्ठ नागरिक (Elderline)' : language === 'mr' ? 'ज्येष्ठ नागरिक (एल्डरलाईन)' : 'Elderline (Seniors)'}</span>
                <span className="text-amber-400 text-base font-extrabold">14567</span>
              </a>
            </li>
            <li>
              <a href="tel:1930" className="flex items-center justify-between p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold transition-all">
                <span>{language === 'hi' ? 'साइबर धोखाधड़ी रिपोर्ट' : language === 'mr' ? 'सायबर गुन्हे नोंदणी' : 'Cyber Fraud Reporting'}</span>
                <span className="text-red-400 text-base font-extrabold">1930</span>
              </a>
            </li>
            <li>
              <a href="tel:112" className="flex items-center justify-between p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold transition-all">
                <span>{language === 'hi' ? 'राष्ट्रीय आपातकाल' : language === 'mr' ? 'राष्ट्रीय आणीबाणी' : 'Police & Emergency'}</span>
                <span className="text-blue-400 text-base font-extrabold">112</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Learning Academy Courses */}
        <div>
          <h3 className="text-base font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            {language === 'hi' ? 'मुख्य पाठ्यक्रम' : language === 'mr' ? 'प्रमुख अभ्यासक्रम' : 'Key Courses'}
          </h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• {language === 'hi' ? 'स्मार्टफोन और टच स्क्रीन' : language === 'mr' ? 'स्मार्टफोन आणि टच स्क्रीन' : 'Smartphone & Touch Gestures'}</li>
            <li>• {language === 'hi' ? 'व्हाट्सएप और वीडियो कॉलिंग' : language === 'mr' ? 'व्हॉट्सॲप आणि व्हिडिओ कॉलिंग' : 'WhatsApp & Video Calling'}</li>
            <li>• {language === 'hi' ? 'यूपीआई एवं डिजिटल भुगतान सुरक्षा' : language === 'mr' ? 'UPI व सुरक्षित डिजिटल पेमेंट' : 'UPI & Online Payment Safety'}</li>
            <li>• {language === 'hi' ? 'फर्जी बिजली बिल व कॉल से बचाव' : language === 'mr' ? 'खोट्या फोन कॉल्सपासून संरक्षण' : 'Scam Defense & Cyber Awareness'}</li>
            <li>• {language === 'hi' ? 'घर बैठे डिजिटल जीवन प्रमाण पत्र' : language === 'mr' ? 'डिजिटल जीवन प्रमाणपत्र' : 'Pension Life Certificate (Jeevan Pramaan)'}</li>
          </ul>
        </div>

        {/* Academic Foundation & Ethics */}
        <div>
          <h3 className="text-base font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            {language === 'hi' ? 'शोध व विश्वसनीयता' : language === 'mr' ? 'संशोधन व विश्वसनीयता' : 'Research Foundation'}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            {language === 'hi'
              ? 'बडी एआई को बुजुर्गों के सीखने के वैज्ञानिक शोध, जेरॉनटेक्नोलॉजी और भारतीय साइबर अपराध अध्ययन के आधार पर तैयार किया गया है।'
              : language === 'mr'
              ? 'बडी एआय हा ज्येष्ठ नागरिकांच्या मानसशास्त्र, जेरॉनटेक्नॉलॉजी आणि सायबर गुन्हेगारीच्या अधिकृत संशोधनावर आधारित आहे.'
              : 'Grounded in verified academic research on gerontechnology, cognitive load, and financial cyberfraud prevention in India.'}
          </p>
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-400">
            <p className="flex items-center gap-1 font-semibold text-slate-200">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              {language === 'hi' ? 'भारत के बुजुर्गों के लिए सप्रेम समर्पित' : language === 'mr' ? 'भारतातील आजी-आजोबांसाठी सप्रेम भेट' : 'Dedicated to Seniors across India'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
        <p>© {new Date().getFullYear()} Buddy AI (Buddy_elder_Ai_Agent). All rights reserved.</p>
        <p className="text-center md:text-right">
          {language === 'hi' 
            ? 'गोपनीयता, संमति और बुजुर्गों की गरिमा हमारी सर्वोच्च प्राथमिकता है।' 
            : language === 'mr' 
            ? 'गोपनीयता, संमती आणि ज्येष्ठांचा सन्मान ही आमची सर्वोच्च प्राथमिकता आहे.' 
            : 'Privacy, consent, and elderly dignity are our core foundational pillars.'}
        </p>
      </div>
    </footer>
  );
};
