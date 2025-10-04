import { PainLog, BODY_PARTS } from '../types/pain';
import { User } from '../types/auth';

export interface SymptomKeyword {
  keyword: string;
  severity: 'mild' | 'moderate' | 'severe';
  count: number;
  dates: string[];
  context: string[];
}

export interface UrgencyAssessment {
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  reasons: string[];
  recommendations: string[];
}

export interface ProviderSummaryReport {
  patient: User;
  dateRange: {
    start: string;
    end: string;
    totalDays: number;
  };
  painSummary: {
    totalEntries: number;
    averagePain: number;
    peakPainDates: string[];
    painFreeDays: number;
    mostAffectedArea: string;
    dominantPainType: string;
  };
  flaggedSymptoms: SymptomKeyword[];
  urgencyAssessment: UrgencyAssessment;
  peakSymptomPeriods: {
    start: string;
    end: string;
    avgPain: number;
    description: string;
  }[];
  adherenceTracking?: {
    exerciseCompliance: number;
    medicationAdherence: number;
    notes: string[];
  };
  clinicalNotes: string[];
}

// Critical symptom keywords that indicate urgent care needs
const CRITICAL_KEYWORDS = [
  'numbness', 'numb', 'tingling', 'weakness', 'paralysis', 'paralyzed',
  'chest pain', 'difficulty breathing', 'shortness of breath',
  'severe headache', 'vision problems', 'blurred vision',
  'fever', 'infection', 'swelling', 'redness'
];

// High severity keywords
const HIGH_SEVERITY_KEYWORDS = [
  'burning', 'stabbing', 'shooting', 'electric', 'radiating',
  'cant sleep', "can't sleep", 'sleepless', 'insomnia',
  'constant', 'persistent', 'worsening', 'getting worse',
  'unbearable', 'excruciating', 'severe'
];

// Moderate severity keywords  
const MODERATE_KEYWORDS = [
  'aching', 'throbbing', 'cramping', 'stiff', 'tight',
  'sore', 'tender', 'uncomfortable', 'bothersome',
  'activity limited', 'difficult to move', 'limited mobility'
];

export const generateProviderSummary = (
  patient: User, 
  painLogs: PainLog[]
): ProviderSummaryReport => {
  if (painLogs.length === 0) {
    return createEmptyReport(patient);
  }

  // Sort logs by date
  const sortedLogs = [...painLogs].sort((a, b) => 
    new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime()
  );

  const dateRange = {
    start: sortedLogs[0].date,
    end: sortedLogs[sortedLogs.length - 1].date,
    totalDays: Math.ceil((new Date(sortedLogs[sortedLogs.length - 1].date).getTime() - 
                         new Date(sortedLogs[0].date).getTime()) / (1000 * 60 * 60 * 24)) + 1
  };

  // Calculate pain summary
  const painSummary = calculatePainSummary(sortedLogs, dateRange);
  
  // Detect symptom keywords
  const flaggedSymptoms = detectSymptomKeywords(sortedLogs);
  
  // Assess urgency
  const urgencyAssessment = assessUrgency(sortedLogs, flaggedSymptoms);
  
  // Identify peak symptom periods
  const peakSymptomPeriods = identifyPeakPeriods(sortedLogs);
  
  // Generate clinical notes
  const clinicalNotes = generateClinicalNotes(sortedLogs, flaggedSymptoms, urgencyAssessment);

  return {
    patient,
    dateRange,
    painSummary,
    flaggedSymptoms,
    urgencyAssessment,
    peakSymptomPeriods,
    clinicalNotes
  };
};

const createEmptyReport = (patient: User): ProviderSummaryReport => ({
  patient,
  dateRange: { start: '', end: '', totalDays: 0 },
  painSummary: {
    totalEntries: 0,
    averagePain: 0,
    peakPainDates: [],
    painFreeDays: 0,
    mostAffectedArea: 'None',
    dominantPainType: 'None'
  },
  flaggedSymptoms: [],
  urgencyAssessment: { level: 'low', score: 0, reasons: [], recommendations: [] },
  peakSymptomPeriods: [],
  clinicalNotes: []
});

