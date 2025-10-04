import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PainLog } from '../types/pain';
import useAppStore from '../state/appStore';
import { cn } from '../utils/cn';

interface ProviderTimelineCalendarProps {
  painLogs: PainLog[];
  selectedDate?: string;
  onDateSelect?: (date: string) => void;
}

export default function ProviderTimelineCalendar({ 
  painLogs, 
  selectedDate, 
  onDateSelect 
}: ProviderTimelineCalendarProps) {
  const { isDarkMode } = useAppStore();

  const calendarData = useMemo(() => {
    // Create calendar data for last 30 days
    const today = new Date();
    const days = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Get pain logs for this date
      const dayLogs = painLogs.filter(log => log.date === dateStr);
      
      // Calculate average pain for the day
      let avgPain = 0;
      let maxPain = 0;
      if (dayLogs.length > 0) {
        avgPain = dayLogs.reduce((sum, log) => sum + log.severity, 0) / dayLogs.length;
        maxPain = Math.max(...dayLogs.map(log => log.severity));
      }
      
      days.push({
        date: dateStr,
        dayOfMonth: date.getDate(),
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: dateStr === today.toISOString().split('T')[0],
        logs: dayLogs,
        avgPain: Math.round(avgPain * 10) / 10,
        maxPain,
        hasData: dayLogs.length > 0
      });
    }
    
    return days;
  }, [painLogs]);

  const getPainColor = (avgPain: number) => {
    if (avgPain === 0) return isDarkMode ? '#374151' : '#F3F4F6'; // Gray - no data
    if (avgPain <= 3) return '#10B981'; // Green - mild
    if (avgPain <= 6) return '#F59E0B'; // Yellow - moderate  
    return '#EF4444'; // Red - severe
  };

  const getPainDotSize = (maxPain: number) => {
    if (maxPain === 0) return 4;
    if (maxPain <= 3) return 6;
    if (maxPain <= 6) return 8;
    return 10;
  };

  const renderCalendarDay = (dayData: any) => {
    const isSelected = selectedDate === dayData.date;
    const painColor = getPainColor(dayData.avgPain);
    const dotSize = getPainDotSize(dayData.maxPain);

    return (
      <Pressable
        key={dayData.date}
        onPress={() => onDateSelect?.(dayData.date)}
        className={cn(
          "items-center justify-center p-2 rounded-lg min-w-[40px] mr-1",
          isSelected 
            ? (isDarkMode ? "bg-emerald-600" : "bg-emerald-500")
            : "bg-transparent",
          "active:opacity-70"
        )}
      >
        <Text className={cn(
          "text-xs font-medium mb-1",
          isSelected 
            ? "text-white"
            : dayData.isToday 
              ? (isDarkMode ? "text-emerald-400" : "text-emerald-600")
              : (isDarkMode ? "text-gray-400" : "text-gray-600")
        )}>
          {dayData.dayOfWeek}
        </Text>
        
        <Text className={cn(
          "text-sm font-bold mb-2",
          isSelected 
            ? "text-white"
            : dayData.isToday
              ? (isDarkMode ? "text-white" : "text-gray-900")
              : (isDarkMode ? "text-white" : "text-gray-900")
        )}>
          {dayData.dayOfMonth}
        </Text>

        {/* Pain indicator dot */}
        <View 
          className="rounded-full"
          style={{
            width: dotSize,
            height: dotSize,
            backgroundColor: painColor,
          }}
        />

        {/* Multiple entries indicator */}
        {dayData.logs.length > 1 && (
          <Text className={cn(
            "text-xs mt-1",
            isSelected 
              ? "text-emerald-100"
              : (isDarkMode ? "text-gray-400" : "text-gray-500")
          )}>
            {dayData.logs.length}
          </Text>
        )}
      </Pressable>
    );
  };

  const selectedDayData = calendarData.find(day => day.date === selectedDate);

  return (
    <View className="space-y-4">
      {/* Calendar Header */}
      <View className="flex-row items-center justify-between">
        <Text className={cn(
          "text-lg font-bold",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          Pain Timeline (Last 30 Days)
        </Text>
        <View className="flex-row items-center space-x-2">
          <View className="flex-row items-center space-x-1">
            <View className="w-3 h-3 rounded-full bg-green-500" />
            <Text className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>
              Mild
            </Text>
          </View>
          <View className="flex-row items-center space-x-1">
            <View className="w-3 h-3 rounded-full bg-yellow-500" />
            <Text className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>
              Moderate
            </Text>
          </View>
          <View className="flex-row items-center space-x-1">
            <View className="w-3 h-3 rounded-full bg-red-500" />
            <Text className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>
              Severe
            </Text>
          </View>
        </View>
      </View>

      {/* Calendar Grid */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="max-h-24"
      >
        <View className="flex-row">
          {calendarData.map(renderCalendarDay)}
        </View>
      </ScrollView>

      {/* Selected Day Details */}
      {selectedDayData && selectedDayData.hasData && (
        <View className={cn(
          "p-4 rounded-xl",
          isDarkMode ? "bg-gray-800" : "bg-white"
        )}>
          <View className="flex-row items-center justify-between mb-3">
            <Text className={cn(
              "text-lg font-semibold",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              {new Date(selectedDate!).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
            <View className="flex-row items-center space-x-2">
              <Text className={cn(
                "text-sm",
                isDarkMode ? "text-gray-400" : "text-gray-600"
              )}>
                Avg: {selectedDayData.avgPain}/10
              </Text>
              <View 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: getPainColor(selectedDayData.avgPain) }}
              />
            </View>
          </View>

          {/* Day's Pain Logs */}
          <View className="space-y-2">
            {selectedDayData.logs.map((log, index) => (
              <View 
                key={log.id}
                className={cn(
                  "flex-row items-center justify-between p-3 rounded-lg",
                  isDarkMode ? "bg-gray-700" : "bg-gray-50"
                )}
              >
                <View className="flex-1">
                  <Text className={cn(
                    "font-medium",
                    isDarkMode ? "text-white" : "text-gray-900"
                  )}>
                    {log.bodyPart} - {log.painType}
                  </Text>
                  <Text className={cn(
                    "text-sm",
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  )}>
                    {log.time} • {log.cause.replace('_', ' ')}
                  </Text>
                </View>
                <View 
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: getPainColor(log.severity) }}
                >
                  <Text className="text-white text-sm font-bold">
                    {log.severity}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Summary Stats */}
      <View className={cn(
        "p-4 rounded-xl",
        isDarkMode ? "bg-gray-800" : "bg-white"
      )}>
        <Text className={cn(
          "text-lg font-semibold mb-3",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          30-Day Summary
        </Text>
        <View className="flex-row justify-between">
          <View className="items-center">
            <Text className={cn(
              "text-2xl font-bold",
              isDarkMode ? "text-green-400" : "text-green-600"
            )}>
              {calendarData.filter(day => day.avgPain > 0 && day.avgPain <= 3).length}
            </Text>
            <Text className={cn(
              "text-sm",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}>
              Good Days
            </Text>
          </View>
          <View className="items-center">
            <Text className={cn(
              "text-2xl font-bold",
              isDarkMode ? "text-yellow-400" : "text-yellow-600"
            )}>
              {calendarData.filter(day => day.avgPain > 3 && day.avgPain <= 6).length}
            </Text>
            <Text className={cn(
              "text-sm",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}>
              Moderate Days
            </Text>
          </View>
          <View className="items-center">
            <Text className={cn(
              "text-2xl font-bold",
              isDarkMode ? "text-red-400" : "text-red-600"
            )}>
              {calendarData.filter(day => day.avgPain > 6).length}
            </Text>
            <Text className={cn(
              "text-sm",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}>
              Severe Days
            </Text>
          </View>
          <View className="items-center">
            <Text className={cn(
              "text-2xl font-bold",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}>
              {calendarData.filter(day => !day.hasData).length}
            </Text>
            <Text className={cn(
              "text-sm",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}>
              No Data
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}