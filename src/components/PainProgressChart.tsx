import React, { useMemo } from 'react';
import { View, Text, ScrollView, Dimensions, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PainLog, BODY_PARTS } from '../types/pain';
import useAppStore from '../state/appStore';
import { cn } from '../utils/cn';

const { width: screenWidth } = Dimensions.get('window');

interface PainProgressChartProps {
  painLogs: PainLog[];
  timeRange?: 'week' | 'month' | 'all';
  onFlareUpPress?: (log: PainLog) => void;
}

interface DataPoint {
  date: string;
  severity: number;
  bodyPart: string;
  painType: string;
  log: PainLog;
  x: number;
  y: number;
  isFlareUp: boolean;
}

export default function PainProgressChart({ painLogs, timeRange = 'month', onFlareUpPress }: PainProgressChartProps) {
  const { isDarkMode } = useAppStore();

  const { dataPoints, flareUps, stats } = useMemo(() => {
    if (painLogs.length === 0) {
      return { dataPoints: [], flareUps: [], stats: { avg: 0, trend: 'stable' as const } };
    }

    // Sort and filter logs based on time range
    const sortedLogs = [...painLogs].sort((a, b) => 
      new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime()
    );

    let filteredLogs = sortedLogs;
    const now = new Date();
    
    if (timeRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredLogs = sortedLogs.filter(log => new Date(log.date) >= weekAgo);
    } else if (timeRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredLogs = sortedLogs.filter(log => new Date(log.date) >= monthAgo);
    }

    if (filteredLogs.length === 0) {
      return { dataPoints: [], flareUps: [], stats: { avg: 0, trend: 'stable' as const } };
    }

    // Calculate statistics
    const avgSeverity = filteredLogs.reduce((sum, log) => sum + log.severity, 0) / filteredLogs.length;
    
    // Determine trend (comparing first half vs second half)
    let trend: 'improving' | 'worsening' | 'stable' = 'stable';
    if (filteredLogs.length >= 4) {
      const midpoint = Math.floor(filteredLogs.length / 2);
      const firstHalf = filteredLogs.slice(0, midpoint);
      const secondHalf = filteredLogs.slice(midpoint);
      
      const firstHalfAvg = firstHalf.reduce((sum, log) => sum + log.severity, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, log) => sum + log.severity, 0) / secondHalf.length;
      
      const difference = secondHalfAvg - firstHalfAvg;
      if (difference > 0.5) trend = 'worsening';
      else if (difference < -0.5) trend = 'improving';
    }

    // Create data points
    const graphHeight = 200;
    const graphWidth = Math.max(filteredLogs.length * 50, screenWidth - 60);
    
    const points: DataPoint[] = filteredLogs.map((log, index) => ({
      date: log.date,
      severity: log.severity,
      bodyPart: log.bodyPart,
      painType: log.painType,
      log,
      x: index * 50 + 25,
      y: graphHeight - ((log.severity - 1) / 9) * (graphHeight - 40),
      isFlareUp: false, // Will be calculated below
    }));

    // Detect flare-ups (pain spikes significantly above average)
    const flareUpThreshold = Math.max(avgSeverity + 2, 7); // At least 7/10 or 2 points above average
    points.forEach(point => {
      point.isFlareUp = point.severity >= flareUpThreshold;
    });

    const flareUpPoints = points.filter(p => p.isFlareUp);

    return {
      dataPoints: points,
      flareUps: flareUpPoints,
      stats: { avg: Math.round(avgSeverity * 10) / 10, trend }
    };
  }, [painLogs, timeRange]);

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
          No Pain Data
        </Text>
        <Text className={cn(
          "text-center",
          isDarkMode ? "text-gray-400" : "text-gray-600"
        )}>
          Pain progress will appear here when patient logs data
        </Text>
      </View>
    );
  }

  const getSeverityColor = (severity: number) => {
    if (severity <= 3) return '#10B981'; // Green
    if (severity <= 6) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getTrendIcon = () => {
    switch (stats.trend) {
      case 'improving': return 'trending-down';
      case 'worsening': return 'trending-up';
      default: return 'remove';
    }
  };

  const getTrendColor = () => {
    switch (stats.trend) {
      case 'improving': return '#10B981';
      case 'worsening': return '#EF4444';
      default: return isDarkMode ? '#6B7280' : '#9CA3AF';
    }
  };

  return (
    <View className={cn(
      "p-4 rounded-xl",
      isDarkMode ? "bg-gray-800" : "bg-white"
    )}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className={cn(
            "text-lg font-semibold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Pain Progress
          </Text>
          <Text className={cn(
            "text-sm",
            isDarkMode ? "text-gray-400" : "text-gray-600"
          )}>
            Last {timeRange === 'week' ? '7 days' : timeRange === 'month' ? '30 days' : 'all time'}
          </Text>
        </View>
        <View className="items-end">
          <View className="flex-row items-center space-x-2">
            <Ionicons 
              name={getTrendIcon()} 
              size={20} 
              color={getTrendColor()} 
            />
            <Text className={cn(
              "text-2xl font-bold",
              stats.avg <= 3 ? "text-green-500" : stats.avg <= 6 ? "text-yellow-500" : "text-red-500"
            )}>
              {stats.avg}
            </Text>
          </View>
          <Text className={cn(
            "text-xs",
            isDarkMode ? "text-gray-400" : "text-gray-600"
          )}>
            Average
          </Text>
        </View>
      </View>

      {/* Flare-up alerts */}
      {flareUps.length > 0 && (
        <View className={cn(
          "p-3 rounded-lg mb-4",
          isDarkMode ? "bg-red-900/30" : "bg-red-50"
        )}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center space-x-2">
              <Ionicons name="warning" size={16} color="#EF4444" />
              <Text className={cn(
                "font-semibold text-sm",
                isDarkMode ? "text-red-300" : "text-red-700"
              )}>
                {flareUps.length} Flare-up Alert{flareUps.length > 1 ? 's' : ''}
              </Text>
            </View>
            <Text className={cn(
              "text-xs",
              isDarkMode ? "text-red-400" : "text-red-600"
            )}>
              {stats.trend === 'worsening' ? 'Worsening Trend' : 'Monitor Closely'}
            </Text>
          </View>
          <Text className={cn(
            "text-xs mt-1",
            isDarkMode ? "text-red-200" : "text-red-600"
          )}>
            Pain spikes detected above normal threshold
          </Text>
        </View>
      )}

      {/* Graph */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ width: Math.max(dataPoints.length * 50, screenWidth - 60), height: 260 }}>
          {/* Y-axis labels */}
          <View className="absolute left-0 top-0 bottom-12">
            {[10, 8, 6, 4, 2].map(value => (
              <View 
                key={value}
                className="absolute left-0 flex-row items-center"
                style={{ 
                  top: 200 - ((value - 1) / 9) * 160 - 8,
                }}
              >
                <Text className={cn(
                  "text-xs w-6 text-right mr-2",
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                )}>
                  {value}
                </Text>
                <View className={cn(
                  "w-full h-px",
                  value === Math.round(stats.avg) ? "bg-blue-500 opacity-50" : (isDarkMode ? "bg-gray-700" : "bg-gray-200")
                )} />
              </View>
            ))}
          </View>

          {/* Graph area */}
          <View className="ml-10 relative" style={{ width: Math.max(dataPoints.length * 50, screenWidth - 100), height: 200 }}>
            {/* Average line */}
            <View 
              className="absolute w-full h-px bg-blue-500 opacity-50"
              style={{ top: 200 - ((stats.avg - 1) / 9) * 160 }}
            />
            <Text 
              className={cn(
                "absolute right-0 text-xs",
                isDarkMode ? "text-blue-400" : "text-blue-600"
              )}
              style={{ top: 200 - ((stats.avg - 1) / 9) * 160 - 15 }}
            >
              Avg: {stats.avg}
            </Text>

            {/* Connection lines */}
            {dataPoints.map((point, index) => {
              if (index === 0) return null;
              const prevPoint = dataPoints[index - 1];
              
              return (
                <View
                  key={`line-${index}`}
                  className={cn(
                    "absolute h-px",
                    isDarkMode ? "bg-blue-400" : "bg-blue-500"
                  )}
                  style={{
                    left: prevPoint.x,
                    top: prevPoint.y,
                    width: Math.sqrt(Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2)),
                    transform: [{
                      rotate: `${Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x) * 180 / Math.PI}deg`
                    }],
                    transformOrigin: '0 0',
                  }}
                />
              );
            })}

            {/* Data points */}
            {dataPoints.map((point, index) => (
              <View key={index}>
                {/* Point */}
                <Pressable
                  onPress={() => point.isFlareUp && onFlareUpPress?.(point.log)}
                  className="absolute"
                  style={{
                    left: point.x - 6,
                    top: point.y - 6,
                  }}
                >
                  <View
                    className="w-3 h-3 rounded-full border-2 border-white"
                    style={{
                      backgroundColor: getSeverityColor(point.severity),
                    }}
                  />
                  
                  {/* Flare-up indicator */}
                  {point.isFlareUp && (
                    <View
                      className="absolute w-6 h-6 rounded-full border-2 border-red-500 bg-red-500/20 -top-1.5 -left-1.5 items-center justify-center"
                    >
                      <Ionicons name="warning" size={12} color="#EF4444" />
                    </View>
                  )}
                </Pressable>

                {/* Date label */}
                <Text
                  className={cn(
                    "absolute text-xs",
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  )}
                  style={{
                    left: point.x - 15,
                    top: 210,
                    width: 30,
                    textAlign: 'center',
                  }}
                >
                  {new Date(point.date).getDate()}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Legend and Stats */}
      <View className="mt-4 pt-4 border-t" style={{ borderTopColor: isDarkMode ? '#374151' : '#E5E7EB' }}>
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row space-x-4">
            <View className="flex-row items-center space-x-1">
              <View className="w-3 h-3 rounded-full bg-green-500" />
              <Text className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                Mild (1-3)
              </Text>
            </View>
            <View className="flex-row items-center space-x-1">
              <View className="w-3 h-3 rounded-full bg-yellow-500" />
              <Text className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                Moderate (4-6)
              </Text>
            </View>
            <View className="flex-row items-center space-x-1">
              <View className="w-3 h-3 rounded-full bg-red-500" />
              <Text className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                Severe (7-10)
              </Text>
            </View>
          </View>
          
          {flareUps.length > 0 && (
            <View className="flex-row items-center space-x-1">
              <View className="w-4 h-4 rounded-full border-2 border-red-500 bg-red-500/20 items-center justify-center">
                <Ionicons name="warning" size={8} color="#EF4444" />
              </View>
              <Text className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                Flare-up
              </Text>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View className="flex-row justify-between">
          <Text className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>
            Trend: {stats.trend}
          </Text>
          <Text className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>
            {dataPoints.length} entries
          </Text>
          <Text className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>
            Range: {dataPoints.length > 0 ? `${Math.min(...dataPoints.map(p => p.severity))}-${Math.max(...dataPoints.map(p => p.severity))}` : '0'}
          </Text>
        </View>
      </View>
    </View>
  );
}