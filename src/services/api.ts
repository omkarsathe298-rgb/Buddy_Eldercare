import { ChatMessage, ScamAnalysisResult, ResearchDocument, AgentType, AppLanguage, UserIntent, IntentClassificationResult } from '../types';

export async function sendMessageToAI(params: {
  message: string;
  history?: ChatMessage[];
  language?: AppLanguage;
  agentType?: AgentType | 'auto';
  userId?: string;
  conversationId?: string;
}): Promise<{
  text: string;
  agentType: AgentType;
  intent?: UserIntent;
  confidence?: number;
  reasoning?: string;
  citations?: { title: string; author?: string; year?: string; section?: string }[];
  questionId?: string;
  timestamp: string;
}> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to reach AI Buddy');
  }

  return response.json();
}

export async function classifyIntent(message: string, history?: ChatMessage[]): Promise<IntentClassificationResult> {
  const response = await fetch('/api/classify-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });

  if (!response.ok) {
    throw new Error('Intent classification failed');
  }

  return response.json();
}

export async function checkScamMessage(messageSnippet: string, language: AppLanguage = 'en'): Promise<ScamAnalysisResult> {
  const response = await fetch('/api/safety/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageSnippet, language }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to analyze suspicious message');
  }

  return response.json();
}

export async function queryResearchKnowledge(query: string, language: AppLanguage = 'en'): Promise<{
  answer: string;
  citations: any[];
}> {
  const response = await fetch('/api/research/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, language }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Research query failed');
  }

  return response.json();
}

export async function fetchAdminDocuments(): Promise<{ documents: ResearchDocument[] }> {
  const response = await fetch('/api/admin/documents');
  if (!response.ok) {
    throw new Error('Failed to fetch documents');
  }
  return response.json();
}

export async function createAdminDocument(docData: Partial<ResearchDocument>): Promise<{ message: string; document: ResearchDocument }> {
  const response = await fetch('/api/admin/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(docData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create document');
  }

  return response.json();
}

export async function deleteAdminDocument(id: string): Promise<void> {
  const response = await fetch(`/api/admin/documents/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete document');
  }
}
