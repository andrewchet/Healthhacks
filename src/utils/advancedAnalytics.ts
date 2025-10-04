import { PainLog, BODY_PARTS } from '../types/pain';
import { getOpenAIChatResponse } from '../api/chat-service';

export interface FlareUp {
  date: string;
  severity: number;
  bodyPart: string;
  isSpike: boolean;
  daysSinceLastFlare?: number;
}

export interface RiskAlert {
  type: 'worsening_trend' | 'chronic_pattern' | 'nerve_symptoms' | 'infection_risk' | 'medication_concern';
  severity: 'low' | 'medium' | 'high';
  message: string;
  recommendation: string;
  affectedLogs: string[];
}

export interface AIInsight {
  summary: string;
  keyFindings: string[];
  suggestedQuestions: string[];
  diagnosisAids: string[];
  riskAlerts: RiskAlert[];
}

export interface ProviderAnalytics {
  flareUps: FlareUp[];
  progressData: { date: string; severity: number; bodyPart: string }[];
  aiInsights: AIInsight;
  chronicConditionTags: string[];
}

export const detectFlareUps = (painLogs: PainLog[]): FlareUp[] => {
  if (painLogs.length < 3) return [];

  const sortedLogs = [...painLogs].sort((a, b) => 
    new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime()
  );

  const flareUps: FlareUp[] = [];
  const avgSeverity = sortedLogs.reduce((sum, log) => sum + log.severity, 0) / sortedLogs.length;

  for (let i = 1; i < sortedLogs.length; i++) {
    const currentLog = sortedLogs[i];
    const prevLog = sortedLogs[i - 1];
    
    // Detect spike: current pain is significantly higher than average and previous
    const isSpike = currentLog.severity > avgSeverity + 2 && 
                   currentLog.severity > prevLog.severity + 2 &&
                   currentLog.severity >= 7;

    if (isSpike) {
      const lastFlareIndex = flareUps.length - 1;
      const daysSinceLastFlare = lastFlareIndex >= 0 
        ? Math.floor((new Date(currentLog.date).getTime() - new Date(flareUps[lastFlareIndex].date).getTime()) / (1000 * 60 * 60 * 24))
        : undefined;

      flareUps.push({
        date: currentLog.date,
        severity: currentLog.severity,
        bodyPart: currentLog.bodyPart,
        isSpike: true,
        daysSinceLastFlare
      });
    }
  }

  return flareUps;
};

export const generateRiskAlerts = (painLogs: PainLog[]): RiskAlert[] => {
  const alerts: RiskAlert[] = [];
  const recentLogs = painLogs.slice(0, 10);

  // Worsening trend detection
  if (painLogs.length >= 6) {
    const firstHalf = painLogs.slice(Math.floor(painLogs.length / 2));
    const secondHalf = painLogs.slice(0, Math.floor(painLogs.length / 2));
    const firstAvg = firstHalf.reduce((sum, log) => sum + log.severity, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, log) => sum + log.severity, 0) / secondHalf.length;

    if (secondAvg > firstAvg + 1.5) {
      alerts.push({
        type: 'worsening_trend',
        severity: 'high',
        message: 'Patient shows significant worsening pain trend over time',
        recommendation: 'Consider immediate reassessment and treatment adjustment',
        affectedLogs: secondHalf.map(log => log.id)
      });
    }
  }

  // High severity alert
  const highSeverityLogs = recentLogs.filter(log => log.severity >= 8);
  if (highSeverityLogs.length >= 3) {
    alerts.push({
      type: 'medication_concern',
      severity: 'high',
      message: 'Multiple high-severity pain episodes (8+/10) in recent logs',
      recommendation: 'Review current pain management strategy and consider medication adjustment',
      affectedLogs: highSeverityLogs.map(log => log.id)
    });
  }

  return alerts;
};

