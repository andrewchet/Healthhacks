import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAppStore from '../state/appStore';
import useAuthStore from '../state/authStore';
import usePainStore from '../state/painStore';
import { User } from '../types/auth';
import { generateDoctorReport } from '../utils/doctorExport';
import { BODY_PARTS } from '../types/pain';
import PainProgressChart from '../components/PainProgressChart';
import AISummary from '../components/AISummary';
import ProviderReportTools from '../components/ProviderReportTools';
import PatientCommunication from '../components/PatientCommunication';
import PatientTags from '../components/PatientTags';
import { cn } from '../utils/cn';
import AppModal from '../components/AppModal';

export default function ProviderDashboard() {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useAppStore();
  const { currentUser, getSharedPatients, logout } = useAuthStore();
  const { painLogs } = usePainStore();
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'ai' | 'reports' | 'communication' | 'tags'>('overview');
  const [sortBy, setSortBy] = useState<'name' | 'lastEntry' | 'severity' | 'priority'>('name');
  const [filterBy, setFilterBy] = useState<'all' | 'urgent' | 'monitoring' | 'severe'>('all');

  const [modal, setModal] = useState<{ visible: boolean; title: string; message: string; showCancel?: boolean; onConfirm?: () => void }>({ visible: false, title: '', message: '' });
  const openModal = (title: string, message: string, opts?: { showCancel?: boolean; onConfirm?: () => void }) => setModal({ visible: true, title, message, showCancel: opts?.showCancel, onConfirm: opts?.onConfirm });
  const closeModal = () => setModal((m) => ({ ...m, visible: false }));

  const sharedPatients = getSharedPatients();

  // Enhanced patient data with mock classifications and last entry info
  const enhancedPatients = useMemo(() => {
    return sharedPatients.map(patient => {
      const patientLogs = painLogs; // In real app, filter by patient ID
      const lastEntry = patientLogs[0];
      const avgSeverity = patientLogs.length > 0 
        ? patientLogs.reduce((sum, log) => sum + log.severity, 0) / patientLogs.length 
        : 0;
      
      // Mock classification data - in real app this would come from backend
      const mockTags = patient.id === 'demo-patient' 
        ? ['Chronic Back Pain', 'Moderate Severity', 'Monitoring Required']
        : ['Arthritis', 'Mild Severity'];
        
      return {
        ...patient,
        lastEntry: lastEntry ? new Date(lastEntry.date + ' ' + lastEntry.time) : null,
        avgSeverity: Math.round(avgSeverity * 10) / 10,
        tags: mockTags,
        priority: mockTags.some(t => t.includes('Urgent')) ? 'urgent' as const :
                 mockTags.some(t => t.includes('Monitoring')) ? 'monitoring' as const :
                 'routine' as const
      };
    });
  }, [sharedPatients, painLogs]);

  // Sort and filter patients
  const sortedAndFilteredPatients = useMemo(() => {
    let filtered = enhancedPatients;
    
    // Apply filters
    if (filterBy === 'urgent') {
      filtered = filtered.filter(p => p.priority === 'urgent');
    } else if (filterBy === 'monitoring') {
      filtered = filtered.filter(p => p.priority === 'monitoring');
    } else if (filterBy === 'severe') {
      filtered = filtered.filter(p => p.avgSeverity >= 7);
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'lastEntry':
          if (!a.lastEntry && !b.lastEntry) return 0;
          if (!a.lastEntry) return 1;
          if (!b.lastEntry) return -1;
          return b.lastEntry.getTime() - a.lastEntry.getTime();
        case 'severity':
          return b.avgSeverity - a.avgSeverity;
        case 'priority':
          const priorityOrder = { urgent: 3, monitoring: 2, routine: 1 } as const;
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        default:
          return 0;
      }
    });
  }, [enhancedPatients, sortBy, filterBy]);

  // Get pain logs for selected patient (in real app, this would be filtered by patient ID)
  const patientPainLogs = useMemo(() => {
    if (!selectedPatient) return [] as typeof painLogs;
    // For demo purposes, showing all logs. In production, filter by patient ID
    return painLogs;
  }, [selectedPatient, painLogs]);

  const patientReport = useMemo(() => {
    if (patientPainLogs.length === 0) return null;
    return generateDoctorReport(patientPainLogs);
  }, [patientPainLogs]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // In real app, this would fetch latest patient data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleLogout = () => {
    logout();
  };

  const renderPatientCard = (patient: typeof enhancedPatients[0]) => (
    <Pressable
      key={patient.id}
      onPress={() => setSelectedPatient(patient)}
      className={cn(
        "p-4 rounded-xl border-2 mb-3",
        selectedPatient?.id === patient.id
          ? (isDarkMode ? "bg-emerald-600 border-emerald-500" : "bg-emerald-500 border-emerald-400")
          : (isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"),
        "active:opacity-70"
      )}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-center space-x-2 mb-1">
            <Text className={cn(
              "text-lg font-semibold",
              selectedPatient?.id === patient.id 
                ? "text-white"
                : (isDarkMode ? "text-white" : "text-gray-900")
            )}>
              {patient.name}
            </Text>
            {patient.priority === 'urgent' && (
              <View className="w-2 h-2 rounded-full bg-red-500" />
            )}
            {patient.priority === 'monitoring' && (
              <View className="w-2 h-2 rounded-full bg-yellow-500" />
            )}
          </View>
          
          <Text className={cn(
            "text-sm mb-1",
            selectedPatient?.id === patient.id 
              ? "text-emerald-100"
              : (isDarkMode ? "text-gray-400" : "text-gray-600")
          )}>
            {patient.email}
          </Text>
          
          {/* Patient stats */}
          <View className="flex-row items-center space-x-3">
            <Text className={cn(
              "text-xs",
              selectedPatient?.id === patient.id 
                ? "text-emerald-100"
                : (isDarkMode ? "text-gray-400" : "text-gray-600")
            )}>
              Avg: {patient.avgSeverity}/10
            </Text>
            {patient.lastEntry && (
              <Text className={cn(
                "text-xs",
                selectedPatient?.id === patient.id 
                  ? "text-emerald-100"
                  : (isDarkMode ? "text-gray-400" : "text-gray-600")
              )}>
                Last: {patient.lastEntry.toLocaleDateString()}
              </Text>
            )}
          </View>
          
          {/* Tags preview */}
          <View className="flex-row items-center space-x-1 mt-1">
            {patient.tags.slice(0, 2).map((tag, index) => (
              <View
                key={index}
                className={cn(
                  "px-2 py-1 rounded-full",
                  selectedPatient?.id === patient.id 
                    ? "bg-white/20"
                    : (isDarkMode ? "bg-gray-700" : "bg-gray-100")
                )}
              >
                <Text className={cn(
                  "text-xs",
                  selectedPatient?.id === patient.id 
                    ? "text-white"
                    : (isDarkMode ? "text-gray-300" : "text-gray-600")
                )}>
                  {tag}
                </Text>
              </View>
            ))}
            {patient.tags.length > 2 && (
              <Text className={cn(
                "text-xs",
                selectedPatient?.id === patient.id 
                  ? "text-emerald-100"
                  : (isDarkMode ? "text-gray-400" : "text-gray-600")
              )}>
                +{patient.tags.length - 2}
              </Text>
            )}
          </View>
        </View>
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={selectedPatient?.id === patient.id ? "white" : (isDarkMode ? "#9CA3AF" : "#6B7280")} 
        />
      </View>
    </Pressable>
  );

  const renderAnalyticsCard = (title: string, value: string, icon: keyof typeof Ionicons.glyphMap, color?: string) => (
    <View className={cn(
      "flex-1 p-4 rounded-xl",
      isDarkMode ? "bg-gray-800" : "bg-white",
      "shadow-sm"
    )}>
      <View className="flex-row items-center space-x-2 mb-2">
        <Ionicons 
          name={icon} 
          size={20} 
          color={color || (isDarkMode ? "#10B981" : "#059669")} 
        />
        <Text className={cn(
          "text-sm font-medium",
          isDarkMode ? "text-gray-400" : "text-gray-600"
        )}>
          {title}
        </Text>
      </View>
      <Text className={cn(
        "text-lg font-bold",
        isDarkMode ? "text-white" : "text-gray-900"
      )}>
        {value}
      </Text>
    </View>
  );

  const renderPatientAnalysis = () => {
    if (!selectedPatient || !patientReport) {
      return (
        <View className={cn(
          "p-8 rounded-xl items-center",
          isDarkMode ? "bg-gray-800" : "bg-white"
        )}>
          <Ionicons 
            name="person-outline" 
            size={48} 
            color={isDarkMode ? "#6B7280" : "#9CA3AF"} 
          />
          <Text className={cn(
            "text-lg font-semibold mt-4 mb-2",
            isDarkMode ? "text-gray-300" : "text-gray-700"
          )}>
            {selectedPatient ? 'No Data Available' : 'Select a Patient'}
          </Text>
          <Text className={cn(
            "text-center",
            isDarkMode ? "text-gray-400" : "text-gray-600"
          )}>
            {selectedPatient 
              ? 'This patient has not shared any pain data yet'
              : 'Choose a patient from the list to view their pain data and trends'
            }
          </Text>
        </View>
      );
    }

    const bodyPartDisplayName = BODY_PARTS.find(
      part => part.id === patientReport.summary.mostCommonBodyPart
    )?.displayName || patientReport.summary.mostCommonBodyPart;

    const getTrendColor = () => {
      switch (patientReport.summary.painTrend) {
        case 'improving': return '#10B981';
        case 'worsening': return '#EF4444';
        default: return isDarkMode ? '#6B7280' : '#9CA3AF';
      }
    };

    return (
      <View className="space-y-6">
        {/* Patient Header */}
        <View className={cn(
          "p-4 rounded-xl",
          isDarkMode ? "bg-gray-800" : "bg-white"
        )}>
          <Text className={cn(
            "text-xl font-bold mb-2",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            {selectedPatient.name}
          </Text>
          <Text className={cn(
            "text-sm",
            isDarkMode ? "text-gray-400" : "text-gray-600"
          )}>
            Analysis Period: {patientReport.summary.dateRange}
          </Text>
        </View>

        {/* Quick Stats */}
        <View className="space-y-4">
          <View className="flex-row space-x-3">
            {renderAnalyticsCard(
              'Total Entries',
              patientReport.summary.totalEntries.toString(),
              'list'
            )}
            {renderAnalyticsCard(
              'Average Pain',
              `${patientReport.summary.averagePain}/10`,
              'pulse',
              patientReport.summary.averagePain <= 3 ? '#10B981' : patientReport.summary.averagePain <= 6 ? '#F59E0B' : '#EF4444'
            )}
          </View>
          
          <View className="flex-row space-x-3">
            {renderAnalyticsCard(
              'Most Affected Area',
              bodyPartDisplayName,
              'body'
            )}
            {renderAnalyticsCard(
              'Pain Trend',
              patientReport.summary.painTrend,
              patientReport.summary.painTrend === 'improving' ? 'trending-down' : 
               patientReport.summary.painTrend === 'worsening' ? 'trending-up' : 'remove',
              getTrendColor()
            )}
          </View>
        </View>

        {/* Pain Patterns */}
        <View className={cn(
          "p-4 rounded-xl",
          isDarkMode ? "bg-gray-800" : "bg-white"
        )}>
          <Text className={cn(
            "text-lg font-semibold mb-4",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Pain Patterns
          </Text>
          
          <View className="space-y-3">
            <View>
              <Text className={cn(
                "text-sm font-medium mb-2",
                isDarkMode ? "text-gray-300" : "text-gray-700"
              )}>
                By Body Part:
              </Text>
              {Object.entries(patientReport.patterns.painByBodyPart)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([bodyPart, count]) => (
                  <View key={bodyPart} className="flex-row justify-between items-center mb-1">
                    <Text className={cn(
                      "text-sm",
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    )}>
                      {BODY_PARTS.find(part => part.id === bodyPart)?.displayName || bodyPart}
                    </Text>
                    <Text className={cn(
                      "text-sm font-medium",
                      isDarkMode ? "text-white" : "text-gray-900"
                    )}>
                      {count} episodes
                    </Text>
                  </View>
                ))}
            </View>

            <View>
              <Text className={cn(
                "text-sm font-medium mb-2",
                isDarkMode ? "text-gray-300" : "text-gray-700"
              )}>
                By Pain Type:
              </Text>
              {Object.entries(patientReport.patterns.painByType)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([type, count]) => (
                  <View key={type} className="flex-row justify-between items-center mb-1">
                    <Text className={cn(
                      "text-sm capitalize",
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    )}>
                      {type}
                    </Text>
                    <Text className={cn(
                      "text-sm font-medium",
                      isDarkMode ? "text-white" : "text-gray-900"
                    )}>
                      {count} episodes
                    </Text>
                  </View>
                ))}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View 
      className={cn(
        "flex-1",
        isDarkMode ? "bg-gray-900" : "bg-gray-50"
      )}
    >
      {/* Header */}
      <View 
        className={cn(
          "px-4 py-3 border-b",
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        )}
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className={cn(
              "text-xl font-bold",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              Provider Dashboard
            </Text>
            <Text className={cn(
              "text-sm",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}>
              Welcome, {currentUser?.name}
            </Text>
          </View>
          <Pressable
            onPress={handleLogout}
            className={cn(
              "p-2 rounded-full",
              isDarkMode ? "bg-gray-700" : "bg-gray-100"
            )}
          >
            <Ionicons 
              name="log-out-outline" 
              size={20} 
              color={isDarkMode ? "#EF4444" : "#DC2626"} 
            />
          </Pressable>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View className="p-4 space-y-6">
          {/* Patients List */}
          <View>
            <View className="flex-row items-center justify-between mb-4">
              <Text className={cn(
                "text-xl font-bold",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>
                My Patients ({sortedAndFilteredPatients.length}/{sharedPatients.length})
              </Text>
              
              {/* Sort/Filter Controls */}
              <View className="flex-row space-x-2">
                <Pressable
                  onPress={() => {
                    const sortOptions = ['name', 'lastEntry', 'severity', 'priority'] as const;
                    const currentIndex = sortOptions.indexOf(sortBy as any);
                    const nextSort = sortOptions[(currentIndex + 1) % sortOptions.length];
                    setSortBy(nextSort as any);
                  }}
                  className={cn(
                    "px-3 py-2 rounded-lg flex-row items-center space-x-1",
                    isDarkMode ? "bg-gray-700" : "bg-gray-100"
                  )}
                >
                  <Ionicons name="swap-vertical" size={14} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
                  <Text className={cn(
                    "text-xs font-medium",
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    {sortBy}
                  </Text>
                </Pressable>
                
                <Pressable
                  onPress={() => {
                    const filterOptions = ['all', 'urgent', 'monitoring', 'severe'] as const;
                    const currentIndex = filterOptions.indexOf(filterBy as any);
                    const nextFilter = filterOptions[(currentIndex + 1) % filterOptions.length];
                    setFilterBy(nextFilter as any);
                  }}
                  className={cn(
                    "px-3 py-2 rounded-lg flex-row items-center space-x-1",
                    filterBy !== 'all' 
                      ? (isDarkMode ? "bg-emerald-600" : "bg-emerald-500")
                      : (isDarkMode ? "bg-gray-700" : "bg-gray-100")
                  )}
                >
                  <Ionicons 
                    name="filter" 
                    size={14} 
                    color={filterBy !== 'all' ? "white" : (isDarkMode ? "#9CA3AF" : "#6B7280")} 
                  />
                  <Text className={cn(
                    "text-xs font-medium",
                    filterBy !== 'all' 
                      ? "text-white"
                      : (isDarkMode ? "text-gray-300" : "text-gray-700")
                  )}>
                    {filterBy}
                  </Text>
                </Pressable>
              </View>
            </View>
            
            {sharedPatients.length === 0 ? (
              <View className={cn(
                "p-6 rounded-xl items-center",
                isDarkMode ? "bg-gray-800" : "bg-white"
              )}>
                <Ionicons 
                  name="people-outline" 
                  size={48} 
                  color={isDarkMode ? "#6B7280" : "#9CA3AF"} 
                />
                <Text className={cn(
                  "text-lg font-semibold mt-4 mb-2",
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  No Patients Yet
                </Text>
                <Text className={cn(
                  "text-center",
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                )}>
                  Patients will appear here when they share their pain data with you
                </Text>
              </View>
            ) : (
              <View>
                {sortedAndFilteredPatients.map(renderPatientCard)}
              </View>
            )}
          </View>

          {/* Patient Analysis */}
          {selectedPatient && patientPainLogs.length > 0 && (
            <View>
              <Text className={cn(
                "text-xl font-bold mb-4",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>
                Patient Analysis - {selectedPatient.name}
              </Text>
              
              {/* Tab Navigation */}
              <View className="flex-row mb-6">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row space-x-2">
                    {[
                      { id: 'overview', label: 'Overview', icon: 'stats-chart' },
                      { id: 'progress', label: 'Progress Graph', icon: 'trending-up' },
                      { id: 'ai', label: 'AI Insights', icon: 'sparkles' },
                      { id: 'reports', label: 'Reports', icon: 'document-text' },
                      { id: 'communication', label: 'Communication', icon: 'chatbubbles' },
                      { id: 'tags', label: 'Classifications', icon: 'pricetags' },
                    ].map((tab) => (
                      <Pressable
                        key={tab.id}
                        onPress={() => setActiveTab(tab.id as any)}
                        className={cn(
                          "py-3 px-4 rounded-xl border-2 flex-row items-center space-x-2",
                          activeTab === tab.id
                            ? (isDarkMode ? "bg-emerald-600 border-emerald-500" : "bg-emerald-500 border-emerald-400")
                            : (isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"),
                          "active:opacity-80"
                        )}
                      >
                        <Ionicons 
                          name={tab.icon as any} 
                          size={16} 
                          color={activeTab === tab.id ? "white" : (isDarkMode ? "#9CA3AF" : "#6B7280")} 
                        />
                        <Text className={cn(
                          "text-sm font-medium whitespace-nowrap",
                          activeTab === tab.id
                            ? "text-white"
                            : (isDarkMode ? "text-gray-300" : "text-gray-700")
                        )}>
                          {tab.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* Tab Content */}
              <View className="space-y-6">
                {activeTab === 'overview' && renderPatientAnalysis()}
                {activeTab === 'progress' && (
                  <PainProgressChart 
                    painLogs={patientPainLogs} 
                    timeRange="month"
                    onFlareUpPress={(log) => {
                      openModal(
                        'Flare-Up Alert',
                        `High pain episode detected on ${new Date(log.date).toLocaleDateString()}\n\nSeverity: ${log.severity}/10\nLocation: ${BODY_PARTS.find(p => p.id === log.bodyPart)?.displayName || log.bodyPart}\nType: ${log.painType}\n\n${log.description || 'No additional notes'}`,
                        { showCancel: false }
                      );
                    }}
                  />
                )}
                {activeTab === 'ai' && (
                  <AISummary 
                    painLogs={patientPainLogs}
                    patientName={selectedPatient.name}
                  />
                )}
                {activeTab === 'reports' && (
                  <ProviderReportTools 
                    painLogs={patientPainLogs}
                    patient={selectedPatient}
                  />
                )}
                {activeTab === 'communication' && (
                  <PatientCommunication 
                    patient={selectedPatient}
                  />
                )}
                {activeTab === 'tags' && (
                  <PatientTags 
                    patient={selectedPatient}
                    onTagsUpdate={(tags) => {
                      console.log('Updated tags for', selectedPatient.name, ':', tags);
                    }}
                  />
                )}
              </View>
            </View>
          )}

          {/* Show message when no patient selected but patients exist */}
          {sharedPatients.length > 0 && !selectedPatient && (
            <View>
              <Text className={cn(
                "text-xl font-bold mb-4",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>
                Patient Analysis
              </Text>
              {renderPatientAnalysis()}
            </View>
          )}
        </View>
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
