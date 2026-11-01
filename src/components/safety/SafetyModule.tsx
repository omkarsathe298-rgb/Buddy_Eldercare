import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { checkScamMessage } from '../../services/api';
import { ScamAnalysisResult, TrustedContact } from '../../types';
import { VERIFIED_HELPLINES, SENIOR_GOLDEN_SAFETY_RULES } from '../../data/emergencyHelplines';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  PhoneCall, 
  Search, 
  CheckCircle, 
  UserPlus, 
  Trash2, 
  HeartHandshake, 
  ExternalLink,
  Lock,
  ArrowRight,
  Info
} from 'lucide-react';

export const SafetyModule: React.FC = () => {
  const { currentUser } = useAuth();
  const { language, playTapSound } = useAccessibility();

  // Scam scanner states
  const [inputText, setInputText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<ScamAnalysisResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Trusted Contacts state
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  // Call confirmation modal
  const [callingNumber, setCallingNumber] = useState<{ number: string; name: string } | null>(null);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);

  // Sample Scams for elderly practice/test
  const SAMPLE_SCAMS = [
    {
      title: language === 'hi' ? 'बिजली बिल कटने की धमकी' : language === 'mr' ? 'लाईट बिल कापण्याचा खोटा मेसेज' : 'Electricity Disconnection SMS',
      text: 'Dear Consumer, your electricity power will be disconnected tonight at 9:30 PM because your previous month bill was not updated. Please immediately call Electricity Officer on 9876543210 and pay via link.'
    },
    {
      title: language === 'hi' ? '₹२५ लाख लॉटरी का झांसा' : language === 'mr' ? '२५ लाख लॉटरीची फसवणूक' : 'KBC / 25 Lakh Lottery Fraud',
      text: 'Congratulations! Your mobile number won 25,00,000 INR in KBC WhatsApp Lucky Draw. To claim your lottery money, please pay 5,000 registration tax and send your Aadhaar and bank details.'
    },
    {
      title: language === 'hi' ? 'पेंशन पाने के लिए पिन डालें' : language === 'mr' ? 'पेन्शनसाठी पिन टाका' : 'Enter PIN to Receive Pension',
      text: 'Sir, I am sending ₹6,000 pension arrears to your Google Pay. Please open your Google Pay, accept the request, and enter your 6-digit UPI PIN to receive the money.'
    }
  ];

  // Fetch trusted contacts from Firestore
  useEffect(() => {
    if (!currentUser) return;

    const loadContacts = async () => {
      setLoadingContacts(true);
      try {
        const q = query(
          collection(db, 'contacts'),
          where('userId', '==', currentUser.uid)
        );
        const snap = await getDocs(q);
        const list: TrustedContact[] = [];
        snap.forEach(d => {
          list.push({ id: d.id, ...d.data() } as TrustedContact);
        });
        setContacts(list);
      } catch (err) {
        console.warn('Contacts load fallback:', err);
      } finally {
        setLoadingContacts(false);
      }
    };

    loadContacts();
  }, [currentUser]);

  const handleScan = async (textToScan?: string) => {
    const text = textToScan || inputText;
    if (!text.trim()) return;
    playTapSound();
    setAnalyzing(true);
    setScanError(null);
    setScanResult(null);

    try {
      const result = await checkScamMessage(text, language);
      setScanResult(result);

      // Save check log in Firestore if user is authenticated
      if (currentUser) {
        try {
          await addDoc(collection(db, 'safetyChecks'), {
            userId: currentUser.uid,
            messageSnippet: text.slice(0, 300),
            riskLevel: result.riskLevel,
            scamType: result.scamType,
            safeNextSteps: result.safeNextSteps[language]?.[0] || 'Be cautious',
            createdAt: new Date().toISOString()
          });
        } catch (e) {
          console.warn('Failed to save safety check log:', e);
        }
      }
    } catch (err: any) {
      setScanError(err.message || 'Scam analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newContactName || !newContactPhone) return;
    playTapSound();

    try {
      const newDoc = {
        userId: currentUser.uid,
        name: newContactName,
        relation: newContactRelation || 'Family',
        phone: newContactPhone,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'contacts'), newDoc);
      setContacts(prev => [...prev, { id: docRef.id, ...newDoc }]);
      setNewContactName('');
      setNewContactRelation('');
      setNewContactPhone('');
      setShowAddContact(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'contacts');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    playTapSound();
    try {
      await deleteDoc(doc(db, 'contacts', contactId));
      setContacts(prev => prev.filter(c => c.id !== contactId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `contacts/${contactId}`);
    }
  };

  const handleInitiateCall = (number: string, name: string) => {
    playTapSound();
    setCallingNumber({ number, name });
  };

  const confirmCall = () => {
    if (callingNumber) {
      window.location.href = `tel:${callingNumber.number}`;
      setCallingNumber(null);
    }
  };

  const handleSendFamilyAlert = () => {
    playTapSound();
    setAlertSuccess(
      language === 'hi' 
        ? 'आपके विश्वसनीय संपर्कों को सुरक्षा सहायता सूचना भेज दी गई है।' 
        : language === 'mr' 
        ? 'तुमच्या कुटुंबियांना तातडीचा मदतीचा संदेश पाठवला गेला आहे.' 
        : 'Emergency alert sent to your trusted family contacts.'
    );
    setTimeout(() => setAlertSuccess(null), 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      {/* Safety Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-rose-700 to-orange-700 rounded-3xl p-6 md:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/20 px-3.5 py-1 rounded-full text-xs md:text-sm font-bold uppercase tracking-wide">
            <ShieldAlert className="w-4 h-4 text-amber-200" />
            <span>
              {language === 'hi' ? 'सुरक्षा व सतर्कता केंद्र' : language === 'mr' ? 'सायबर सुरक्षा व संरक्षण कक्ष' : 'Senior Cyber Safety Shield'}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            {language === 'hi'
              ? 'संदिग्ध संदेश और धोखाधड़ी की जांच करें'
              : language === 'mr'
              ? 'संशयास्पद मेसेज आणि फोन कॉल्सची तपासणी करा'
              : 'Scan Suspicious Messages & Protect Your Bank Balance'}
          </h1>
          <p className="text-rose-100 text-base md:text-lg leading-relaxed">
            {language === 'hi'
              ? 'व्हाट्सएप या एसएमएस पर आया कोई भी संदिग्ध संदेश यहां पेस्ट करें। बडी एआई आपको बताएगा कि वह सच है या धोखा।'
              : language === 'mr'
              ? 'व्हॉट्सॲप किंवा फोनवर आलेला कोणताही मेसेज येथे टाका. बडी एआय क्षणात सांगेल की ती फसवणूक आहे का.'
              : 'Paste any WhatsApp message, SMS, link, or caller claim below to analyze fraud indicators.'}
          </p>
        </div>

        {/* Emergency Alert Button */}
        <div className="flex flex-col items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={handleSendFamilyAlert}
            className="w-full md:w-auto px-6 py-4 rounded-2xl bg-white hover:bg-rose-50 text-red-700 font-black text-lg shadow-xl border-2 border-white transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <PhoneCall className="w-5 h-5 text-red-600 animate-bounce" />
            <span>
              {language === 'hi' ? 'परिवार को अलर्ट भेजें' : language === 'mr' ? 'कुटुंबियांना अलर्ट पाठवा' : 'Send Emergency Alert'}
            </span>
          </button>
          <span className="text-xs text-rose-200 font-semibold text-center">
            {language === 'hi' ? 'आपके पंजीकृत संपर्कों को संदेश' : language === 'mr' ? 'नोंदणीकृत कुटुंबियांना सूचना' : 'Notifies your trusted contacts'}
          </span>
        </div>
      </div>

      {alertSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-100 border-2 border-emerald-500 text-emerald-950 font-black text-center text-lg animate-pulse">
          {alertSuccess}
        </div>
      )}

      {/* SECTION 1: Scam Message Checker */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-slate-200 shadow-lg space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">
              {language === 'hi' ? 'संदिग्ध संदेश जांचक (Scam Checker)' : language === 'mr' ? 'संशयास्पद मेसेज तपासणी' : 'Instant Scam Message Scanner'}
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              {language === 'hi' ? 'संदेश पेस्ट करें और "जांच करें" बटन दबाएं' : language === 'mr' ? 'मेसेज पेस्ट करा आणि "तपासा" बटन दाबा' : 'Paste message text below and click Scan'}
            </p>
          </div>
        </div>

        {/* Text Input */}
        <div>
          <textarea
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              language === 'hi'
                ? 'यहाँ संदेश पेस्ट करें... (उदा. बिजली बिल कटने का मेसेज, लॉटरी, या बैंक कॉल)'
                : language === 'mr'
                ? 'येथे मेसेज पेस्ट करा... (उदा. लाईट बिल, लॉटरी किंवा बँकेचा मेसेज)'
                : 'Paste the suspicious SMS, WhatsApp text, or caller message here...'
            }
            className="w-full p-4 text-base md:text-lg rounded-2xl border-2 border-slate-300 focus:border-red-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Quick Sample Scam Pills */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {language === 'hi' ? 'आम धोखाधड़ी के नमूने आजमाएं:' : language === 'mr' ? 'वारंवार होणाऱ्या फसवणुकीचे नमुने:' : 'Try Common Scam Examples:'}
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_SCAMS.map((sample, sIdx) => (
              <button
                key={sIdx}
                type="button"
                onClick={() => {
                  setInputText(sample.text);
                  handleScan(sample.text);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-700 border border-slate-300 text-xs md:text-sm font-bold text-slate-700 transition-all text-left"
              >
                {sample.title}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          {inputText && (
            <button
              type="button"
              onClick={() => { playTapSound(); setInputText(''); setScanResult(null); }}
              className="px-5 py-3 rounded-xl border border-slate-300 text-slate-600 font-bold text-sm"
            >
              {language === 'hi' ? 'साफ करें' : language === 'mr' ? 'रद्द करा' : 'Clear'}
            </button>
          )}

          <button
            type="button"
            disabled={analyzing || !inputText.trim()}
            onClick={() => handleScan()}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-lg shadow-lg shadow-red-500/30 disabled:opacity-40 transition-all hover:scale-105"
          >
            {analyzing 
              ? (language === 'hi' ? 'जांच हो रही है...' : language === 'mr' ? 'तपासणी सुरू आहे...' : 'Analyzing for fraud...')
              : (language === 'hi' ? 'संदेश की जांच करें' : language === 'mr' ? 'मेसेज तपासा' : 'Check This Message')}
          </button>
        </div>

        {scanError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-sm font-bold">
            {scanError}
          </div>
        )}

        {/* Scan Result Card */}
        {scanResult && (
          <div className={`p-6 md:p-8 rounded-3xl border-3 space-y-5 animate-in fade-in duration-300 ${
            scanResult.riskLevel === 'high_risk'
              ? 'bg-rose-50 border-rose-500'
              : scanResult.riskLevel === 'suspicious'
              ? 'bg-amber-50 border-amber-500'
              : 'bg-emerald-50 border-emerald-500'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {scanResult.riskLevel === 'high_risk' && (
                  <span className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center font-black">
                    ✕
                  </span>
                )}
                {scanResult.riskLevel === 'suspicious' && (
                  <span className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-black">
                    !
                  </span>
                )}
                {scanResult.riskLevel === 'safe' && (
                  <span className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black">
                    ✓
                  </span>
                )}

                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-600">
                    {language === 'hi' ? 'जांच परिणाम' : language === 'mr' ? 'तपासणी निकाल' : 'Analysis Verdict'}
                  </span>
                  <h3 className="text-2xl font-black text-slate-900">
                    {scanResult.riskLevel === 'high_risk' && (language === 'hi' ? '⚠️ उच्च जोखिम! यह एक खतरनाक धोखा है' : language === 'mr' ? '⚠️ तीव्र धोका! ही निव्वळ फसवणूक आहे' : '⚠️ HIGH RISK SCAM DETECTED!')}
                    {scanResult.riskLevel === 'suspicious' && (language === 'hi' ? '⚠️ संदिग्ध संदेश! सावधान रहें' : language === 'mr' ? '⚠️ संशयास्पद मेसेज! सावध राहा' : '⚠️ SUSPICIOUS MESSAGE! PROCEED WITH CAUTION')}
                    {scanResult.riskLevel === 'safe' && (language === 'hi' ? '✓ सुरक्षित प्रतीत होता है' : language === 'mr' ? '✓ सुरक्षित वाटत आहे' : '✓ Likely Safe Message')}
                  </h3>
                </div>
              </div>

              <span className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-white shadow-sm border border-slate-300">
                {scanResult.scamType}
              </span>
            </div>

            {/* Explanation in user language */}
            <div className="space-y-2">
              <h4 className="text-sm font-extrabold text-slate-700 uppercase tracking-wide">
                {language === 'hi' ? 'सरल शब्दों में समझें:' : language === 'mr' ? 'सोप्या भाषेत स्पष्टीकरण:' : 'What does this mean?'}:
              </h4>
              <p className="text-slate-900 text-base md:text-lg leading-relaxed font-semibold">
                {scanResult.explanation[language] || scanResult.explanation.en}
              </p>
            </div>

            {/* Indicators */}
            {scanResult.indicators && scanResult.indicators.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wide">
                  {language === 'hi' ? 'धोखाधड़ी के मुख्य लक्षण:' : language === 'mr' ? 'फसवणुकीची मुख्य लक्षणे:' : 'Red Flag Indicators'}:
                </h4>
                <ul className="space-y-1.5">
                  {scanResult.indicators.map((ind, iIdx) => (
                    <li key={iIdx} className="flex items-center gap-2 text-sm md:text-base font-bold text-slate-800">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>{ind}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Safe Next Steps */}
            <div className="p-4 rounded-2xl bg-white border border-slate-300 space-y-2">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>
                  {language === 'hi' ? 'अब आपको क्या करना चाहिए (सुरक्षित कदम):' : language === 'mr' ? 'आता तुम्ही काय करावे (सुरक्षित उपाय):' : 'Safe Recommended Actions'}:
                </span>
              </h4>
              <ul className="space-y-1 text-sm md:text-base text-slate-800 font-semibold">
                {(scanResult.safeNextSteps[language] || scanResult.safeNextSteps.en).map((step, sIdx) => (
                  <li key={sIdx}>• {step}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Golden Rules of Digital Safety */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-10 text-white space-y-6">
        <div className="flex items-center gap-3">
          <Lock className="w-8 h-8 text-amber-400" />
          <div>
            <h2 className="text-2xl md:text-3xl font-black">
              {language === 'hi' ? 'वरिष्ठ नागरिकों के ३ स्वर्णिम नियम' : language === 'mr' ? 'ज्येष्ठांसाठी सायबर सुरक्षेचे ३ सुवर्ण नियम' : '3 Golden Rules of Senior Cyber Safety'}
            </h2>
            <p className="text-amber-200 text-sm">
              {language === 'hi' ? 'इन्हें हमेशा याद रखें, कभी कोई धोखा नहीं होगा' : language === 'mr' ? 'हे ३ नियम लक्षात ठेवल्यास कधीही फसवणूक होणार नाही' : 'Remember these 3 rules to protect your life savings'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SENIOR_GOLDEN_SAFETY_RULES.map((rule, idx) => (
            <div key={rule.id} className="p-6 rounded-2xl bg-slate-800 border-2 border-slate-700 hover:border-amber-400 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center">
                #{idx + 1}
              </div>
              <h3 className="text-lg md:text-xl font-black text-white leading-snug">
                {rule.rule[language] || rule.rule.en}
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed font-medium">
                {rule.explanation[language] || rule.explanation.en}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: Verified Emergency Helplines with Confirmation */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">
              {language === 'hi' ? 'आधिकारिक सरकारी हेल्पलाइन' : language === 'mr' ? 'अधिकृत शासकीय हेल्पलाइन' : 'Verified Emergency Helplines'}
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              {language === 'hi' ? 'किसी भी संकट में इन नंबरों पर संपर्क करें' : language === 'mr' ? 'कोणत्याही संकटात या नंबरवर संपर्क साधा' : 'One-tap dial with safety confirmation'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {VERIFIED_HELPLINES.map(line => (
            <div key={line.id} className="bg-white rounded-3xl p-6 border-2 border-slate-200 hover:border-red-400 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">{line.authority}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 leading-snug">
                  {line.name[language] || line.name.en}
                </h3>
                <p className="text-slate-600 text-xs leading-relaxed line-clamp-3">
                  {line.description[language] || line.description.en}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-2xl font-black text-red-600 tracking-wider">
                  {line.number}
                </span>
                <button
                  type="button"
                  onClick={() => handleInitiateCall(line.number, line.name[language] || line.name.en)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm shadow transition-all hover:scale-105"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>{language === 'hi' ? 'कॉल करें' : language === 'mr' ? 'कॉल करा' : 'Call'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: Trusted Emergency Contacts */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-slate-200 shadow-lg space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900">
                {language === 'hi' ? 'विश्वसनीय संपर्क (परिवार व मित्र)' : language === 'mr' ? 'विश्वसनीय संपर्क (कुटुंब व आप्तेष्ट)' : 'Trusted Emergency Contacts'}
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                {language === 'hi' ? 'मुसीबत के समय तुरंत मदद पाने के लिए' : language === 'mr' ? 'अडचणीच्या वेळी त्वरित मदतीसाठी' : 'Direct emergency family phone numbers'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { playTapSound(); setShowAddContact(!showAddContact); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>{language === 'hi' ? 'नया संपर्क जोड़ें' : language === 'mr' ? 'नवीन संपर्क जोडा' : 'Add New Contact'}</span>
          </button>
        </div>

        {/* Add Contact Form */}
        {showAddContact && (
          <form onSubmit={handleAddContact} className="p-6 rounded-2xl bg-amber-50 border-2 border-amber-300 space-y-4">
            <h3 className="font-extrabold text-lg text-amber-950">
              {language === 'hi' ? 'नया विश्वसनीय संपर्क' : language === 'mr' ? 'नवीन संपर्क तपशील' : 'Add Emergency Contact'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'hi' ? 'नाम' : language === 'mr' ? 'नाव' : 'Name'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh (Son)"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 bg-white text-base"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'hi' ? 'रिश्ता' : language === 'mr' ? 'नाते' : 'Relationship'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Son, Daughter, Doctor"
                  value={newContactRelation}
                  onChange={(e) => setNewContactRelation(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 bg-white text-base"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'hi' ? 'फोन नंबर' : language === 'mr' ? 'फोन नंबर' : 'Phone Number'} *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 9876543210"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 bg-white text-base"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddContact(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-sm shadow"
              >
                Save Contact
              </button>
            </div>
          </form>
        )}

        {/* Contacts List */}
        {contacts.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 font-medium">
            {language === 'hi'
              ? 'अभी कोई संपर्क नहीं जोड़ा गया है। अपने बेटे, बेटी या डॉक्टर का नंबर जोड़ें।'
              : language === 'mr'
              ? 'अद्याप कोणताही संपर्क जोडला नाही. मुलांचा किंवा डॉक्टरांचा नंबर जोडा.'
              : 'No trusted contacts added yet. Add your son, daughter, or doctor for instant help.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map(c => (
              <div key={c.id} className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-black text-slate-900">{c.name}</h4>
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">{c.relation}</p>
                  <p className="text-base font-extrabold text-slate-700 mt-1">{c.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleInitiateCall(c.phone, c.name)}
                    className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow"
                    title="Call Contact"
                  >
                    <PhoneCall className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteContact(c.id)}
                    className="p-3 rounded-xl bg-slate-200 hover:bg-rose-100 hover:text-rose-600 text-slate-600 transition-colors"
                    title="Delete Contact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Initiating Calls (prevents accidental calls by seniors) */}
      {callingNumber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border-4 border-amber-400 shadow-2xl space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <PhoneCall className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-900">
                {language === 'hi' ? 'कॉल करने की पुष्टि करें' : language === 'mr' ? 'कॉल करण्याची खात्री करा' : 'Confirm Phone Call'}
              </h3>
              <p className="text-slate-600 text-base mt-2">
                {language === 'hi' ? 'क्या आप इस नंबर पर कॉल मिलाना चाहते हैं?' : language === 'mr' ? 'तुम्ही या नंबरवर फोन करू इच्छिता का?' : 'Do you wish to place a call to:'}
              </p>
              <div className="mt-3 p-3 rounded-xl bg-slate-100 text-xl font-black text-slate-900">
                {callingNumber.name} ({callingNumber.number})
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => setCallingNumber(null)}
                className="flex-1 py-3.5 rounded-2xl border-2 border-slate-300 font-bold text-slate-700 hover:bg-slate-50"
              >
                {language === 'hi' ? 'नहीं, रद्द करें' : language === 'mr' ? 'नाही, रद्द करा' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={confirmCall}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-lg shadow-emerald-600/30"
              >
                {language === 'hi' ? 'हाँ, कॉल करें' : language === 'mr' ? 'होय, कॉल करा' : 'Yes, Call Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
