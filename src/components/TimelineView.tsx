import React from 'react';
import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PainLog, BODY_PARTS } from '../types/pain';
import useAppStore from '../state/appStore';
import { cn } from '../utils/cn';

const { width: screenWidth } = Dimensions.get('window');

interface TimelineViewProps {
  painLogs: PainLog[];
  onLogPress?: (log: PainLog) => void;
}

export default function TimelineView({ painLogs, onLogPress }: TimelineViewProps) {
  const { isDarkMode } = useAppStore();

  if (painLogs.length === 0) {
    return (
      <View className={cn(
        "p-8 rounded-xl items-center",
        isDarkMode ? "bg-gray-800" : "bg-white"
      )}>
        <Ionicons 
          name="time-outline" 
          size={48} 
          color={isDarkMode ? "#6B7280" : "#9CA3AF"} 
        />
        <Text className={cn(
          "text-lg font-semibold mt-4 mb-2",
          isDarkMode ? "text-gray-300" : "text-gray-700"
        )}>
          No timeline data
        </Text>
        <Text className={cn(
          "text-center",
          isDarkMode ? "text-gray-400" : "text-gray-600"
        )}>
          Add more pain logs to see your timeline
        </Text>
      </View>
    );
  }

  // Sort logs by date (newest first)
  const sortedLogs = [...painLogs].sort((a, b) => 
    new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime()
  );

  // Group logs by date
  const groupedLogs = sortedLogs.reduce((groups, log) => {
    const date = log.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(log);
    return groups;
  }, {} as Record<string, PainLog[]>);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 3) return '#10B981'; // Green
    if (severity <= 6) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const renderTimelineEntry = (log: PainLog) => {
    const bodyPartInfo = BODY_PARTS.find(part => part.id === log.bodyPart);
    const severityColor = getSeverityColor(log.severity);

    return (
      <Pressable
        key={log.id}
        onPress={() => onLogPress?.(log)}
        className={cn(
          "mr-4 w-48 p-3 rounded-xl border",
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200",
          "active:opacity-70"
        )}
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1">
            <Text className={cn(
              "font-semibold",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              {bodyPartInfo?.displayName || log.bodyPart}
            </Text>
            <Text className={cn(
              "text-xs capitalize",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}>
              {log.painType} • {log.time}
            </Text>
          </View>
          <View 
            className="px-2 py-1 rounded-full"
            style={{ backgroundColor: severityColor }}
          >
            <Text className="text-white text-xs font-bold">
              {log.severity}
            </Text>
          </View>
        </View>

        {log.tags && log.tags.length > 0 && (
          <View className="flex-row flex-wrap mb-2">
            {log.tags.slice(0, 2).map((tag, index) => (
              <View
                key={index}
                className={cn(
                  "px-2 py-1 rounded-full mr-1 mb-1",
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
            {log.tags.length > 2 && (
              <Text className={cn(
                "text-xs",
                isDarkMode ? "text-gray-400" : "text-gray-500"
              )}>
                +{log.tags.length - 2}
              </Text>
            )}
          </View>
        )}

        {log.photos && log.photos.length > 0 && (
          <View className="flex-row items-center mt-1">
            <Ionicons 
              name="camera" 
              size={12} 
              color={isDarkMode ? "#9CA3AF" : "#6B7280"} 
            />
            <Text className={cn(
              "text-xs ml-1",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}>
              {log.photos.length} photo{log.photos.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  const renderDateGroup = (date: string, logs: PainLog[]) => (
    <View key={date} className="mb-6">
      {/* Date Header */}
      <View className="flex-row items-center mb-3">
        <View className={cn(
          "w-3 h-3 rounded-full mr-3",
          isDarkMode ? "bg-emerald-500" : "bg-emerald-600"
        )} />
        <Text className={cn(
          "text-lg font-semibold",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          {formatDate(date)}
        </Text>
        <Text className={cn(
          "text-sm ml-2",
          isDarkMode ? "text-gray-400" : "text-gray-600"
        )}>
          ({logs.length} {logs.length === 1 ? 'entry' : 'entries'})
        </Text>
      </View>

      {/* Timeline Entries */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="ml-6"
      >
        <View className="flex-row">
          {logs.map(renderTimelineEntry)}
        </View>
      </ScrollView>

      {/* Connecting Line */}
      <View className={cn(
        "w-0.5 h-6 ml-5 mt-2",
        isDarkMode ? "bg-gray-700" : "bg-gray-300"
      )} />
    </View>
  );

  return (
    <View>
      <View className="flex-row items-center justify-between mb-4">
        <Text className={cn(
          "text-xl font-bold",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          Pain Timeline
        </Text>
        <Ionicons 
          name="time" 
          size={24} 
          color={isDarkMode ? "#10B981" : "#059669"} 
        />
      </View>

      <Text className={cn(
        "text-sm mb-6",
        isDarkMode ? "text-gray-400" : "text-gray-600"
      )}>
        Scroll horizontally to see all entries for each day
      </Text>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        className="max-h-96"
      >
        {Object.entries(groupedLogs).map(([date, logs]) => 
          renderDateGroup(date, logs)
        )}
      </ScrollView>
    </View>
  );
}