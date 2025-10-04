import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import useAppStore from '../state/appStore';
import useAuthStore from '../state/authStore';
import { cn } from '../utils/cn';
import AppModal from '../components/AppModal';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isDarkMode } = useAppStore();
  const { login } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [modal, setModal] = useState({ visible: false, title: '', message: '' });
  const showModal = (title: string, message: string) => setModal({ visible: true, title, message });
  const closeModal = () => setModal((m) => ({ ...m, visible: false }));

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showModal('Missing Information', 'Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await login(email.trim(), password);
      
      if (success) {
        // Get the current user to determine where to navigate
        const currentUser = useAuthStore.getState().currentUser;
        if (currentUser?.userType === 'provider') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'ProviderDashboard' }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
        }
      } else {
        showModal(
          'Login Failed', 
          'Invalid email or password. Try:\n• patient@demo.com\n• provider@demo.com\n(Any password)'
        );
      }
    } catch (error) {
      showModal('Error', 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const goToRegister = () => {
    navigation.navigate('Register');
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
        <ScrollView 
          className="flex-1 px-6"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center space-y-8">
            {/* App Icon */}
            <View className={cn(
              "w-24 h-24 rounded-3xl items-center justify-center",
              isDarkMode ? "bg-emerald-600" : "bg-emerald-500"
            )}>
              <Ionicons 
                name="medical" 
                size={48} 
                color="white" 
              />
            </View>

            {/* Title */}
            <View className="items-center space-y-2">
              <Text className={cn(
                "text-3xl font-bold text-center",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>
                Welcome Back
              </Text>
              <Text className={cn(
                "text-lg text-center",
                isDarkMode ? "text-gray-300" : "text-gray-600"
              )}>
                Sign in to ReliefLog
              </Text>
            </View>

            {/* Demo Info */}
            <View className={cn(
              "p-4 rounded-xl w-full max-w-sm",
              isDarkMode ? "bg-blue-900/30" : "bg-blue-50"
            )}>
              <Text className={cn(
                "text-sm font-semibold mb-2",
                isDarkMode ? "text-blue-300" : "text-blue-700"
              )}>
                Demo Accounts:
              </Text>
              <Text className={cn(
                "text-sm",
                isDarkMode ? "text-blue-200" : "text-blue-600"
              )}>
                Patient: patient@demo.com{'\n'}
                Provider: provider@demo.com{'\n'}
                (Use any password)
              </Text>
            </View>

            {/* Login Form */}
            <View className="w-full max-w-sm space-y-4">
              {/* Email Input */}
              <View>
                <Text className={cn(
                  "text-sm font-medium mb-2",
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  Email
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
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

              {/* Password Input */}
              <View>
                <Text className={cn(
                  "text-sm font-medium mb-2",
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  Password
                </Text>
                <View className="relative">
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                    className={cn(
                      "p-4 pr-12 rounded-xl border-2",
                      isDarkMode 
                        ? "bg-gray-800 border-gray-700 text-white" 
                        : "bg-white border-gray-200 text-gray-900"
                    )}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4"
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color={isDarkMode ? "#9CA3AF" : "#6B7280"} 
                    />
                  </Pressable>
                </View>
              </View>

              {/* Login Button */}
              <Pressable
                onPress={handleLogin}
                disabled={isLoading}
                className={cn(
                  "w-full py-4 px-6 rounded-xl items-center justify-center",
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
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Text>
              </Pressable>

              {/* Register Link */}
              <View className="flex-row justify-center items-center">
                <Text className={cn(
                  "text-sm",
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                )}>
                  Don't have an account?{' '}
                </Text>
                <Pressable onPress={goToRegister}>
                  <Text className={cn(
                    "text-sm font-semibold",
                    isDarkMode ? "text-emerald-400" : "text-emerald-600"
                  )}>
                    Sign Up
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>

        <AppModal
          visible={modal.visible}
          title={modal.title}
          message={modal.message}
          onClose={closeModal}
          showCancel={false}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
