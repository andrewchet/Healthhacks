import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAppStore from '../state/appStore';
import { cn } from '../utils/cn';
import AppModal from './AppModal';

interface CustomTagsProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

const SUGGESTED_TAGS = [
  // Activity triggers
  'Gym day', 'After exercise', 'Heavy lifting', 'Long walk', 'Running', 'Desk work',
  // Lifestyle triggers  
  'Poor sleep', 'Stress', 'Long day', 'Travel', 'Poor posture', 'Skipped stretching',
  // Environmental triggers
  'Rainy day', 'Weather change', 'Cold weather', 'Hot weather', 'High humidity',
  // Medical/Treatment
  'Took medication', 'Missed medication', 'Physical therapy', 'Massage',
  // Time-based
  'Morning stiffness', 'Evening pain', 'Night pain', 'After sitting', 'After standing',
  // Dietary/Health
  'Dehydrated', 'Ate inflammatory foods', 'Alcohol', 'Caffeine', 'Period-related'
];

export default function CustomTags({ selectedTags, onTagsChange }: CustomTagsProps) {
  const { isDarkMode } = useAppStore();
  const [newTag, setNewTag] = useState('');
  const [showInput, setShowInput] = useState(false);

  const [modal, setModal] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });
  const openModal = (title: string, message: string) => setModal({ visible: true, title, message });
  const closeModal = () => setModal((m) => ({ ...m, visible: false }));

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      onTagsChange([...selectedTags, trimmedTag]);
    }
    setNewTag('');
    setShowInput(false);
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleAddCustomTag = () => {
    if (newTag.trim()) {
      addTag(newTag);
    } else {
      openModal('Invalid Tag', 'Please enter a valid tag name.');
    }
  };

  const renderTag = (tag: string, isSelected: boolean, onPress: () => void) => (
    <Pressable
      key={tag}
      onPress={onPress}
      className={cn(
        "px-3 py-2 rounded-full border flex-row items-center space-x-1 mb-2 mr-2",
        isSelected
          ? (isDarkMode ? "bg-emerald-600 border-emerald-500" : "bg-emerald-500 border-emerald-400")
          : (isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"),
        "active:opacity-70"
      )}
    >
      {isSelected && (
        <Ionicons 
          name="checkmark" 
          size={14} 
          color="white" 
        />
      )}
      <Text className={cn(
        "text-sm font-medium",
        isSelected 
          ? "text-white"
          : (isDarkMode ? "text-gray-300" : "text-gray-700")
      )}>
        {tag}
      </Text>
      {isSelected && !SUGGESTED_TAGS.includes(tag) && (
        <Pressable onPress={() => removeTag(tag)} className="ml-1">
          <Ionicons name="close" size={14} color="white" />
        </Pressable>
      )}
    </Pressable>
  );

  return (
    <View className="space-y-4">
      <Text className={cn(
        "text-lg font-semibold",
        isDarkMode ? "text-white" : "text-gray-900"
      )}>
        Tags (Optional)
      </Text>
      
      <Text className={cn(
        "text-sm",
        isDarkMode ? "text-gray-400" : "text-gray-600"
      )}>
        Add tags to identify patterns and triggers
      </Text>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <View>
          <Text className={cn(
            "text-sm font-medium mb-2",
            isDarkMode ? "text-gray-300" : "text-gray-700"
          )}>
            Selected:
          </Text>
          <View className="flex-row flex-wrap">
            {selectedTags.map(tag => 
              renderTag(tag, true, () => removeTag(tag))
            )}
          </View>
        </View>
      )}

      {/* Suggested Tags */}
      <View>
        <Text className={cn(
          "text-sm font-medium mb-2",
          isDarkMode ? "text-gray-300" : "text-gray-700"
        )}>
          Suggested:
        </Text>
        <View className="flex-row flex-wrap">
          {SUGGESTED_TAGS
            .filter(tag => !selectedTags.includes(tag))
            .map(tag => 
              renderTag(tag, false, () => addTag(tag))
            )}
        </View>
      </View>

      {/* Add Custom Tag */}
      <View>
        <Text className={cn(
          "text-sm font-medium mb-2",
          isDarkMode ? "text-gray-300" : "text-gray-700"
        )}>
          Custom:
        </Text>
        
        {showInput ? (
          <View className="flex-row space-x-2">
            <TextInput
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Enter custom tag..."
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              className={cn(
                "flex-1 px-3 py-2 rounded-xl border",
                isDarkMode 
                  ? "bg-gray-800 border-gray-700 text-white" 
                  : "bg-white border-gray-200 text-gray-900"
              )}
              onSubmitEditing={handleAddCustomTag}
              autoFocus
            />
            <Pressable
              onPress={handleAddCustomTag}
              className={cn(
                "px-4 py-2 rounded-xl",
                isDarkMode ? "bg-emerald-600" : "bg-emerald-500"
              )}
            >
              <Text className="text-white font-medium">Add</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setShowInput(false);
                setNewTag('');
              }}
              className={cn(
                "px-4 py-2 rounded-xl",
                isDarkMode ? "bg-gray-700" : "bg-gray-300"
              )}
            >
              <Text className={cn(
                "font-medium",
                isDarkMode ? "text-gray-300" : "text-gray-700"
              )}>
                Cancel
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => setShowInput(true)}
            className={cn(
              "px-3 py-2 rounded-xl border-2 border-dashed flex-row items-center space-x-2",
              isDarkMode 
                ? "border-gray-600 bg-gray-800/50" 
                : "border-gray-300 bg-gray-50",
              "active:opacity-70"
            )}
          >
            <Ionicons 
              name="add" 
              size={16} 
              color={isDarkMode ? "#9CA3AF" : "#6B7280"} 
            />
            <Text className={cn(
              "text-sm font-medium",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}>
              Add custom tag
            </Text>
          </Pressable>
        )}
      </View>

      <AppModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
        showCancel={false}
      />
    </View>
  );
}
