import React, { useState } from 'react';
import { View, Text, Pressable, Modal, Image, Dimensions } from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import useAppStore from '../state/appStore';
import { cn } from '../utils/cn';
import AppModal from './AppModal';

const { width: screenWidth } = Dimensions.get('window');

interface PhotoCaptureProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
}

export default function PhotoCapture({ photos, onPhotosChange }: PhotoCaptureProps) {
  const { isDarkMode } = useAppStore();

  const [modal, setModal] = useState<{ visible: boolean; title: string; message?: string; options?: boolean }>({ visible: false, title: '' });
  const closeModal = () => setModal((m) => ({ ...m, visible: false }));

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onPhotosChange([...photos, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setModal({ visible: true, title: 'Error', message: 'Failed to select image. Please try again.' });
    } finally {
      closeModal();
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const showPhotoOptions = () => {
    setModal({ visible: true, title: 'Add Photo', message: 'Choose how you want to add a photo', options: true });
  };

  const openCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onPhotosChange([...photos, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      setModal({ visible: true, title: 'Error', message: 'Failed to take photo. Please try again.' });
    } finally {
      closeModal();
    }
  };

  return (
    <View className="space-y-4">
      <Text className={cn(
        "text-lg font-semibold",
        isDarkMode ? "text-white" : "text-gray-900"
      )}>
        Photos (Optional)
      </Text>
      
      <Text className={cn(
        "text-sm",
        isDarkMode ? "text-gray-400" : "text-gray-600"
      )}>
        Add photos to track swelling, bruising, or range of motion over time
      </Text>

      {/* Photo Grid */}
      {photos.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {photos.map((photoUri, index) => (
            <View key={index} className="relative">
              <Image
                source={{ uri: photoUri }}
                className="w-20 h-20 rounded-xl"
                resizeMode="cover"
              />
              <Pressable
                onPress={() => removePhoto(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
              >
                <Ionicons name="close" size={12} color="white" />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Add Photo Button */}
      {photos.length < 3 && (
        <Pressable
          onPress={showPhotoOptions}
          className={cn(
            "p-4 rounded-xl border-2 border-dashed flex-row items-center justify-center space-x-2",
            isDarkMode 
              ? "border-gray-600 bg-gray-800/50" 
              : "border-gray-300 bg-gray-50",
            "active:opacity-70"
          )}
        >
          <Ionicons 
            name="camera" 
            size={20} 
            color={isDarkMode ? "#9CA3AF" : "#6B7280"} 
          />
          <Text className={cn(
            "font-medium",
            isDarkMode ? "text-gray-400" : "text-gray-600"
          )}>
            Add Photo {photos.length > 0 && `(${photos.length}/3)`}
          </Text>
        </Pressable>
      )}

      <AppModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
        showCancel={modal.options ? true : false}
      >
        {modal.options && (
          <View className="flex-row justify-end space-x-2 mt-2">
            <Pressable
              onPress={openCamera}
              className={cn(
                "px-4 py-2 rounded-xl",
                isDarkMode ? "bg-emerald-600" : "bg-emerald-500"
              )}
            >
              <Text className="text-white font-semibold">Take Photo</Text>
            </Pressable>
            <Pressable
              onPress={pickFromGallery}
              className={cn(
                "px-4 py-2 rounded-xl",
                isDarkMode ? "bg-blue-600" : "bg-blue-500"
              )}
            >
              <Text className="text-white font-semibold">Photo Library</Text>
            </Pressable>
          </View>
        )}
      </AppModal>
    </View>
  );
}
