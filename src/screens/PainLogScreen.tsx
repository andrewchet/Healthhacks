import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import useAppStore from '../state/appStore';
import usePainStore from '../state/painStore';
import { PainLog } from '../types/pain';
import BodyPartSelector from '../components/BodyPartSelector';
import PhotoCapture from '../components/PhotoCapture';
import CustomTags from '../components/CustomTags';
import VoiceLogger from '../components/VoiceLogger';
import { cn } from '../utils/cn';
import AppModal from '../components/AppModal';

const PAIN_TYPES = [
  { id: 'sharp', label: 'Sharp', icon: 'flash' },
  { id: 'dull', label: 'Dull', icon: 'ellipse' },
  { id: 'aching', label: 'Aching', icon: 'pulse' },
  { id: 'burning', label: 'Burning', icon: 'flame' },
  { id: 'stabbing', label: 'Stabbing', icon: 'triangle' },
  { id: 'throbbing', label: 'Throbbing', icon: 'heart' },
] as const;

const PAIN_CAUSES = [
  { id: 'injury', label: 'Injury', icon: 'medical' },
  { id: 'overuse', label: 'Overuse', icon: 'repeat' },
  { id: 'woke_up_with_it', label: 'Woke up with it', icon: 'bed' },
  { id: 'activity', label: 'During activity', icon: 'fitness' },
  { id: 'unknown', label: 'Unknown', icon: 'help-circle' },
] as const;

type RouteParams = {
  bodyPart?: string;
};

