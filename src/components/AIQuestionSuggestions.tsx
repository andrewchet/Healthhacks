import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProviderSummaryReport } from '../utils/providerAnalytics';
import { getOpenAIChatResponse } from '../api/chat-service';
import useAppStore from '../state/appStore';
import { cn } from '../utils/cn';

interface AIQuestionSuggestionsProps {
  report: ProviderSummaryReport;
  onQuestionSelect?: (question: string) => void;
}

interface SuggestedQuestion {
  id: string;
  question: string;
  category: 'assessment' | 'treatment' | 'lifestyle' | 'followup';
  rationale: string;
}

export default function AIQuestionSuggestions({ 
  report, 
  onQuestionSelect 
}: AIQuestionSuggestionsProps) {
  const { isDarkMode } = useAppStore();
  const [suggestions, setSuggestions] = useState<SuggestedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (report.painSummary.totalEntries > 0) {
      generateSuggestions();
    }
  }, [report]);

  const generateSuggestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const prompt = createAnalysisPrompt(report);
      const response = await getOpenAIChatResponse(prompt);
      
      const suggestions = parseSuggestions(response.content);
      setSuggestions(suggestions);
    } catch (err) {
      console.error('Error generating suggestions:', err);
      setError('Unable to generate suggestions at this time');
      // Fallback to rule-based suggestions
      setSuggestions(generateRuleBasedSuggestions(report));
    } finally {
      setIsLoading(false);
    }
  };

  const createAnalysisPrompt = (report: ProviderSummaryReport): string => {
    const criticalSymptoms = report.flaggedSymptoms
      .filter(s => s.severity === 'severe')
      .map(s => s.keyword)
      .join(', ');

    const bodyPartName = report.painSummary.mostAffectedArea;
    const avgPain = report.painSummary.averagePain;
    const urgencyLevel = report.urgencyAssessment.level;

    return `As a healthcare provider, I need to generate 4-6 specific, clinically relevant questions to ask a patient based on their pain tracking data. 

Patient Summary:
- Primary complaint: ${report.painSummary.dominantPainType} pain in ${bodyPartName}
- Average pain level: ${avgPain}/10 over ${report.dateRange.totalDays} days
- Urgency level: ${urgencyLevel}
- Critical symptoms: ${criticalSymptoms || 'None'}
- Peak pain episodes: ${report.painSummary.peakPainDates.length}

Generate 4-6 questions in this exact format:
CATEGORY: [assessment/treatment/lifestyle/followup]
QUESTION: [specific question to ask patient]
RATIONALE: [why this question is important based on their data]

Focus on:
1. Clarifying concerning symptoms or patterns
2. Understanding functional impact
3. Medication/treatment effectiveness
4. Lifestyle factors
5. Need for specialist referral

Make questions specific to their data patterns, not generic. Each question should be directly motivated by something in their pain logs.`;
  };

  const parseSuggestions = (content: string): SuggestedQuestion[] => {
    const suggestions: SuggestedQuestion[] = [];
    const sections = content.split(/CATEGORY:/i).slice(1);

    sections.forEach((section, index) => {
      const lines = section.trim().split('\n');
      const category = lines[0]?.trim().toLowerCase() as SuggestedQuestion['category'];
      
      const questionLine = lines.find(line => line.toLowerCase().startsWith('question:'));
      const rationaleLine = lines.find(line => line.toLowerCase().startsWith('rationale:'));

      if (questionLine && rationaleLine) {
        suggestions.push({
          id: `ai-${index}`,
          question: questionLine.replace(/^question:\s*/i, '').trim(),
          category: ['assessment', 'treatment', 'lifestyle', 'followup'].includes(category) 
            ? category as SuggestedQuestion['category']
            : 'assessment',
          rationale: rationaleLine.replace(/^rationale:\s*/i, '').trim()
        });
      }
    });

    return suggestions.slice(0, 6); // Limit to 6 suggestions
  };

  const generateRuleBasedSuggestions = (report: ProviderSummaryReport): SuggestedQuestion[] => {
    const suggestions: SuggestedQuestion[] = [];

    // High pain levels
    if (report.painSummary.averagePain >= 7) {
      suggestions.push({
        id: 'rule-1',
        question: "On a scale of 1-10, how much is your current pain interfering with your daily activities and sleep?",
        category: 'assessment',
        rationale: 'High average pain levels suggest significant functional impact'
      });
    }

    // Critical symptoms
    const criticalSymptoms = report.flaggedSymptoms.filter(s => s.severity === 'severe');
    if (criticalSymptoms.length > 0) {
      suggestions.push({
        id: 'rule-2',
        question: `You mentioned experiencing ${criticalSymptoms[0].keyword}. Can you describe exactly when this occurs and how long it lasts?`,
        category: 'assessment',
        rationale: 'Critical symptoms require detailed characterization for proper evaluation'
      });
    }

    // Peak periods
    if (report.peakSymptomPeriods.length > 0) {
      suggestions.push({
        id: 'rule-3',
        question: "What activities or situations seem to trigger your worst pain episodes?",
        category: 'lifestyle',
        rationale: 'Multiple peak pain periods suggest identifiable triggers'
      });
    }

    // Treatment effectiveness
    suggestions.push({
      id: 'rule-4',
      question: "What pain relief methods have you tried, and which ones work best for you?",
      category: 'treatment',
      rationale: 'Understanding current treatment response guides optimization'
    });

    return suggestions;
  };

  const getCategoryIcon = (category: SuggestedQuestion['category']) => {
    switch (category) {
      case 'assessment': return 'medical';
      case 'treatment': return 'bandage';
      case 'lifestyle': return 'fitness';
      case 'followup': return 'calendar';
      default: return 'help-circle';
    }
  };

  const getCategoryColor = (category: SuggestedQuestion['category']) => {
    switch (category) {
      case 'assessment': return isDarkMode ? '#EF4444' : '#DC2626';
      case 'treatment': return isDarkMode ? '#10B981' : '#059669';
      case 'lifestyle': return isDarkMode ? '#F59E0B' : '#D97706';
      case 'followup': return isDarkMode ? '#3B82F6' : '#2563EB';
      default: return isDarkMode ? '#6B7280' : '#9CA3AF';
    }
  };

  if (!report.painSummary.totalEntries) {
    return null;
  }

  return (
    <View className={cn(
      "p-4 rounded-xl",
      isDarkMode ? "bg-gray-800" : "bg-white"
    )}>
      <Pressable
        onPress={() => setExpanded(!expanded)}
        className="flex-row items-center justify-between mb-3"
      >
        <View className="flex-row items-center space-x-2">
          <Ionicons 
            name="bulb" 
            size={20} 
            color={isDarkMode ? "#F59E0B" : "#D97706"} 
          />
          <Text className={cn(
            "text-lg font-semibold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            AI Question Suggestions
          </Text>
        </View>
        <View className="flex-row items-center space-x-2">
          {isLoading && <ActivityIndicator size="small" color={isDarkMode ? "#F59E0B" : "#D97706"} />}
          <Ionicons 
            name={expanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={isDarkMode ? "#9CA3AF" : "#6B7280"} 
          />
        </View>
      </Pressable>

      <Text className={cn(
        "text-sm mb-4",
        isDarkMode ? "text-gray-400" : "text-gray-600"
      )}>
        AI-generated questions based on patient's pain patterns and concerning symptoms
      </Text>

      {expanded && (
        <>
          {error ? (
            <View className={cn(
              "p-3 rounded-lg mb-3",
              isDarkMode ? "bg-red-900/30" : "bg-red-50"
            )}>
              <Text className={cn(
                "text-sm",
                isDarkMode ? "text-red-300" : "text-red-600"
              )}>
                {error}
              </Text>
            </View>
          ) : isLoading ? (
            <View className="items-center py-6">
              <ActivityIndicator size="large" color={isDarkMode ? "#F59E0B" : "#D97706"} />
              <Text className={cn(
                "text-sm mt-2",
                isDarkMode ? "text-gray-400" : "text-gray-600"
              )}>
                Analyzing patient data...
              </Text>
            </View>
          ) : (
            <ScrollView className="max-h-96">
              <View className="space-y-3">
                {suggestions.map((suggestion) => (
                  <Pressable
                    key={suggestion.id}
                    onPress={() => onQuestionSelect?.(suggestion.question)}
                    className={cn(
                      "p-3 rounded-lg border-l-4",
                      isDarkMode ? "bg-gray-700" : "bg-gray-50",
                      "active:opacity-70"
                    )}
                    style={{ borderLeftColor: getCategoryColor(suggestion.category) }}
                  >
                    <View className="flex-row items-start space-x-3">
                      <View className={cn(
                        "w-8 h-8 rounded-full items-center justify-center mt-1"
                      )} style={{ backgroundColor: getCategoryColor(suggestion.category) + '20' }}>
                        <Ionicons 
                          name={getCategoryIcon(suggestion.category)} 
                          size={16} 
                          color={getCategoryColor(suggestion.category)} 
                        />
                      </View>
                      
                      <View className="flex-1">
                        <View className="flex-row items-center space-x-2 mb-1">
                          <Text className={cn(
                            "text-xs font-medium uppercase",
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          )} style={{ color: getCategoryColor(suggestion.category) }}>
                            {suggestion.category}
                          </Text>
                        </View>
                        
                        <Text className={cn(
                          "text-sm font-medium mb-2",
                          isDarkMode ? "text-white" : "text-gray-900"
                        )}>
                          "{suggestion.question}"
                        </Text>
                        
                        <Text className={cn(
                          "text-xs",
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        )}>
                          💡 {suggestion.rationale}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}

          {!isLoading && !error && suggestions.length > 0 && (
            <Pressable
              onPress={generateSuggestions}
              className={cn(
                "mt-4 p-3 rounded-lg flex-row items-center justify-center space-x-2",
                isDarkMode ? "bg-gray-700" : "bg-gray-100",
                "active:opacity-70"
              )}
            >
              <Ionicons 
                name="refresh" 
                size={16} 
                color={isDarkMode ? "#F59E0B" : "#D97706"} 
              />
              <Text className={cn(
                "text-sm font-medium",
                isDarkMode ? "text-gray-300" : "text-gray-700"
              )}>
                Generate New Suggestions
              </Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}