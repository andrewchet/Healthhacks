import React, { useState } from 'react';
import { View, Text, Pressable, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../types/auth';
import useAppStore from '../state/appStore';
import { cn } from '../utils/cn';

interface PatientTagsProps {
  patient: User;
  onTagsUpdate?: (tags: string[]) => void;
}

const CHRONIC_CONDITIONS = [
  'Arthritis',
  'Fibromyalgia', 
  'Chronic Back Pain',
  'Osteoarthritis',
  'Rheumatoid Arthritis',
  'Sciatica',
  'Migraine',
  'Chronic Fatigue Syndrome',
  'Lupus',
  'Multiple Sclerosis',
  'Carpal Tunnel Syndrome',
  'Plantar Fasciitis',
  'Tennis Elbow',
  'Frozen Shoulder',
  'Herniated Disc'
];

const SEVERITY_LEVELS = [
  { id: 'mild', label: 'Mild', color: '#10B981' },
  { id: 'moderate', label: 'Moderate', color: '#F59E0B' },
  { id: 'severe', label: 'Severe', color: '#EF4444' },
  { id: 'critical', label: 'Critical', color: '#7C2D12' }
];

const PRIORITY_LEVELS = [
  { id: 'routine', label: 'Routine', color: '#6B7280' },
  { id: 'monitoring', label: 'Monitoring', color: '#3B82F6' },
  { id: 'urgent', label: 'Urgent', color: '#F59E0B' },
  { id: 'immediate', label: 'Immediate', color: '#EF4444' }
];

export default function PatientTags({ patient, onTagsUpdate }: PatientTagsProps) {
  const { isDarkMode } = useAppStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [customTag, setCustomTag] = useState('');
  
  // Mock patient tags - in real app this would come from backend
  const [patientTags, setPatientTags] = useState<string[]>([
    'Chronic Back Pain',
    'Moderate Severity',
    'Monitoring Required'
  ]);
  
  const [patientSeverity, setPatientSeverity] = useState('moderate');
  const [patientPriority, setPatientPriority] = useState('monitoring');

  const addTag = (tag: string) => {
    if (!patientTags.includes(tag)) {
      const newTags = [...patientTags, tag];
      setPatientTags(newTags);
      onTagsUpdate?.(newTags);
    }
  };

  const removeTag = (tag: string) => {
    const newTags = patientTags.filter(t => t !== tag);
    setPatientTags(newTags);
    onTagsUpdate?.(newTags);
  };

  const addCustomTag = () => {
    if (customTag.trim() && !patientTags.includes(customTag.trim())) {
      addTag(customTag.trim());
      setCustomTag('');
    }
  };

  const updateSeverity = (severity: string) => {
    setPatientSeverity(severity);
    // Remove old severity tags
    const filteredTags = patientTags.filter(tag => 
      !SEVERITY_LEVELS.some(level => tag.includes(level.label))
    );
    const severityLabel = SEVERITY_LEVELS.find(s => s.id === severity)?.label;
    if (severityLabel) {
      const newTags = [...filteredTags, `${severityLabel} Severity`];
      setPatientTags(newTags);
      onTagsUpdate?.(newTags);
    }
  };

  const updatePriority = (priority: string) => {
    setPatientPriority(priority);
    // Remove old priority tags
    const filteredTags = patientTags.filter(tag => 
      !PRIORITY_LEVELS.some(level => tag.includes(level.label))
    );
    const priorityLabel = PRIORITY_LEVELS.find(p => p.id === priority)?.label;
    if (priorityLabel && priority !== 'routine') {
      const newTags = [...filteredTags, `${priorityLabel} ${priority === 'immediate' ? 'Attention' : 'Required'}`];
      setPatientTags(newTags);
      onTagsUpdate?.(newTags);
    }
  };

  const getTagColor = (tag: string) => {
    if (tag.includes('Mild')) return '#10B981';
    if (tag.includes('Moderate')) return '#F59E0B';
    if (tag.includes('Severe')) return '#EF4444';
    if (tag.includes('Critical')) return '#7C2D12';
    if (tag.includes('Urgent')) return '#F59E0B';
    if (tag.includes('Immediate')) return '#EF4444';
    if (tag.includes('Monitoring')) return '#3B82F6';
    if (CHRONIC_CONDITIONS.includes(tag)) return '#8B5CF6';
    return '#6B7280';
  };

  return (
    <View className={cn(
      "p-4 rounded-xl",
      isDarkMode ? "bg-gray-800" : "bg-white"
    )}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center space-x-2">
          <Ionicons 
            name="pricetags" 
            size={20} 
            color={isDarkMode ? "#8B5CF6" : "#7C3AED"} 
          />
          <Text className={cn(
            "text-lg font-semibold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Patient Classification
          </Text>
        </View>
        <Pressable
          onPress={() => setModalVisible(true)}
          className={cn(
            "px-3 py-2 rounded-lg",
            isDarkMode ? "bg-purple-600" : "bg-purple-500"
          )}
        >
          <Text className="text-white text-sm font-semibold">Manage</Text>
        </Pressable>
      </View>

      {/* Current Tags */}
      <View className="flex-row flex-wrap gap-2 mb-4">
        {patientTags.map((tag, index) => (
          <View
            key={index}
            className="px-3 py-2 rounded-full border flex-row items-center space-x-2"
            style={{ 
              backgroundColor: getTagColor(tag) + '20',
              borderColor: getTagColor(tag)
            }}
          >
            <Text 
              className="text-sm font-medium"
              style={{ color: getTagColor(tag) }}
            >
              {tag}
            </Text>
          </View>
        ))}
        
        {patientTags.length === 0 && (
          <Text className={cn(
            "text-sm italic",
            isDarkMode ? "text-gray-400" : "text-gray-600"
          )}>
            No classifications assigned
          </Text>
        )}
      </View>

      {/* Quick Actions */}
      <View className="flex-row space-x-2">
        <View className="flex-1">
          <Text className={cn(
            "text-xs font-medium mb-2",
            isDarkMode ? "text-gray-400" : "text-gray-600"
          )}>
            Severity Level
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-2">
              {SEVERITY_LEVELS.map((level) => (
                <Pressable
                  key={level.id}
                  onPress={() => updateSeverity(level.id)}
                  className={cn(
                    "px-3 py-2 rounded-lg border",
                    patientSeverity === level.id 
                      ? "border-2"
                      : "border opacity-50"
                  )}
                  style={{ 
                    backgroundColor: level.color + '20',
                    borderColor: level.color
                  }}
                >
                  <Text 
                    className="text-xs font-medium"
                    style={{ color: level.color }}
                  >
                    {level.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Management Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className={cn(
          "flex-1",
          isDarkMode ? "bg-gray-900" : "bg-white"
        )}>
          <View className={cn(
            "flex-row items-center justify-between p-4 border-b",
            isDarkMode ? "border-gray-700" : "border-gray-200"
          )}>
            <Text className={cn(
              "text-xl font-bold",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              Manage Patient Tags
            </Text>
            <Pressable onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={isDarkMode ? "white" : "black"} />
            </Pressable>
          </View>

          <ScrollView className="flex-1 p-4">
            <View className="space-y-6">
              {/* Current Tags */}
              <View>
                <Text className={cn(
                  "text-lg font-semibold mb-3",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>
                  Current Classifications
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {patientTags.map((tag, index) => (
                    <Pressable
                      key={index}
                      onPress={() => removeTag(tag)}
                      className="px-3 py-2 rounded-full border flex-row items-center space-x-2"
                      style={{ 
                        backgroundColor: getTagColor(tag) + '20',
                        borderColor: getTagColor(tag)
                      }}
                    >
                      <Text 
                        className="text-sm font-medium"
                        style={{ color: getTagColor(tag) }}
                      >
                        {tag}
                      </Text>
                      <Ionicons name="close" size={14} color={getTagColor(tag)} />
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Chronic Conditions */}
              <View>
                <Text className={cn(
                  "text-lg font-semibold mb-3",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>
                  Chronic Conditions
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {CHRONIC_CONDITIONS.map((condition) => (
                    <Pressable
                      key={condition}
                      onPress={() => addTag(condition)}
                      className={cn(
                        "px-3 py-2 rounded-lg border",
                        patientTags.includes(condition)
                          ? "border-purple-500 bg-purple-500/20"
                          : (isDarkMode ? "border-gray-600 bg-gray-700" : "border-gray-200 bg-gray-50")
                      )}
                    >
                      <Text className={cn(
                        "text-sm font-medium",
                        patientTags.includes(condition)
                          ? "text-purple-600"
                          : (isDarkMode ? "text-gray-300" : "text-gray-700")
                      )}>
                        {condition}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Priority Level */}
              <View>
                <Text className={cn(
                  "text-lg font-semibold mb-3",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>
                  Priority Level
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {PRIORITY_LEVELS.map((priority) => (
                    <Pressable
                      key={priority.id}
                      onPress={() => updatePriority(priority.id)}
                      className={cn(
                        "px-4 py-3 rounded-lg border",
                        patientPriority === priority.id 
                          ? "border-2"
                          : "border"
                      )}
                      style={{ 
                        backgroundColor: priority.color + '20',
                        borderColor: priority.color
                      }}
                    >
                      <Text 
                        className="font-medium"
                        style={{ color: priority.color }}
                      >
                        {priority.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Custom Tags */}
              <View>
                <Text className={cn(
                  "text-lg font-semibold mb-3",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>
                  Custom Tag
                </Text>
                <View className="flex-row space-x-3">
                  <TextInput
                    value={customTag}
                    onChangeText={setCustomTag}
                    placeholder="Enter custom classification..."
                    placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                    className={cn(
                      "flex-1 p-3 rounded-lg border",
                      isDarkMode 
                        ? "bg-gray-800 border-gray-700 text-white" 
                        : "bg-white border-gray-200 text-gray-900"
                    )}
                  />
                  <Pressable
                    onPress={addCustomTag}
                    className={cn(
                      "px-4 py-3 rounded-lg",
                      isDarkMode ? "bg-purple-600" : "bg-purple-500"
                    )}
                  >
                    <Text className="text-white font-semibold">Add</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}