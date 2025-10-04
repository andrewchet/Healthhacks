export interface MedicalHistory {
  id: string;
  patientId: string;
  date: string;
  type: 'diagnosis' | 'surgery' | 'medication' | 'allergy' | 'family_history' | 'social_history';
  description: string;
  icd10Code?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  status: 'active' | 'resolved' | 'chronic';
  notes?: string;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  indication: string;
  status: 'active' | 'discontinued' | 'completed';
  sideEffects?: string[];
}

export interface Vital {
  id: string;
  patientId: string;
  date: string;
  bloodPressure?: { systolic: number; diastolic: number };
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  painScore?: number;
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  providerId: string;
  date: string;
  type: 'progress' | 'consultation' | 'assessment' | 'treatment_plan' | 'discharge';
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  physicalExam?: string;
  assessment?: string;
  plan?: string;
  followUp?: string;
  aiGenerated?: boolean;
}

export interface DiagnosticTest {
  id: string;
  patientId: string;
  date: string;
  type: 'lab' | 'imaging' | 'biopsy' | 'other';
  testName: string;
  results?: string;
  interpretation?: string;
  orderedBy: string;
  status: 'ordered' | 'pending' | 'completed' | 'cancelled';
}

export interface PatientEMR {
  id: string;
  patientId: string;
  demographics: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    address?: string;
    phone?: string;
    email: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  medicalHistory: MedicalHistory[];
  medications: Medication[];
  vitals: Vital[];
  clinicalNotes: ClinicalNote[];
  diagnosticTests: DiagnosticTest[];
  allergies: string[];
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
  };
  lastUpdated: string;
}