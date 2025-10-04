import React from 'react';
import { View, Text, ScrollView, Dimensions, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PainLog, BODY_PARTS } from '../types/pain';
import useAppStore from '../state/appStore';
import { cn } from '../utils/cn';

const { width: screenWidth } = Dimensions.get('window');

interface ProviderTimelineProps {
  painLogs: PainLog[];
  onDatePress?: (date: string, logs: PainLog[]) => void;
}

export default function ProviderTimeline({ painLogs, onDatePress }: ProviderTimelineProps) {
  const { isDarkMode } = useAppStore();

  // Generate last 30 days
  const generateCalendar = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        isToday: i === 0,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      });
    }
    
    return days;
  };

  const calendar = generateCalendar();

  // Get pain data for each day
  const getDayData = (dateString: string) => {
    const dayLogs = painLogs.filter(log => log.date === dateString);
    
    if (dayLogs.length === 0) {
      return { severity: 0, count: 0, color: isDarkMode ? '#374151' : '#F3F4F6' };
    }

    const avgSeverity = dayLogs.reduce((sum, log) => sum + log.severity, 0) / dayLogs.length;
    const maxSeverity = Math.max(...dayLogs.map(log => log.severity));
    
    let color;
    if (maxSeverity >= 8) {
      color = '#DC2626'; // Red - Severe
    } else if (maxSeverity >= 6) {
      color = '#EA580C'; // Orange - High
    } else if (maxSeverity >= 4) {
      color = '#D97706'; // Yellow - Moderate
    } else if (maxSeverity >= 2) {
      color = '#65A30D'; // Light Green - Mild
    } else {
      color = '#16A34A'; // Green - Minimal
    }

    return {
      severity: avgSeverity,
      maxSeverity,
      count: dayLogs.length,
      color,
      logs: dayLogs
    };
  };

  const getSeverityLabel = (severity: number) => {
    if (severity >= 8) return 'Severe';
    if (severity >= 6) return 'High';
    if (severity >= 4) return 'Moderate';
    if (severity >= 2) return 'Mild';
    return 'Minimal';
  };

  const renderDay = (day: any) => {
    const dayData = getDayData(day.date);
    
    return (
      <Pressable
        key={day.date}
        onPress={() => onDatePress?.(day.date, dayData.logs || [])}
        className={cn(
          "items-center p-2 rounded-lg mx-1 mb-2 min-w-[40px]",
          day.isToday && "border-2 border-blue-500",
          "active:opacity-70"
        )}
      >
        <Text className={cn(
          "text-xs font-medium mb-1",
          day.isWeekend 
            ? (isDarkMode ? "text-gray-400" : "text-gray-500")
            : (isDarkMode ? "text-white" : "text-gray-900")
        )}>
          {day.dayName}
        </Text>
        
        <View
          className="w-8 h-8 rounded-full items-center justify-center mb-1"
          style={{ backgroundColor: dayData.color }}
        >
          <Text className={cn(
            "text-xs font-bold",
            dayData.severity > 0 ? "text-white" : (isDarkMode ? "text-gray-600" : "text-gray-400")
          )}>
            {day.dayNumber}
          </Text>
        </View>
        
        {dayData.count > 0 && (
          <View className="flex-row items-center">
            <View className="w-1 h-1 bg-blue-500 rounded-full mr-1" />
            <Text className={cn(
              "text-xs",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}>
              {dayData.count}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  // Get weekly summary
  const getWeeklyTrends = () => {
    const weeks = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = 7 * i;
      const weekEnd = Math.min(7 * (i + 1), calendar.length);
      const weekDays = calendar.slice(weekStart, weekEnd);
      
      const weekLogs = weekDays.flatMap(day => 
        painLogs.filter(log => log.date === day.date)
      );
      
      if (weekLogs.length > 0) {
        const avgSeverity = weekLogs.reduce((sum, log) => sum + log.severity, 0) / weekLogs.length;
        weeks.push({
          label: `Week ${4 - i}`,
          severity: avgSeverity,
          count: weekLogs.length
        });
      }
    }
    
    return weeks.reverse();
  };

  const weeklyTrends = getWeeklyTrends();

  return (
    <View className="space-y-4">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <Text className={cn(
          "text-lg font-bold",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          Pain Timeline (30 Days)
        </Text>
        <View className="flex-row items-center space-x-2">
          <View className="flex-row items-center space-x-1">
            <View className="w-3 h-3 rounded-full bg-red-600" />
            <Text className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>
              Severe
            </Text>
          </View>
          <View className="flex-row items-center space-x-1">
            <View className="w-3 h-3 rounded-full bg-green-600" />
            <Text className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>
              Mild
            </Text>
          </View>
        </View>
      </View>

      {/* Calendar Grid */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="flex-1"
      >
        <View className="flex-row">
          {calendar.map(renderDay)}
        </View>
      </ScrollView>

      {/* Weekly Trends */}
      {weeklyTrends.length > 0 && (
        <View className={cn(
          "p-4 rounded-xl",
          isDarkMode ? "bg-gray-800" : "bg-white"
        )}>
          <Text className={cn(
            "text-sm font-semibold mb-3",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Weekly Trends
          </Text>
          <View className="space-y-2">
            {weeklyTrends.map((week, index) => (
              <View key={index} className="flex-row items-center justify-between">
                <Text className={cn(
                  "text-sm",
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                )}>
                  {week.label}
                </Text>
                <View className="flex-row items-center space-x-2">
                  <Text className={cn(
                    "text-sm",
                    isDarkMode ? "text-white" : "text-gray-900"
                  )}>
                    {week.severity.toFixed(1)}/10
                  </Text>
                  <Text className={cn(
                    "text-xs",
                    isDarkMode ? "text-gray-500" : "text-gray-500"
                  )}>
                    ({week.count} entries)
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Legend */}
      <View className={cn(
        "p-3 rounded-xl",
        isDarkMode ? "bg-gray-800" : "bg-white"
      )}>
        <Text className={cn(
          "text-sm font-medium mb-2",
          isDarkMode ? "text-gray-300" : "text-gray-700"
        )}>
          Timeline Guide:
        </Text>
        <Text className={cn(
          "text-xs leading-relaxed",
          isDarkMode ? "text-gray-400" : "text-gray-600"
        )}>
          • Each circle represents a day{'\n'}
          • Color intensity shows pain severity{'\n'}
          • Blue dot indicates number of pain logs{'\n'}
          • Tap any day to see detailed entries
        </Text>
      </View>
    </View>
  );
}