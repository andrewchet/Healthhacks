import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PainLog, BODY_PARTS } from '../types/pain';
import useAppStore from '../state/appStore';
import { getOpenAIChatResponse } from '../api/chat-service';
import { generateDoctorReport } from '../utils/doctorExport';
import { cn } from '../utils/cn';

interface AISummaryProps {
  painLogs: PainLog[];
  patientName: string;
}

interface AISummaryData {
  naturalLanguageSummary: string;
  diagnosisAids: string[];
  riskAlerts: string[];
  smartQuestions: string[];
  redFlags: string[];
}

export default function AISummary({ painLogs, patientName }: AISummaryProps) {
  const { isDarkMode } = useAppStore();
  const [summary, setSummary] = useState<AISummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (painLogs.length > 0) {
      generateAISummary();
    }
  }, [painLogs]);

  const generateAISummary = async () => {
    if (painLogs.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const report = generateDoctorReport(painLogs);
      
      // Create comprehensive context for AI
      const context = `
Patient: ${patientName}
Total Pain Logs: ${report.summary.totalEntries}
Average Pain Level: ${report.summary.averagePain}/10
Most Common Area: ${BODY_PARTS.find(p => p.id === report.summary.mostCommonBodyPart)?.displayName || report.summary.mostCommonBodyPart}
Most Common Pain Type: ${report.summary.mostCommonPainType}
Pain Trend: ${report.summary.painTrend}

Recent Pain Logs:
${painLogs.slice(0, 10).map(log => 
  `- ${log.date}: ${BODY_PARTS.find(p => p.id === log.bodyPart)?.displayName || log.bodyPart} - ${log.painType} pain (${log.severity}/10) - ${log.cause}${log.tags ? ` - Tags: ${log.tags.join(', ')}` : ''}${log.description ? ` - Notes: ${log.description}` : ''}`
).join('\n')}

Pain Pattern Analysis:
${Object.entries(report.patterns.painByBodyPart).slice(0, 5).map(([part, count]) => 
  `- ${BODY_PARTS.find(p => p.id === part)?.displayName || part}: ${count} episodes`
).join('\n')}

Common Tags/Triggers:
${Object.entries(report.patterns.commonTags).slice(0, 5).map(([tag, count]) => 
  `- ${tag}: ${count} times`
).join('\n')}
      `;

      const prompt = `As a clinical AI assistant for healthcare providers, analyze this patient's pain data and provide a structured clinical assessment.

Patient Data:
${context}

Please provide your response in VALID JSON format with these exact keys:
{
  "naturalLanguageSummary": "Write a 2-3 sentence clinical summary describing the patient's pain pattern, triggers, and key observations in professional medical terminology",
  "diagnosisAids": ["List 3-4 potential diagnoses or differential considerations based on the pain pattern and location"],
  "riskAlerts": ["Any concerning symptoms or patterns that require immediate attention"],
  "smartQuestions": ["3-4 specific questions the provider should ask this patient during the encounter"],
  "redFlags": ["Any neurological or serious warning signs identified"]
}

IMPORTANT: 
- Return ONLY valid JSON, no additional text or formatting
- Make the naturalLanguageSummary concise but comprehensive
- Focus on actionable clinical insights
- Be appropriately cautious about definitive diagnoses`;

      const response = await getOpenAIChatResponse(prompt);
      
      try {
        // Clean the response content first
        let cleanContent = response.content.trim();
        
        // Remove markdown code blocks if present
        cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
        
        // Try to parse as JSON
        const parsedSummary = JSON.parse(cleanContent);
        setSummary(parsedSummary);
      } catch (parseError) {
        // If JSON parsing fails, try to extract just the summary text
        let cleanSummary = response.content;
        
        // Remove JSON formatting if present
        if (cleanSummary.includes('"naturalLanguageSummary"')) {
          const summaryMatch = cleanSummary.match(/"naturalLanguageSummary":\s*"([^"]+)"/);
          if (summaryMatch) {
            cleanSummary = summaryMatch[1];
          }
        }
        
        // Remove any remaining JSON artifacts
        cleanSummary = cleanSummary
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .replace(/^{.*?"naturalLanguageSummary":\s*"/g, '')
          .replace(/",.*$/g, '')
          .replace(/\\"/g, '"')
          .trim();
        
        setSummary({
          naturalLanguageSummary: cleanSummary,
          diagnosisAids: ["AI analysis available - see full response"],
          riskAlerts: [],
          smartQuestions: ["Ask about symptom progression", "Inquire about functional impact"],
          redFlags: []
        });
      }
    } catch (error) {
      console.error('AI Summary error:', error);
      setError('Failed to generate AI summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderSection = (title: string, items: string[], icon: keyof typeof Ionicons.glyphMap, color: string) => {
    if (!items || items.length === 0) return null;

    return (
      <View className="mb-4">
        <View className="flex-row items-center space-x-2 mb-2">
          <Ionicons name={icon} size={16} color={color} />
          <Text className={cn(
            "text-sm font-semibold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            {title}
          </Text>
        </View>
        {items.map((item, index) => (
          <Text 
            key={index}
            className={cn(
              "text-sm mb-1 ml-6",
              isDarkMode ? "text-gray-300" : "text-gray-700"
            )}
          >
            • {item}
          </Text>
        ))}
      </View>
    );
  };

  if (painLogs.length === 0) {
    return (
      <View className={cn(
        "p-4 rounded-xl",
        isDarkMode ? "bg-gray-800" : "bg-white"
      )}>
        <Text className={cn(
          "text-center",
          isDarkMode ? "text-gray-400" : "text-gray-600"
        )}>
          AI insights will appear when patient has pain logs
        </Text>
      </View>
    );
  }

  return (
    <View className={cn(
      "p-4 rounded-xl",
      isDarkMode ? "bg-gray-800" : "bg-white"
    )}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center space-x-2">
          <Ionicons 
            name="sparkles" 
            size={20} 
            color={isDarkMode ? "#10B981" : "#059669"} 
          />
          <Text className={cn(
            "text-lg font-semibold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            AI Clinical Insights
          </Text>
        </View>
        
        <Pressable
          onPress={generateAISummary}
          disabled={loading}
          className={cn(
            "px-3 py-2 rounded-lg",
            isDarkMode ? "bg-gray-700" : "bg-gray-100"
          )}
        >
          {loading ? (
            <ActivityIndicator size="small" color={isDarkMode ? "#10B981" : "#059669"} />
          ) : (
            <Ionicons 
              name="refresh" 
              size={16} 
              color={isDarkMode ? "#10B981" : "#059669"} 
            />
          )}
        </Pressable>
      </View>

      {loading && (
        <View className="items-center py-8">
          <ActivityIndicator size="large" color={isDarkMode ? "#10B981" : "#059669"} />
          <Text className={cn(
            "text-sm mt-2",
            isDarkMode ? "text-gray-400" : "text-gray-600"
          )}>
            Analyzing pain patterns with AI...
          </Text>
        </View>
      )}

      {error && (
        <View className={cn(
          "p-3 rounded-lg mb-4",
          isDarkMode ? "bg-red-900/30" : "bg-red-50"
        )}>
          <Text className={cn(
            "text-sm",
            isDarkMode ? "text-red-400" : "text-red-600"
          )}>
            {error}
          </Text>
        </View>
      )}

      {summary && !loading && (
        <View className="space-y-4">
          {/* Natural Language Summary */}
          <View className={cn(
            "p-4 rounded-lg",
            isDarkMode ? "bg-blue-900/30" : "bg-blue-50"
          )}>
            <View className="flex-row items-center space-x-2 mb-2">
              <Ionicons name="document-text" size={16} color={isDarkMode ? "#60A5FA" : "#3B82F6"} />
              <Text className={cn(
                "text-sm font-semibold",
                isDarkMode ? "text-blue-300" : "text-blue-700"
              )}>
                Clinical Summary
              </Text>
            </View>
            <Text className={cn(
              "text-base leading-relaxed",
              isDarkMode ? "text-blue-200" : "text-blue-600"
            )}>
              {summary.naturalLanguageSummary
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .replace(/^{[^}]*"naturalLanguageSummary":\s*"/g, '')
                .replace(/",.*$/g, '')
                .replace(/\\"/g, '"')
                .replace(/^\s*"/, '')
                .replace(/"\s*$/, '')
                .trim()}
            </Text>
          </View>

          {/* Red Flags - Most important */}
          {summary.redFlags && summary.redFlags.length > 0 && (
            <View className={cn(
              "p-4 rounded-lg border-l-4 border-red-500",
              isDarkMode ? "bg-red-900/30" : "bg-red-50"
            )}>
              {renderSection('⚠️ Red Flags - Immediate Attention', summary.redFlags, 'warning', '#EF4444')}
            </View>
          )}

          {/* Risk Alerts */}
          {renderSection('Risk Alerts', summary.riskAlerts, 'alert-circle', '#F59E0B')}

          {/* Diagnosis Aids */}
          {renderSection('Potential Diagnoses to Consider', summary.diagnosisAids, 'medical', isDarkMode ? '#10B981' : '#059669')}

          {/* Smart Questions */}
          {renderSection('Suggested Questions to Ask', summary.smartQuestions, 'help-circle', isDarkMode ? '#60A5FA' : '#3B82F6')}
        </View>
      )}

      {/* Disclaimer */}
      <View className={cn(
        "mt-4 p-3 rounded-lg",
        isDarkMode ? "bg-yellow-900/30" : "bg-yellow-50"
      )}>
        <Text className={cn(
          "text-xs",
          isDarkMode ? "text-yellow-300" : "text-yellow-700"
        )}>
          🤖 AI-generated insights for clinical reference only. Always use professional judgment and conduct appropriate examinations.
        </Text>
      </View>
    </View>
  );
}