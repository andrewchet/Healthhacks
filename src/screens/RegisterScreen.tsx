import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import useAppStore from '../state/appStore';
import useAuthStore from '../state/authStore';
import { RegisterData } from '../types/auth';
import { cn } from '../utils/cn';
import AppModal from '../components/AppModal';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isDarkMode } = useAppStore();
  const { register } = useAuthStore();
  
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    name: '',
    userType: 'patient'
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [modal, setModal] = useState<{ visible: boolean; title: string; message: string; onConfirm?: () => void; confirmText?: string; showCancel?: boolean }>({ visible: false, title: '', message: '' });
  const openModal = (title: string, message: string, opts?: { onConfirm?: () => void; confirmText?: string; showCancel?: boolean }) => setModal({ visible: true, title, message, onConfirm: opts?.onConfirm, confirmText: opts?.confirmText, showCancel: opts?.showCancel });
  const closeModal = () => setModal((m) => ({ ...m, visible: false }));

  const updateFormData = (field: keyof RegisterData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    // Validation
    if (!formData.email.trim() || !formData.password.trim() || !formData.name.trim()) {
      openModal('Missing Information', 'Please fill in all required fields.', { showCancel: false });
      return;
    }

    if (formData.password !== confirmPassword) {
      openModal('Password Mismatch', 'Passwords do not match.', { showCancel: false });
      return;
    }

    if (formData.userType === 'provider' && !formData.licenseNumber?.trim()) {
      openModal('Missing Information', 'License number is required for healthcare providers.', { showCancel: false });
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await register(formData);
      
      if (success) {
        openModal(
          'Registration Successful',
          'Your account has been created successfully!',
          {
            confirmText: 'OK',
            showCancel: false,
            onConfirm: () => {
              closeModal();
              if (formData.userType === 'provider') {
                navigation.reset({ index: 0, routes: [{ name: 'ProviderDashboard' }] });
              } else {
                navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
              }
            }
          }
        );
      } else {
        openModal('Registration Failed', 'An account with this email already exists.', { showCancel: false });
      }
    } catch (error) {
      openModal('Error', 'An error occurred during registration. Please try again.', { showCancel: false });
    } finally {
      setIsLoading(false);
    }
  };

  const goToLogin = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View 
        className={cn(
          "flex-1",
          isDarkMode ? "bg-gray-900" : "bg-white"
        )}
        style={{ paddingTop: insets.top }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <Pressable
            onPress={goToLogin}
            className="p-2 rounded-full"
          >
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? "white" : "black"} />
          </Pressable>
          <Text className={cn(
            "text-xl font-bold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Create Account
          </Text>
          <View className="w-8" />
        </View>

        <ScrollView 
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="space-y-6">
            {/* User Type Selection */}
            <View>
              <Text className={cn(
                "text-lg font-semibold mb-4",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>
                I am a:
              </Text>
              <View className="flex-row space-x-3">
                <Pressable
                  onPress={() => updateFormData('userType', 'patient')}
                  className={cn(
                    "flex-1 p-4 rounded-xl border-2 items-center",
                    formData.userType === 'patient'
                      ? (isDarkMode ? "bg-emerald-600 border-emerald-500" : "bg-emerald-500 border-emerald-400")
                      : (isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"),
                    "active:opacity-80"
                  )}
                >
                  <Ionicons 
                    name="person" 
                    size={24} 
                    color={formData.userType === 'patient' ? "white" : (isDarkMode ? "#9CA3AF" : "#6B7280")} 
                  />
                  <Text className={cn(
                    "font-semibold mt-2",
                    formData.userType === 'patient' 
                      ? "text-white"
                      : (isDarkMode ? "text-gray-300" : "text-gray-700")
                  )}>
                    Patient
                  </Text>
                </Pressable>
                
                <Pressable
                  onPress={() => updateFormData('userType', 'provider')}
                  className={cn(
                    "flex-1 p-4 rounded-xl border-2 items-center",
                    formData.userType === 'provider'
                      ? (isDarkMode ? "bg-emerald-600 border-emerald-500" : "bg-emerald-500 border-emerald-400")
                      : (isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"),
                    "active:opacity-80"
                  )}
                >
                  <Ionicons 
                    name="medical" 
                    size={24} 
                    color={formData.userType === 'provider' ? "white" : (isDarkMode ? "#9CA3AF" : "#6B7280")} 
                  />
                  <Text className={cn(
                    "font-semibold mt-2",
                    formData.userType === 'provider' 
                      ? "text-white"
                      : (isDarkMode ? "text-gray-300" : "text-gray-700")
                  )}>
                    Healthcare Provider
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Basic Information */}
            <View className="space-y-4">
              {/* Name */}
              <View>
                <Text className={cn(
                  "text-sm font-medium mb-2",
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  Full Name *
                </Text>
                <TextInput
                  value={formData.name}
                  onChangeText={(value) => updateFormData('name', value)}
                  placeholder="Enter your full name"
                  placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                  className={cn(
                    "p-4 rounded-xl border-2",
                    isDarkMode 
                      ? "bg-gray-800 border-gray-700 text-white" 
                      : "bg-white border-gray-200 text-gray-900"
                  )}
                />
              </View>

              {/* Email */}
              <View>
                <Text className={cn(
                  "text-sm font-medium mb-2",
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  Email *
                </Text>
                <TextInput
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  placeholder="Enter your email"
                  placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                  className={cn(
                    "p-4 rounded-xl border-2",
                    isDarkMode 
                      ? "bg-gray-800 border-gray-700 text-white" 
                      : "bg-white border-gray-200 text-gray-900"
                  )}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password */}
              <View>
                <Text className={cn(
                  "text-sm font-medium mb-2",
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  Password *
                </Text>
                <TextInput
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  placeholder="Create a password"
                  placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                  className={cn(
                    "p-4 rounded-xl border-2",
                    isDarkMode 
                      ? "bg-gray-800 border-gray-700 text-white" 
                      : "bg-white border-gray-200 text-gray-900"
                  )}
                  secureTextEntry
                />
              </View>

              {/* Confirm Password */}
              <View>
                <Text className={cn(
                  "text-sm font-medium mb-2",
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  Confirm Password *
                </Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                  className={cn(
                    "p-4 rounded-xl border-2",
                    isDarkMode 
                      ? "bg-gray-800 border-gray-700 text-white" 
                      : "bg-white border-gray-200 text-gray-900"
                  )}
                  secureTextEntry
                />
              </View>
            </View>

            {/* Provider-specific fields */}
            {formData.userType === 'provider' && (
              <View className="space-y-4">
                <Text className={cn(
                  "text-lg font-semibold",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>
                  Professional Information
                </Text>
                
                <View>
                  <Text className={cn(
                    "text-sm font-medium mb-2",
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    License Number *
                  </Text>
                  <TextInput
                    value={formData.licenseNumber || ''}
                    onChangeText={(value) => updateFormData('licenseNumber', value)}
                    placeholder="Enter your medical license number"
                    placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                    className={cn(
                      "p-4 rounded-xl border-2",
                      isDarkMode 
                        ? "bg-gray-800 border-gray-700 text-white" 
                        : "bg-white border-gray-200 text-gray-900"
                    )}
                  />
                </View>

                <View>
                  <Text className={cn(
                    "text-sm font-medium mb-2",
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    Specialty (Optional)
                  </Text>
                  <TextInput
                    value={formData.specialty || ''}
                    onChangeText={(value) => updateFormData('specialty', value)}
                    placeholder="e.g. Pain Management, Orthopedics"
                    placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                    className={cn(
                      "p-4 rounded-xl border-2",
                      isDarkMode 
                        ? "bg-gray-800 border-gray-700 text-white" 
                        : "bg-white border-gray-200 text-gray-900"
                    )}
                  />
                </View>
              </View>
            )}

            {/* Patient-specific fields */}
            {formData.userType === 'patient' && (
              <View>
                <Text className={cn(
                  "text-sm font-medium mb-2",
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  Date of Birth (Optional)
                </Text>
                <TextInput
                  value={formData.dateOfBirth || ''}
                  onChangeText={(value) => updateFormData('dateOfBirth', value)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                  className={cn(
                    "p-4 rounded-xl border-2",
                    isDarkMode 
                      ? "bg-gray-800 border-gray-700 text-white" 
                      : "bg-white border-gray-200 text-gray-900"
                  )}
                />
              </View>
            )}

            {/* Register Button */}
            <Pressable
              onPress={handleRegister}
              disabled={isLoading}
              className={cn(
                "w-full py-4 px-6 rounded-xl items-center justify-center mt-8",
                isLoading
                  ? (isDarkMode ? "bg-gray-700" : "bg-gray-300")
                  : (isDarkMode ? "bg-emerald-600" : "bg-emerald-500"),
                "active:opacity-80"
              )}
            >
              <Text className={cn(
                "text-lg font-semibold",
                isLoading 
                  ? (isDarkMode ? "text-gray-400" : "text-gray-500")
                  : "text-white"
              )}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </Pressable>

            {/* Login Link */}
            <View className="flex-row justify-center items-center">
              <Text className={cn(
                "text-sm",
                isDarkMode ? "text-gray-400" : "text-gray-600"
              )}>
                Already have an account?{' '}
              </Text>
              <Pressable onPress={goToLogin}>
                <Text className={cn(
                  "text-sm font-semibold",
                  isDarkMode ? "text-emerald-400" : "text-emerald-600"
                )}>
                  Sign In
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

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
    </KeyboardAvoidingView>
  );
}
