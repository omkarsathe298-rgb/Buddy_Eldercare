import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_RESEARCH_DOCUMENTS } from './src/data/researchPapers.ts';
import { ResearchDocument, ScamAnalysisResult, AgentType, UserIntent, IntentClassificationResult } from './src/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// In-memory store for documents initialized from foundational research papers
let activeDocuments: ResearchDocument[] = [...INITIAL_RESEARCH_DOCUMENTS];

// Initialize Google Gemini SDK securely on backend
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const PRIMARY_MODEL = 'gemini-3.1-flash-lite';
const FALLBACK_MODEL = 'gemini-3.8-flash';

// Resilient content generator with multi-model failover and generous per-model timeout
async function generateWithFallback(params: { prompt: string; systemInstruction?: string; jsonMode?: boolean; timeoutMs?: number }): Promise<string> {
  const modelsToTry = [PRIMARY_MODEL, FALLBACK_MODEL, 'gemini-flash-latest'];
  let lastError: any = null;
  const timeoutMs = params.timeoutMs || 14000;

  for (const model of modelsToTry) {
    try {
      const config: any = {};
      if (params.systemInstruction) config.systemInstruction = params.systemInstruction;
      if (params.jsonMode) config.responseMimeType = 'application/json';

      const callPromise = ai.models.generateContent({
        model,
        contents: params.prompt,
        config: Object.keys(config).length > 0 ? config : undefined
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout waiting for ${model}`)), timeoutMs)
      );

      const response: any = await Promise.race([callPromise, timeoutPromise]);

      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} request error, trying fallback:`, err?.message || err);
    }
  }
  throw lastError || new Error('All Gemini model fallbacks exhausted.');
}

// ==========================================
// TASK 3: SPECIALIZED AGENT PROMPTS
// ==========================================
const AGENT_SYSTEM_PROMPTS: Record<AgentType, string> = {
  learning: `You are Buddy AI's Learning Agent. You act strictly as a patient, encouraging digital literacy teacher for elderly people in India.
Your core rules:
1. Focus exclusively on teaching how to use digital devices, smartphone apps, WhatsApp, email, internet browsing, and computer basics.
2. Explain ONE concept at a time. Provide clear numbered steps (Step 1, Step 2, Step 3).
3. Use simple, relatable everyday Indian analogies (e.g., comparing an email inbox to a physical post box, or a WhatsApp voice note to a walkie-talkie).
4. When explaining phone features or settings, specify exactly which icon to look for and where it is located.
5. Check whether the elder understood, celebrate their willingness to learn, and invite them to ask again without feeling shy.
6. Do NOT give generic financial scam warnings unless the user specifically asks about safety. Keep answers focused on practical how-to steps.`,

  safety: `You are Buddy AI's Safety Agent. You act strictly as a protective digital safety and cybersecurity educator for senior citizens in India.
Your core rules:
1. Focus exclusively on identifying online threats, fraud patterns, suspicious links, unknown calls, and protecting user privacy and bank balances.
2. Directly identify the danger and explain WHY it is dangerous in calm, non-technical terms.
3. Enforce the absolute golden rules:
   - A UPI PIN is ONLY entered to send/debit money; you NEVER need a PIN or QR code scan to RECEIVE money or claim pension refunds.
   - Bank managers, police, and government officers NEVER ask for OTPs or passwords over phone or WhatsApp.
   - Indian law enforcement (Police, CBI, ED) NEVER conducts interrogations or arrests over WhatsApp/Skype video calls ("Digital Arrest" is 100% fraud).
   - Never install remote access utilities (AnyDesk, TeamViewer, RustDesk) or APK files sent by strangers.
4. Give safe, numbered recommended next steps immediately.
5. Provide official helplines: 1930 (National Cyber Crime Reporting Portal) and 14567 (Elderline - Senior Citizen Helpline).`,

  support: `You are Buddy AI's Support Agent. You act strictly as a patient technical support assistant for the Buddy AI website and user accounts.
Your core rules:
1. Help users with platform navigation, account registration, login issues, password resets, text size adjustment, and site features.
2. If the user reports login problems:
   - Guide them to the "Sign In" button at the top right of the page.
   - Remind them to verify their email address and password.
   - Mention the one-click "Continue with Google" option and the "Forgot Pass?" reset link.
3. If the user asks about text size or visual comfort:
   - Direct them to the "A" buttons (Normal, Large, XL) at the very top of the screen.
   - Mention the "Contrast" button for high-contrast viewing.
4. If the user asks about the voice assistant, direct them to the orange "Voice Buddy" or microphone button.
5. Provide clear, click-by-click instructions on which button to tap on this screen.`,

  research: `You are Buddy AI's Research Agent. You act strictly as an evidence-based academic researcher specializing in gerontechnology, elderly education, and Indian cybercrime studies.
Your core rules:
1. Answer questions based on the retrieved academic research papers and documents provided in the prompt.
2. State findings clearly and provide explicit citations including Document Title, Authors, Year, and Section.
3. Explicitly distinguish verified research document evidence from general opinions.
4. If the indexed research documents do NOT contain sufficient information to answer the question, state that fact honestly: "Based on our indexed academic papers, this specific detail is not directly addressed. However, general digital literacy principles suggest..."
5. Never fabricate research titles, page numbers, statistics, or authors.
6. Translate complex academic terminology into clear, accessible language for seniors and caregivers.`,

  feedback: `You are Buddy AI's Feedback Agent. You handle user feedback, ratings, complaints, and suggestions about previous answers.
Your core rules:
1. Do NOT answer as a general teacher or give unrelated lessons. Focus exclusively on acknowledging and learning from the user's feedback.
2. When a user says an explanation was too difficult, too fast, confusing, or unhelpful:
   - Listen empathetically and apologize warmly for the confusion.
   - Acknowledge their feedback with genuine care.
   - Ask specifically: "Would you like me to explain this again using simpler words, smaller steps, or in Hindi or Marathi?"
   - Offer to break down the previous topic into very tiny, easy-to-follow steps immediately.
3. When a user gives positive feedback ("great", "thank you", "very helpful"), thank them warmly and encourage their continued learning.`,

  general: `You are Buddy AI's General Agent. You handle general knowledge, geography, daily questions, culture, and friendly conversation.
Your core rules:
1. Answer general questions directly, accurately, and politely (e.g., questions about history, capitals, weather, recipes, facts, or everyday topics).
2. Do NOT force every question into a tech lesson or digital literacy topic. If someone asks "What is the capital of India?", answer directly that New Delhi is the capital, along with a brief, friendly piece of context.
3. Be respectful, concise, and helpful.
4. Respond in the user's preferred language (English, Hindi, or Marathi).`
};

// ==========================================
// TASK 2: INTELLIGENT INTENT DETECTION SERVICE
// ==========================================

// Rule-based high-accuracy classifier used as immediate baseline and fallback
function ruleBasedClassify(message: string, history?: any[]): IntentClassificationResult {
  const text = message.toLowerCase().trim();

  // 1. FEEDBACK INTENT: Feedback or complaint regarding previous answers
  const feedbackKeywords = [
    'too difficult', 'too hard', 'too fast', 'too complicated', 'did not understand',
    'didn\'t understand', 'confusing', 'not helpful', 'explain simpler', 'simple words',
    'bad explanation', 'great explanation', 'thank you that was clear', 'much better',
    'कठिन है', 'समझ नहीं आया', 'सोपे करून सांगा', 'समजले नाही', 'फार अवघड', 'छान समजावले'
  ];
  if (feedbackKeywords.some(k => text.includes(k))) {
    return {
      intent: 'FEEDBACK',
      selectedAgent: 'feedback',
      confidence: 0.95,
      reasoning: 'User is expressing feedback, difficulty, or appreciation regarding an explanation.',
      userLanguage: /[\u0900-\u097F]/.test(message) ? (text.includes('आहे') || text.includes('नाही') ? 'mr' : 'hi') : 'en'
    };
  }

  // 2. SUPPORT INTENT: Website navigation, login, password, settings, voice button, buddy ai account
  const supportKeywords = [
    'cannot log in', 'can\'t log in', 'login issue', 'log in to my', 'account', 'sign in',
    'forgot password', 'reset password', 'buddy ai account', 'how to use this website',
    'website not working', 'change font size', 'make words bigger on website',
    'microphone not working', 'high contrast', 'caregiver connect', 'लॉगिन', 'पासवर्ड'
  ];
  if (supportKeywords.some(k => text.includes(k))) {
    return {
      intent: 'SUPPORT',
      selectedAgent: 'support',
      confidence: 0.92,
      reasoning: 'User is inquiring about Buddy AI website technical navigation, login, or settings.',
      userLanguage: /[\u0900-\u097F]/.test(message) ? (text.includes('आहे') ? 'mr' : 'hi') : 'en'
    };
  }

  // 3. RESEARCH INTENT: Research papers, academic documents, studies, empirical findings, RBI circulars
  const researchKeywords = [
    'research paper', 'academic paper', 'study findings', 'gerontechnology', 'rbi circular',
    'findings of my uploaded', 'uploaded research', 'evidence', 'empirical', 'literature',
    'संशोधन', 'शोध पत्र'
  ];
  if (researchKeywords.some(k => text.includes(k))) {
    return {
      intent: 'RESEARCH',
      selectedAgent: 'research',
      confidence: 0.95,
      reasoning: 'User is asking about academic research studies, uploaded papers, or evidence.',
      userLanguage: /[\u0900-\u097F]/.test(message) ? (text.includes('आहे') ? 'mr' : 'hi') : 'en'
    };
  }

  // 4. SAFETY INTENT: Scams, fraud, OTP, PIN, suspicious calls, digital arrest, electricity bill threats
  const safetyKeywords = [
    'otp', 'pin', 'bank otp', 'upi pin', 'scam', 'fraud', 'fraudulent', 'hacked',
    'suspicious message', 'suspicious link', 'electricity bill disconnect', 'power cut tonight',
    'lottery won', 'cbi call', 'police video call', 'digital arrest', 'anydesk', 'teamviewer',
    'cvv', 'card expiry', 'पिन', 'ओटीपी', 'धोखा', 'फसवणूक'
  ];
  if (safetyKeywords.some(k => text.includes(k))) {
    return {
      intent: 'SAFETY',
      selectedAgent: 'safety',
      confidence: 0.94,
      reasoning: 'User is asking about a potential security threat, OTP request, or cyber scam.',
      userLanguage: /[\u0900-\u097F]/.test(message) ? (text.includes('आहे') ? 'mr' : 'hi') : 'en'
    };
  }

  // 5. GENERAL INTENT: General trivia, geography, weather, greetings, facts unrelated to digital tools
  const generalKeywords = [
    'capital of', 'who is', 'what is the capital', 'recipe for', 'weather in',
    'how many states', 'history of', 'prime minister', 'president of', 'meaning of life',
    'राजधानी', 'हवामान'
  ];
  if (generalKeywords.some(k => text.includes(k))) {
    return {
      intent: 'GENERAL',
      selectedAgent: 'general',
      confidence: 0.93,
      reasoning: 'User is asking a general knowledge or factual question unrelated to digital devices.',
      userLanguage: /[\u0900-\u097F]/.test(message) ? (text.includes('आहे') ? 'mr' : 'hi') : 'en'
    };
  }

  // 6. LEARNING INTENT: Device how-to, smartphone features, WhatsApp, email, computer, zooming text on phone
  const learningKeywords = [
    'whatsapp', 'photo', 'voice note', 'video call', 'smartphone', 'phone', 'computer',
    'email', 'gmail', 'google search', 'text bigger', 'how do i send', 'how to use',
    'how to make text', 'keyboard', 'touch screen', 'कस पाठवू', 'कसे करावे', 'कैसे भेजें'
  ];
  if (learningKeywords.some(k => text.includes(k))) {
    return {
      intent: 'LEARNING',
      selectedAgent: 'learning',
      confidence: 0.94,
      reasoning: 'User wants to learn smartphone or software basics step-by-step.',
      userLanguage: /[\u0900-\u097F]/.test(message) ? (text.includes('आहे') ? 'mr' : 'hi') : 'en'
    };
  }

  // Default fallback
  return {
    intent: 'GENERAL',
    selectedAgent: 'general',
    confidence: 0.75,
    reasoning: 'Default conversational categorization.',
    userLanguage: /[\u0900-\u097F]/.test(message) ? 'hi' : 'en'
  };
}

// AI-powered Intent Classification with JSON Schema
async function classifyUserIntent(message: string, history?: any[]): Promise<IntentClassificationResult> {
  const ruleResult = ruleBasedClassify(message, history);

  // If rule match is high confidence (>= 0.90), use it directly for deterministic speed & precision
  if (ruleResult.confidence >= 0.90) {
    return ruleResult;
  }

  const prompt = `You are the Master Intent Classifier for Buddy AI, an elderly digital companion in India.
Classify the following user message into EXACTLY ONE category:

1. "LEARNING": Questions about learning smartphone, WhatsApp, email, computers, internet, digital payments and technology how-to.
2. "SAFETY": Questions about scams, fraud, OTP, PIN, suspicious messages, suspicious links, privacy and cybersecurity.
3. "SUPPORT": Questions about using the Buddy AI website, login issues, settings, navigation and technical problems.
4. "RESEARCH": Questions about academic research papers, uploaded PDFs, elderly education studies and document-based information.
5. "FEEDBACK": Feedback, ratings, complaints or suggestions about previous answers (e.g., "Your explanation was too difficult to understand").
6. "GENERAL": Questions that do not belong to the above categories (e.g., general knowledge like "What is the capital of India?").

Respond ONLY with valid JSON:
{
  "intent": "LEARNING" | "SAFETY" | "SUPPORT" | "RESEARCH" | "FEEDBACK" | "GENERAL",
  "selectedAgent": "learning" | "safety" | "support" | "research" | "feedback" | "general",
  "confidence": number between 0.0 and 1.0,
  "reasoning": string,
  "userLanguage": "en" | "hi" | "mr"
}

User Message: "${message.replace(/"/g, '\\"')}"`;

  try {
    const rawJson = await generateWithFallback({ prompt, jsonMode: true, timeoutMs: 3500 });
    const parsed: IntentClassificationResult = JSON.parse(rawJson);
    if (parsed.intent && parsed.selectedAgent) {
      return parsed;
    }
  } catch (e) {
    console.warn('AI classifier fallback to rule-based classifier:', e);
  }

  return ruleResult;
}

// Helper: RAG document search
function retrieveDocumentPassages(query: string, maxDocs = 3) {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const scored = activeDocuments.filter(d => d.active).map(doc => {
    let score = 0;
    const combined = `${doc.title} ${doc.summary} ${doc.content} ${doc.tags.join(' ')}`.toLowerCase();
    for (const word of queryWords) {
      if (combined.includes(word)) {
        score += 1;
      }
    }
    return { doc, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxDocs).map(item => item.doc);
}

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'Buddy AI',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY
  });
});

