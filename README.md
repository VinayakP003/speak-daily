# Speak Daily 🎙️

**Speak Daily** is an AI-powered English speaking coach and real-time speech analytics application. Built using React Native and Expo, it acts as a veteran language teacher designed to help you communicate more clearly, confidently, and professionally. 

Whether you're preparing for presentations, practicing everyday English, or aiming to reduce filler words, Speak Daily tracks your speech, analyzes patterns, and provides actionable feedback.

---

## ✨ Features

- **🎙️ High-Fidelity Speech Transcription**: Integrated with [AssemblyAI](https://www.assemblyai.com/) to process voice input accurately.
- **📊 Multi-Dimensional Scoring**: Evaluates spoken responses across four key metrics:
  - **Fluency**: Speech flow and speed.
  - **Clarity**: Pronunciation, articulation, and grammar.
  - **Structure**: Completeness of thoughts and sentence phrasing.
  - **Richness**: Vocabulary diversity and sophisticated language patterns.
- **🎓 The "Veteran Teacher" Suggestion Engine**:
  - **Encouraging & Gentle**: Minor errors (like using filler words such as "um" or "like") receive constructive, polite recommendations.
  - **Strict on Inappropriate Language**: Detects profanity and vulgarity, giving immediate, direct guidance with polite alternatives to keep your language professional.
- **📈 Progress Tracking**: Review past speech sessions, analyze score breakdowns, and track improvements over time with visual progress charts.
- **📱 Modern Cross-Platform UI**: Clean, engaging interface built with React Native and Expo, optimized for mobile devices.

---

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Navigation**: Expo Router (File-based routing)
- **Language**: TypeScript
- **Speech-to-Text API**: [AssemblyAI](https://www.assemblyai.com/)
- **Data Visualization**: React Native SVG / Charting library
- **Storage**: Local persistence for speech history

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:
- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- Expo Go app installed on your physical iOS/Android device (optional, for testing)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/VinayakP003/speak-daily.git
   cd speak-daily
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   Create a `.env` file in the root directory and add your AssemblyAI API credentials:
   ```env
   EXPO_PUBLIC_ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
   ```

4. Start the development server:
   ```bash
   npx expo start
   ```

5. Run the app:
   - Scan the QR code with your phone's camera (iOS) or Expo Go app (Android).
   - Alternatively, press `a` to open in an Android emulator or `i` to open in an iOS simulator.

---

## 📂 Project Structure

```text
├── app/                  # Expo Router navigation and screens
│   ├── (tabs)/           # Tabbed navigation (Index, History, etc.)
│   └── _layout.tsx       # Root layout configuration
├── assets/               # Local icons, logos, and images
├── components/           # Reusable UI components (HistoryList, ProgressChart, SentenceBreakdown, etc.)
├── constants/            # Theme variables and static configurations
├── hooks/                # Custom React hooks (Theme, Color schemes)
├── lib/                  # Core logic modules (transcription, scoring, suggestions, text normalization)
└── scripts/              # Local testing and debugging scripts
```

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request for any suggestions, enhancements, or bug fixes.
