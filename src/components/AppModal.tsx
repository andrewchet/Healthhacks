import React from "react";
import { Modal, View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useAppStore from "../state/appStore";
import { cn } from "../utils/cn";

interface AppModalProps {
  visible: boolean;
  title: string;
  message?: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  destructive?: boolean;
  children?: React.ReactNode;
}

export default function AppModal({
  visible,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = "OK",
  cancelText = "Cancel",
  showCancel = true,
  destructive = false,
  children,
}: AppModalProps) {
  const { isDarkMode } = useAppStore();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 items-center justify-end">
        {/* Backdrop */}
        <Pressable
          onPress={onClose}
          className="absolute top-0 left-0 right-0 bottom-0 bg-black/40"
        />

        {/* Sheet */}
        <View
          className={cn(
            "w-full rounded-t-3xl p-5",
            isDarkMode ? "bg-gray-900" : "bg-white"
          )}
          style={{ paddingBottom: 24 }}
        >
          {/* Handle */}
          <View
            className={cn(
              "self-center w-10 h-1.5 rounded-full mb-4",
              isDarkMode ? "bg-gray-700" : "bg-gray-300"
            )}
          />

          {/* Header */}
          <View className="flex-row items-center space-x-2 mb-2">
            <Ionicons
              name="information-circle"
              size={20}
              color={destructive ? "#EF4444" : isDarkMode ? "#10B981" : "#059669"}
            />
            <Text
              className={cn(
                "text-lg font-semibold",
                isDarkMode ? "text-white" : "text-gray-900"
              )}
            >
              {title}
            </Text>
          </View>

          {message ? (
            <Text
              className={cn(
                "text-sm mb-4",
                isDarkMode ? "text-gray-300" : "text-gray-700"
              )}
            >
              {message}
            </Text>
          ) : null}

          {children}

          {/* Actions */}
          <View className="flex-row justify-end space-x-2 mt-4">
            {showCancel && (
              <Pressable
                onPress={onClose}
                className={cn(
                  "px-4 py-2 rounded-xl",
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                )}
              >
                <Text className={cn("font-medium", isDarkMode ? "text-white" : "text-gray-800")}>{cancelText}</Text>
              </Pressable>
            )}
            {onConfirm && (
              <Pressable
                onPress={onConfirm}
                className={cn(
                  "px-4 py-2 rounded-xl",
                  destructive
                    ? isDarkMode
                      ? "bg-red-600"
                      : "bg-red-500"
                    : isDarkMode
                    ? "bg-emerald-600"
                    : "bg-emerald-500"
                )}
              >
                <Text className="text-white font-semibold">{confirmText}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
