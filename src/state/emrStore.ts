import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PatientEMR, MedicalHistory, Medication, Vital, ClinicalNote, DiagnosticTest } from "../types/emr";

interface EMRStore {
  patientRecords: PatientEMR[];
  
  // Patient EMR Management
  createPatientEMR: (patientId: string, demographics: PatientEMR['demographics']) => void;
  getPatientEMR: (patientId: string) => PatientEMR | null;
  updatePatientDemographics: (patientId: string, demographics: Partial<PatientEMR['demographics']>) => void;
  
  // Medical History
  addMedicalHistory: (patientId: string, history: Omit<MedicalHistory, 'id' | 'patientId'>) => void;
  updateMedicalHistory: (historyId: string, updates: Partial<MedicalHistory>) => void;
  
  // Medications
  addMedication: (patientId: string, medication: Omit<Medication, 'id' | 'patientId'>) => void;
  updateMedication: (medicationId: string, updates: Partial<Medication>) => void;
  discontinueMedication: (medicationId: string) => void;
  
  // Vitals
  addVital: (patientId: string, vital: Omit<Vital, 'id' | 'patientId'>) => void;
  getLatestVitals: (patientId: string) => Vital | null;
  
  // Clinical Notes
  addClinicalNote: (patientId: string, note: Omit<ClinicalNote, 'id' | 'patientId'>) => void;
  updateClinicalNote: (noteId: string, updates: Partial<ClinicalNote>) => void;
  
  // Diagnostic Tests
  addDiagnosticTest: (patientId: string, test: Omit<DiagnosticTest, 'id' | 'patientId'>) => void;
  updateTestResults: (testId: string, results: string, interpretation?: string) => void;
}

