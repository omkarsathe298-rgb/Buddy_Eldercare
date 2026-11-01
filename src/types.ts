export type UserRole = 'elderly_user' | 'caregiver' | 'admin';
export type AppLanguage = 'en' | 'hi' | 'mr';
export type FontSize = 'normal' | 'large' | 'extra-large';
export type AgentType = 'learning' | 'safety' | 'support' | 'feedback' | 'research' | 'general';

export type UserIntent = 'LEARNING' | 'SAFETY' | 'SUPPORT' | 'RESEARCH' | 'GENERAL' | 'FEEDBACK';

export interface IntentClassificationResult {
  intent: UserIntent;
  selectedAgent: AgentType;
  confidence: number;
  reasoning: string;
  userLanguage: AppLanguage;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  preferredLanguage: AppLanguage;
  fontSize: FontSize;
  highContrast: boolean;
  speechSpeed: number; // 0.75 to 1.25
  phone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrustedContact {
  id: string;
  userId: string;
  name: string;
  relation: string;
  phone: string;
  email?: string;
  isPrimary?: boolean;
  createdAt: string;
}

export interface CaregiverConnection {
  id: string;
  elderlyUserId: string;
  elderlyUserName: string;
  caregiverEmail: string;
  caregiverUserId?: string;
  status: 'pending' | 'active' | 'revoked';
  canViewProgress: boolean;
  canReceiveAlerts: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  agentType?: AgentType;
  timestamp: string;
  sources?: ResearchCitation[];
  feedbackGiven?: boolean;
}

export interface ResearchCitation {
  documentId?: string;
  title: string;
  author?: string;
  year?: string;
  section?: string;
  relevanceExplanation?: string;
}

export interface ResearchDocument {
  id: string;
  title: string;
  category: 'digital_literacy' | 'upi_safety' | 'gerontechnology' | 'government_services' | 'assistive_tech';
  author: string;
  year: string;
  summary: string;
  content: string;
  tags: string[];
  active: boolean;
  uploadedBy?: string;
  createdAt: string;
}

export interface ScamAnalysisResult {
  riskLevel: 'safe' | 'suspicious' | 'high_risk';
  scamType: string;
  indicators: string[];
  explanation: {
    en: string;
    hi: string;
    mr: string;
  };
  safeNextSteps: {
    en: string[];
    hi: string[];
    mr: string[];
  };
  confidence: number;
}

export interface CourseQuizQuestion {
  id: string;
  question: {
    en: string;
    hi: string;
    mr: string;
  };
  options: {
    en: string[];
    hi: string[];
    mr: string[];
  };
  correctIndex: number;
  explanation: {
    en: string;
    hi: string;
    mr: string;
  };
}

export interface Lesson {
  id: string;
  title: {
    en: string;
    hi: string;
    mr: string;
  };
  summary: {
    en: string;
    hi: string;
    mr: string;
  };
  durationMinutes: number;
  steps: {
    title: { en: string; hi: string; mr: string };
    description: { en: string; hi: string; mr: string };
    tip?: { en: string; hi: string; mr: string };
    iconName?: string;
  }[];
  quiz: CourseQuizQuestion[];
}

export interface Course {
  id: string;
  title: {
    en: string;
    hi: string;
    mr: string;
  };
  description: {
    en: string;
    hi: string;
    mr: string;
  };
  iconName: string;
  level: 'beginner' | 'intermediate';
  category: string;
  lessons: Lesson[];
}

export interface UserProgressRecord {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  completed: boolean;
  quizScore?: number;
  completedAt?: string;
  updatedAt: string;
}

export interface UserFeedbackRecord {
  id?: string;
  userId: string;
  conversationId?: string;
  rating: number; // 1-5
  isHelpful: boolean;
  comment?: string;
  agentType?: AgentType;
  createdAt: string;
}
