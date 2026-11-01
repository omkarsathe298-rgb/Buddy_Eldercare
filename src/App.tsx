import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccessibilityProvider, useAccessibility } from './context/AccessibilityContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { ElderlyDashboard } from './components/dashboard/ElderlyDashboard';
import { LearningAcademy } from './components/learning/LearningAcademy';
import { SafetyModule } from './components/safety/SafetyModule';
import { ResearchKnowledgeHub } from './components/research/ResearchKnowledgeHub';
import { CaregiverDashboard } from './components/caregiver/CaregiverDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AgentChatModal } from './components/chat/AgentChatModal';
import { VoiceAssistantModal } from './components/voice/VoiceAssistantModal';
import { AuthModal } from './components/auth/AuthModal';
import { AgentType } from './types';

function MainAppContent() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState<boolean>(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [chatAgent, setChatAgent] = useState<AgentType>('learning');
  const [chatTopic, setChatTopic] = useState<string | undefined>(undefined);

  const { playTapSound } = useAccessibility();

  const handleOpenChat = (agent: AgentType = 'learning', topic?: string) => {
    playTapSound();
    setChatAgent(agent);
    setChatTopic(topic);
    setIsChatModalOpen(true);
  };

  const handleOpenVoice = () => {
    playTapSound();
    setIsVoiceModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 transition-colors">
      {/* Sticky Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openAuthModal={() => { playTapSound(); setIsAuthModalOpen(true); }}
        openVoiceAssistant={handleOpenVoice}
      />

      {/* Main Content View based on currentTab */}
      <main className="flex-1">
        {currentTab === 'dashboard' && (
          <ElderlyDashboard
            onNavigate={(tab) => { playTapSound(); setCurrentTab(tab); }}
            onOpenChat={handleOpenChat}
            onOpenVoice={handleOpenVoice}
          />
        )}

        {currentTab === 'learning' && (
          <LearningAcademy
            onAskBuddy={(topic) => handleOpenChat('learning', topic)}
          />
        )}

        {currentTab === 'safety' && (
          <SafetyModule />
        )}

        {currentTab === 'research' && (
          <ResearchKnowledgeHub />
        )}

        {currentTab === 'caregiver' && (
          <CaregiverDashboard />
        )}

        {currentTab === 'admin' && (
          <AdminDashboard />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <AgentChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        defaultAgent={chatAgent}
        initialTopic={chatTopic}
      />

      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <MainAppContent />
      </AccessibilityProvider>
    </AuthProvider>
  );
}
