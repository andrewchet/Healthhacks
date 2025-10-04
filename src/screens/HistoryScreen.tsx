import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAppStore from '../state/appStore';
import usePainStore from '../state/painStore';
import { BODY_PARTS } from '../types/pain';
import TimelineView from '../components/TimelineView';
import ProgressTracker from '../components/ProgressTracker';
import TriggerAnalysis from '../components/TriggerAnalysis';
import { cn } from '../utils/cn';

const { width: screenWidth } = Dimensions.get('window');

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useAppStore();
  const { painLogs } = usePainStore();
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'all'>('week');
  const [viewMode, setViewMode] = useState<'analytics' | 'timeline' | 'progress' | 'triggers'>('analytics');

  const timeRanges = [
    { id: 'week', label: '7 Days', days: 7 },
    { id: 'month', label: '30 Days', days: 30 },
    { id: 'all', label: 'All Time', days: Infinity },
  ] as const;

  const filteredLogs = useMemo(() => {
    if (selectedTimeRange === 'all') return painLogs;
    
    const cutoffDate = new Date();
    const selectedRange = timeRanges.find(r => r.id === selectedTimeRange);
    cutoffDate.setDate(cutoffDate.getDate() - (selectedRange?.days || 7));
    
    return painLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= cutoffDate;
    });
  }, [painLogs, selectedTimeRange]);

  const analytics = useMemo(() => {
    if (filteredLogs.length === 0) {
      return {
        averagePain: 0,
        totalEntries: 0,
        mostCommonBodyPart: 'None',
        mostCommonPainType: 'None',
        painTrend: 'stable' as const,
      };
    }

    const averagePain = filteredLogs.reduce((sum, log) => sum + log.severity, 0) / filteredLogs.length;
    
    // Most common body part
    const bodyPartCounts = filteredLogs.reduce((acc, log) => {
      acc[log.bodyPart] = (acc[log.bodyPart] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostCommonBodyPart = Object.entries(bodyPartCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

    // Most common pain type
    const painTypeCounts = filteredLogs.reduce((acc, log) => {
      acc[log.painType] = (acc[log.painType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostCommonPainType = Object.entries(painTypeCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

    // Pain trend (comparing first half vs second half of logs)
    let painTrend: 'improving' | 'worsening' | 'stable' = 'stable';
    if (filteredLogs.length >= 4) {
      const midpoint = Math.floor(filteredLogs.length / 2);
      const firstHalf = filteredLogs.slice(midpoint);
      const secondHalf = filteredLogs.slice(0, midpoint);
      
      const firstHalfAvg = firstHalf.reduce((sum, log) => sum + log.severity, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, log) => sum + log.severity, 0) / secondHalf.length;
      
      const difference = secondHalfAvg - firstHalfAvg;
      if (difference > 0.5) painTrend = 'worsening';
      else if (difference < -0.5) painTrend = 'improving';
    }

    return {
      averagePain: Math.round(averagePain * 10) / 10,
      totalEntries: filteredLogs.length,
      mostCommonBodyPart,
      mostCommonPainType,
      painTrend,
    };
  }, [filteredLogs]);

  const bodyPartDisplayName = BODY_PARTS.find(
    part => part.id === analytics.mostCommonBodyPart
  )?.displayName || analytics.mostCommonBodyPart;

  const renderTimeRangeSelector = () => (
    <View className="flex-row space-x-2 mb-6">
      {timeRanges.map((range) => (
        <Pressable
          key={range.id}
          onPress={() => setSelectedTimeRange(range.id)}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl border-2",
            selectedTimeRange === range.id
              ? (isDarkMode ? "bg-emerald-600 border-emerald-500" : "bg-emerald-500 border-emerald-400")
              : (isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"),
            "active:opacity-80"
          )}
        >
          <Text className={cn(
            "text-center font-medium",
            selectedTimeRange === range.id
              ? "text-white"
              : (isDarkMode ? "text-gray-300" : "text-gray-700")
          )}>
            {range.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const renderAnalyticsCard = (title: string, value: string, icon: keyof typeof Ionicons.glyphMap, color?: string) => (
    <View className={cn(
      "flex-1 p-4 rounded-xl",
      isDarkMode ? "bg-gray-800" : "bg-white",
      "shadow-sm"
    )}>
      <View className="flex-row items-center space-x-2 mb-2">
        <Ionicons 
          name={icon} 
          size={20} 
          color={color || (isDarkMode ? "#10B981" : "#059669")} 
        />
        <Text className={cn(
          "text-sm font-medium",
          isDarkMode ? "text-gray-400" : "text-gray-600"
        )}>
          {title}
        </Text>
      </View>
      <Text className={cn(
        "text-lg font-bold",
        isDarkMode ? "text-white" : "text-gray-900"
      )}>
        {value}
      </Text>
    </View>
  );

  const renderPainLogItem = (log: typeof painLogs[0], index: number) => {
    const bodyPartInfo = BODY_PARTS.find(part => part.id === log.bodyPart);
    const severityColor = log.severity <= 3 ? '#10B981' : log.severity <= 6 ? '#F59E0B' : '#EF4444';
    
    return (
      <View
        key={log.id}
        className={cn(
          "p-4 rounded-xl mb-3",
          isDarkMode ? "bg-gray-800" : "bg-white",
          "shadow-sm"
        )}
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1">
            <Text className={cn(
              "text-lg font-semibold",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              {bodyPartInfo?.displayName || log.bodyPart}
            </Text>
            <Text className={cn(
              "text-sm capitalize",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}>
              {log.painType} • {log.cause.replace('_', ' ')}
            </Text>
          </View>
          <View className="items-end">
            <View 
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: severityColor }}
            >
              <Text className="text-white text-sm font-semibold">
                {log.severity}/10
              </Text>
            </View>
            <Text className={cn(
              "text-xs mt-1",
              isDarkMode ? "text-gray-400" : "text-gray-500"
            )}>
              {new Date(log.date).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Tags */}
        {log.tags && log.tags.length > 0 && (
          <View className="flex-row flex-wrap mt-2">
            {log.tags.slice(0, 3).map((tag, index) => (
              <View
                key={index}
                className={cn(
                  "px-2 py-1 rounded-full mr-2 mb-1",
                  isDarkMode ? "bg-gray-700" : "bg-gray-100"
                )}
              >
                <Text className={cn(
                  "text-xs",
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                )}>
                  {tag}
                </Text>
              </View>
            ))}
            {log.tags.length > 3 && (
              <Text className={cn(
                "text-xs self-center",
                isDarkMode ? "text-gray-400" : "text-gray-500"
              )}>
                +{log.tags.length - 3} more
              </Text>
            )}
          </View>
        )}

        {/* Photos indicator */}
        {log.photos && log.photos.length > 0 && (
          <View className="flex-row items-center mt-2">
            <Ionicons 
              name="camera" 
              size={16} 
              color={isDarkMode ? "#9CA3AF" : "#6B7280"} 
            />
            <Text className={cn(
              "text-sm ml-2",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}>
              {log.photos.length} photo{log.photos.length > 1 ? 's' : ''} attached
            </Text>
          </View>
        )}
        
        {log.description && (
          <Text className={cn(
            "text-sm mt-2",
            isDarkMode ? "text-gray-300" : "text-gray-700"
          )}>
            {log.description}
          </Text>
        )}
      </View>
    );
  };

  const getTrendIcon = () => {
    switch (analytics.painTrend) {
      case 'improving': return 'trending-down';
      case 'worsening': return 'trending-up';
      default: return 'remove';
    }
  };

  const getTrendColor = () => {
    switch (analytics.painTrend) {
      case 'improving': return '#10B981';
      case 'worsening': return '#EF4444';
      default: return isDarkMode ? '#6B7280' : '#9CA3AF';
    }
  };

  return (
    <View 
      className={cn(
        "flex-1",
        isDarkMode ? "bg-gray-900" : "bg-gray-50"
      )}
    >
      <ScrollView 
        className="flex-1 px-4" 
        style={{ paddingTop: insets.top + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-8">
          <Text className={cn(
            "text-3xl font-bold mb-2",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Pain History
          </Text>
          <Text className={cn(
            "text-lg",
            isDarkMode ? "text-gray-300" : "text-gray-600"
          )}>
            Track your progress and identify patterns
          </Text>
        </View>

        {/* View Mode Selector */}
        <View className="flex-row space-x-1 mb-4">
          <Pressable
            onPress={() => setViewMode('analytics')}
            className={cn(
              "flex-1 py-2 px-1 rounded-xl border-2",
              viewMode === 'analytics'
                ? (isDarkMode ? "bg-emerald-600 border-emerald-500" : "bg-emerald-500 border-emerald-400")
                : (isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"),
              "active:opacity-80"
            )}
          >
            <Text className={cn(
              "text-center font-medium text-xs",
              viewMode === 'analytics'
                ? "text-white"
                : (isDarkMode ? "text-gray-300" : "text-gray-700")
            )}>
              Analytics
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setViewMode('progress')}
            className={cn(
              "flex-1 py-2 px-1 rounded-xl border-2",
              viewMode === 'progress'
                ? (isDarkMode ? "bg-emerald-600 border-emerald-500" : "bg-emerald-500 border-emerald-400")
                : (isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"),
              "active:opacity-80"
            )}
          >
            <Text className={cn(
              "text-center font-medium text-xs",
              viewMode === 'progress'
                ? "text-white"
                : (isDarkMode ? "text-gray-300" : "text-gray-700")
            )}>
              Progress
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setViewMode('triggers')}
            className={cn(
              "flex-1 py-2 px-1 rounded-xl border-2",
              viewMode === 'triggers'
                ? (isDarkMode ? "bg-emerald-600 border-emerald-500" : "bg-emerald-500 border-emerald-400")
                : (isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"),
              "active:opacity-80"
            )}
          >
            <Text className={cn(
              "text-center font-medium text-xs",
              viewMode === 'triggers'
                ? "text-white"
                : (isDarkMode ? "text-gray-300" : "text-gray-700")
            )}>
              Triggers
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setViewMode('timeline')}
            className={cn(
              "flex-1 py-2 px-1 rounded-xl border-2",
              viewMode === 'timeline'
                ? (isDarkMode ? "bg-emerald-600 border-emerald-500" : "bg-emerald-500 border-emerald-400")
                : (isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"),
              "active:opacity-80"
            )}
          >
            <Text className={cn(
              "text-center font-medium text-xs",
              viewMode === 'timeline'
                ? "text-white"
                : (isDarkMode ? "text-gray-300" : "text-gray-700")
            )}>
              Timeline
            </Text>
          </Pressable>
        </View>

        {/* Time Range Selector */}
        {renderTimeRangeSelector()}

        {filteredLogs.length === 0 ? (
          <View className={cn(
            "p-8 rounded-xl items-center",
            isDarkMode ? "bg-gray-800" : "bg-white"
          )}>
            <Ionicons 
              name="bar-chart-outline" 
              size={48} 
              color={isDarkMode ? "#6B7280" : "#9CA3AF"} 
            />
            <Text className={cn(
              "text-lg font-semibold mt-4 mb-2",
              isDarkMode ? "text-gray-300" : "text-gray-700"
            )}>
              No pain logs yet
            </Text>
            <Text className={cn(
              "text-center",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}>
              Start tracking your pain to see analytics and trends here
            </Text>
          </View>
        ) : viewMode === 'timeline' ? (
          <TimelineView painLogs={filteredLogs} />
        ) : viewMode === 'progress' ? (
          <ProgressTracker painLogs={filteredLogs} />
        ) : viewMode === 'triggers' ? (
          <TriggerAnalysis painLogs={filteredLogs} />
        ) : (
          <>
            {/* Analytics Cards */}
            <View className="space-y-4 mb-8">
              <View className="flex-row space-x-3">
                {renderAnalyticsCard(
                  'Total Entries',
                  analytics.totalEntries.toString(),
                  'list'
                )}
                {renderAnalyticsCard(
                  'Average Pain',
                  `${analytics.averagePain}/10`,
                  'pulse',
                  analytics.averagePain <= 3 ? '#10B981' : analytics.averagePain <= 6 ? '#F59E0B' : '#EF4444'
                )}
              </View>
              
              <View className="flex-row space-x-3">
                {renderAnalyticsCard(
                  'Most Common Area',
                  bodyPartDisplayName,
                  'body'
                )}
                {renderAnalyticsCard(
                  'Pain Trend',
                  analytics.painTrend,
                  getTrendIcon(),
                  getTrendColor()
                )}
              </View>
            </View>

            {/* Recent Logs */}
            <View className="mb-8">
              <Text className={cn(
                "text-xl font-bold mb-4",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>
                Recent Entries
              </Text>
              {filteredLogs.slice(0, 10).map(renderPainLogItem)}
              
              {filteredLogs.length > 10 && (
                <Text className={cn(
                  "text-center mt-4",
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                )}>
                  Showing latest 10 entries out of {filteredLogs.length} total
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}