const calculatePainSummary = (logs: PainLog[], dateRange: any) => {
  const totalEntries = logs.length;
  const averagePain = logs.reduce((sum, log) => sum + log.severity, 0) / totalEntries;
  
  // Find peak pain dates (pain >= 8)
  const peakPainDates = logs
    .filter(log => log.severity >= 8)
    .map(log => log.date)
    .filter((date, index, arr) => arr.indexOf(date) === index);

  // Calculate pain-free days (days with no entries)
  const logDates = new Set(logs.map(log => log.date));
  const painFreeDays = dateRange.totalDays - logDates.size;

  // Most affected area
  const bodyPartCounts = logs.reduce((acc, log) => {
    acc[log.bodyPart] = (acc[log.bodyPart] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const mostAffectedArea = Object.entries(bodyPartCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

  // Dominant pain type
  const painTypeCounts = logs.reduce((acc, log) => {
    acc[log.painType] = (acc[log.painType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const dominantPainType = Object.entries(painTypeCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

  return {
    totalEntries,
    averagePain: Math.round(averagePain * 10) / 10,
    peakPainDates,
    painFreeDays,
    mostAffectedArea,
    dominantPainType
  };
};

const detectSymptomKeywords = (logs: PainLog[]): SymptomKeyword[] => {
  const keywordMap = new Map<string, SymptomKeyword>();

  logs.forEach(log => {
    const text = `${log.description || ''} ${log.activity || ''} ${(log.tags || []).join(' ')}`.toLowerCase();
    
    // Check for critical keywords
    CRITICAL_KEYWORDS.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        updateKeywordMap(keywordMap, keyword, 'severe', log);
      }
    });

    // Check for high severity keywords
    HIGH_SEVERITY_KEYWORDS.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        updateKeywordMap(keywordMap, keyword, 'moderate', log);
      }
    });

    // Check for moderate keywords
    MODERATE_KEYWORDS.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        updateKeywordMap(keywordMap, keyword, 'mild', log);
      }
    });
  });

  return Array.from(keywordMap.values())
    .sort((a, b) => {
      const severityOrder = { severe: 3, moderate: 2, mild: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity] || b.count - a.count;
    });
};

const updateKeywordMap = (
  map: Map<string, SymptomKeyword>, 
  keyword: string, 
  severity: 'mild' | 'moderate' | 'severe', 
  log: PainLog
) => {
  const existing = map.get(keyword);
  if (existing) {
    existing.count++;
    existing.dates.push(log.date);
    existing.context.push(`${log.bodyPart}: ${log.description || 'No description'}`);
  } else {
    map.set(keyword, {
      keyword,
      severity,
      count: 1,
      dates: [log.date],
      context: [`${log.bodyPart}: ${log.description || 'No description'}`]
    });
  }
};

const assessUrgency = (logs: PainLog[], flaggedSymptoms: SymptomKeyword[]): UrgencyAssessment => {
  let score = 0;
  const reasons: string[] = [];
  const recommendations: string[] = [];

  // Check for critical symptoms
  const criticalSymptoms = flaggedSymptoms.filter(s => s.severity === 'severe');
  if (criticalSymptoms.length > 0) {
    score += 40;
    reasons.push(`Critical symptoms detected: ${criticalSymptoms.map(s => s.keyword).join(', ')}`);
    recommendations.push('Immediate medical evaluation recommended');
  }

  // Check for high pain scores
  const highPainLogs = logs.filter(log => log.severity >= 8);
  if (highPainLogs.length > logs.length * 0.3) {
    score += 25;
    reasons.push(`Frequent severe pain episodes (${highPainLogs.length}/${logs.length})`);
    recommendations.push('Pain management consultation needed');
  }

  // Check for worsening trend
  if (logs.length >= 5) {
    const recent = logs.slice(-5);
    const older = logs.slice(0, -5);
    const recentAvg = recent.reduce((sum, log) => sum + log.severity, 0) / recent.length;
    const olderAvg = older.reduce((sum, log) => sum + log.severity, 0) / older.length;
    
    if (recentAvg > olderAvg + 1) {
      score += 20;
      reasons.push('Pain levels are worsening over time');
      recommendations.push('Reassess current treatment plan');
    }
  }

  // Check for sleep disruption
  const sleepKeywords = flaggedSymptoms.filter(s => 
    s.keyword.includes('sleep') || s.keyword.includes('insomnia')
  );
  if (sleepKeywords.length > 0) {
    score += 15;
    reasons.push('Sleep disruption reported');
    recommendations.push('Address sleep-related pain management');
  }

  // Check for functional limitation
  const functionalKeywords = flaggedSymptoms.filter(s => 
    s.keyword.includes('limited') || s.keyword.includes('difficult')
  );
  if (functionalKeywords.length > 0) {
    score += 10;
    reasons.push('Functional limitations noted');
    recommendations.push('Consider physical therapy referral');
  }

  // Determine urgency level
  let level: UrgencyAssessment['level'] = 'low';
  if (score >= 60) level = 'critical';
  else if (score >= 40) level = 'high';
  else if (score >= 20) level = 'medium';

  return { level, score, reasons, recommendations };
};

