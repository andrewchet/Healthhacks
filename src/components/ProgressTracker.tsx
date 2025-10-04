import React, { useMemo } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PainLog } from '../types/pain';
import useAppStore from '../state/appStore';
import { cn } from '../utils/cn';

const { width: screenWidth } = Dimensions.get('window');

interface ProgressTrackerProps {
  painLogs: PainLog[];
}

interface WeeklyProgress {
  week: string;
  averagePain: number;
  totalLogs: number;
  improvement: number;
  encouragement: string;
}

export default function ProgressTracker({ painLogs }: ProgressTrackerProps) {
  const { isDarkMode } = useAppStore();

  const getEncouragement = (avgPain: number, improvement: number, logCount: number): string => {
    if (improvement > 1.5) {
      return "Excellent progress! Keep it up! 🌟";
    } else if (improvement > 0.5) {
      return "Great improvement this week! 👏";
    } else if (improvement > 0) {
      return "You're making progress! 📈";
    } else if (improvement === 0) {
      return "Staying consistent! 💪";
    } else if (improvement > -0.5) {
      return "Slight setback, but you've got this! 💙";
    } else if (logCount >= 5) {
      return "Tracking well despite challenges 📊";
    } else {
      return "Keep tracking - data helps! 📝";
    }
  };

  const weeklyProgress = useMemo(() => {
    if (painLogs.length === 0) return [];

    // Group logs by week
    const weeks: Record<string, PainLog[]> = {};
    const today = new Date();
    
    for (let i = 0; i < 12; i++) { // Last 12 weeks
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (i * 7) - today.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekKey = weekStart.toISOString().split('T')[0];
      weeks[weekKey] = painLogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= weekStart && logDate <= weekEnd;
      });
    }

    // Calculate progress for each week
    const progressData: WeeklyProgress[] = [];
    const weekKeys = Object.keys(weeks).sort().reverse().slice(0, 8); // Last 8 weeks

    weekKeys.forEach((weekKey, index) => {
      const weekLogs = weeks[weekKey];
      const weekStart = new Date(weekKey);
      
      if (weekLogs.length > 0) {
        const averagePain = weekLogs.reduce((sum, log) => sum + log.severity, 0) / weekLogs.length;
        
        // Calculate improvement compared to previous week
        let improvement = 0;
        if (index < weekKeys.length - 1) {
          const prevWeekLogs = weeks[weekKeys[index + 1]];
          if (prevWeekLogs.length > 0) {
            const prevAverage = prevWeekLogs.reduce((sum, log) => sum + log.severity, 0) / prevWeekLogs.length;
            improvement = prevAverage - averagePain; // Positive = improvement
          }
        }

        progressData.push({
          week: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          averagePain,
          totalLogs: weekLogs.length,
          improvement,
          encouragement: getEncouragement(averagePain, improvement, weekLogs.length)
        });
      }
    });

    return progressData.reverse(); // Show chronological order
  }, [painLogs, getEncouragement]);

  const getOverallTrend = () => {
    if (weeklyProgress.length < 3) return null;

    const recent = weeklyProgress.slice(-3);
    const older = weeklyProgress.slice(0, 3);
    
    const recentAvg = recent.reduce((sum, week) => sum + week.averagePain, 0) / recent.length;
    const olderAvg = older.reduce((sum, week) => sum + week.averagePain, 0) / older.length;
    
    const overallImprovement = olderAvg - recentAvg;
    
    return {
      improvement: overallImprovement,
      trend: overallImprovement > 0.5 ? 'improving' : overallImprovement < -0.5 ? 'worsening' : 'stable',
      message: overallImprovement > 0.5 
        ? `You've improved by ${overallImprovement.toFixed(1)} points over time! 🎉`
        : overallImprovement < -0.5 
        ? `Pain has increased by ${Math.abs(overallImprovement).toFixed(1)} points. Consider consulting your doctor.`
        : "Your pain levels have been relatively stable."
    };
  };

  const overallTrend = getOverallTrend();

  const renderProgressBar = (week: WeeklyProgress, index: number) => {
    const maxPain = 10;
    const barHeight = (week.averagePain / maxPain) * 80;
    const barColor = week.averagePain <= 3 ? '#10B981' : week.averagePain <= 6 ? '#F59E0B' : '#EF4444';
    
    return (
      <View key={index} className="items-center flex-1 mx-1">
        <View className="h-20 justify-end mb-2">
          <View 
            className="w-6 rounded-t-sm"
            style={{ 
              height: barHeight, 
              backgroundColor: barColor,
              minHeight: 4
            }}
          />
        </View>
        
        <Text className={cn(
          "text-xs font-medium mb-1",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          {week.averagePain.toFixed(1)}
        </Text>
        
        <Text className={cn(
          "text-xs text-center",
          isDarkMode ? "text-gray-400" : "text-gray-600"
        )}>
          {week.week}
        </Text>
        
        {week.improvement !== 0 && (
          <View className="flex-row items-center mt-1">
            <Ionicons 
              name={week.improvement > 0 ? "trending-down" : "trending-up"} 
              size={10} 
              color={week.improvement > 0 ? "#10B981" : "#EF4444"} 
            />
            <Text className={cn(
              "text-xs ml-1",
              week.improvement > 0 ? "text-green-600" : "text-red-600"
            )}>
              {Math.abs(week.improvement).toFixed(1)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (painLogs.length === 0) {
    return (
      <View className={cn(
        "p-6 rounded-xl items-center",
        isDarkMode ? "bg-gray-800" : "bg-white"
      )}>
        <Ionicons 
          name="trending-up" 
          size={48} 
          color={isDarkMode ? "#6B7280" : "#9CA3AF"} 
        />
        <Text className={cn(
          "text-lg font-semibold mt-4 mb-2",
          isDarkMode ? "text-gray-300" : "text-gray-700"
        )}>
          Start Your Progress Journey
        </Text>
        <Text className={cn(
          "text-center",
          isDarkMode ? "text-gray-400" : "text-gray-600"
        )}>
          Log your pain regularly to see progress trends and encouraging insights
        </Text>
      </View>
    );
  }

  return (
    <View className="space-y-6">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <Text className={cn(
          "text-xl font-bold",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          Your Progress
        </Text>
        <Ionicons 
          name="trophy" 
          size={24} 
          color={isDarkMode ? "#F59E0B" : "#D97706"} 
        />
      </View>

      {/* Overall Trend Card */}
      {overallTrend && (
        <View className={cn(
          "p-4 rounded-xl",
          overallTrend.trend === 'improving' 
            ? (isDarkMode ? "bg-green-900/30" : "bg-green-50")
            : overallTrend.trend === 'worsening'
            ? (isDarkMode ? "bg-red-900/30" : "bg-red-50")
            : (isDarkMode ? "bg-blue-900/30" : "bg-blue-50")
        )}>
          <View className="flex-row items-center space-x-2 mb-2">
            <Ionicons 
              name={
                overallTrend.trend === 'improving' ? "trending-down" :
                overallTrend.trend === 'worsening' ? "trending-up" : "remove"
              }
              size={20} 
              color={
                overallTrend.trend === 'improving' ? "#10B981" :
                overallTrend.trend === 'worsening' ? "#EF4444" : "#3B82F6"
              }
            />
            <Text className={cn(
              "text-lg font-semibold",
              overallTrend.trend === 'improving' 
                ? (isDarkMode ? "text-green-300" : "text-green-700")
                : overallTrend.trend === 'worsening'
                ? (isDarkMode ? "text-red-300" : "text-red-700")
                : (isDarkMode ? "text-blue-300" : "text-blue-700")
            )}>
              Overall Trend: {overallTrend.trend.charAt(0).toUpperCase() + overallTrend.trend.slice(1)}
            </Text>
          </View>
          <Text className={cn(
            "leading-relaxed",
            overallTrend.trend === 'improving' 
              ? (isDarkMode ? "text-green-200" : "text-green-600")
              : overallTrend.trend === 'worsening'
              ? (isDarkMode ? "text-red-200" : "text-red-600")
              : (isDarkMode ? "text-blue-200" : "text-blue-600")
          )}>
            {overallTrend.message}
          </Text>
        </View>
      )}

      {/* Weekly Progress Chart */}
      <View className={cn(
        "p-4 rounded-xl",
        isDarkMode ? "bg-gray-800" : "bg-white"
      )}>
        <Text className={cn(
          "text-lg font-semibold mb-4",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          Weekly Pain Levels
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row items-end" style={{ minWidth: screenWidth - 80 }}>
            {weeklyProgress.map(renderProgressBar)}
          </View>
        </ScrollView>
        
        <View className="flex-row justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <View className="flex-row items-center space-x-2">
            <View className="w-3 h-3 rounded-full bg-green-500" />
            <Text className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>
              Mild (1-3)
            </Text>
          </View>
          <View className="flex-row items-center space-x-2">
            <View className="w-3 h-3 rounded-full bg-yellow-500" />
            <Text className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>
              Moderate (4-6)
            </Text>
          </View>
          <View className="flex-row items-center space-x-2">
            <View className="w-3 h-3 rounded-full bg-red-500" />
            <Text className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>
              Severe (7-10)
            </Text>
          </View>
        </View>
      </View>

      {/* Weekly Encouragements */}
      <View className={cn(
        "p-4 rounded-xl",
        isDarkMode ? "bg-gray-800" : "bg-white"
      )}>
        <Text className={cn(
          "text-lg font-semibold mb-4",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          Weekly Insights
        </Text>
        
        <ScrollView className="max-h-32">
          {weeklyProgress.slice(-4).reverse().map((week, index) => (
            <View key={index} className="flex-row items-center space-x-3 mb-3">
              <Text className={cn(
                "text-sm font-medium w-16",
                isDarkMode ? "text-gray-300" : "text-gray-700"
              )}>
                {week.week}
              </Text>
              <Text className={cn(
                "text-sm flex-1",
                isDarkMode ? "text-gray-400" : "text-gray-600"
              )}>
                {week.encouragement}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Progress Statistics */}
      <View className="flex-row space-x-3">
        <View className={cn(
          "flex-1 p-4 rounded-xl",
          isDarkMode ? "bg-gray-800" : "bg-white"
        )}>
          <View className="flex-row items-center space-x-2 mb-2">
            <Ionicons name="calendar" size={16} color={isDarkMode ? "#10B981" : "#059669"} />
            <Text className={cn(
              "text-sm font-medium",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}>
              Tracking Days
            </Text>
          </View>
          <Text className={cn(
            "text-2xl font-bold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            {painLogs.length}
          </Text>
        </View>

        <View className={cn(
          "flex-1 p-4 rounded-xl",
          isDarkMode ? "bg-gray-800" : "bg-white"
        )}>
          <View className="flex-row items-center space-x-2 mb-2">
            <Ionicons name="time" size={16} color={isDarkMode ? "#10B981" : "#059669"} />
            <Text className={cn(
              "text-sm font-medium",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}>
              Streak (Days)
            </Text>
          </View>
          <Text className={cn(
            "text-2xl font-bold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            {weeklyProgress.length > 0 ? Math.min(7, weeklyProgress[weeklyProgress.length - 1]?.totalLogs || 0) : 0}
          </Text>
        </View>
      </View>
    </View>
  );
}