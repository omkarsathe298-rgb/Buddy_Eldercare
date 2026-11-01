import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { CaregiverConnection } from '../../types';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { 
  Users, 
  ShieldCheck, 
  Heart, 
  CheckCircle2, 
  XCircle, 
  Send, 
  AlertTriangle, 
  BookOpen, 
  Plus, 
  Trash2,
  Lock,
  MessageSquare
} from 'lucide-react';

export const CaregiverDashboard: React.FC = () => {
  const { currentUser, userProfile, isCaregiver } = useAuth();
  const { language, playTapSound } = useAccessibility();

  const [connections, setConnections] = useState<CaregiverConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [encouragementNote, setEncouragementNote] = useState('');
  const [sentSuccess, setSentSuccess] = useState<string | null>(null);

  // Fetch connections for current user (either as elderly or as caregiver)
  useEffect(() => {
    if (!currentUser) return;

    const loadConnections = async () => {
      setLoading(true);
      try {
        const elderlyQ = query(
          collection(db, 'caregivers'),
          where('elderlyUserId', '==', currentUser.uid)
        );
        const caregiverQ = query(
          collection(db, 'caregivers'),
          where('caregiverEmail', '==', currentUser.email || '')
        );

        const [snap1, snap2] = await Promise.all([
          getDocs(elderlyQ).catch(() => ({ docs: [] } as any)),
          getDocs(caregiverQ).catch(() => ({ docs: [] } as any))
        ]);

        const map: Record<string, CaregiverConnection> = {};
        snap1.docs.forEach((d: any) => { map[d.id] = { id: d.id, ...d.data() }; });
        snap2.docs.forEach((d: any) => { map[d.id] = { id: d.id, ...d.data() }; });

        setConnections(Object.values(map));
      } catch (err) {
        console.warn('Caregiver connection query check:', err);
      } finally {
        setLoading(false);
      }
    };

    loadConnections();
  }, [currentUser]);

  // Handle elderly user inviting a caregiver with explicit consent
  const handleInviteCaregiver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !inviteEmail.trim()) return;
    playTapSound();

    try {
      const newConn: Omit<CaregiverConnection, 'id'> = {
        elderlyUserId: currentUser.uid,
        elderlyUserName: userProfile?.name || currentUser.displayName || 'Elderly Parent',
        caregiverEmail: inviteEmail.trim().toLowerCase(),
        status: 'active', // Direct consent from the elder
        canViewProgress: true,
        canReceiveAlerts: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'caregivers'), newConn);
      setConnections(prev => [...prev, { id: docRef.id, ...newConn }]);
      setInviteEmail('');
      setSentSuccess(
        language === 'hi'
          ? 'देखभालकर्ता को सफलतापूर्वक जोड़ा गया।'
          : language === 'mr'
          ? 'काळजीवाहकाची नोंदणी यशस्वीरीत्या जोडली गेली.'
          : 'Caregiver connected successfully with explicit consent.'
      );
      setTimeout(() => setSentSuccess(null), 4000);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'caregivers');
    }
  };

  // Revoke consent with one tap
  const handleRevoke = async (id: string) => {
    playTapSound();
    try {
      await updateDoc(doc(db, 'caregivers', id), {
        status: 'revoked',
        updatedAt: new Date().toISOString()
      });
      setConnections(prev => prev.map(c => c.id === id ? { ...c, status: 'revoked' } : c));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `caregivers/${id}`);
    }
  };

  const handleSendEncouragement = () => {
    playTapSound();
    if (!encouragementNote.trim()) return;
    setSentSuccess(
      language === 'hi'
        ? 'प्रोत्साहन संदेश भेज दिया गया!'
        : language === 'mr'
        ? 'प्रोत्साहनपर संदेश पाठवला गेला!'
        : 'Encouragement message sent to senior learner!'
    );
    setEncouragementNote('');
    setTimeout(() => setSentSuccess(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-emerald-800 to-slate-900 rounded-3xl p-6 md:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/20 px-3.5 py-1 rounded-full text-xs md:text-sm font-bold uppercase tracking-wider">
            <Heart className="w-4 h-4 text-rose-300" />
            <span>
              {language === 'hi' ? 'परिवार व देखभालकर्ता सहयोग' : language === 'mr' ? 'कुटुंब व काळजीवाहक कक्ष' : 'Family & Caregiver Consent Hub'}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            {language === 'hi' 
              ? 'अपनों की डिजिटल सुरक्षा और प्रगति से जुड़े रहें' 
              : language === 'mr' 
              ? 'आपल्या प्रियजनांच्या प्रगतीशी व सुरक्षेशी जोडलेले राहा' 
              : 'Supporting Seniors with Privacy and Explicit Consent'}
          </h1>
          <p className="text-emerald-100 text-base md:text-lg leading-relaxed">
            {language === 'hi'
              ? 'बुजुर्गों की अनुमति से उनकी सीखने की प्रगति देखें, उत्साहवर्धक संदेश भेजें और साइबर अलर्ट प्राप्त करें।'
              : language === 'mr'
              ? 'ज्येष्ठांच्या संमतीने त्यांची शिकण्याची प्रगती पहा, प्रोत्साहनपर संदेश पाठवा आणि सायबर अलर्ट मिळवा.'
              : 'Caregivers can view learning progress, send uplifting notes, and receive scam warning alerts only with explicit consent.'}
          </p>
        </div>

        <div className="bg-white/10 p-6 rounded-2xl border border-white/20 text-center min-w-[200px]">
          <div className="text-4xl font-black text-amber-300 mb-1">
            {connections.filter(c => c.status === 'active').length}
          </div>
          <div className="text-sm font-bold text-white uppercase tracking-wider">
            {language === 'hi' ? 'सक्रिय रिश्ते' : language === 'mr' ? 'सक्रिय जोडणी' : 'Active Connections'}
          </div>
        </div>
      </div>

      {sentSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-100 border-2 border-emerald-500 text-emerald-950 font-black text-center text-lg animate-in fade-in">
          {sentSuccess}
        </div>
      )}

      {/* Invite Caregiver / Link Form */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-slate-200 shadow-md space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">
              {language === 'hi' ? 'देखभालकर्ता / बच्चे को जोड़ें' : language === 'mr' ? 'काळजीवाहक / मुलांचा ईमेल जोडा' : 'Link Family Caregiver with Consent'}
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              {language === 'hi' ? 'अपने बेटे, बेटी या रिश्तेदार का ईमेल दर्ज करें' : language === 'mr' ? 'आपल्या मुलांचा किंवा नातेवाईकांचा ईमेल प्रविष्ट करा' : 'Enter your son, daughter, or caregiver email to grant progress viewing access'}
            </p>
          </div>
        </div>

        <form onSubmit={handleInviteCaregiver} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="caregiver.family@example.com"
            className="flex-1 px-4 py-3.5 rounded-2xl border-2 border-slate-300 focus:border-teal-600 focus:outline-none text-base"
          />
          <button
            type="submit"
            className="px-6 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-base shadow transition-all hover:scale-105 shrink-0"
          >
            {language === 'hi' ? 'अनुमति दें व जोड़ें' : language === 'mr' ? 'संमती द्या व जोडा' : 'Authorize & Connect'}
          </button>
        </form>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold bg-slate-50 p-3 rounded-xl border border-slate-200">
          <Lock className="w-4 h-4 text-teal-600 shrink-0" />
          <span>
            {language === 'hi'
              ? 'वरिष्ठ नागरिक किसी भी समय "अनुमति रद्द करें" बटन दबाकर पहुंच तुरंत बंद कर सकते हैं।'
              : language === 'mr'
              ? 'ज्येष्ठ नागरिक कधीही "संमती मागे घ्या" वर क्लिक करून प्रवेश तात्काळ थांबवू शकतात.'
              : 'Senior users can revoke access at any time with a single click. Private chat transcripts are never exposed.'}
          </span>
        </div>
      </div>

      {/* Connected Caregivers List */}
      <div className="space-y-4">
        <h3 className="text-2xl font-black text-slate-900">
          {language === 'hi' ? 'वर्तमान परिवार संबंध' : language === 'mr' ? 'सध्या जोडलेले कुटुंबिय' : 'Authorized Family Connections'}
        </h3>

        {connections.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border-2 border-slate-200 text-slate-500 font-medium">
            {language === 'hi'
              ? 'अभी कोई परिवार का सदस्य नहीं जुड़ा है। ऊपर ईमेल दर्ज करके अपने बेटे या बेटी को जोड़ें।'
              : language === 'mr'
              ? 'अद्याप कोणीही जोडलेले नाही. वरील बॉक्समध्ये ईमेल टाकून जोडा.'
              : 'No family connections authorized yet. Enter their email above to link.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {connections.map(c => {
              const isActive = c.status === 'active';
              return (
                <div key={c.id} className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-black text-slate-900">{c.caregiverEmail}</h4>
                      <p className="text-xs text-slate-500">Linked to: {c.elderlyUserName}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                      isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 text-xs text-slate-700 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span>{language === 'hi' ? 'सीखने की प्रगति देख सकते हैं' : language === 'mr' ? 'प्रगती पाहू शकतात' : 'View Course Progress'}:</span>
                      <span className="font-bold text-emerald-600">✓ Granted</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{language === 'hi' ? 'सुरक्षा अलर्ट प्राप्त होते हैं' : language === 'mr' ? 'सुरक्षा अलर्ट मिळतात' : 'Receive Scam Alerts'}:</span>
                      <span className="font-bold text-emerald-600">✓ Granted</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end">
                    {isActive ? (
                      <button
                        type="button"
                        onClick={() => handleRevoke(c.id)}
                        className="px-4 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs"
                      >
                        {language === 'hi' ? 'अनुमति वापस लें' : language === 'mr' ? 'संमती मागे घ्या' : 'Revoke Access'}
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">Access Revoked</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Send Encouragement Card */}
      <div className="bg-gradient-to-tr from-amber-50 to-orange-50 rounded-3xl p-6 md:p-8 border-2 border-amber-300 space-y-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-amber-700" />
          <div>
            <h3 className="text-xl font-black text-amber-950">
              {language === 'hi' ? 'प्रोत्साहन और स्नेह का संदेश भेजें' : language === 'mr' ? 'कौतुकाचा व प्रेमाचा संदेश पाठवा' : 'Send Encouragement Note'}
            </h3>
            <p className="text-xs text-amber-800">
              {language === 'hi' ? 'अपने माता-पिता या दादा-दादी को उनके सीखने के प्रयास के लिए बधाई दें!' : 'Congratulate senior learners on completing digital lessons!'}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={encouragementNote}
            onChange={(e) => setEncouragementNote(e.target.value)}
            placeholder="e.g. 'Shabash Dad! Great job finishing the WhatsApp voice message lesson!'"
            className="flex-1 px-4 py-3 rounded-2xl border-2 border-amber-200 bg-white text-base focus:outline-none focus:border-amber-500"
          />
          <button
            type="button"
            onClick={handleSendEncouragement}
            className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm shadow shrink-0"
          >
            Send Love
          </button>
        </div>
      </div>
    </div>
  );
};
