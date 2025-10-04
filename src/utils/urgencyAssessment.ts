import { PainLog } from '../types/pain';
import { User } from '../types/auth';

export interface UrgencyAssessment {
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  flags: UrgencyFlag[];
  recommendations: string[];
  lastUpdated: string;
}

export interface UrgencyFlag {
  type: 'severity' | 'frequency' | 'duration' | 'symptoms' | 'trend';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: string;
}

export interface PatientUrgency {
  patient: User;
  urgency: UrgencyAssessment;
  lastLogDate: string;
  totalLogs: number;
}

const URGENT_KEYWORDS = [
  'numb', 'numbness', 'tingling', 'burning', 'can\'t sleep', 'unbearable',
  'spreading', 'weakness', 'paralysis', 'severe', 'excruciating',
  'shooting', 'electric', 'radiating', 'constant', 'worsening',
  'dizzy', 'nausea', 'vomiting', 'fever', 'swelling'
];

const CRITICAL_KEYWORDS = [
  'chest pain', 'trouble breathing', 'shortness of breath', 'heart',
  'stroke', 'paralyzed', 'can\'t move', 'loss of consciousness',
  'severe headache', 'sudden onset', 'emergency'
];

export const assessPatientUrgency = (painLogs: PainLog[], patient: User): UrgencyAssessment => {
  if (painLogs.length === 0) {
    return {
      level: 'low',
      score: 0,
      flags: [],
      recommendations: ['No recent pain data available'],
      lastUpdated: new Date().toISOString()
    };
  }

  const flags: UrgencyFlag[] = [];
  let urgencyScore = 0;

  // Sort logs by date (newest first)
  const sortedLogs = [...painLogs].sort((a, b) => 
    new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime()
  );

  const recentLogs = sortedLogs.slice(0, 10); // Last 10 entries
  const last7Days = sortedLogs.filter(log => {
    const logDate = new Date(log.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return logDate >= weekAgo;
  });

  // 1. Severity Assessment
  const avgSeverity = recentLogs.reduce((sum, log) => sum + log.severity, 0) / recentLogs.length;
  const maxSeverity = Math.max(...recentLogs.map(log => log.severity));
  const highSeverityCount = recentLogs.filter(log => log.severity >= 8).length;

  if (maxSeverity >= 9) {
    flags.push({
      type: 'severity',
      severity: 'critical',
      message: 'Extreme pain levels reported',
      details: `Maximum pain level: ${maxSeverity}/10 in recent entries`
    });
    urgencyScore += 25;
  } else if (avgSeverity >= 7) {
    flags.push({
      type: 'severity',
      severity: 'high',
      message: 'Consistently high pain levels',
      details: `Average pain: ${avgSeverity.toFixed(1)}/10 over last ${recentLogs.length} entries`
    });
    urgencyScore += 15;
  } else if (highSeverityCount >= 3) {
    flags.push({
      type: 'severity',
      severity: 'medium',
      message: 'Multiple severe pain episodes',
      details: `${highSeverityCount} severe pain episodes (8+/10) in recent logs`
    });
    urgencyScore += 10;
  }

  // 2. Frequency Assessment
  if (last7Days.length >= 7) {
    flags.push({
      type: 'frequency',
      severity: 'high',
      message: 'Daily pain logging',
      details: `${last7Days.length} pain entries in the last 7 days`
    });
    urgencyScore += 12;
  } else if (last7Days.length >= 5) {
    flags.push({
      type: 'frequency',
      severity: 'medium',
      message: 'Frequent pain episodes',
      details: `${last7Days.length} pain entries in the last 7 days`
    });
    urgencyScore += 8;
  }

  // 3. Trend Assessment
  if (recentLogs.length >= 5) {
    const firstHalf = recentLogs.slice(Math.floor(recentLogs.length / 2));
    const secondHalf = recentLogs.slice(0, Math.floor(recentLogs.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, log) => sum + log.severity, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, log) => sum + log.severity, 0) / secondHalf.length;
    
    const trendDifference = secondHalfAvg - firstHalfAvg;
    
    if (trendDifference >= 2) {
      flags.push({
        type: 'trend',
        severity: 'high',
        message: 'Rapidly worsening pain',
        details: `Pain increased by ${trendDifference.toFixed(1)} points recently`
      });
      urgencyScore += 18;
    } else if (trendDifference >= 1) {
      flags.push({
        type: 'trend',
        severity: 'medium',
        message: 'Worsening pain trend',
        details: `Pain increased by ${trendDifference.toFixed(1)} points recently`
      });
      urgencyScore += 10;
    }
  }

  // 4. Symptom Keywords Assessment
  const allDescriptions = recentLogs
    .map(log => `${log.description || ''} ${log.tags?.join(' ') || ''}`)
    .join(' ')
    .toLowerCase();

  const criticalMatches = CRITICAL_KEYWORDS.filter(keyword => 
    allDescriptions.includes(keyword.toLowerCase())
  );
  
  const urgentMatches = URGENT_KEYWORDS.filter(keyword => 
    allDescriptions.includes(keyword.toLowerCase())
  );

  if (criticalMatches.length > 0) {
    flags.push({
      type: 'symptoms',
      severity: 'critical',
      message: 'Critical symptoms reported',
      details: `Keywords found: ${criticalMatches.join(', ')}`
    });
    urgencyScore += 30;
  } else if (urgentMatches.length >= 3) {
    flags.push({
      type: 'symptoms',
      severity: 'high',
      message: 'Multiple concerning symptoms',
      details: `Keywords found: ${urgentMatches.slice(0, 3).join(', ')}`
    });
    urgencyScore += 15;
  } else if (urgentMatches.length >= 1) {
    flags.push({
      type: 'symptoms',
      severity: 'medium',
      message: 'Concerning symptoms reported',
      details: `Keywords found: ${urgentMatches.join(', ')}`
    });
    urgencyScore += 8;
  }

  // 5. Duration Assessment
  const daysSinceFirst = painLogs.length > 0 ? 
    Math.floor((new Date().getTime() - new Date(sortedLogs[sortedLogs.length - 1].date).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  
  if (daysSinceFirst >= 30 && avgSeverity >= 5) {
    flags.push({
      type: 'duration',
      severity: 'medium',
      message: 'Chronic pain pattern',
      details: `Pain logging for ${daysSinceFirst} days with average severity ${avgSeverity.toFixed(1)}/10`
    });
    urgencyScore += 8;
  }

  // Determine urgency level
  let level: UrgencyAssessment['level'];
  if (urgencyScore >= 25) {
    level = 'critical';
  } else if (urgencyScore >= 15) {
    level = 'high';
  } else if (urgencyScore >= 8) {
    level = 'medium';
  } else {
    level = 'low';
  }

  // Generate recommendations
  const recommendations = generateRecommendations(flags, level, recentLogs);

  return {
    level,
    score: urgencyScore,
    flags,
    recommendations,
    lastUpdated: new Date().toISOString()
  };
};

const generateRecommendations = (
  flags: UrgencyFlag[], 
  level: UrgencyAssessment['level'], 
  recentLogs: PainLog[]
): string[] => {
  const recommendations: string[] = [];

  if (level === 'critical') {
    recommendations.push('URGENT: Schedule immediate consultation or emergency evaluation');
    recommendations.push('Consider same-day appointment or emergency referral');
  } else if (level === 'high') {
    recommendations.push('Schedule priority appointment within 24-48 hours');
    recommendations.push('Review current pain management plan');
  } else if (level === 'medium') {
    recommendations.push('Schedule follow-up within 1-2 weeks');
    recommendations.push('Monitor pain trends closely');
  } else {
    recommendations.push('Continue current management plan');
    recommendations.push('Routine follow-up as scheduled');
  }

  // Specific recommendations based on flags
  flags.forEach(flag => {
    switch (flag.type) {
      case 'severity':
        if (flag.severity === 'critical' || flag.severity === 'high') {
          recommendations.push('Consider pain medication adjustment');
          recommendations.push('Evaluate for underlying cause escalation');
        }
        break;
      case 'frequency':
        recommendations.push('Assess current pain management effectiveness');
        recommendations.push('Consider preventive measures');
        break;
      case 'trend':
        recommendations.push('Investigate cause of pain escalation');
        recommendations.push('Review recent activities and triggers');
        break;
      case 'symptoms':
        if (flag.severity === 'critical') {
          recommendations.push('Rule out serious underlying conditions');
        }
        recommendations.push('Detailed symptom assessment recommended');
        break;
      case 'duration':
        recommendations.push('Consider specialist referral for chronic pain');
        recommendations.push('Evaluate long-term management strategies');
        break;
    }
  });

  return [...new Set(recommendations)]; // Remove duplicates
};

export const prioritizePatients = (patients: PatientUrgency[]): PatientUrgency[] => {
  return patients.sort((a, b) => {
    // First sort by urgency level
    const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const urgencyDiff = urgencyOrder[b.urgency.level] - urgencyOrder[a.urgency.level];
    
    if (urgencyDiff !== 0) return urgencyDiff;
    
    // Then by urgency score
    const scoreDiff = b.urgency.score - a.urgency.score;
    if (scoreDiff !== 0) return scoreDiff;
    
    // Finally by last log date (most recent first)
    return new Date(b.lastLogDate).getTime() - new Date(a.lastLogDate).getTime();
  });
};