const identifyPeakPeriods = (logs: PainLog[]) => {
  const periods: any[] = [];
  let currentPeriod: any = null;

  logs.forEach((log, index) => {
    if (log.severity >= 7) {
      if (!currentPeriod) {
        currentPeriod = {
          start: log.date,
          end: log.date,
          logs: [log],
          totalPain: log.severity
        };
      } else {
        currentPeriod.end = log.date;
        currentPeriod.logs.push(log);
        currentPeriod.totalPain += log.severity;
      }
    } else {
      if (currentPeriod) {
        const avgPain = currentPeriod.totalPain / currentPeriod.logs.length;
        const bodyParts = [...new Set(currentPeriod.logs.map((l: PainLog) => l.bodyPart))];
        
        periods.push({
          start: currentPeriod.start,
          end: currentPeriod.end,
          avgPain: Math.round(avgPain * 10) / 10,
          description: `Severe pain in ${bodyParts.join(', ')} (${currentPeriod.logs.length} episodes)`
        });
        currentPeriod = null;
      }
    }
  });

  // Handle ongoing period
  if (currentPeriod) {
    const avgPain = currentPeriod.totalPain / currentPeriod.logs.length;
    const bodyParts = [...new Set(currentPeriod.logs.map((l: PainLog) => l.bodyPart))];
    
    periods.push({
      start: currentPeriod.start,
      end: currentPeriod.end,
      avgPain: Math.round(avgPain * 10) / 10,
      description: `Severe pain in ${bodyParts.join(', ')} (${currentPeriod.logs.length} episodes)`
    });
  }

  return periods;
};

const generateClinicalNotes = (
  logs: PainLog[], 
  flaggedSymptoms: SymptomKeyword[],
  urgencyAssessment: UrgencyAssessment
): string[] => {
  const notes: string[] = [];

  // Pain pattern analysis
  const bodyPartCounts = logs.reduce((acc, log) => {
    acc[log.bodyPart] = (acc[log.bodyPart] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const primaryArea = Object.entries(bodyPartCounts)
    .sort(([,a], [,b]) => b - a)[0];

  if (primaryArea) {
    const bodyPartName = BODY_PARTS.find(part => part.id === primaryArea[0])?.displayName || primaryArea[0];
    notes.push(`Primary complaint: ${bodyPartName} pain (${primaryArea[1]} episodes)`);
  }

  // Symptom severity analysis
  const avgPain = logs.reduce((sum, log) => sum + log.severity, 0) / logs.length;
  if (avgPain >= 7) {
    notes.push('Severe pain levels consistently reported');
  } else if (avgPain >= 5) {
    notes.push('Moderate pain levels affecting daily activities');
  }

  // Flagged symptoms
  if (flaggedSymptoms.length > 0) {
    const criticalSymptoms = flaggedSymptoms.filter(s => s.severity === 'severe');
    if (criticalSymptoms.length > 0) {
      notes.push(`Red flag symptoms: ${criticalSymptoms.map(s => s.keyword).join(', ')}`);
    }
  }

  // Activity correlation
  const activityLogs = logs.filter(log => log.cause === 'activity' && log.activity);
  if (activityLogs.length > 0) {
    notes.push(`Activity-related pain noted in ${activityLogs.length} instances`);
  }

  // Treatment response notes
  const medicationTags = logs.filter(log => 
    log.tags?.some(tag => tag.toLowerCase().includes('medication') || tag.toLowerCase().includes('med'))
  );
  if (medicationTags.length > 0) {
    notes.push('Patient tracking medication use - review effectiveness');
  }

  return notes;
};