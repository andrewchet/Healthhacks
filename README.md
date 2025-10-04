# 🏥 HealthHacks - Pain Management & Provider Dashboard

A comprehensive React Native health app for pain tracking, AI-powered analysis, and healthcare provider collaboration.

## 🌟 Features

### **Patient Features**
- 📊 **Interactive Body Model** - Visual pain tracking with body part selection
- 📝 **Smart Pain Logging** - Detailed pain entries with severity, type, and triggers
- 🎙️ **Voice Logging** - Speech-to-text pain descriptions
- 📸 **Photo Documentation** - Visual pain tracking with camera integration
- 🤖 **AI Health Chat** - Intelligent health assistant with pain analysis
- 📈 **Progress Tracking** - Timeline visualization and pattern recognition
- 📋 **History & Analytics** - Comprehensive pain data overview

### **Provider Features**
- 🏥 **Provider Dashboard** - Professional medical interface
- 📊 **Patient Analytics** - AI-powered pain pattern analysis
- 🚨 **Urgency Assessment** - Risk scoring and priority patient flagging
- 📅 **Timeline Calendar** - Visual patient progress tracking
- 📄 **EMR Export** - Medical record generation and sharing
- 💬 **AI Insights** - Clinical question suggestions and analysis
- 📞 **Patient Communication** - Secure provider-patient messaging

## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: Zustand with AsyncStorage persistence
- **Navigation**: React Navigation v7
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **AI Integration**: OpenAI, Anthropic, Grok APIs
- **Audio**: Expo AV for voice recording
- **Camera**: Expo Camera for photo capture

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ 
- npm or yarn
- Expo CLI

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/healthhacks.git
   cd healthhacks
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY=your_openai_api_key
   EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY=your_anthropic_api_key
   EXPO_PUBLIC_VIBECODE_GROK_API_KEY=your_grok_api_key
   EXPO_PUBLIC_VIBECODE_GOOGLE_API_KEY=your_google_api_key
   EXPO_PUBLIC_VIBECODE_ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on your device**
   - **Web**: Visit `http://localhost:8081`
   - **Mobile**: Scan QR code with Expo Go app
   - **iOS Simulator**: Press `i` in terminal
   - **Android Emulator**: Press `a` in terminal

## 📱 Demo Accounts

### Patient Account
- Email: `patient@demo.com`
- Password: `any password`

### Provider Account
- Email: `provider@demo.com`
- Password: `any password`

## 🏗️ Architecture

```
src/
├── api/           # AI service integrations
├── components/    # Reusable UI components
├── navigation/    # App navigation setup
├── screens/       # Main app screens
├── state/         # Zustand store management
├── types/         # TypeScript type definitions
└── utils/         # Helper functions and utilities
```

## 🔑 Key Components

- **Pain Tracking**: Comprehensive logging with visual body model
- **AI Integration**: Multi-provider AI for health insights
- **Provider Tools**: Professional medical dashboard
- **Data Export**: EMR-compatible medical reports
- **Voice Features**: Speech-to-text pain logging
- **Security**: Local data storage with optional provider sharing

## 🚀 Deployment

### Web Deployment (Vercel)
```bash
npx expo export --platform web
vercel dist
```

### Mobile App Stores (EAS)
```bash
npm install -g eas-cli
eas build --platform all
eas submit
```

## 🔒 Privacy & Security

- Local data storage with AsyncStorage
- Optional provider data sharing with patient consent
- API keys secured through environment variables
- HIPAA-ready data handling patterns

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with Expo and React Native
- AI powered by OpenAI, Anthropic, and Grok
- Icons by Expo Vector Icons
- UI styling with NativeWind

---

**Note**: This app is for educational purposes. Always consult healthcare professionals for medical decisions.