const useEMRStore = create<EMRStore>()(
  persist(
    (set, get) => ({
      patientRecords: [
        // Demo EMR record for demo patient
        {
          id: "emr-demo-patient",
          patientId: "demo-patient",
          demographics: {
            firstName: "John",
            lastName: "Smith",
            dateOfBirth: "1990-01-15",
            gender: "male",
            email: "patient@demo.com",
            phone: "(555) 123-4567",
            emergencyContact: {
              name: "Jane Smith",
              phone: "(555) 987-6543",
              relationship: "Spouse"
            }
          },
          medicalHistory: [
            {
              id: "hist1",
              patientId: "demo-patient",
              date: "2023-01-15",
              type: "diagnosis",
              description: "Chronic Lower Back Pain",
              icd10Code: "M54.5",
              severity: "moderate",
              status: "active",
              notes: "Intermittent pain, worse with prolonged sitting"
            },
            {
              id: "hist2",
              patientId: "demo-patient",
              date: "2022-08-10",
              type: "surgery",
              description: "Arthroscopic Knee Surgery (Right)",
              severity: "moderate",
              status: "resolved"
            }
          ],
          medications: [
            {
              id: "med1",
              patientId: "demo-patient",
              name: "Ibuprofen",
              dosage: "400mg",
              frequency: "TID PRN",
              route: "PO",
              startDate: "2024-01-01",
              prescribedBy: "Dr. Sarah Johnson",
              indication: "Pain management",
              status: "active"
            }
          ],
          vitals: [
            {
              id: "vital1",
              patientId: "demo-patient",
              date: new Date().toISOString(),
              bloodPressure: { systolic: 120, diastolic: 80 },
              heartRate: 72,
              temperature: 98.6,
              weight: 175,
              height: 70,
              bmi: 25.1,
              painScore: 4
            }
          ],
          clinicalNotes: [
            {
              id: "note1",
              patientId: "demo-patient",
              providerId: "demo-provider",
              date: new Date().toISOString(),
              type: "progress",
              chiefComplaint: "Worsening lower back pain over past 2 weeks",
              assessment: "Chronic lumbar pain with recent exacerbation",
              plan: "Continue current pain management, consider PT referral",
              aiGenerated: false
            }
          ],
          diagnosticTests: [
            {
              id: "test1",
              patientId: "demo-patient",
              date: "2024-01-15",
              type: "imaging",
              testName: "Lumbar Spine MRI",
              results: "Mild disc degeneration L4-L5",
              interpretation: "Consistent with degenerative disc disease",
              orderedBy: "Dr. Sarah Johnson",
              status: "completed"
            }
          ],
          allergies: ["Penicillin", "Shellfish"],
          lastUpdated: new Date().toISOString()
        }
      ],
      
      createPatientEMR: (patientId, demographics) => {
        const newEMR: PatientEMR = {
          id: `emr-${patientId}`,
          patientId,
          demographics,
          medicalHistory: [],
          medications: [],
          vitals: [],
          clinicalNotes: [],
          diagnosticTests: [],
          allergies: [],
          lastUpdated: new Date().toISOString()
        };
        
        set({ patientRecords: [...get().patientRecords, newEMR] });
      },
      
      getPatientEMR: (patientId) => {
        return get().patientRecords.find(record => record.patientId === patientId) || null;
      },
      
      updatePatientDemographics: (patientId, demographics) => {
        set({
          patientRecords: get().patientRecords.map(record =>
            record.patientId === patientId
              ? { ...record, demographics: { ...record.demographics, ...demographics }, lastUpdated: new Date().toISOString() }
              : record
          )
        });
      },
      
      addMedicalHistory: (patientId, history) => {
        const newHistory: MedicalHistory = {
          ...history,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          patientId
        };
        
        set({
          patientRecords: get().patientRecords.map(record =>
            record.patientId === patientId
              ? { 
                  ...record, 
                  medicalHistory: [...record.medicalHistory, newHistory],
                  lastUpdated: new Date().toISOString()
                }
              : record
          )
        });
      },
      
      updateMedicalHistory: (historyId, updates) => {
        set({
          patientRecords: get().patientRecords.map(record => ({
            ...record,
            medicalHistory: record.medicalHistory.map(history =>
              history.id === historyId ? { ...history, ...updates } : history
            ),
            lastUpdated: new Date().toISOString()
          }))
        });
      },
      
      addMedication: (patientId, medication) => {
        const newMedication: Medication = {
          ...medication,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          patientId
        };
        
        set({
          patientRecords: get().patientRecords.map(record =>
            record.patientId === patientId
              ? { 
                  ...record, 
                  medications: [...record.medications, newMedication],
                  lastUpdated: new Date().toISOString()
                }
              : record
          )
        });
      },
      
      updateMedication: (medicationId, updates) => {
        set({
          patientRecords: get().patientRecords.map(record => ({
            ...record,
            medications: record.medications.map(med =>
              med.id === medicationId ? { ...med, ...updates } : med
            ),
            lastUpdated: new Date().toISOString()
          }))
        });
      },
      
      discontinueMedication: (medicationId) => {
        set({
          patientRecords: get().patientRecords.map(record => ({
            ...record,
            medications: record.medications.map(med =>
              med.id === medicationId ? { ...med, status: 'discontinued' as const, endDate: new Date().toISOString() } : med
            ),
            lastUpdated: new Date().toISOString()
          }))
        });
      },
      
      addVital: (patientId, vital) => {
        const newVital: Vital = {
          ...vital,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          patientId
        };
        
        set({
          patientRecords: get().patientRecords.map(record =>
            record.patientId === patientId
              ? { 
                  ...record, 
                  vitals: [...record.vitals, newVital],
                  lastUpdated: new Date().toISOString()
                }
              : record
          )
        });
      },
      
      getLatestVitals: (patientId) => {
        const record = get().patientRecords.find(r => r.patientId === patientId);
        if (!record || record.vitals.length === 0) return null;
        
        return record.vitals.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      },
      
      addClinicalNote: (patientId, note) => {
        const newNote: ClinicalNote = {
          ...note,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          patientId
        };
        
        set({
          patientRecords: get().patientRecords.map(record =>
            record.patientId === patientId
              ? { 
                  ...record, 
                  clinicalNotes: [...record.clinicalNotes, newNote],
                  lastUpdated: new Date().toISOString()
                }
              : record
          )
        });
      },
      
      updateClinicalNote: (noteId, updates) => {
        set({
          patientRecords: get().patientRecords.map(record => ({
            ...record,
            clinicalNotes: record.clinicalNotes.map(note =>
              note.id === noteId ? { ...note, ...updates } : note
            ),
            lastUpdated: new Date().toISOString()
          }))
        });
      },
      
      addDiagnosticTest: (patientId, test) => {
        const newTest: DiagnosticTest = {
          ...test,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          patientId
        };
        
        set({
          patientRecords: get().patientRecords.map(record =>
            record.patientId === patientId
              ? { 
                  ...record, 
                  diagnosticTests: [...record.diagnosticTests, newTest],
                  lastUpdated: new Date().toISOString()
                }
              : record
          )
        });
      },
      
      updateTestResults: (testId, results, interpretation) => {
        set({
          patientRecords: get().patientRecords.map(record => ({
            ...record,
            diagnosticTests: record.diagnosticTests.map(test =>
              test.id === testId 
                ? { ...test, results, interpretation, status: 'completed' as const }
                : test
            ),
            lastUpdated: new Date().toISOString()
          }))
        });
      }
    }),
    {
      name: "emr-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useEMRStore;