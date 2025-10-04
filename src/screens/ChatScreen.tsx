import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAppStore from '../state/appStore';
import usePainStore from '../state/painStore';
import { getOpenAIChatResponse } from '../api/chat-service';
import { generateDoctorReport } from '../utils/doctorExport';
import { cn } from '../utils/cn';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const HEALTH_DISCLAIMER = `I'm an AI assistant designed to provide general information about pain management and symptoms. I cannot diagnose medical conditions or replace professional medical advice. If you're experiencing severe pain, sudden onset symptoms, or concerning changes, please consult with a healthcare provider immediately.

How can I help you understand your pain better today?`;

const SAMPLE_QUESTIONS = [
  "Why does my shoulder hurt after working out?",
  "What could cause lower back pain?",
  "When should I see a doctor about joint pain?",
  "Analyze my pain patterns",
  "What specialist should I see?",
  "Help me prepare for my doctor appointment",
  "Are there any red flags in my symptoms?",
  "What exercises might help my pain?"
];

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useAppStore();
  const { painLogs } = usePainStore();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: HEALTH_DISCLAIMER,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const createContextFromPainLogs = () => {
    if (painLogs.length === 0) return '';
    
    // Generate comprehensive analysis
    const report = generateDoctorReport(painLogs);
    const recentLogs = painLogs.slice(0, 10);
    
    let context = `User's pain data analysis:
- Total entries: ${report.summary.totalEntries}
- Average pain level: ${report.summary.averagePain}/10
- Most affected area: ${report.summary.mostCommonBodyPart}
- Most common pain type: ${report.summary.mostCommonPainType}
- Pain trend: ${report.summary.painTrend}

Recent pain patterns:
${Object.entries(report.patterns.painByBodyPart).slice(0, 3).map(([part, count]) => 
  `- ${part}: ${count} episodes`).join('\n')}

Common triggers/tags: ${Object.keys(report.patterns.commonTags).slice(0, 5).join(', ')}

Recent entries: ${recentLogs.map(log => 
  `${log.date}: ${log.bodyPart} pain (${log.severity}/10, ${log.painType}, ${log.cause}${log.tags ? `, tags: ${log.tags.join(', ')}` : ''})`
).join('; ')}`;

    return context;
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
      const context = createContextFromPainLogs();
      const systemPrompt = `You are an advanced health information assistant focused on pain management and musculoskeletal health. You provide educational information while being clear that you cannot diagnose or replace medical care.

CORE CAPABILITIES:
1. RED FLAG IDENTIFICATION: Identify concerning symptoms that require immediate medical attention
2. SPECIALIST RECOMMENDATIONS: Suggest appropriate specialists based on pain patterns
3. APPOINTMENT PREPARATION: Help users prepare questions and summaries for doctors
4. PATTERN ANALYSIS: Analyze pain trends and correlations
5. EXERCISE/LIFESTYLE GUIDANCE: Suggest evidence-based interventions

RED FLAG SYMPTOMS (always recommend immediate medical care):
- Chest pain, shortness of breath, heart-related symptoms
- Sudden severe headache, vision changes, neurological symptoms  
- Signs of infection: fever, severe swelling, red streaking
- Loss of bladder/bowel control, severe weakness, numbness
- Pain after trauma with suspected fracture
- Severe abdominal pain, signs of internal bleeding

SPECIALIST RECOMMENDATIONS:
- Orthopedist: Joint, bone, muscle injuries; sports medicine
- Neurologist: Nerve pain, headaches, tingling, weakness
- Rheumatologist: Autoimmune conditions, widespread joint pain
- Pain Management: Chronic pain, complex pain syndromes
- Physical Medicine & Rehab: Functional improvement, disability
- Physiatrist: Comprehensive musculoskeletal care

APPOINTMENT PREP GUIDANCE:
- Summarize pain history, patterns, triggers
- List current medications and treatments tried
- Describe functional limitations and quality of life impact
- Prepare specific questions about diagnosis and treatment options

${context ? `User's pain data analysis:\n${context}` : 'No pain history available.'}

Be empathetic, evidence-based, and actionable. Always include appropriate medical disclaimers.`;

      const response = await getOpenAIChatResponse(
        `${systemPrompt}\n\nUser question: ${text}`
      );

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment. If you're experiencing urgent symptoms, please contact a healthcare provider directly.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleQuestion = (question: string) => {
    sendMessage(question);
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
          "max-w-[80%] p-4 rounded-2xl",
          isUser 
            ? (isDarkMode ? "bg-emerald-600" : "bg-emerald-500")
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
              ? "text-emerald-100"
              : (isDarkMode ? "text-gray-400" : "text-gray-500")
          )}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View 
        className={cn(
          "flex-1",
          isDarkMode ? "bg-gray-900" : "bg-white"
        )}
      >
        {/* Header */}
        <View 
          className={cn(
            "px-4 py-3 border-b",
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          )}
          style={{ paddingTop: insets.top + 12 }}
        >
          <View className="flex-row items-center space-x-3">
            <View className={cn(
              "w-10 h-10 rounded-full items-center justify-center",
              isDarkMode ? "bg-emerald-600" : "bg-emerald-500"
            )}>
              <Ionicons name="medical" size={20} color="white" />
            </View>
            <View>
              <Text className={cn(
                "text-lg font-semibold",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>
                Health Assistant
              </Text>
              <Text className={cn(
                "text-sm",
                isDarkMode ? "text-gray-400" : "text-gray-600"
              )}>
                Ask about your pain and symptoms
              </Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 py-4"
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}
          
          {isLoading && (
            <View className="flex-row justify-start mb-4">
              <View className={cn(
                "p-4 rounded-2xl",
                isDarkMode ? "bg-gray-800" : "bg-gray-100"
              )}>
                <View className="flex-row space-x-1">
                  <View className={cn(
                    "w-2 h-2 rounded-full",
                    isDarkMode ? "bg-gray-600" : "bg-gray-400"
                  )} />
                  <View className={cn(
                    "w-2 h-2 rounded-full",
                    isDarkMode ? "bg-gray-600" : "bg-gray-400"
                  )} />
                  <View className={cn(
                    "w-2 h-2 rounded-full",
                    isDarkMode ? "bg-gray-600" : "bg-gray-400"
                  )} />
                </View>
              </View>
            </View>
          )}

          {/* Sample Questions */}
          {messages.length === 1 && (
            <View className="mt-6 space-y-3">
              <Text className={cn(
                "text-lg font-semibold mb-3",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>
                Quick Questions:
              </Text>
              {SAMPLE_QUESTIONS.map((question, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleSampleQuestion(question)}
                  className={cn(
                    "p-3 rounded-xl border border-dashed",
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
                    "{question}"
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View 
          className={cn(
            "px-4 py-3 border-t",
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          )}
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <View className="flex-row items-end space-x-3">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about your pain or symptoms..."
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
                  ? (isDarkMode ? "bg-emerald-600" : "bg-emerald-500")
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
    </KeyboardAvoidingView>
  );
}