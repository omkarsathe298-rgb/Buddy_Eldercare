import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { fetchAdminDocuments } from '../../services/api';
import { ResearchDocument, UserProfile } from '../../types';
import { 
  Settings, 
  Users, 
  BookOpen, 
  ShieldAlert, 
  FileText, 
  Star, 
  Activity, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { language, playTapSound } = useAccessibility();

  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [documentsList, setDocumentsList] = useState<ResearchDocument[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProgressRecords: 0,
    totalSafetyScans: 0,
    totalFeedback: 0,
    averageRating: 4.8
  });
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    setLoading(true);
    playTapSound();
    try {
      // 1. Load users
      const usersSnap = await getDocs(collection(db, 'users')).catch(() => ({ docs: [] } as any));
      const users: UserProfile[] = [];
      usersSnap.docs.forEach((d: any) => users.push({ ...d.data(), uid: d.id }));
      setUsersList(users);

      // 2. Load progress records count
      const progSnap = await getDocs(collection(db, 'progress')).catch(() => ({ size: 0 } as any));
      
      // 3. Load safety checks count
      const safetySnap = await getDocs(collection(db, 'safetyChecks')).catch(() => ({ size: 0 } as any));

      // 4. Load feedback
      const feedbackSnap = await getDocs(collection(db, 'feedback')).catch(() => ({ docs: [], size: 0 } as any));
      let ratingSum = 0;
      feedbackSnap.docs.forEach((f: any) => {
        ratingSum += f.data().rating || 5;
      });
      const avg = feedbackSnap.size > 0 ? (ratingSum / feedbackSnap.size).toFixed(1) : '4.9';

      // 5. Load documents
      const docsRes = await fetchAdminDocuments().catch(() => ({ documents: [] }));
      setDocumentsList(docsRes.documents || []);

      setStats({
        totalUsers: users.length || 1,
        totalProgressRecords: progSnap.size || 0,
        totalSafetyScans: safetySnap.size || 0,
        totalFeedback: feedbackSnap.size || 0,
        averageRating: Number(avg)
      });
    } catch (err) {
      console.warn('Admin load note:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  const handleRoleChange = async (userId: string, newRole: any) => {
    playTapSound();
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsersList(prev => prev.map(u => u.uid === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-rose-600 mx-auto" />
        <h2 className="text-3xl font-black text-slate-900">Admin Access Required</h2>
        <p className="text-slate-600">
          This portal is restricted to authorized administrators (e.g. omkarsathe298@gmail.com). Please log in with admin credentials.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Settings className="w-4 h-4" />
            <span>Platform Administration & Analytics</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black">Buddy AI Control Centre</h1>
          <p className="text-slate-400 text-sm mt-1">
            Logged in as Admin: <span className="text-amber-400 font-bold">{currentUser?.email}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={loadAdminData}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-black uppercase tracking-wider">Registered Users</span>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.totalUsers}</div>
          <div className="text-xs text-emerald-600 font-bold">Active in Firestore</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-black uppercase tracking-wider">Lessons Completed</span>
            <BookOpen className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.totalProgressRecords}</div>
          <div className="text-xs text-amber-600 font-bold">Verified Learning Activity</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-black uppercase tracking-wider">Scams Scanned</span>
            <ShieldAlert className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.totalSafetyScans}</div>
          <div className="text-xs text-rose-600 font-bold">AI Threat Verifications</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-black uppercase tracking-wider">Feedback Score</span>
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.averageRating} / 5.0</div>
          <div className="text-xs text-slate-500 font-bold">{stats.totalFeedback} reviews</div>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900">User Management</h2>
          <span className="text-xs font-bold text-slate-500">{usersList.length} users</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase text-xs border-b">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Email</th>
                <th className="p-3">Current Role</th>
                <th className="p-3">Preferred Language</th>
                <th className="p-3">Role Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usersList.map(u => (
                <tr key={u.uid} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{u.name || 'Learner'}</td>
                  <td className="p-3 text-slate-600">{u.email}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                      u.role === 'admin' 
                        ? 'bg-rose-100 text-rose-800' 
                        : u.role === 'caregiver'
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 uppercase font-semibold text-slate-500">{u.preferredLanguage || 'en'}</td>
                  <td className="p-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                      className="px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white font-semibold"
                    >
                      <option value="elderly_user">elderly_user</option>
                      <option value="caregiver">caregiver</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
