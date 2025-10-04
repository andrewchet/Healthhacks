import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import useAppStore from '../state/appStore';
import usePainStore from '../state/painStore';
import { BODY_PARTS, BodyPart } from '../types/pain';
import { cn } from '../utils/cn';

export default function BodyModelScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isDarkMode } = useAppStore();
  const { getRecentLogs } = usePainStore();
  const [selectedCategory, setSelectedCategory] = useState<'head' | 'torso' | 'arms' | 'legs' | null>(null);

  const recentLogs = getRecentLogs(7);
  const recentPainAreas = new Set(recentLogs.map(log => log.bodyPart));

  const handleBodyPartPress = (bodyPart: BodyPart) => {
    navigation.navigate('PainLog' as never, { bodyPart: bodyPart.id } as never);
  };

  const categorizedParts = {
    head: BODY_PARTS.filter(part => part.category === 'head'),
    torso: BODY_PARTS.filter(part => part.category === 'torso'),
    arms: BODY_PARTS.filter(part => part.category === 'arms'),
    legs: BODY_PARTS.filter(part => part.category === 'legs'),
  };

  const renderBodyPartButton = (bodyPart: BodyPart) => {
    const hasRecentPain = recentPainAreas.has(bodyPart.id);
    
    return (
      <Pressable
        key={bodyPart.id}
        onPress={() => handleBodyPartPress(bodyPart)}
        className={cn(
          "p-4 rounded-xl border-2 mb-3",
          hasRecentPain 
            ? (isDarkMode ? "bg-red-900/30 border-red-500" : "bg-red-50 border-red-300")
            : (isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"),
          "active:opacity-70"
        )}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center space-x-3">
            <View className={cn(
              "w-10 h-10 rounded-full items-center justify-center",
              hasRecentPain 
                ? "bg-red-500" 
                : (isDarkMode ? "bg-emerald-600" : "bg-emerald-500")
            )}>
              <Ionicons 
                name={hasRecentPain ? "alert-circle" : "add"} 
                size={20} 
                color="white" 
              />
            </View>
            <Text className={cn(
              "text-lg font-medium",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              {bodyPart.displayName}
            </Text>
          </View>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={isDarkMode ? "#9CA3AF" : "#6B7280"} 
          />
        </View>
        {hasRecentPain && (
          <Text className={cn(
            "text-sm mt-2 ml-13",
            isDarkMode ? "text-red-400" : "text-red-600"
          )}>
            Recent pain logged
          </Text>
        )}
      </Pressable>
    );
  };

  const renderCategorySection = (category: keyof typeof categorizedParts, title: string, icon: keyof typeof Ionicons.glyphMap) => {
    const isExpanded = selectedCategory === category;
    const parts = categorizedParts[category];
    const hasRecentPainInCategory = parts.some(part => recentPainAreas.has(part.id));

    return (
      <View key={category} className="mb-6">
        <Pressable
          onPress={() => setSelectedCategory(isExpanded ? null : category)}
          className={cn(
            "flex-row items-center justify-between p-4 rounded-xl",
            isDarkMode ? "bg-gray-800" : "bg-gray-50",
            "active:opacity-70"
          )}
        >
          <View className="flex-row items-center space-x-3">
            <View className={cn(
              "w-12 h-12 rounded-full items-center justify-center",
              hasRecentPainInCategory 
                ? "bg-red-500" 
                : (isDarkMode ? "bg-emerald-600" : "bg-emerald-500")
            )}>
              <Ionicons name={icon} size={24} color="white" />
            </View>
            <View>
              <Text className={cn(
                "text-xl font-semibold",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>
                {title}
              </Text>
              {hasRecentPainInCategory && (
                <Text className={cn(
                  "text-sm",
                  isDarkMode ? "text-red-400" : "text-red-600"
                )}>
                  Has recent pain
                </Text>
              )}
            </View>
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={24} 
            color={isDarkMode ? "#9CA3AF" : "#6B7280"} 
          />
        </Pressable>

        {isExpanded && (
          <View className="mt-4 space-y-2">
            {parts.map(renderBodyPartButton)}
          </View>
        )}
      </View>
    );
  };

  return (
    <View 
      className={cn(
        "flex-1",
        isDarkMode ? "bg-gray-900" : "bg-gray-50"
      )}
    >
      <ScrollView className="flex-1 px-4" style={{ paddingTop: insets.top + 20 }}>
        {/* Header */}
        <View className="mb-8">
          <Text className={cn(
            "text-3xl font-bold mb-2",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Track Your Pain
          </Text>
          <Text className={cn(
            "text-lg",
            isDarkMode ? "text-gray-300" : "text-gray-600"
          )}>
            Select a body area to log your pain experience
          </Text>
        </View>

        {/* Recent Pain Summary */}
        {recentLogs.length > 0 && (
          <View className={cn(
            "p-4 rounded-xl mb-6",
            isDarkMode ? "bg-blue-900/30" : "bg-blue-50"
          )}>
            <View className="flex-row items-center space-x-2 mb-2">
              <Ionicons name="information-circle" size={20} color={isDarkMode ? "#60A5FA" : "#3B82F6"} />
              <Text className={cn(
                "text-lg font-semibold",
                isDarkMode ? "text-blue-300" : "text-blue-700"
              )}>
                Last 7 Days
              </Text>
            </View>
            <Text className={cn(
              "text-sm",
              isDarkMode ? "text-blue-200" : "text-blue-600"
            )}>
              You logged {recentLogs.length} pain {recentLogs.length === 1 ? 'entry' : 'entries'} across {recentPainAreas.size} body {recentPainAreas.size === 1 ? 'area' : 'areas'}
            </Text>
          </View>
        )}

        {/* Body Categories */}
        <View className="space-y-4">
          {renderCategorySection('head', 'Head & Neck', 'person-outline')}
          {renderCategorySection('torso', 'Torso & Back', 'body-outline')}
          {renderCategorySection('arms', 'Arms & Hands', 'hand-left-outline')}
          {renderCategorySection('legs', 'Legs & Feet', 'walk-outline')}
        </View>

        {/* Quick Add Button */}
        <Pressable
          onPress={() => navigation.navigate('PainLog' as never)}
          className={cn(
            "mt-8 mb-8 p-4 rounded-xl flex-row items-center justify-center space-x-3",
            isDarkMode ? "bg-emerald-600" : "bg-emerald-500",
            "active:opacity-80"
          )}
        >
          <Ionicons name="add-circle" size={24} color="white" />
          <Text className="text-white text-lg font-semibold">
            Quick Add Pain Log
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}