import { PainLog } from '../types/pain';
import { PatientEMR, MedicalHistory, Medication } from '../types/emr';
import { getOpenAIChatResponse } from '../api/chat-service';

export interface AIAnalysis {
  differentialDiagnosis: {
    condition: string;
    probability: number;
    reasoning: string;
    icd10Code?: string;
  }[];
  riskFactors: string[];
  redFlags: string[];
  recommendedTests: {
    test: string;
    urgency: 'routine' | 'urgent' | 'emergent';
    reasoning: string;
  }[];
  treatmentPlan: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  followUp: {
    timeframe: string;
    parameters: string[];
  };
  patientEducation: string[];
}

export interface MedicationRecommendation {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  indication: string;
  contraindications: string[];
  monitoring: string[];
  alternatives: string[];
}

export const generateAIClinicalAnalysis = async (
  painLogs: PainLog[],
  patientEMR: PatientEMR | null
): Promise<AIAnalysis> => {
  try {
    const analysisPrompt = createClinicalAnalysisPrompt(painLogs, patientEMR);
    const response = await getOpenAIChatResponse(analysisPrompt);
    
    // Parse the AI response into structured format
    return parseAIAnalysisResponse(response.content);
  } catch (error) {
    console.error('AI Clinical Analysis Error:', error);
    return getFallbackAnalysis();
  }
};

export const generateMedicationRecommendations = async (
  painLogs: PainLog[],
  patientEMR: PatientEMR | null,
  currentMedications: Medication[]
): Promise<MedicationRecommendation[]> => {
  try {
    const medicationPrompt = createMedicationPrompt(painLogs, patientEMR, currentMedications);
    const response = await getOpenAIChatResponse(medicationPrompt);
    
    return parseMedicationResponse(response.content);
  } catch (error) {
    console.error('Medication Recommendation Error:', error);
    return [];
  }
};

export const generateProgressNote = async (
  painLogs: PainLog[],
  patientEMR: PatientEMR | null,
  chiefComplaint: string
): Promise<{
  historyOfPresentIllness: string;
  assessment: string;
  plan: string;
}> => {
  try {
    const progressPrompt = createProgressNotePrompt(painLogs, patientEMR, chiefComplaint);
    const response = await getOpenAIChatResponse(progressPrompt);
    
    return parseProgressNoteResponse(response.content);
  } catch (error) {
    console.error('Progress Note Generation Error:', error);
    return {
      historyOfPresentIllness: 'Unable to generate HPI automatically.',
      assessment: 'Clinical assessment pending.',
      plan: 'Treatment plan to be determined.'
    };
  }
};

export const identifyRedFlags = (painLogs: PainLog[], patientEMR: PatientEMR | null): string[] => {
  const redFlags: string[] = [];
  
  // Check for concerning pain patterns
  const highSeverityLogs = painLogs.filter(log => log.severity >= 8);
  if (highSeverityLogs.length > 3) {
    redFlags.push('Multiple episodes of severe pain (8+/10)');
  }
  
  // Check for neurological symptoms in descriptions
  const neurologicalKeywords = ['numbness', 'tingling', 'weakness', 'paralysis', 'loss of sensation'];
  const neurologicalSymptoms = painLogs.filter(log => 
    neurologicalKeywords.some(keyword => 
      log.description?.toLowerCase().includes(keyword)
    )
  );
  if (neurologicalSymptoms.length > 0) {
    redFlags.push('Possible neurological symptoms reported');
  }
  
  // Check for head/neck pain
  const headNeckPain = painLogs.filter(log => 
    log.bodyPart.includes('head') || log.bodyPart.includes('neck')
  );
  if (headNeckPain.length > 0 && headNeckPain.some(log => log.severity >= 7)) {
    redFlags.push('Severe head/neck pain - consider secondary causes');
  }
  
  // Check for chest pain
  const chestPain = painLogs.filter(log => log.bodyPart.includes('chest'));
  if (chestPain.length > 0) {
    redFlags.push('Chest pain - cardiac evaluation may be indicated');
  }
  
  // Check medical history for concerning conditions
  if (patientEMR?.medicalHistory) {
    const cancerHistory = patientEMR.medicalHistory.filter(history => 
      history.description.toLowerCase().includes('cancer') ||
      history.description.toLowerCase().includes('malignancy')
    );
    if (cancerHistory.length > 0) {
      redFlags.push('History of malignancy - consider metastatic disease');
    }
  }
  
  return redFlags;
};

const createClinicalAnalysisPrompt = (painLogs: PainLog[], patientEMR: PatientEMR | null): string => {
  const patientAge = patientEMR ? calculateAge(patientEMR.demographics.dateOfBirth) : 'unknown';
  const medicalHistory = patientEMR?.medicalHistory.map(h => h.description).join(', ') || 'None documented';
  const currentMeds = patientEMR?.medications.filter(m => m.status === 'active').map(m => `${m.name} ${m.dosage}`).join(', ') || 'None';
  
  const painSummary = summarizePainLogs(painLogs);
  
  return `You are an expert clinician analyzing a patient's pain presentation. Provide a comprehensive clinical analysis.

PATIENT INFORMATION:
- Age: ${patientAge}
- Medical History: ${medicalHistory}
- Current Medications: ${currentMeds}

PAIN PRESENTATION:
${painSummary}

Please provide a structured clinical analysis in the following JSON format:
{
  "differentialDiagnosis": [
    {
      "condition": "Most likely diagnosis",
      "probability": 70,
      "reasoning": "Clinical reasoning",
      "icd10Code": "M54.5"
    }
  ],
  "riskFactors": ["List of relevant risk factors"],
  "redFlags": ["Any concerning features requiring urgent evaluation"],
  "recommendedTests": [
    {
      "test": "Test name",
      "urgency": "routine|urgent|emergent",
      "reasoning": "Why this test is needed"
    }
  ],
  "treatmentPlan": {
    "immediate": ["Immediate interventions"],
    "shortTerm": ["Short-term management (days to weeks)"],
    "longTerm": ["Long-term management (months)"]
  },
  "followUp": {
    "timeframe": "When to follow up",
    "parameters": ["What to monitor"]
  },
  "patientEducation": ["Key education points for patient"]
}

Focus on evidence-based medicine and include appropriate clinical reasoning. Consider both common and serious causes of pain.`;
};

