import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { queryResearchKnowledge, fetchAdminDocuments, createAdminDocument, deleteAdminDocument } from '../../services/api';
import { ResearchDocument } from '../../types';
import { INITIAL_RESEARCH_DOCUMENTS } from '../../data/researchPapers';
import { 
  FileText, 
  Search, 
  BookOpen, 
  ShieldCheck, 
  Sparkles, 
  Plus, 
  Trash2, 
  Volume2, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

export const ResearchKnowledgeHub: React.FC = () => {
  const { isAdmin } = useAuth();
  const { language, speak, playTapSound } = useAccessibility();

  const [documents, setDocuments] = useState<ResearchDocument[]>(INITIAL_RESEARCH_DOCUMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [researchAnswer, setResearchAnswer] = useState<string | null>(null);
  const [citations, setCitations] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<ResearchDocument | null>(null);

  // Admin add document modal state
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newCategory, setNewCategory] = useState<any>('digital_literacy');
  const [newYear, setNewYear] = useState('2024');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');

  // Fetch updated documents from server
  useEffect(() => {
    fetchAdminDocuments()
      .then(res => {
        if (res.documents && res.documents.length > 0) {
          setDocuments(res.documents);
        }
      })
      .catch(err => console.warn('Document sync notice:', err));
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    playTapSound();
    setSearching(true);
    setResearchAnswer(null);
    setCitations([]);

    try {
      const res = await queryResearchKnowledge(searchQuery, language);
      setResearchAnswer(res.answer);
      setCitations(res.citations);
    } catch (err: any) {
      setResearchAnswer('Failed to retrieve research answers. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    playTapSound();
    try {
      const res = await createAdminDocument({
        title: newTitle,
        author: newAuthor,
        category: newCategory,
        year: newYear,
        summary: newSummary,
        content: newContent,
        tags: ['academic', 'elderly', newCategory]
      });
      setDocuments(prev => [...prev, res.document]);
      setShowAddDoc(false);
      setNewTitle('');
      setNewAuthor('');
      setNewSummary('');
      setNewContent('');
    } catch (err: any) {
      alert(err.message || 'Failed to add document');
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document from the Knowledge Hub?')) return;
    playTapSound();
    try {
      await deleteAdminDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      if (selectedDoc?.id === id) setSelectedDoc(null);
    } catch (err: any) {
      alert('Delete failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      {/* Knowledge Hub Hero */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 md:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/20 px-3.5 py-1 rounded-full text-xs md:text-sm font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>
              {language === 'hi' ? 'प्रमाणित शोध ज्ञान केंद्र' : language === 'mr' ? 'प्रमाणित संशोधन ज्ञान कक्ष' : 'Research & Evidence Knowledge Hub'}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            {language === 'hi' 
              ? 'वैज्ञानिक शोध और नियमों पर आधारित उत्तर' 
              : language === 'mr' 
              ? 'शास्त्रीय संशोधन आणि नियमांवर आधारित उत्तरे' 
              : 'Grounded in Authentic Academic Research'}
          </h1>
          <p className="text-indigo-200 text-base md:text-lg leading-relaxed">
            {language === 'hi'
              ? 'बडी एआई केवल सामान्य जानकारी नहीं देता, बल्कि वरिष्ठ नागरिकों की जेरॉनटेक्नोलॉजी और भारतीय वित्तीय साइबर अपराध के शोध पत्रों से तथ्य उद्धृत करता है।'
              : language === 'mr'
              ? 'बडी एआय केवळ अंदाजे माहिती देत नाही, तर ज्येष्ठ नागरिक तंत्रज्ञान आणि सायबर गुन्हेगारीच्या अधिकृत संशोधन अहवालांतून पुरावे देतो.'
              : 'Buddy AI synthesizes indexed peer-reviewed gerontechnology studies and RBI circulars without fabricating citations.'}
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => { playTapSound(); setShowAddDoc(true); }}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-base shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Add Research Paper</span>
          </button>
        )}
      </div>

      {/* RAG Search Engine */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-slate-200 shadow-lg space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">
              {language === 'hi' ? 'शोध पत्रों में प्रश्न खोजें (RAG Retrieval)' : language === 'mr' ? 'संशोधन अहवालातून उत्तर शोधा' : 'Ask the Research Knowledge Hub'}
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              {language === 'hi' ? 'उदा. "बुजुर्गों के लिए टच स्क्रीन बटन का आकार क्या होना चाहिए?" या "RBI के अनुसार पेंशन जीवन प्रमाण पत्र के नियम"' : 'e.g. "What button size is recommended for elderly touchscreens?" or "RBI Zero Liability rules"'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'hi'
                ? 'शोध आधारित प्रश्न लिखें...'
                : language === 'mr'
                ? 'संशोधनावर आधारित प्रश्न लिहा...'
                : 'Ask a question to retrieve cited research evidence...'
            }
            className="flex-1 px-4 py-4 rounded-2xl border-2 border-slate-300 focus:border-indigo-600 focus:outline-none text-base md:text-lg"
          />
          <button
            type="submit"
            disabled={searching || !searchQuery.trim()}
            className="px-6 md:px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base md:text-lg shadow-md disabled:opacity-40 transition-all hover:scale-105 shrink-0"
          >
            {searching ? 'Retrieving...' : 'Search Papers'}
          </button>
        </form>

        {/* Evidence-Based RAG Answer Box */}
        {researchAnswer && (
          <div className="p-6 md:p-8 rounded-3xl bg-indigo-50/80 border-2 border-indigo-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-indigo-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Evidence-Based Answer:
              </span>
              <button
                type="button"
                onClick={() => speak(researchAnswer, language)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-900 font-bold text-xs"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Read Aloud</span>
              </button>
            </div>

            <div className="text-slate-900 text-base md:text-lg leading-relaxed font-medium whitespace-pre-line">
              {researchAnswer}
            </div>

            {/* Citations */}
            {citations.length > 0 && (
              <div className="pt-4 border-t border-indigo-200 space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-900">
                  Referenced Academic Documents:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {citations.map((c, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-xl border border-indigo-200 text-xs text-slate-700 space-y-1">
                      <div className="font-extrabold text-indigo-950">"{c.title}"</div>
                      <div className="text-slate-500">{c.author} ({c.year})</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Indexed Research Papers Directory */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900">
            {language === 'hi' ? 'संग्रहित शोध पत्र एवं दस्तावेज़' : language === 'mr' ? 'समाविष्ट संशोधन अहवाल व कागदपत्रे' : 'Indexed Research Documents & Compendiums'}
          </h2>
          <span className="text-sm font-bold text-slate-500">
            {documents.length} verified documents
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {documents.map(doc => (
            <div
              key={doc.id}
              onClick={() => { playTapSound(); setSelectedDoc(doc); }}
              className="bg-white rounded-3xl p-6 border-2 border-slate-200 hover:border-indigo-400 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-100 text-slate-700 uppercase">
                    {doc.category.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-bold text-slate-400">{doc.year}</span>
                </div>

                <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {doc.title}
                </h3>

                <p className="text-xs font-semibold text-slate-500">
                  Authors: {doc.author}
                </p>

                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                  {doc.summary}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-extrabold text-indigo-600 group-hover:underline">
                  Read Full Passages →
                </span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDocument(doc.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Document Passage Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-3xl w-full max-h-[85vh] overflow-y-auto border-2 border-indigo-300 shadow-2xl space-y-6 relative">
            <button
              type="button"
              onClick={() => setSelectedDoc(null)}
              className="absolute right-6 top-6 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="space-y-2 pr-10">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                Academic Document Findings
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900">
                {selectedDoc.title}
              </h2>
              <p className="text-sm text-slate-500 font-semibold">
                {selectedDoc.author} ({selectedDoc.year})
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-slate-800 text-sm font-medium">
              <span className="font-bold">Abstract / Summary: </span>
              {selectedDoc.summary}
            </div>

            <div className="space-y-4 text-slate-800 text-base leading-relaxed whitespace-pre-line font-medium border-t pt-4">
              {selectedDoc.content}
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold"
              >
                Close Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Add Document Modal */}
      {showAddDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full border-2 border-amber-300 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900">Upload New Academic Document</h3>
              <button type="button" onClick={() => setShowAddDoc(false)} className="p-2 text-slate-500">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                  placeholder="e.g. Cognitive Ergonomics in Mobile Banking for Indian Seniors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Author / Institution</label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                    placeholder="e.g. IIT Bombay & Gerontological Society"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Year</label>
                  <input
                    type="text"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  <option value="digital_literacy">Digital Literacy & Accessibility</option>
                  <option value="upi_safety">UPI Safety & Financial Frauds</option>
                  <option value="gerontechnology">Gerontechnology & Touch Ergonomics</option>
                  <option value="government_services">Government Digital Services & RBI</option>
                  <option value="assistive_tech">Voice & Assistive Interfaces</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Summary / Abstract</label>
                <textarea
                  rows={2}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                  placeholder="Short summary of research findings..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Document Text / Sections *</label>
                <textarea
                  rows={6}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                  placeholder="Paste research document sections, methodology, and empirical data..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddDoc(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm shadow"
                >
                  Save & Index
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