export const generateProgressData = (painLogs: PainLog[]) => {
  return painLogs
    .sort((a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime())
    .map(log => ({
      date: log.date,
      severity: log.severity,
      bodyPart: log.bodyPart,
      time: log.time
    }));
};

export const generateAIInsights = async (painLogs: PainLog[], riskAlerts: RiskAlert[]): Promise<AIInsight> => {
  if (painLogs.length === 0) {
    return {
      summary: 'No pain data available for analysis.',
      keyFindings: [],
      suggestedQuestions: [],
      diagnosisAids: [],
      riskAlerts: []
    };
  }

  try {
    const context = `
    Patient Pain Analysis for Healthcare Provider:
    
    Total Entries: ${painLogs.length}
    Average Pain: ${(painLogs.reduce((sum, log) => sum + log.severity, 0) / painLogs.length).toFixed(1)}/10
    
    Most Common Areas:
    ${Object.entries(painLogs.reduce((acc, log) => {
      acc[log.bodyPart] = (acc[log.bodyPart] || 0) + 1;
      return acc;
    }, {} as Record<string, number>))
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([part, count]) => `- ${BODY_PARTS.find(bp => bp.id === part)?.displayName || part}: ${count} episodes`)
      .join('\n')}
    
    Pain Types:
    ${Object.entries(painLogs.reduce((acc, log) => {
      acc[log.painType] = (acc[log.painType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>))
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type, count]) => `- ${type}: ${count} episodes`)
      .join('\n')}
    `;

    const prompt = `You are an AI assistant for healthcare providers. Provide a clinical analysis in JSON format:

    {
      "summary": "2 sentence summary of patient's pain pattern",
      "keyFindings": ["2-3 key clinical findings"],
      "suggestedQuestions": ["3 targeted questions for the provider to ask"],
      "diagnosisAids": ["2 potential considerations based on patterns"]
    }

    Patient Data: ${context}`;

    const response = await getOpenAIChatResponse(prompt);
    
    try {
      const aiResponse = JSON.parse(response.content);
      return {
        ...aiResponse,
        riskAlerts
      };
    } catch (parseError) {
      return {
        summary: 'Patient shows varied pain patterns requiring clinical assessment.',
        keyFindings: ['Multiple body areas affected', 'Pain severity varies', 'Pattern analysis needed'],
        suggestedQuestions: ['How has your pain changed recently?', 'What activities worsen symptoms?', 'Any new treatments tried?'],
        diagnosisAids: ['Consider patient history', 'Review physical examination'],
        riskAlerts
      };
    }
  } catch (error) {
    return {
      summary: 'AI analysis temporarily unavailable. Manual review recommended.',
      keyFindings: ['Manual analysis required', 'Review pain severity trends'],
      suggestedQuestions: ['Describe your pain experience', 'What makes pain better/worse?'],
      diagnosisAids: ['Consider differential diagnosis', 'Review anatomical patterns'],
      riskAlerts
    };
  }
};

export const generateProviderAnalytics = async (painLogs: PainLog[]): Promise<ProviderAnalytics> => {
  const flareUps = detectFlareUps(painLogs);
  const progressData = generateProgressData(painLogs);
  const riskAlerts = generateRiskAlerts(painLogs);
  const aiInsights = await generateAIInsights(painLogs, riskAlerts);
  
  const chronicConditionTags: string[] = [];
  const bodyPartCounts = painLogs.reduce((acc, log) => {
    acc[log.bodyPart] = (acc[log.bodyPart] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Generate chronic condition suggestions
  Object.entries(bodyPartCounts).forEach(([bodyPart, count]) => {
    if (count >= Math.max(painLogs.length * 0.4, 3)) {
      if (bodyPart.includes('back')) chronicConditionTags.push('Chronic Low Back Pain');
      else if (bodyPart.includes('neck')) chronicConditionTags.push('Cervical Pain Syndrome');
      else if (bodyPart.includes('knee')) chronicConditionTags.push('Chronic Knee Pain');
    }
  });

  return {
    flareUps,
    progressData,
    aiInsights,
    chronicConditionTags
  };
};