const createMedicationPrompt = (
  painLogs: PainLog[], 
  patientEMR: PatientEMR | null, 
  currentMedications: Medication[]
): string => {
  const allergies = patientEMR?.allergies.join(', ') || 'None documented';
  const currentMeds = currentMedications.map(m => `${m.name} ${m.dosage} ${m.frequency}`).join(', ') || 'None';
  const painSummary = summarizePainLogs(painLogs);
  
  return `You are a clinical pharmacologist providing medication recommendations for pain management.

PATIENT INFORMATION:
- Current Medications: ${currentMeds}
- Known Allergies: ${allergies}
- Pain Pattern: ${painSummary}

Provide medication recommendations in JSON format:
[
  {
    "medication": "Drug name",
    "dosage": "Specific dosage",
    "frequency": "How often",
    "duration": "How long",
    "indication": "What it's for",
    "contraindications": ["List of contraindications"],
    "monitoring": ["What to monitor"],
    "alternatives": ["Alternative options"]
  }
]

Consider drug interactions, contraindications, and evidence-based pain management guidelines. Prioritize safety and efficacy.`;
};

const createProgressNotePrompt = (
  painLogs: PainLog[], 
  patientEMR: PatientEMR | null, 
  chiefComplaint: string
): string => {
  const painSummary = summarizePainLogs(painLogs);
  const medicalHistory = patientEMR?.medicalHistory.map(h => h.description).join(', ') || 'None';
  
  return `Generate a clinical progress note based on the following information:

CHIEF COMPLAINT: ${chiefComplaint}

PAIN HISTORY: ${painSummary}

PAST MEDICAL HISTORY: ${medicalHistory}

Generate a professional progress note with these sections:
{
  "historyOfPresentIllness": "Detailed HPI following standard format",
  "assessment": "Clinical assessment with reasoning",
  "plan": "Detailed treatment plan with specific actions"
}

Use proper medical terminology and follow standard documentation practices.`;
};

const summarizePainLogs = (painLogs: PainLog[]): string => {
  if (painLogs.length === 0) return 'No pain logs available';
  
  const recentLogs = painLogs.slice(0, 10);
  const avgSeverity = recentLogs.reduce((sum, log) => sum + log.severity, 0) / recentLogs.length;
  
  const bodyParts = [...new Set(recentLogs.map(log => log.bodyPart))];
  const painTypes = [...new Set(recentLogs.map(log => log.painType))];
  const causes = [...new Set(recentLogs.map(log => log.cause))];
  
  return `Patient reports ${recentLogs.length} pain episodes over recent period. 
Average severity: ${avgSeverity.toFixed(1)}/10. 
Affected areas: ${bodyParts.join(', ')}. 
Pain characteristics: ${painTypes.join(', ')}. 
Associated factors: ${causes.join(', ')}.`;
};

const parseAIAnalysisResponse = (response: string): AIAnalysis => {
  try {
    // Try to parse JSON response
    const parsed = JSON.parse(response);
    return parsed;
  } catch (error) {
    // Fallback parsing or return default structure
    return getFallbackAnalysis();
  }
};

const parseMedicationResponse = (response: string): MedicationRecommendation[] => {
  try {
    return JSON.parse(response);
  } catch (error) {
    return [];
  }
};

const parseProgressNoteResponse = (response: string): { historyOfPresentIllness: string; assessment: string; plan: string } => {
  try {
    return JSON.parse(response);
  } catch (error) {
    return {
      historyOfPresentIllness: response.split('Assessment:')[0] || response,
      assessment: 'Clinical assessment pending review.',
      plan: 'Treatment plan to be finalized.'
    };
  }
};

const getFallbackAnalysis = (): AIAnalysis => ({
  differentialDiagnosis: [
    {
      condition: 'Musculoskeletal pain syndrome',
      probability: 60,
      reasoning: 'Based on pain pattern and location'
    }
  ],
  riskFactors: ['Chronic pain pattern'],
  redFlags: [],
  recommendedTests: [
    {
      test: 'Clinical evaluation',
      urgency: 'routine',
      reasoning: 'Standard assessment needed'
    }
  ],
  treatmentPlan: {
    immediate: ['Pain assessment', 'Symptomatic treatment'],
    shortTerm: ['Pain management plan', 'Follow-up in 1-2 weeks'],
    longTerm: ['Chronic pain management if indicated']
  },
  followUp: {
    timeframe: '1-2 weeks',
    parameters: ['Pain levels', 'Functional status']
  },
  patientEducation: ['Pain management techniques', 'When to seek care']
});

const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export default {
  generateAIClinicalAnalysis,
  generateMedicationRecommendations,
  generateProgressNote,
  identifyRedFlags
};