import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Share, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import useAppStore from "../state/appStore";
import usePainStore from "../state/painStore";
import useAuthStore from "../state/authStore";
import { generateDoctorReport, formatReportForSharing } from "../utils/doctorExport";
import AnimatedToggle from "../components/AnimatedToggle";
import AppModal from "../components/AppModal";
import { cn } from "../utils/cn";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isDarkMode, toggleDarkMode, resetOnboarding, resetApp } = useAppStore();
  const { painLogs } = usePainStore();
  const { currentUser, shareDataWithProvider, logout } = useAuthStore();

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState<string | undefined>(undefined);
  const [modalConfirmText, setModalConfirmText] = useState("OK");
  const [modalCancelText, setModalCancelText] = useState("Cancel");
  const [modalDestructive, setModalDestructive] = useState(false);
  const [modalOnConfirm, setModalOnConfirm] = useState<(() => void) | undefined>(undefined);
  const [modalShowCancel, setModalShowCancel] = useState(true);
  const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);

  // Share with provider input
  const [providerEmail, setProviderEmail] = useState("");

  const openModal = (opts: {
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
    onConfirm?: () => void;
    showCancel?: boolean;
    content?: React.ReactNode;
  }) => {
    setModalTitle(opts.title);
    setModalMessage(opts.message);
    setModalConfirmText(opts.confirmText ?? "OK");
    setModalCancelText(opts.cancelText ?? "Cancel");
    setModalDestructive(!!opts.destructive);
    setModalOnConfirm(() => opts.onConfirm);
    setModalShowCancel(opts.showCancel ?? true);
    setModalContent(opts.content ?? null);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalContent(null);
    setModalOnConfirm(undefined);
    setProviderEmail("");
  };

  const handleResetOnboarding = () => {
    openModal({
      title: "Return to Welcome Screen",
      message: "This will take you back to the welcome screen without deleting your pain logs.",
      confirmText: "Go to Welcome",
      onConfirm: () => {
        resetOnboarding();
        closeModal();
      },
    });
  };

  const handleResetData = () => {
    openModal({
      title: "Reset All Data",
      message: "This will permanently delete all your pain logs and reset the app. This action cannot be undone.",
      confirmText: "Delete All Data",
      cancelText: "Cancel",
      destructive: true,
      onConfirm: () => {
        resetApp();
        openModal({ title: "Data Reset", message: "All data has been cleared successfully.", showCancel: false });
      },
    });
  };

  const handleExportData = () => {
    if (painLogs.length === 0) {
      openModal({ title: "No Data", message: "You don\"t have any pain logs to export yet.", showCancel: false });
      return;
    }

    openModal({
      title: "Export Data",
      message:
        "Data export feature would generate a CSV file with your pain logs. This feature would be implemented in a production version.",
      showCancel: false,
    });
  };

  const handleDoctorExport = async () => {
    if (painLogs.length === 0) {
      openModal({ title: "No Data", message: "You don\"t have any pain logs to export yet.", showCancel: false });
      return;
    }

    try {
      const report = generateDoctorReport(painLogs);
      const reportText = formatReportForSharing(report);

      await Share.share({
        message: reportText,
        title: "Pain Report for Healthcare Provider",
      });
    } catch (error) {
      openModal({ title: "Error", message: "Failed to generate doctor report. Please try again.", showCancel: false });
    }
  };

  const handleShareWithProvider = () => {
    setProviderEmail("");
    openModal({
      title: "Share with Healthcare Provider",
      message: "Enter the email address of your healthcare provider to share your pain data:",
      confirmText: "Share",
      content: (
        <View className="mt-2">
          <TextInput
            value={providerEmail}
            onChangeText={setProviderEmail}
            placeholder="provider@example.com"
            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
            className={cn(
              "p-4 rounded-xl border-2",
              isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"
            )}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      ),
      onConfirm: () => {
        if (providerEmail && providerEmail.trim()) {
          const success = shareDataWithProvider(providerEmail.trim());
          closeModal();
          if (success) {
            openModal({ title: "Success", message: `Your pain data is now shared with ${providerEmail}`, showCancel: false });
          } else {
            openModal({ title: "Error", message: "Provider not found. Please check the email address.", showCancel: false });
          }
        }
      },
    });
  };

  const handleLogout = () => {
    openModal({
      title: "Sign Out",
      message: "Are you sure you want to sign out?",
      confirmText: "Sign Out",
      destructive: true,
      onConfirm: () => {
        logout();
        closeModal();
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      },
    });
  };

  const handleContactSupport = () => {
    openModal({
      title: "Contact Support",
      message:
        "For support and feedback, you can reach out through the app store or contact the development team.",
      showCancel: false,
    });
  };

  const handlePrivacyPolicy = () => {
    openModal({
      title: "Privacy Policy",
      message:
        "Your pain logs are stored locally on your device and are not shared with any third parties. The AI chat feature uses secure connections to provide health information.",
      showCancel: false,
    });
  };

  const renderSettingItem = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightElement?: React.ReactNode,
    destructive?: boolean
  ) => (
    <Pressable
      onPress={onPress}
      className={cn(
        "flex-row items-center p-4 rounded-xl mb-3",
        isDarkMode ? "bg-gray-800" : "bg-white",
        "active:opacity-70"
      )}
      disabled={!onPress}
    >
      <View className={cn(
        "w-10 h-10 rounded-full items-center justify-center mr-4",
        destructive ? "bg-red-500" : isDarkMode ? "bg-emerald-600" : "bg-emerald-500"
      )}>
        <Ionicons name={icon} size={20} color="white" />
      </View>

      <View className="flex-1">
        <Text
          className={cn(
            "text-lg font-medium",
            destructive ? "text-red-500" : isDarkMode ? "text-white" : "text-gray-900"
          )}
        >
          {title}
        </Text>
        {subtitle && (
          <Text className={cn("text-sm mt-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>{subtitle}</Text>
        )}
      </View>

      {rightElement && <View className="ml-4">{rightElement}</View>}

      {onPress && !rightElement && (
        <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
      )}
    </Pressable>
  );

  const renderToggleSwitch = (value: boolean, onToggle: () => void) => (
    <AnimatedToggle value={value} onToggle={onToggle} />
  );

  return (
    <View
      className={cn("flex-1", isDarkMode ? "bg-gray-900" : "bg-gray-50")}
    >
      <ScrollView
        className="flex-1 px-4"
        style={{ paddingTop: insets.top + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-8">
          <Text className={cn("text-3xl font-bold mb-2", isDarkMode ? "text-white" : "text-gray-900")}>
            Settings
          </Text>
          <Text className={cn("text-lg", isDarkMode ? "text-gray-300" : "text-gray-600")}>
            Customize your ReliefLog experience
          </Text>
        </View>

        {/* Appearance */}
        <View className="mb-8">
          <Text className={cn("text-xl font-bold mb-4", isDarkMode ? "text-white" : "text-gray-900")}>
            Appearance
          </Text>

          {renderSettingItem(
            isDarkMode ? "moon" : "sunny",
            "Dark Mode",
            isDarkMode ? "Dark theme enabled" : "Light theme enabled",
            toggleDarkMode,
            renderToggleSwitch(isDarkMode, toggleDarkMode)
          )}
        </View>

        {/* Data Management */}
        <View className="mb-8">
          <Text className={cn("text-xl font-bold mb-4", isDarkMode ? "text-white" : "text-gray-900")}>
            Data Management
          </Text>

          {currentUser?.userType === "patient" &&
            renderSettingItem(
              "people",
              "Share with Provider",
              "Allow healthcare provider to access your data",
              handleShareWithProvider
            )}

          {renderSettingItem(
            "medical",
            "Doctor Report",
            "Generate comprehensive report for healthcare visits",
            handleDoctorExport
          )}

          {renderSettingItem(
            "download",
            "Export Data",
            `Export your ${painLogs.length} pain logs to CSV`,
            handleExportData
          )}

          {renderSettingItem(
            "trash",
            "Reset All Data",
            "Permanently delete all pain logs",
            handleResetData,
            undefined,
            true
          )}
        </View>

        {/* Account */}
        <View className="mb-8">
          <Text className={cn("text-xl font-bold mb-4", isDarkMode ? "text-white" : "text-gray-900")}>
            Account
          </Text>

          {renderSettingItem(
            "refresh",
            "Return to Welcome Screen",
            "Go back to the welcome screen",
            handleResetOnboarding
          )}

          {renderSettingItem(
            "log-out",
            "Sign Out",
            `Sign out of ${currentUser?.email}`,
            handleLogout,
            undefined,
            true
          )}
        </View>

        {/* Support & Information */}
        <View className="mb-8">
          <Text className={cn("text-xl font-bold mb-4", isDarkMode ? "text-white" : "text-gray-900")}>
            Support & Information
          </Text>

          {renderSettingItem(
            "shield-checkmark",
            "Privacy Policy",
            "How we protect your data",
            handlePrivacyPolicy
          )}

          {renderSettingItem(
            "mail",
            "Contact Support",
            "Get help or send feedback",
            handleContactSupport
          )}

          {renderSettingItem(
            "information-circle",
            "About ReliefLog",
            "Version 1.0.0"
          )}
        </View>

        {/* App Statistics */}
        <View className={cn("p-4 rounded-xl mb-8", isDarkMode ? "bg-gray-800" : "bg-white")}> 
          <Text className={cn("text-lg font-semibold mb-3", isDarkMode ? "text-white" : "text-gray-900")}>
            Your Progress
          </Text>

          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                Total Pain Logs
              </Text>
              <Text className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
                {painLogs.length}
              </Text>
            </View>

            {painLogs.length > 0 && (
              <View className="flex-row justify-between">
                <Text className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                  First Entry
                </Text>
                <Text className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
                  {new Date(painLogs[painLogs.length - 1]?.date).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Disclaimer */}
        <View className={cn("p-4 rounded-xl mb-8", isDarkMode ? "bg-yellow-900/30" : "bg-yellow-50")}> 
          <View className="flex-row items-start space-x-2">
            <Ionicons name="warning" size={20} color={isDarkMode ? "#FCD34D" : "#F59E0B"} />
            <View className="flex-1">
              <Text className={cn("text-sm font-medium mb-1", isDarkMode ? "text-yellow-300" : "text-yellow-700")}>
                Medical Disclaimer
              </Text>
              <Text className={cn("text-sm leading-relaxed", isDarkMode ? "text-yellow-200" : "text-yellow-600")}>
                ReliefLog is for tracking purposes only and does not replace professional medical advice, diagnosis, or treatment. Always consult healthcare providers for medical concerns.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Global modal */}
      <AppModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        onClose={closeModal}
        onConfirm={modalOnConfirm}
        confirmText={modalConfirmText}
        cancelText={modalCancelText}
        destructive={modalDestructive}
        showCancel={modalShowCancel}
      >
        {modalContent}
      </AppModal>
    </View>
  );
}
