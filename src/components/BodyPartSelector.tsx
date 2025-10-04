import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BODY_PARTS, BodyPart } from '../types/pain';
import useAppStore from '../state/appStore';
import { cn } from '../utils/cn';

interface BodyPartSelectorProps {
  selectedBodyPart: string;
  onSelectBodyPart: (bodyPartId: string) => void;
}

export default function BodyPartSelector({ selectedBodyPart, onSelectBodyPart }: BodyPartSelectorProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { isDarkMode } = useAppStore();

  const selectedBodyPartInfo = BODY_PARTS.find(part => part.id === selectedBodyPart);

  const categorizedParts = {
    head: BODY_PARTS.filter(part => part.category === 'head'),
    torso: BODY_PARTS.filter(part => part.category === 'torso'),
    arms: BODY_PARTS.filter(part => part.category === 'arms'),
    legs: BODY_PARTS.filter(part => part.category === 'legs'),
  };

  const handleSelectBodyPart = (bodyPart: BodyPart) => {
    onSelectBodyPart(bodyPart.id);
    setIsModalVisible(false);
  };

  const renderBodyPartButton = (bodyPart: BodyPart) => (
    <Pressable
      key={bodyPart.id}
      onPress={() => handleSelectBodyPart(bodyPart)}
      className={cn(
        "p-3 rounded-xl border-2 mb-2",
        selectedBodyPart === bodyPart.id
          ? (isDarkMode ? "bg-emerald-600 border-emerald-500" : "bg-emerald-500 border-emerald-400")
          : (isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"),
        "active:opacity-70"
      )}
    >
      <Text className={cn(
        "font-medium",
        selectedBodyPart === bodyPart.id
          ? "text-white"
          : (isDarkMode ? "text-white" : "text-gray-900")
      )}>
        {bodyPart.displayName}
      </Text>
    </Pressable>
  );

  const renderCategorySection = (
    category: keyof typeof categorizedParts, 
    title: string, 
    icon: keyof typeof Ionicons.glyphMap
  ) => (
    <View key={category} className="mb-6">
      <View className="flex-row items-center space-x-2 mb-3">
        <Ionicons name={icon} size={20} color={isDarkMode ? "#10B981" : "#059669"} />
        <Text className={cn(
          "text-lg font-semibold",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          {title}
        </Text>
      </View>
      {categorizedParts[category].map(renderBodyPartButton)}
    </View>
  );

  return (
    <>
      <Pressable
        onPress={() => setIsModalVisible(true)}
        className={cn(
          "p-4 rounded-xl border-2 flex-row items-center justify-between",
          selectedBodyPart 
            ? (isDarkMode ? "bg-emerald-600 border-emerald-500" : "bg-emerald-500 border-emerald-400")
            : (isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")
        )}
      >
        <Text className={cn(
          "font-medium",
          selectedBodyPart 
            ? "text-white" 
            : (isDarkMode ? "text-gray-400" : "text-gray-500")
        )}>
          {selectedBodyPartInfo?.displayName || 'Select body part'}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color={selectedBodyPart ? "white" : (isDarkMode ? "#9CA3AF" : "#6B7280")} 
        />
      </Pressable>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className={cn(
          "flex-1",
          isDarkMode ? "bg-gray-900" : "bg-white"
        )}>
          {/* Header */}
          <View className={cn(
            "flex-row items-center justify-between p-4 border-b",
            isDarkMode ? "border-gray-700" : "border-gray-200"
          )}>
            <Text className={cn(
              "text-xl font-bold",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              Select Body Part
            </Text>
            <Pressable
              onPress={() => setIsModalVisible(false)}
              className="p-2"
            >
              <Ionicons name="close" size={24} color={isDarkMode ? "white" : "black"} />
            </Pressable>
          </View>

          {/* Body Parts List */}
          <ScrollView className="flex-1 p-4">
            {renderCategorySection('head', 'Head & Neck', 'person-outline')}
            {renderCategorySection('torso', 'Torso & Back', 'body-outline')}
            {renderCategorySection('arms', 'Arms & Hands', 'hand-left-outline')}
            {renderCategorySection('legs', 'Legs & Feet', 'walk-outline')}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}