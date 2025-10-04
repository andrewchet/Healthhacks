import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { transcribeAudio } from '../api/transcribe-audio';
import useAppStore from '../state/appStore';
import { cn } from '../utils/cn';
import AppModal from './AppModal';

interface VoiceLoggerProps {
  onTranscriptionComplete: (transcription: string) => void;
}

export default function VoiceLogger({ onTranscriptionComplete }: VoiceLoggerProps) {
  const { isDarkMode } = useAppStore();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const [modal, setModal] = useState<{ visible: boolean; title: string; message: string; onConfirm?: () => void; confirmText?: string; showCancel?: boolean }>({ visible: false, title: '', message: '' });
  const openModal = (title: string, message: string, opts?: { onConfirm?: () => void; confirmText?: string; showCancel?: boolean }) => setModal({ visible: true, title, message, onConfirm: opts?.onConfirm, confirmText: opts?.confirmText, showCancel: opts?.showCancel });
  const closeModal = () => setModal((m) => ({ ...m, visible: false }));

  const requestPermission = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      setHasPermission(permission.granted);
      return permission.granted;
    } catch (error) {
      console.error('Error requesting audio permission:', error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      let permissionGranted = hasPermission;
      
      if (permissionGranted === null) {
        permissionGranted = await requestPermission();
      }

      if (!permissionGranted) {
        openModal(
          'Microphone Permission Required',
          'Please allow microphone access to use voice logging.',
          { showCancel: true, confirmText: 'Open Settings', onConfirm: requestPermission }
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      openModal('Error', 'Failed to start recording. Please try again.', { showCancel: false });
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      
      const uri = recording.getURI();
      if (uri) {
        setIsProcessing(true);
        
        try {
          const transcription = await transcribeAudio(uri);
          onTranscriptionComplete(transcription);
          
          openModal(
            'Voice Transcribed!', 
            'Your voice note has been converted to text and added to your pain log.',
            { showCancel: false }
          );
        } catch (transcriptionError) {
          console.error('Transcription failed:', transcriptionError);
          openModal(
            'Transcription Failed', 
            'Unable to convert speech to text. Please try speaking more clearly or check your internet connection.',
            { showCancel: false }
          );
        }
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      openModal('Error', 'Failed to process recording. Please try again.', { showCancel: false });
    } finally {
      setRecording(null);
      setIsProcessing(false);
    }
  };

  const handlePress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <View className="space-y-4">
      <Text className={cn(
        "text-lg font-semibold",
        isDarkMode ? "text-white" : "text-gray-900"
      )}>
        Voice Pain Log
      </Text>
      
      <Text className={cn(
        "text-sm",
        isDarkMode ? "text-gray-400" : "text-gray-600"
      )}>
        Tap and hold to record your pain description, then release to transcribe
      </Text>

      <View className="items-center space-y-4">
        <Pressable
          onPress={handlePress}
          disabled={isProcessing}
          className={cn(
            "w-20 h-20 rounded-full items-center justify-center",
            isRecording 
              ? "bg-red-500" 
              : isProcessing
              ? (isDarkMode ? "bg-gray-700" : "bg-gray-300")
              : (isDarkMode ? "bg-emerald-600" : "bg-emerald-500"),
            "active:opacity-80"
          )}
          style={{
            transform: isRecording ? [{ scale: 1.1 }] : [{ scale: 1 }],
          }}
        >
          {isProcessing ? (
            <Ionicons name="hourglass" size={32} color="white" />
          ) : isRecording ? (
            <Ionicons name="stop" size={32} color="white" />
          ) : (
            <Ionicons name="mic" size={32} color="white" />
          )}
        </Pressable>

        <Text className={cn(
          "text-sm font-medium text-center",
          isRecording 
            ? "text-red-500"
            : isProcessing
            ? (isDarkMode ? "text-gray-400" : "text-gray-600")
            : (isDarkMode ? "text-emerald-400" : "text-emerald-600")
        )}>
          {isProcessing 
            ? 'Converting speech to text...'
            : isRecording 
            ? 'Recording... Tap to stop'
            : 'Tap to start voice recording'
          }
        </Text>

        {isRecording && (
          <View className="flex-row space-x-1">
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                className="w-2 h-2 bg-red-500 rounded-full"
                style={{
                  opacity: (Date.now() % 1000) < 500 ? 1 : 0.3,
                }}
              />
            ))}
          </View>
        )}
      </View>

      {/* Voice Tips */}
      <View className={cn(
        "p-3 rounded-xl",
        isDarkMode ? "bg-blue-900/30" : "bg-blue-50"
      )}>
        <View className="flex-row items-start space-x-2">
          <Ionicons 
            name="bulb" 
            size={16} 
            color={isDarkMode ? "#60A5FA" : "#3B82F6"} 
            style={{ marginTop: 1 }}
          />
          <View className="flex-1">
            <Text className={cn(
              "text-sm font-medium mb-1",
              isDarkMode ? "text-blue-300" : "text-blue-700"
            )}>
              Voice Recording Tips:
            </Text>
            <Text className={cn(
              "text-xs leading-relaxed",
              isDarkMode ? "text-blue-200" : "text-blue-600"
            )}>
              • Speak clearly and at normal pace{'\n'}
              • Describe location, intensity, and type of pain{'\n'}
              • Mention triggers or activities{'\n'}
              • Include how it affects your daily life
            </Text>
          </View>
        </View>
      </View>

      <AppModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
        onConfirm={modal.onConfirm}
        confirmText={modal.confirmText}
        showCancel={modal.showCancel ?? false}
      />
    </View>
  );
}
