import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAppStore from '../state/appStore';
import { getOpenAIChatResponse } from '../api/chat-service';
import { PatientEMR } from '../types/emr';
import { PainLog } from '../types/pain';
import { cn } from '../utils/cn';

interface ClinicalAIChatProps {
  patientEMR: PatientEMR | null;
  patientPainLogs: PainLog[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const CLINICAL_PROMPTS = [
  "What are the most likely diagnoses based on this patient's presentation?",
  "What additional tests would you recommend?",
  "Are there any red flags I should be concerned about?",
  "What treatment options would be most appropriate?",
  "How should I monitor this patient's progress?",
  "What patient education points are most important?"
];

export default function ClinicalAIChat({ patientEMR, patientPainLogs }: ClinicalAIChatProps) {
  const { isDarkMode } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "I'm your clinical AI assistant. I can help analyze this patient's case, suggest diagnoses, recommend tests, and provide evidence-based treatment guidance. What would you like to discuss?",
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const createClinicalContext = () => {
    if (!patientEMR) return 'No patient EMR data available.';
    
    const age = calculateAge(patientEMR.demographics.dateOfBirth);
    const medicalHistory = patientEMR.medicalHistory.map(h => h.description).join(', ') || 'None';
    const medications = patientEMR.medications.filter(m => m.status === 'active').map(m => `${m.name} ${m.dosage}`).join(', ') || 'None';
    const allergies = patientEMR.allergies.join(', ') || 'None';
    
    const painSummary = patientPainLogs.length > 0 ? 
      `Recent pain logs: ${patientPainLogs.slice(0, 5).map(log => 
        `${log.bodyPart} ${log.painType} pain (${log.severity}/10) on ${log.date}`
      ).join('; ')}` : 'No recent pain logs';

    return `PATIENT CASE:
Demographics: ${age} year old ${patientEMR.demographics.gender}
Medical History: ${medicalHistory}
Current Medications: ${medications}
Allergies: ${allergies}
${painSummary}

Latest vitals: ${patientEMR.vitals.length > 0 ? 
  `BP ${patientEMR.vitals[0].bloodPressure?.systolic}/${patientEMR.vitals[0].bloodPressure?.diastolic}, HR ${patientEMR.vitals[0].heartRate}` : 
  'No recent vitals'}`;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const context = createClinicalContext();
      const clinicalPrompt = `You are an expert clinical decision support AI assisting a healthcare provider. Provide evidence-based, concise clinical guidance.

${context}

Healthcare Provider Question: ${text}

Provide a professional clinical response with:
1. Direct answer to the question
2. Clinical reasoning
3. Evidence-based recommendations
4. Any relevant warnings or considerations
5. Suggested next steps if applicable

Keep responses focused and actionable for clinical decision-making.`;

      const response = await getOpenAIChatResponse(clinicalPrompt);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Clinical AI error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm experiencing technical difficulties. Please try again or consult clinical guidelines directly for immediate patient care decisions.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    
    return (
      <View
        key={message.id}
        className={cn(
          "mb-4 flex-row",
          isUser ? "justify-end" : "justify-start"
        )}
      >
        <View className={cn(
          "max-w-[85%] p-4 rounded-2xl",
          isUser 
            ? (isDarkMode ? "bg-blue-600" : "bg-blue-500")
            : (isDarkMode ? "bg-gray-800" : "bg-gray-100")
        )}>
          <Text className={cn(
            "text-base leading-relaxed",
            isUser 
              ? "text-white"
              : (isDarkMode ? "text-white" : "text-gray-900")
          )}>
            {message.content}
          </Text>
          <Text className={cn(
            "text-xs mt-2",
            isUser 
              ? "text-blue-100"
              : (isDarkMode ? "text-gray-400" : "text-gray-500")
          )}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1">
      {/* Quick Prompts */}
      {messages.length === 1 && (
        <View className="p-4">
          <Text className={cn(
            "text-lg font-semibold mb-3",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Clinical Questions:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-3">
              {CLINICAL_PROMPTS.map((prompt, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleQuickPrompt(prompt)}
                  className={cn(
                    "px-4 py-3 rounded-xl border border-dashed min-w-[200px]",
                    isDarkMode 
                      ? "border-gray-600 bg-gray-800/50" 
                      : "border-gray-300 bg-gray-50",
                    "active:opacity-70"
                  )}
                >
                  <Text className={cn(
                    "text-sm",
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    {prompt}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Messages */}
      <ScrollView className="flex-1 px-4">
        {messages.map(renderMessage)}
        
        {isLoading && (
          <View className="flex-row justify-start mb-4">
            <View className={cn(
              "p-4 rounded-2xl",
              isDarkMode ? "bg-gray-800" : "bg-gray-100"
            )}>
              <View className="flex-row space-x-1">
                <View className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  isDarkMode ? "bg-gray-600" : "bg-gray-400"
                )} />
                <View className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  isDarkMode ? "bg-gray-600" : "bg-gray-400"
                )} />
                <View className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  isDarkMode ? "bg-gray-600" : "bg-gray-400"
                )} />
              </View>
              <Text className={cn(
                "text-xs mt-2",
                isDarkMode ? "text-gray-400" : "text-gray-600"
              )}>
                Analyzing clinical data...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View className={cn(
        "px-4 py-3 border-t",
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      )}>
        <View className="flex-row items-end space-x-3">
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask a clinical question..."
            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
            className={cn(
              "flex-1 px-4 py-3 rounded-2xl border-2 max-h-24",
              isDarkMode 
                ? "bg-gray-700 border-gray-600 text-white" 
                : "bg-gray-50 border-gray-200 text-gray-900"
            )}
            multiline
            textAlignVertical="center"
            onSubmitEditing={() => sendMessage(inputText)}
            editable={!isLoading}
          />
          <Pressable
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isLoading}
            className={cn(
              "w-12 h-12 rounded-full items-center justify-center",
              inputText.trim() && !isLoading
                ? (isDarkMode ? "bg-blue-600" : "bg-blue-500")
                : (isDarkMode ? "bg-gray-700" : "bg-gray-300")
            )}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={
                inputText.trim() && !isLoading 
                  ? "white" 
                  : (isDarkMode ? "#6B7280" : "#9CA3AF")
              } 
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};