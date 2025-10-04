import React from 'react';
import { Pressable } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import useAppStore from '../state/appStore';
import { cn } from '../utils/cn';

interface AnimatedToggleProps {
  value: boolean;
  onToggle: () => void;
}

export default function AnimatedToggle({ value, onToggle }: AnimatedToggleProps) {
  const { isDarkMode } = useAppStore();
  const translateX = useSharedValue(value ? 20 : 0);

  React.useEffect(() => {
    translateX.value = withSpring(value ? 20 : 0, {
      damping: 15,
      stiffness: 200,
    });
  }, [value, translateX]);

  const handlePress = () => {
    runOnJS(onToggle)();
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <Pressable
      onPress={handlePress}
      className={cn(
        "w-12 h-7 rounded-full p-1 justify-center",
        value 
          ? (isDarkMode ? "bg-emerald-600" : "bg-emerald-500")
          : (isDarkMode ? "bg-gray-600" : "bg-gray-300")
      )}
    >
      <Animated.View
        className="w-5 h-5 rounded-full bg-white"
        style={animatedStyle}
      />
    </Pressable>
  );
}