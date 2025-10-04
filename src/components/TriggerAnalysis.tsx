import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PainLog } from '../types/pain';
import useAppStore from '../state/appStore';
import { cn } from '../utils/cn';

interface TriggerAnalysisProps {
  painLogs: PainLog[];
}

interface TriggerCorrelation {
  tag: string;
  averagePain: number;
  count: number;
  correlation: 'high' | 'medium' | 'low';
  insight: string;
}

export default function TriggerAnalysis({ painLogs }: TriggerAnalysisProps) {
  const { isDarkMode } = useAppStore();

  const triggerCorrelations = useMemo(() => {
    if (painLogs.length === 0) return [];

    // Get all tags and their associated pain levels
    const tagData: Record<string, number[]> = {};
    const overallPainLevels: number[] = [];

    painLogs.forEach(log => {
      overallPainLevels.push(log.severity);
      if (log.tags) {
        log.tags.forEach(tag => {
          if (!tagData[tag]) {
            tagData[tag] = [];
          }
          tagData[tag].push(log.severity);
        });
      }
    });

    const overallAverage = overallPainLevels.reduce((sum, pain) => sum + pain, 0) / overallPainLevels.length;

    // Calculate correlations
    const correlations: TriggerCorrelation[] = [];

    Object.entries(tagData).forEach(([tag, painLevels]) => {
      if (painLevels.length >= 2) { // Need at least 2 data points
        const tagAverage = painLevels.reduce((sum, pain) => sum + pain, 0) / painLevels.length;
        const difference = tagAverage - overallAverage;
        
        let correlation: 'high' | 'medium' | 'low' = 'low';
        let insight = '';

        if (Math.abs(difference) >= 2) {
          correlation = 'high';
          insight = difference > 0 
            ? `Strong pain trigger - ${difference.toFixed(1)} points above average`
            : `Pain reliever - ${Math.abs(difference).toFixed(1)} points below average`;
        } else if (Math.abs(difference) >= 1) {
          correlation = 'medium';
          insight = difference > 0 
            ? `Moderate pain trigger - ${difference.toFixed(1)} points above average`
            : `Mild pain reliever - ${Math.abs(difference).toFixed(1)} points below average`;
        } else {
          correlation = 'low';
          insight = 'No significant correlation with pain levels';
        }

        correlations.push({
          tag,
          averagePain: tagAverage,
          count: painLevels.length,
          correlation,
          insight
        });
      }
    });

    // Sort by correlation strength and difference from average
    return correlations.sort((a, b) => {
      const correlationOrder = { high: 3, medium: 2, low: 1 };
      const aDiff = Math.abs(a.averagePain - overallAverage);
      const bDiff = Math.abs(b.averagePain - overallAverage);
      
      if (correlationOrder[a.correlation] !== correlationOrder[b.correlation]) {
        return correlationOrder[b.correlation] - correlationOrder[a.correlation];
      }
      
      return bDiff - aDiff;
    });
  }, [painLogs]);

  const getCorrelationColor = (correlation: string, averagePain: number, overallAverage: number) => {
    const difference = averagePain - overallAverage;
    
    if (correlation === 'high') {
      return difference > 0 ? '#DC2626' : '#059669'; // Red for triggers, green for relievers
    } else if (correlation === 'medium') {
      return difference > 0 ? '#EA580C' : '#16A34A'; // Orange/light green
    } else {
      return isDarkMode ? '#6B7280' : '#9CA3AF'; // Gray for low correlation
    }
  };

  const getCorrelationIcon = (correlation: string, averagePain: number, overallAverage: number): keyof typeof Ionicons.glyphMap => {
    const difference = averagePain - overallAverage;
    
    if (correlation === 'high') {
      return difference > 0 ? 'warning' : 'checkmark-circle';
    } else if (correlation === 'medium') {
      return difference > 0 ? 'alert' : 'thumbs-up';
    } else {
      return 'remove-circle';
    }
  };

  if (painLogs.length === 0 || triggerCorrelations.length === 0) {
    return (
      <View className={cn(
        "p-6 rounded-xl items-center",
        isDarkMode ? "bg-gray-800" : "bg-white"
      )}>
        <Ionicons 
          name="analytics-outline" 
          size={48} 
          color={isDarkMode ? "#6B7280" : "#9CA3AF"} 
        />
        <Text className={cn(
          "text-lg font-semibold mt-4 mb-2",
          isDarkMode ? "text-gray-300" : "text-gray-700"
        )}>
          {painLogs.length === 0 ? 'No Pain Data' : 'Not Enough Tag Data'}
        </Text>
        <Text className={cn(
          "text-center",
          isDarkMode ? "text-gray-400" : "text-gray-600"
        )}>
          {painLogs.length === 0 
            ? 'Start logging pain with tags to see trigger analysis'
            : 'Add more tags to your pain logs to identify patterns and triggers'
          }
        </Text>
      </View>
    );
  }

  const overallAverage = painLogs.reduce((sum, log) => sum + log.severity, 0) / painLogs.length;

  return (
    <View className="space-y-4">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <Text className={cn(
          "text-xl font-bold",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          Trigger Analysis
        </Text>
        <Ionicons 
          name="analytics" 
          size={24} 
          color={isDarkMode ? "#10B981" : "#059669"} 
        />
      </View>

      {/* Overall Average */}
      <View className={cn(
        "p-3 rounded-xl",
        isDarkMode ? "bg-blue-900/30" : "bg-blue-50"
      )}>
        <Text className={cn(
          "text-center",
          isDarkMode ? "text-blue-200" : "text-blue-600"
        )}>
          Your overall average pain level is <Text className="font-bold">{overallAverage.toFixed(1)}/10</Text>
        </Text>
      </View>

      {/* Top Triggers and Relievers */}
      <View className="space-y-3">
        <Text className={cn(
          "text-lg font-semibold",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          Key Patterns Found:
        </Text>

        <ScrollView className="max-h-80">
          {triggerCorrelations.slice(0, 10).map((trigger, index) => (
            <View
              key={trigger.tag}
              className={cn(
                "p-4 rounded-xl mb-3",
                isDarkMode ? "bg-gray-800" : "bg-white",
                "border-l-4"
              )}
              style={{
                borderLeftColor: getCorrelationColor(trigger.correlation, trigger.averagePain, overallAverage)
              }}
            >
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-1">
                  <View className="flex-row items-center space-x-2 mb-1">
                    <Ionicons 
                      name={getCorrelationIcon(trigger.correlation, trigger.averagePain, overallAverage)}
                      size={16} 
                      color={getCorrelationColor(trigger.correlation, trigger.averagePain, overallAverage)}
                    />
                    <Text className={cn(
                      "text-lg font-semibold",
                      isDarkMode ? "text-white" : "text-gray-900"
                    )}>
                      {trigger.tag}
                    </Text>
                    <View className={cn(
                      "px-2 py-1 rounded-full",
                      trigger.correlation === 'high' ? "bg-red-100" :
                      trigger.correlation === 'medium' ? "bg-yellow-100" : "bg-gray-100"
                    )}>
                      <Text className={cn(
                        "text-xs font-medium uppercase",
                        trigger.correlation === 'high' ? "text-red-700" :
                        trigger.correlation === 'medium' ? "text-yellow-700" : "text-gray-700"
                      )}>
                        {trigger.correlation}
                      </Text>
                    </View>
                  </View>
                  
                  <Text className={cn(
                    "text-sm mb-2",
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    {trigger.insight}
                  </Text>
                  
                  <View className="flex-row items-center space-x-4">
                    <Text className={cn(
                      "text-sm",
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    )}>
                      Avg Pain: <Text className="font-semibold">{trigger.averagePain.toFixed(1)}/10</Text>
                    </Text>
                    <Text className={cn(
                      "text-sm",
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    )}>
                      Occurrences: <Text className="font-semibold">{trigger.count}</Text>
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Actionable Insights */}
      <View className={cn(
        "p-4 rounded-xl",
        isDarkMode ? "bg-emerald-900/30" : "bg-emerald-50"
      )}>
        <View className="flex-row items-center space-x-2 mb-3">
          <Ionicons 
            name="bulb" 
            size={20} 
            color={isDarkMode ? "#10B981" : "#059669"} 
          />
          <Text className={cn(
            "text-lg font-semibold",
            isDarkMode ? "text-emerald-300" : "text-emerald-700"
          )}>
            Actionable Insights
          </Text>
        </View>
        
        <View className="space-y-2">
          {triggerCorrelations
            .filter(t => t.correlation === 'high' || t.correlation === 'medium')
            .slice(0, 3)
            .map((trigger, index) => {
              const isTrigger = trigger.averagePain > overallAverage;
              return (
                <Text 
                  key={index}
                  className={cn(
                    "text-sm",
                    isDarkMode ? "text-emerald-200" : "text-emerald-600"
                  )}
                >
                  • {isTrigger 
                    ? `Consider avoiding or modifying "${trigger.tag}" activities`
                    : `"${trigger.tag}" seems to help - consider doing this more often`
                  }
                </Text>
              );
            })}
          
          {triggerCorrelations.filter(t => t.correlation === 'high' || t.correlation === 'medium').length === 0 && (
            <Text className={cn(
              "text-sm",
              isDarkMode ? "text-emerald-200" : "text-emerald-600"
            )}>
              Keep tracking with tags to identify more patterns and triggers over time.
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}