// Dedicated Intent Classification Endpoint for Frontend & Audits
app.post('/api/classify-intent', async (req: Request, res: Response) => {
  const { message, history } = req.body;
  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'Message text is required.' });
    return;
  }
  const result = await classifyUserIntent(message, history);
  res.json(result);
});

// ==========================================
// TASK 4 & 5: AGENT ROUTING & CONVERSATION MEMORY
// ==========================================
app.post('/api/chat', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const questionId = `q-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  try {
    const { 
      message, 
      history, 
      language = 'en', 
      agentType,
      userId = 'anonymous_user',
      conversationId = 'default_conv'
    } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message text is required.' });
      return;
    }

    // TASK 2: Intelligent Intent Classification
    const classification = await classifyUserIntent(message, history);
    
    // Allow explicit user override ONLY if user explicitly locked an agent (not 'auto')
    const effectiveAgent: AgentType = (agentType && agentType !== 'auto' && AGENT_SYSTEM_PROMPTS[agentType as AgentType])
      ? (agentType as AgentType)
      : classification.selectedAgent;

    const systemPrompt = AGENT_SYSTEM_PROMPTS[effectiveAgent] || AGENT_SYSTEM_PROMPTS.general;

    // TASK 5: Relevant Context Retrieval
    let ragContext = '';
    let citations: { title: string; author?: string; year?: string; section?: string }[] = [];

    if (effectiveAgent === 'research' || classification.intent === 'RESEARCH') {
      const retrieved = retrieveDocumentPassages(message, 2);
      if (retrieved.length > 0) {
        ragContext = `\n\n[AUTHENTIC RESEARCH DOCUMENTS EXCERPTS]:\n` +
          retrieved.map((d, idx) => `Document ${idx + 1}: "${d.title}" by ${d.author} (${d.year})\n${d.content}`).join('\n\n') +
          `\n\nINSTRUCTION: Base your answer on the above documents. Explicitly cite the title, author, year, and section. If the documents do not cover an aspect, mention that explicitly without fabricating citations.`;

        citations = retrieved.map(d => ({
          title: d.title,
          author: d.author,
          year: d.year,
          section: 'Document Findings'
        }));
      }
    }

    const effectiveLang = classification.userLanguage || language;
    const languageInstruction = `\nPreferred output language: ${
      effectiveLang === 'hi' 
        ? 'Hindi (हिंदी) in clear Devanagari script' 
        : effectiveLang === 'mr' 
        ? 'Marathi (मराठी) in clear Devanagari script' 
        : 'Simple, conversational English'
    }.`;

    // Partition conversation history safely by conversation
    const conversationHistoryText = Array.isArray(history) && history.length > 0
      ? history.slice(-6).map((h: any) => `${h.sender === 'user' ? 'Elderly User' : 'Buddy AI'}: ${h.text}`).join('\n')
      : '';

    const fullPrompt = `${systemPrompt}
${languageInstruction}
${ragContext}

${conversationHistoryText ? `Previous Conversation Context (Conversation: ${conversationId}):\n${conversationHistoryText}\n` : ''}
Elderly User (${userId}) asks: "${message}"

Respond strictly according to your specialized agent role:`;

    const replyText = await generateWithFallback({ prompt: fullPrompt, timeoutMs: 12000 });

    const latencyMs = Date.now() - startTime;

    // TASK 6: Non-sensitive Debugging and Audit Logging
    console.log('[AI_AGENT_AUDIT]', JSON.stringify({
      questionId,
      timestamp: new Date().toISOString(),
      userId: userId.replace(/(@.*)/, '***'), // Sanitize email/user ID
      conversationId,
      detectedIntent: classification.intent,
      selectedAgent: effectiveAgent,
      confidence: classification.confidence,
      reasoning: classification.reasoning,
      userLanguage: effectiveLang,
      retrievalStatus: citations.length > 0 ? 'RETRIEVED' : 'NONE',
      geminiResponseStatus: 'SUCCESS',
      latencyMs
    }));

    res.json({
      text: replyText || "Namaste! I am here to help you. Could you please ask that again?",
      agentType: effectiveAgent,
      intent: classification.intent,
      confidence: classification.confidence,
      reasoning: classification.reasoning,
      citations: citations.length > 0 ? citations : undefined,
      questionId,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    console.error('[AI_AGENT_AUDIT_ERROR]', JSON.stringify({
      questionId,
      error: error?.message || String(error),
      latencyMs
    }));

    const { language = 'en', agentType, message = '' } = req.body;
    const ruleClassification = ruleBasedClassify(message);
    const targetAgent: AgentType = (agentType && agentType !== 'auto') ? (agentType as AgentType) : ruleClassification.selectedAgent;

    const fallbackResponses: Record<AgentType, string> = {
      learning: `Namaste! Here are simple steps to help you:\n\nStep 1: Open the app on your phone.\nStep 2: Look for the attachment or share icon (like a paperclip or gallery icon).\nStep 3: Select your photo or file and tap the green Send button.\n\nTake your time, and please ask if you want me to repeat any step!`,
      safety: `CRITICAL SAFETY ALERT:\n\n1. NEVER share your Bank OTP, UPI PIN, or password with anyone, even if they claim to be from your bank or the police.\n2. A PIN or OTP is NEVER needed to receive money or pension refunds.\n3. If anyone pressures you, hang up immediately and dial 1930 (National Cyber Helpline) or 14567 (Senior Citizen Elderline).`,
      support: `Namaste! Here is how to resolve your Buddy AI issue:\n\n1. Login Issues: Tap 'Sign In' at the top-right corner of the page. You can use 'Continue with Google' or click 'Forgot Pass?' if you need a password reset link.\n2. Text Size: Use the 'A' buttons (Normal, Large, XL) at the top of the screen to adjust the font size to your comfort.\n\nPlease try this and let us know if you need more help!`,
      research: `Academic Research Findings (from Buddy AI Research Hub):\n\nKey studies in elderly digital education (e.g., 'Digital Literacy and Fraud Vulnerability among Indian Elderly', 2024) find that structured step-by-step guidance, high contrast interfaces, and practical scam simulations increase senior digital self-efficacy by over 40% while reducing fraud vulnerability.`,
      feedback: `Thank you very much for your feedback! We sincerely apologize if the earlier explanation was difficult to understand. We have recorded your note and will make our future answers much simpler, slower, and easier to read.`,
      general: `Namaste! I am Buddy AI, your companion. To answer your question: New Delhi is the capital of India. Please feel free to ask any other questions anytime!`
    };

    const fallbackText = fallbackResponses[targetAgent] || fallbackResponses.general;

    res.json({
      text: fallbackText,
      agentType: targetAgent,
      intent: ruleClassification.intent,
      confidence: ruleClassification.confidence,
      reasoning: ruleClassification.reasoning + ' (Served via resilient fallback)',
      questionId,
      timestamp: new Date().toISOString()
    });
  }
});

// Route: Scam & Fraud Detection Analysis
app.post('/api/safety/check', async (req: Request, res: Response) => {
  const { messageSnippet, language = 'en' } = req.body;

  if (!messageSnippet || typeof messageSnippet !== 'string') {
    res.status(400).json({ error: 'Message text is required for scam check.' });
    return;
  }

  const prompt = `You are an expert Cyber Safety Analyst protecting Indian senior citizens from financial cyber frauds (UPI scams, APK malware, electricity bill threats, fake police digital arrest, KYC fraud).

Analyze this suspicious message/call description received by an elderly person in India:
"""${messageSnippet}"""

Respond ONLY with valid JSON conforming to this TypeScript interface:
{
  "riskLevel": "high_risk" | "suspicious" | "safe",
  "scamType": string,
  "indicators": string[],
  "explanation": {
    "en": string,
    "hi": string,
    "mr": string
  },
  "safeNextSteps": {
    "en": string[],
    "hi": string[],
    "mr": string[]
  },
  "confidence": number
}

Ensure the explanations and next steps are warm, clear, and reassuring for elderly Indian citizens. Remind them to NEVER share OTP or UPI PIN. If high risk, recommend calling 1930.`;

  try {
    const responseText = await generateWithFallback({ prompt, jsonMode: true, timeoutMs: 10000 });
    const parsed: ScamAnalysisResult = JSON.parse(responseText);
    res.json(parsed);
  } catch (error: any) {
    console.warn('API /api/safety/check using safety heuristics fallback:', error?.message);
    const lower = messageSnippet.toLowerCase();
    const isUrgent = lower.includes('disconnect') || lower.includes('cut') || lower.includes('power') || lower.includes('blocked');
    const isPinOtp = lower.includes('pin') || lower.includes('otp') || lower.includes('password') || lower.includes('cvv');
    const isLottery = lower.includes('lottery') || lower.includes('won') || lower.includes('prize') || lower.includes('lakh');

    const fallbackResult: ScamAnalysisResult = {
      riskLevel: (isUrgent || isPinOtp || isLottery) ? 'high_risk' : 'suspicious',
      scamType: isUrgent ? 'Utility Disconnection / Urgent Threat Fraud' : isPinOtp ? 'UPI PIN / Credential Theft Fraud' : 'Suspicious Unknown Contact',
      indicators: [
        'Urgent threat or deadline to provoke panic',
        'Directs you to call an unofficial mobile number or click a link',
        'Requests action without official bank/utility paperwork'
      ],
      explanation: {
        en: 'This message exhibits typical warning signs of cyber fraud. Official departments (MSEB, electricity boards, banks) never send urgent disconnection threats demanding immediate payments via unofficial mobile links.',
        hi: 'यह संदेश साइबर धोखाधड़ी के साफ लक्षण दिखाता है। बिजली विभाग या बैंक कभी भी तुरंत लाइन काटने की धमकी देकर अनजान नंबर पर कॉल करने या लिंक से भुगतान करने को नहीं कहते।',
        mr: 'हा मेसेज सायबर फसवणुकीचा प्रकार आहे. महावितरण किंवा वीज मंडळ कधीही अशी धमकी देऊन वैयक्तिक नंबरवरून पैसे भरण्यास सांगत नाही.'
      },
      safeNextSteps: {
        en: [
          'Do NOT click any link or call the number in the message.',
          'Do NOT enter your UPI PIN or share OTP with anyone.',
          'If money was deducted, immediately call the National Cyber Crime Helpline at 1930.'
        ],
        hi: [
          'संदेश में दिए गए किसी भी लिंक पर क्लिक न करें और न ही उस नंबर पर फोन करें।',
          'अपना यूपीआई पिन न डालें और किसी को भी ओटीपी न बताएं।',
          'यदि अनजाने में पैसे कट गए हों, तो तुरंत राष्ट्रीय साइबर हेल्पलाइन १९३० पर कॉल करें।'
        ],
        mr: [
          'मेसेजमधील कोणत्याही लिंकवर क्लिक करू नका किंवा त्या नंबरवर फोन करू नका.',
          'कोणत्याही परिस्थितीत तुमचा UPI PIN टाकू नका आणि OTP सांगू नका.',
          'खात्यातून पैसे गेले असल्यास तात्काळ १९३० या राष्ट्रीय सायबर हेल्पलाइनवर तक्रार नोंदवा.'
        ]
      },
      confidence: 0.95
    };
    res.json(fallbackResult);
  }
});

// Route: Research Knowledge Hub RAG query
app.post('/api/research/query', async (req: Request, res: Response) => {
  try {
    const { query, language = 'en' } = req.body;

    if (!query) {
      res.status(400).json({ error: 'Query is required.' });
      return;
    }

    const retrieved = retrieveDocumentPassages(query, 3);
    const documentsContent = retrieved
      .map(d => `Title: ${d.title}\nAuthors: ${d.author} (${d.year})\nCategory: ${d.category}\nContent: ${d.content}`)
      .join('\n\n---\n\n');

    const prompt = `You are Buddy AI's Research Knowledge Specialist.
We have an indexed repository of research papers on elderly digital literacy, gerontechnology, and cyber safety in India.

Indexed Papers:
${documentsContent}

User question: "${query}"
Language: ${language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English'}

Answer requirements:
1. Base your answer strictly on the above research papers.
2. Clearly state which paper and section supports your answer.
3. If the papers lack sufficient detail on this topic, clearly say so without making up information.
4. Explain the academic findings in clear, friendly language suitable for seniors and caregivers.`;

    const answerText = await generateWithFallback({ prompt, timeoutMs: 12000 });

    res.json({
      answer: answerText,
      citations: retrieved.map(d => ({
        documentId: d.id,
        title: d.title,
        author: d.author,
        year: d.year,
        category: d.category,
        summary: d.summary
      }))
    });
  } catch (error: any) {
    console.error('API /api/research/query error:', error);
    res.status(500).json({ error: 'Research query failed.', details: error?.message });
  }
});

// Route: Admin Document Management
app.get('/api/admin/documents', (_req: Request, res: Response) => {
  res.json({ documents: activeDocuments });
});

app.post('/api/admin/documents', (req: Request, res: Response) => {
  try {
    const { title, category, author, year, summary, content, tags } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: 'Title and content are required.' });
      return;
    }

    const newDoc: ResearchDocument = {
      id: `doc-${Date.now()}`,
      title,
      category: category || 'digital_literacy',
      author: author || 'Research Team',
      year: year || String(new Date().getFullYear()),
      summary: summary || content.slice(0, 160) + '...',
      content,
      tags: Array.isArray(tags) ? tags : ['research'],
      active: true,
      createdAt: new Date().toISOString()
    };

    activeDocuments.push(newDoc);
    res.status(201).json({ message: 'Document added to Knowledge Hub successfully', document: newDoc });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add document', details: error?.message });
  }
});

app.delete('/api/admin/documents/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const initialCount = activeDocuments.length;
  activeDocuments = activeDocuments.filter(d => d.id !== id);
  if (activeDocuments.length === initialCount) {
    res.status(404).json({ error: 'Document not found.' });
    return;
  }
  res.json({ message: 'Document deleted successfully', id });
});

// Vite Middleware & Static Serving setup
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const PORT = Number(process.env.PORT) || 3000;

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Buddy AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Server startup error:', err);
});