export default function PainLogScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { bodyPart: initialBodyPart } = (route.params as RouteParams) || {};
  const { isDarkMode } = useAppStore();
  const { addPainLog } = usePainStore();

  const [selectedBodyPart, setSelectedBodyPart] = useState(initialBodyPart || '');
  const [severity, setSeverity] = useState(5);
  const [painType, setPainType] = useState<PainLog['painType'] | ''>('');
  const [cause, setCause] = useState<PainLog['cause'] | ''>('');
  const [activity, setActivity] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  const [modal, setModal] = useState<{ visible: boolean; title: string; message: string; onConfirm?: () => void; showCancel?: boolean }>({ visible: false, title: '', message: '' });
  const openModal = (title: string, message: string, opts?: { onConfirm?: () => void; showCancel?: boolean }) => setModal({ visible: true, title, message, onConfirm: opts?.onConfirm, showCancel: opts?.showCancel });
  const closeModal = () => setModal((m) => ({ ...m, visible: false }));

  const handleSave = () => {
    if (!selectedBodyPart || !painType || !cause) {
      openModal('Missing Information', 'Please fill in all required fields: body part, pain type, and cause.', { showCancel: false });
      return;
    }

    const now = new Date();
    const newLog: Omit<PainLog, 'id'> = {
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      bodyPart: selectedBodyPart,
      severity,
      painType: painType as PainLog['painType'],
      cause: cause as PainLog['cause'],
      activity: activity || undefined,
      description: description || undefined,
      photos: photos.length > 0 ? photos : undefined,
      tags: tags.length > 0 ? tags : undefined,
    };

    addPainLog(newLog);
    openModal('Pain Log Saved', 'Your pain entry has been recorded successfully.', {
      showCancel: false,
      onConfirm: () => {
        closeModal();
        navigation.goBack();
      }
    });
  };

  const renderSeverityScale = () => {
    return (
      <View className="space-y-4">
        <Text className={cn(
          "text-lg font-semibold",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          Pain Level: {severity}/10
        </Text>
        <View className="flex-row justify-between items-center">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
            <Pressable
              key={level}
              onPress={() => setSeverity(level)}
              className={cn(
                "w-8 h-8 rounded-full items-center justify-center",
                level <= severity 
                  ? (level <= 3 ? "bg-green-500" : level <= 6 ? "bg-yellow-500" : "bg-red-500")
                  : (isDarkMode ? "bg-gray-700" : "bg-gray-200")
              )}
            >
              <Text className={cn(
                "text-sm font-semibold",
                level <= severity ? "text-white" : (isDarkMode ? "text-gray-400" : "text-gray-600")
              )}>
                {level}
              </Text>
            </Pressable>
          ))}
        </View>
        <View className="flex-row justify-between">
          <Text className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>
            Mild
          </Text>
          <Text className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>
            Severe
          </Text>
        </View>
      </View>
    );
  };

  const renderOptionGrid = (
    options: readonly any[], 
    selectedValue: string, 
    onSelect: (value: string) => void,
    title: string
  ) => {
    return (
      <View className="space-y-4">
        <Text className={cn(
          "text-lg font-semibold",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          {title} *
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {options.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => onSelect(option.id)}
              className={cn(
                "px-4 py-3 rounded-xl border-2 flex-row items-center space-x-2",
                selectedValue === option.id
                  ? (isDarkMode ? "bg-emerald-600 border-emerald-500" : "bg-emerald-500 border-emerald-400")
                  : (isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"),
                "active:opacity-80"
              )}
            >
              <Ionicons 
                name={option.icon} 
                size={16} 
                color={selectedValue === option.id ? "white" : (isDarkMode ? "#9CA3AF" : "#6B7280")} 
              />
              <Text className={cn(
                "font-medium",
                selectedValue === option.id 
                  ? "text-white" 
                  : (isDarkMode ? "text-gray-300" : "text-gray-700")
              )}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View 
      className={cn(
        "flex-1",
        isDarkMode ? "bg-gray-900" : "bg-white"
      )}
    >
      <ScrollView className="flex-1 px-4" style={{ paddingTop: insets.top + 20 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Pressable
            onPress={() => navigation.goBack()}
            className="p-2 rounded-full"
          >
            <Ionicons name="close" size={24} color={isDarkMode ? "white" : "black"} />
          </Pressable>
          <Text className={cn(
            "text-xl font-bold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Log Pain
          </Text>
          <View className="w-8" />
        </View>

        {/* Body Part Selection */}
        <View className="space-y-4 mb-8">
          <Text className={cn(
            "text-lg font-semibold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Body Part *
          </Text>
          <BodyPartSelector 
            selectedBodyPart={selectedBodyPart}
            onSelectBodyPart={setSelectedBodyPart}
          />
        </View>

        {/* Pain Severity */}
        <View className="mb-8">
          {renderSeverityScale()}
        </View>

        {/* Pain Type */}
        <View className="mb-8">
          {renderOptionGrid(PAIN_TYPES, painType, (value) => setPainType(value as PainLog['painType']), 'Pain Type')}
        </View>

        {/* Pain Cause */}
        <View className="mb-8">
          {renderOptionGrid(PAIN_CAUSES, cause, (value) => setCause(value as PainLog['cause']), 'What caused this pain?')}
        </View>

        {/* Activity */}
        {cause === 'activity' && (
          <View className="space-y-4 mb-8">
            <Text className={cn(
              "text-lg font-semibold",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              What activity were you doing?
            </Text>
            <TextInput
              value={activity}
              onChangeText={setActivity}
              placeholder="e.g., lifting weights, running, gardening"
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              className={cn(
                "p-4 rounded-xl border-2",
                isDarkMode 
                  ? "bg-gray-800 border-gray-700 text-white" 
                  : "bg-white border-gray-200 text-gray-900"
              )}
              multiline
            />
          </View>
        )}

        {/* Photos */}
        <View className="mb-8">
          <PhotoCapture 
            photos={photos}
            onPhotosChange={setPhotos}
          />
        </View>

        {/* Tags */}
        <View className="mb-8">
          <CustomTags
            selectedTags={tags}
            onTagsChange={setTags}
          />
        </View>

        {/* Voice Logging */}
        <View className="mb-8">
          <VoiceLogger 
            onTranscriptionComplete={(transcription) => {
              setDescription(prev => prev ? `${prev}\n\n${transcription}` : transcription);
            }}
          />
        </View>

        {/* Description */}
        <View className="space-y-4 mb-8">
          <Text className={cn(
            "text-lg font-semibold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Pain Description
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe how the pain feels, or use voice recording above..."
            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
            className={cn(
              "p-4 rounded-xl border-2 h-24",
              isDarkMode 
                ? "bg-gray-800 border-gray-700 text-white" 
                : "bg-white border-gray-200 text-gray-900"
            )}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          className={cn(
            "mb-8 p-4 rounded-xl items-center justify-center",
            selectedBodyPart && painType && cause
              ? (isDarkMode ? "bg-emerald-600" : "bg-emerald-500")
              : (isDarkMode ? "bg-gray-700" : "bg-gray-300"),
            "active:opacity-80"
          )}
          disabled={!selectedBodyPart || !painType || !cause}
        >
          <Text className={cn(
            "text-lg font-semibold",
            selectedBodyPart && painType && cause
              ? "text-white"
              : (isDarkMode ? "text-gray-400" : "text-gray-500")
          )}>
            Save Pain Log
          </Text>
        </Pressable>
      </ScrollView>

      <AppModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
        onConfirm={modal.onConfirm}
        showCancel={modal.showCancel ?? false}
      />
    </View>
  );
}
