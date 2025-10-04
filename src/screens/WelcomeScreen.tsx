import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import useAppStore from '../state/appStore';
import { cn } from '../utils/cn';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { completeOnboarding, isDarkMode } = useAppStore();

  // Debug logging
  console.log("[WelcomeScreen] Rendering WelcomeScreen");
  console.log("[WelcomeScreen] isDarkMode:", isDarkMode);
  console.log("[WelcomeScreen] insets:", insets);

  const handleGetStarted = () => {
    completeOnboarding();
    navigation.navigate('Login' as never);
  };

  return (
    <View 
      className={cn(
        "flex-1",
        isDarkMode ? "bg-gray-900" : "bg-white"
      )}
      style={{ paddingTop: insets.top }}
    >
      <ScrollView 
        className="flex-1 px-6"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      >
        <View className="items-center space-y-8">
          {/* App Icon */}
          <View className={cn(
            "w-24 h-24 rounded-3xl items-center justify-center",
            isDarkMode ? "bg-emerald-600" : "bg-emerald-500"
          )}>
            <Ionicons 
              name="body" 
              size={48} 
              color="white" 
            />
          </View>

          {/* Welcome Text */}
          <View className="items-center space-y-4">
            <Text className={cn(
              "text-4xl font-bold text-center",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              Welcome to{'\n'}ReliefLog
            </Text>
            
            <Text className={cn(
              "text-lg text-center leading-relaxed max-w-sm",
              isDarkMode ? "text-gray-300" : "text-gray-600"
            )}>
              Track your joint pain, monitor your progress, and get personalized advice.
            </Text>
          </View>

          {/* Features */}
          <View className="space-y-4 w-full max-w-sm">
            <FeatureItem 
              icon="body-outline"
              title="Interactive Body Model"
              description="Tap to log pain location quickly"
              isDarkMode={isDarkMode}
            />
            <FeatureItem 
              icon="chatbubble-outline"
              title="AI Health Assistant"
              description="Get instant advice about your symptoms"
              isDarkMode={isDarkMode}
            />
            <FeatureItem 
              icon="bar-chart-outline"
              title="Track Progress"
              description="View trends and patterns over time"
              isDarkMode={isDarkMode}
            />
          </View>

          {/* Get Started Button */}
          <Pressable
            onPress={handleGetStarted}
            className={cn(
              "w-full max-w-sm py-4 px-6 rounded-2xl items-center justify-center",
              isDarkMode ? "bg-emerald-600" : "bg-emerald-500"
            )}
            style={({ pressed }) => ({
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text className="text-white text-lg font-semibold">
              Get Started
            </Text>
          </Pressable>

          {/* Disclaimer */}
          <Text className={cn(
            "text-sm text-center max-w-sm leading-relaxed",
            isDarkMode ? "text-gray-400" : "text-gray-500"
          )}>
            This app is for tracking purposes only and does not replace professional medical advice.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

interface FeatureItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  isDarkMode: boolean;
}

function FeatureItem({ icon, title, description, isDarkMode }: FeatureItemProps) {
  return (
    <View className="flex-row items-center space-x-4">
      <View className={cn(
        "w-12 h-12 rounded-xl items-center justify-center",
        isDarkMode ? "bg-gray-800" : "bg-gray-100"
      )}>
        <Ionicons 
          name={icon} 
          size={24} 
          color={isDarkMode ? "#10B981" : "#059669"} 
        />
      </View>
      <View className="flex-1">
        <Text className={cn(
          "text-lg font-semibold",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          {title}
        </Text>
        <Text className={cn(
          "text-sm",
          isDarkMode ? "text-gray-400" : "text-gray-600"
        )}>
          {description}
        </Text>
      </View>
    </View>
  );
}