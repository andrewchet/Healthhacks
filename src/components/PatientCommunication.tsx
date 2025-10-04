import React, { useState } from 'react';
import { View, Text, Pressable, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../types/auth';
import useAppStore from '../state/appStore';
import { cn } from '../utils/cn';
import AppModal from './AppModal';

interface PatientCommunicationProps {
  patient: User;
}

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  fromProvider: boolean;
  read: boolean;
}

interface CarePlan {
  id: string;
  title: string;
  description: string;
  type: 'medication' | 'exercise' | 'therapy' | 'followup' | 'lifestyle';
  status: 'active' | 'completed' | 'paused';
  dueDate?: string;
}

export default function PatientCommunication({ patient }: PatientCommunicationProps) {
  const { isDarkMode } = useAppStore();
  const [chatModal, setChatModal] = useState(false);
  const [carePlanModal, setCarePlanModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [newCarePlan, setNewCarePlan] = useState({
    title: '',
    description: '',
    type: 'medication' as CarePlan['type'],
    dueDate: ''
  });

  const [modal, setModal] = useState<{ visible: boolean; title: string; message: string; onConfirm?: () => void; showCancel?: boolean }>(() => ({ visible: false, title: '', message: '' }));
  const openModal = (title: string, message: string, opts?: { onConfirm?: () => void; showCancel?: boolean }) => setModal({ visible: true, title, message, onConfirm: opts?.onConfirm, showCancel: opts?.showCancel });
  const closeModal = () => setModal((m) => ({ ...m, visible: false }));

  // Mock data - in real app this would come from backend
  const [messages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hi Dr. Johnson, my shoulder pain has been getting worse since our last visit. Should I continue with the exercises?',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      fromProvider: false,
      read: true
    },
    {
      id: '2',
      content: 'Thanks for the update. Please reduce the exercise intensity and ice for 15 minutes after each session. Let\'s schedule a follow-up for next week.',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      fromProvider: true,
      read: true
    }
  ]);

  const [carePlans] = useState<CarePlan[]>([
    {
      id: '1',
      title: 'Physical Therapy Exercises',
      description: 'Shoulder strengthening routine - 3 sets of 10, twice daily',
      type: 'exercise',
      status: 'active',
      dueDate: '2024-01-15'
    },
    {
      id: '2',
      title: 'Anti-inflammatory Medication',
      description: 'Ibuprofen 400mg twice daily with food',
      type: 'medication',
      status: 'active'
    }
  ]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    // In real app, this would send to backend
    openModal('Message Sent', 'Your message has been sent to the patient securely.', { showCancel: false });
    setNewMessage('');
  };

  const handleCreateCarePlan = () => {
    if (!newCarePlan.title.trim() || !newCarePlan.description.trim()) {
      openModal('Error', 'Please fill in all required fields.', { showCancel: false });
      return;
    }

    // In real app, this would save to backend
    openModal('Care Plan Created', "The care plan has been added to the patient's record.", {
      showCancel: false,
      onConfirm: () => {
        closeModal();
        setCarePlanModal(false);
      }
    });
    setNewCarePlan({ title: '', description: '', type: 'medication', dueDate: '' });
  };

  const getCarePlanIcon = (type: CarePlan['type']) => {
    switch (type) {
      case 'medication': return 'medical';
      case 'exercise': return 'fitness';
      case 'therapy': return 'people';
      case 'followup': return 'calendar';
      case 'lifestyle': return 'leaf';
      default: return 'clipboard';
    }
  };

  const getCarePlanColor = (type: CarePlan['type']) => {
    switch (type) {
      case 'medication': return '#EF4444';
      case 'exercise': return '#10B981';
      case 'therapy': return '#8B5CF6';
      case 'followup': return '#3B82F6';
      case 'lifestyle': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  return (
    <View className="space-y-4">
      {/* Communication Hub */}
      <View className={cn(
        "p-4 rounded-xl",
        isDarkMode ? "bg-gray-800" : "bg-white"
      )}>
        <View className="flex-row items-center space-x-2 mb-4">
          <Ionicons 
            name="chatbubbles" 
            size={20} 
            color={isDarkMode ? "#10B981" : "#059669"} 
          />
          <Text className={cn(
            "text-lg font-semibold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Patient Communication
          </Text>
        </View>

        <View className="space-y-3">
          <Pressable
            onPress={() => setChatModal(true)}
            className={cn(
              "flex-row items-center justify-between p-4 rounded-xl",
              isDarkMode ? "bg-blue-900/30" : "bg-blue-50"
            )}
          >
            <View className="flex-row items-center space-x-3">
              <Ionicons name="chatbubble" size={20} color={isDarkMode ? "#60A5FA" : "#3B82F6"} />
              <View>
                <Text className={cn(
                  "font-semibold",
                  isDarkMode ? "text-blue-300" : "text-blue-700"
                )}>
                  Secure Messaging
                </Text>
                <Text className={cn(
                  "text-sm",
                  isDarkMode ? "text-blue-200" : "text-blue-600"
                )}>
                  {messages.length} messages • HIPAA compliant
                </Text>
              </View>
            </View>
            <View className="flex-row items-center space-x-2">
              {messages.filter(m => !m.read && !m.fromProvider).length > 0 && (
                <View className="w-3 h-3 rounded-full bg-red-500" />
              )}
              <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#60A5FA" : "#3B82F6"} />
            </View>
          </Pressable>

          <Pressable
            onPress={() => openModal('Video Call', 'Telemedicine integration would enable secure video consultations with the patient.', { showCancel: false })}
            className={cn(
              "flex-row items-center justify-between p-4 rounded-xl",
              isDarkMode ? "bg-green-900/30" : "bg-green-50"
            )}
          >
            <View className="flex-row items-center space-x-3">
              <Ionicons name="videocam" size={20} color={isDarkMode ? "#10B981" : "#059669"} />
              <View>
                <Text className={cn(
                  "font-semibold",
                  isDarkMode ? "text-green-300" : "text-green-700"
                )}>
                  Video Consultation
                </Text>
                <Text className={cn(
                  "text-sm",
                  isDarkMode ? "text-green-200" : "text-green-600"
                )}>
                  Schedule or start telehealth visit
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#10B981" : "#059669"} />
          </Pressable>
        </View>
      </View>

      {/* Care Plan Management */}
      <View className={cn(
        "p-4 rounded-xl",
        isDarkMode ? "bg-gray-800" : "bg-white"
      )}>
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center space-x-2">
            <Ionicons 
              name="clipboard" 
              size={20} 
              color={isDarkMode ? "#F59E0B" : "#D97706"} 
            />
            <Text className={cn(
              "text-lg font-semibold",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              Care Plans
            </Text>
          </View>
          <Pressable
            onPress={() => setCarePlanModal(true)}
            className={cn(
              "px-3 py-2 rounded-lg",
              isDarkMode ? "bg-emerald-600" : "bg-emerald-500"
            )}
          >
            <Text className="text-white text-sm font-semibold">Add Plan</Text>
          </Pressable>
        </View>

        <View className="space-y-3">
          {carePlans.map((plan) => (
            <View
              key={plan.id}
              className={cn(
                "p-3 rounded-lg border-l-4",
                isDarkMode ? "bg-gray-700" : "bg-gray-50"
              )}
              style={{ borderLeftColor: getCarePlanColor(plan.type) }}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center space-x-2 mb-1">
                    <Ionicons 
                      name={getCarePlanIcon(plan.type)} 
                      size={16} 
                      color={getCarePlanColor(plan.type)} 
                    />
                    <Text className={cn(
                      "font-semibold",
                      isDarkMode ? "text-white" : "text-gray-900"
                    )}>
                      {plan.title}
                    </Text>
                  </View>
                  <Text className={cn(
                    "text-sm mb-2",
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    {plan.description}
                  </Text>
                  {plan.dueDate && (
                    <Text className={cn(
                      "text-xs",
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    )}>
                      Due: {new Date(plan.dueDate).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <View className={cn(
                  "px-2 py-1 rounded-full",
                  plan.status === 'active' 
                    ? (isDarkMode ? "bg-green-900/30" : "bg-green-100")
                    : plan.status === 'completed'
                    ? (isDarkMode ? "bg-blue-900/30" : "bg-blue-100")
                    : (isDarkMode ? "bg-yellow-900/30" : "bg-yellow-100")
                )}>
                  <Text className={cn(
                    "text-xs font-medium",
                    plan.status === 'active' 
                      ? (isDarkMode ? "text-green-300" : "text-green-700")
                      : plan.status === 'completed'
                      ? (isDarkMode ? "text-blue-300" : "text-blue-700")
                      : (isDarkMode ? "text-yellow-300" : "text-yellow-700")
                  )}>
                    {plan.status}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Chat Modal */}
      <Modal
        visible={chatModal}
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
              Chat with {patient.name}
            </Text>
            <Pressable onPress={() => setChatModal(false)}>
              <Ionicons name="close" size={24} color={isDarkMode ? "white" : "black"} />
            </Pressable>
          </View>

          <ScrollView className="flex-1 p-4">
            {messages.map((message) => (
              <View
                key={message.id}
                className={cn(
                  "mb-4 max-w-[80%]",
                  message.fromProvider ? "self-end" : "self-start"
                )}
              >
                <View className={cn(
                  "p-3 rounded-lg",
                  message.fromProvider 
                    ? (isDarkMode ? "bg-emerald-600" : "bg-emerald-500")
                    : (isDarkMode ? "bg-gray-700" : "bg-gray-100")
                )}>
                  <Text className={cn(
                    "text-sm",
                    message.fromProvider 
                      ? "text-white"
                      : (isDarkMode ? "text-white" : "text-gray-900")
                  )}>
                    {message.content}
                  </Text>
                  <Text className={cn(
                    "text-xs mt-1",
                    message.fromProvider 
                      ? "text-emerald-100"
                      : (isDarkMode ? "text-gray-400" : "text-gray-600")
                  )}>
                    {message.timestamp.toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View className={cn(
            "p-4 border-t",
            isDarkMode ? "border-gray-700" : "border-gray-200"
          )}>
            <View className="flex-row space-x-3">
              <TextInput
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Type your message..."
                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                className={cn(
                  "flex-1 p-3 rounded-lg border",
                  isDarkMode 
                    ? "bg-gray-800 border-gray-700 text-white" 
                    : "bg-white border-gray-200 text-gray-900"
                )}
              />
              <Pressable
                onPress={handleSendMessage}
                className={cn(
                  "px-4 py-3 rounded-lg",
                  isDarkMode ? "bg-emerald-600" : "bg-emerald-500"
                )}
              >
                <Ionicons name="send" size={16} color="white" />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Care Plan Modal */}
      <Modal
        visible={carePlanModal}
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
              Create Care Plan
            </Text>
            <Pressable onPress={() => setCarePlanModal(false)}>
              <Ionicons name="close" size={24} color={isDarkMode ? "white" : "black"} />
            </Pressable>
          </View>

          <ScrollView className="flex-1 p-4">
            <View className="space-y-4">
              <View>
                <Text className={cn(
                  "text-sm font-medium mb-2",
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  Plan Title
                </Text>
                <TextInput
                  value={newCarePlan.title}
                  onChangeText={(text) => setNewCarePlan(prev => ({ ...prev, title: text }))}
                  placeholder="e.g., Physical Therapy Exercises"
                  placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                  className={cn(
                    "p-3 rounded-lg border",
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
                  Description
                </Text>
                <TextInput
                  value={newCarePlan.description}
                  onChangeText={(text) => setNewCarePlan(prev => ({ ...prev, description: text }))}
                  placeholder="Detailed instructions for the patient..."
                  placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                  className={cn(
                    "p-3 rounded-lg border h-24",
                    isDarkMode 
                      ? "bg-gray-800 border-gray-700 text-white" 
                      : "bg-white border-gray-200 text-gray-900"
                  )}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <Pressable
                onPress={handleCreateCarePlan}
                className={cn(
                  "p-4 rounded-lg items-center",
                  isDarkMode ? "bg-emerald-600" : "bg-emerald-500"
                )}
              >
                <Text className="text-white text-lg font-semibold">Create Care Plan</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>

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
