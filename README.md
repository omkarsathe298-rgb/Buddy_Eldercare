# Buddy AI – Elderly Education & Support Assistant

Buddy AI is an AI-powered educational and support platform designed to help elderly people learn, communicate, and access useful information through a simple, accessible, and user-friendly interface.

The project aims to make technology easier for senior citizens through AI-powered conversations, educational resources, safety assistance, and voice-based interaction.

## 🌐 Live Demo

[Visit Buddy AI](https://buddy-eldercare.vercel.app)

## 🎯 Project Objectives

- Make digital learning easier for elderly people.
- Provide simple, understandable AI-generated explanations.
- Support voice and text-based communication.
- Help users identify suspicious messages and potential online scams.
- Provide educational information using trusted research resources.
- Encourage independent learning and digital confidence.

## ✨ Key Features

### 1. Buddy AI Assistant
- AI-powered conversational assistant.
- Simple and easy-to-understand responses.
- Supports educational questions and everyday learning.

### 2. Learning Assistant
- Provides beginner-friendly explanations.
- Supports digital literacy and general education.
- Helps elderly users learn at their own pace.

### 3. Safety Assistant
- Identifies potentially suspicious messages.
- Helps users recognize phishing, fraud, and scam attempts.
- Provides safe online practices.
- Advises users not to share OTPs, PINs, passwords, or banking details.

### 4. Research Knowledge Hub
- Organizes educational research resources.
- Supports information retrieval and research-based answers.
- Helps provide more relevant responses.

### 5. Voice Interaction
- Supports accessible interaction through voice features where available.
- Aims to make the platform easier for users who have difficulty typing.

### 6. User-Friendly Interface
- Simple navigation.
- Readable text and accessible design.
- Responsive layout for different screen sizes.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| React | Frontend development |
| TypeScript | Type-safe development |
| Vite | Development and build tool |
| Tailwind CSS | User interface styling |
| Node.js | Backend runtime |
| Express.js | Backend API |
| Google Gemini API | AI-powered responses |
| Firebase | Authentication and data services |
| Git and GitHub | Version control |

## 📁 Project Structure

```text
Buddy_elder_Ai_Agent/
│
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── agents/
│   ├── hooks/
│   ├── App.tsx
│   └── main.tsx
│
├── server/
│   └── server.ts
│
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

*Note: The structure above is illustrative. Adjust it to match the actual project files.*

## ⚙️ Installation and Setup

### Prerequisites

Install the following:

- Node.js
- npm
- Git
- Visual Studio Code

### 1. Clone the repository

```bash
git clone https://github.com/OM2356/Buddy_elder_Ai_Agent.git
```

### 2. Open the project

```bash
cd Buddy_elder_Ai_Agent
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file in the appropriate project directory and configure the variables required by your application.

Example:

```env
GEMINI_API_KEY=your_gemini_api_key
APP_URL=http://localhost:5173
```

Never publish real API keys, passwords, or private credentials on GitHub.

### 5. Start the development server

```bash
npm run dev
```

Open the local URL displayed in your terminal.

*Backend startup commands may differ depending on your actual project configuration.*

## 🔌 API Endpoints

The following endpoints are planned or available depending on the backend implementation:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend health |
| POST | `/api/classify-intent` | Identify user intent |
| POST | `/api/chat` | Process AI conversations |
| POST | `/api/safety/check` | Analyze potentially suspicious messages |
| POST | `/api/research/query` | Search research information |
| GET | `/api/admin/documents` | Retrieve research documents |
| POST | `/api/admin/documents` | Add research documents |
| DELETE | `/api/admin/documents` | Remove research documents |

## 🧠 AI Agent Architecture

Buddy AI is designed around specialized AI capabilities:

- **Learning Agent:** Helps elderly users understand educational topics.
- **Safety Agent:** Identifies potentially harmful messages and provides safety guidance.
- **Support Agent:** Helps users navigate the platform and understand its features.
- **Research Agent:** Retrieves relevant information from available research resources.
- **Feedback Agent:** Collects user feedback to improve the learning experience.

The agents should be routed according to the user's intent rather than providing the same generic response to every question.

## 🔐 Safety and Privacy

- Do not share real banking credentials or personal passwords.
- Protect API keys using environment variables.
- Avoid storing unnecessary sensitive personal information.
- AI-generated information should be verified when important decisions are involved.
- Emergency situations should be directed to appropriate human assistance and official emergency services.

## 🎓 Project Use Cases

1. Digital literacy education for senior citizens.
2. Learning basic smartphone and internet skills.
3. Understanding suspicious WhatsApp messages.
4. Accessing simple explanations of educational topics.
5. Practising voice-based interaction with AI.
6. Accessing research-supported educational information.

## 🚀 Future Enhancements

- Improved Marathi, Hindi, and other Indian-language support.
- Real-time voice conversations.
- Personalized learning plans.
- Family and caregiver support features.
- Improved research-based Retrieval-Augmented Generation (RAG).
- Emergency assistance information.
- Better accessibility for users with visual or hearing difficulties.

## 👨‍💻 Contributors

Developed as an educational and technology project focused on AI-powered elderly learning and digital safety.

## 📄 License

Add an appropriate open-source license after confirming the project's licensing requirements.

---

**Buddy AI – Making Technology Simple, Safe, and Accessible for Everyone.**
