import { ProviderSummaryReport } from './providerAnalytics';
import { BODY_PARTS } from '../types/pain';

export interface EMRExportOptions {
  includeRawData: boolean;
  includeTimeline: boolean;
  includeClinicalNotes: boolean;
  includeRecommendations: boolean;
  format: 'text' | 'structured';
}

export const generateEMRReport = (
  report: ProviderSummaryReport,
  options: EMRExportOptions = {
    includeRawData: true,
    includeTimeline: true,
    includeClinicalNotes: true,
    includeRecommendations: true,
    format: 'text'
  }
): string => {
  const sections: string[] = [];

  // Header
  sections.push(generateHeader(report));
  
  // Chief Complaint & History
  sections.push(generateChiefComplaint(report));
  
  // Assessment
  sections.push(generateAssessment(report));
  
  // Urgency Assessment
  if (report.urgencyAssessment.level !== 'low') {
    sections.push(generateUrgencySection(report));
  }
  
  // Timeline (if requested)
  if (options.includeTimeline) {
    sections.push(generateTimelineSection(report));
  }
  
  // Clinical Notes (if requested)
  if (options.includeClinicalNotes && report.clinicalNotes.length > 0) {
    sections.push(generateClinicalNotesSection(report));
  }
  
  // Plan & Recommendations
  if (options.includeRecommendations) {
    sections.push(generatePlanSection(report));
  }
  
  // Raw Data Summary (if requested)
  if (options.includeRawData) {
    sections.push(generateRawDataSection(report));
  }
  
  // Footer
  sections.push(generateFooter());
  
  return sections.join('\n\n');
};

const generateHeader = (report: ProviderSummaryReport): string => {
  const today = new Date().toLocaleDateString();
  
  return `PAIN MANAGEMENT CONSULTATION REPORT
Generated: ${today}
System: ReliefLog Patient Monitoring

PATIENT INFORMATION:
Name: ${report.patient.name}
Email: ${report.patient.email}
DOB: ${report.patient.dateOfBirth ? new Date(report.patient.dateOfBirth).toLocaleDateString() : 'Not provided'}
Reporting Period: ${report.dateRange.start} to ${report.dateRange.end} (${report.dateRange.totalDays} days)

═══════════════════════════════════════════════════════════════════════════════`;
};

const generateChiefComplaint = (report: ProviderSummaryReport): string => {
  const bodyPartName = BODY_PARTS.find(part => part.id === report.painSummary.mostAffectedArea)?.displayName || report.painSummary.mostAffectedArea;
  
  return `CHIEF COMPLAINT:
Patient reports ${report.painSummary.dominantPainType} pain primarily affecting ${bodyPartName}.

HISTORY OF PRESENT ILLNESS:
Patient has been self-monitoring pain levels over ${report.dateRange.totalDays} days with ${report.painSummary.totalEntries} documented episodes. Average pain intensity: ${report.painSummary.averagePain}/10.

Pain Characteristics:
- Primary Location: ${bodyPartName}
- Predominant Type: ${report.painSummary.dominantPainType}
- Pain-free days: ${report.painSummary.painFreeDays}/${report.dateRange.totalDays}
- Severe episodes (≥8/10): ${report.painSummary.peakPainDates.length}`;
};

const generateAssessment = (report: ProviderSummaryReport): string => {
  let assessment = 'ASSESSMENT:\n';
  
  // Overall pain burden
  if (report.painSummary.averagePain >= 7) {
    assessment += '• Severe chronic pain significantly impacting quality of life\n';
  } else if (report.painSummary.averagePain >= 5) {
    assessment += '• Moderate chronic pain with functional limitations\n';
  } else if (report.painSummary.averagePain >= 3) {
    assessment += '• Mild to moderate pain with intermittent symptoms\n';
  } else {
    assessment += '• Well-controlled pain with minimal impact\n';
  }
  
  // Flagged symptoms
  if (report.flaggedSymptoms.length > 0) {
    assessment += '• Concerning symptoms identified:\n';
    report.flaggedSymptoms.forEach(symptom => {
      assessment += `  - ${symptom.keyword} (${symptom.count} occurrences, ${symptom.severity} severity)\n`;
    });
  }
  
  // Peak periods
  if (report.peakSymptomPeriods.length > 0) {
    assessment += '• Pain exacerbation periods identified:\n';
    report.peakSymptomPeriods.forEach(period => {
      assessment += `  - ${period.start} to ${period.end}: ${period.description}\n`;
    });
  }
  
  return assessment.trim();
};

const generateUrgencySection = (report: ProviderSummaryReport): string => {
  const urgency = report.urgencyAssessment;
  
  let section = `URGENCY ASSESSMENT: ${urgency.level.toUpperCase()} PRIORITY\n`;
  section += `Risk Score: ${urgency.score}/100\n\n`;
  
  if (urgency.reasons.length > 0) {
    section += 'Contributing Factors:\n';
    urgency.reasons.forEach(reason => {
      section += `• ${reason}\n`;
    });
  }
  
  return section.trim();
};

const generateTimelineSection = (report: ProviderSummaryReport): string => {
  return `PAIN TIMELINE SUMMARY:
Monitoring period: ${report.dateRange.totalDays} days
Total pain episodes: ${report.painSummary.totalEntries}
Average pain intensity: ${report.painSummary.averagePain}/10

Peak Pain Dates:
${report.painSummary.peakPainDates.length > 0 
  ? report.painSummary.peakPainDates.map(date => `• ${new Date(date).toLocaleDateString()}`).join('\n')
  : '• No severe pain episodes recorded'
}

Pain-free Days: ${report.painSummary.painFreeDays}/${report.dateRange.totalDays} (${Math.round((report.painSummary.painFreeDays / report.dateRange.totalDays) * 100)}%)`;
};

const generateClinicalNotesSection = (report: ProviderSummaryReport): string => {
  return `CLINICAL OBSERVATIONS:
${report.clinicalNotes.map(note => `• ${note}`).join('\n')}`;
};

const generatePlanSection = (report: ProviderSummaryReport): string => {
  let plan = 'PLAN & RECOMMENDATIONS:\n';
  
  if (report.urgencyAssessment.recommendations.length > 0) {
    plan += 'Immediate Actions:\n';
    report.urgencyAssessment.recommendations.forEach(rec => {
      plan += `• ${rec}\n`;
    });
    plan += '\n';
  }
  
  // Standard recommendations based on pain level
  if (report.painSummary.averagePain >= 7) {
    plan += 'Pain Management:\n';
    plan += '• Consider multimodal pain management approach\n';
    plan += '• Evaluate for specialist referral (pain management, neurology)\n';
    plan += '• Assess current medication effectiveness\n';
    plan += '• Consider interventional procedures if appropriate\n\n';
  }
  
  if (report.flaggedSymptoms.some(s => s.severity === 'severe')) {
    plan += 'Red Flag Symptoms:\n';
    plan += '• Urgent medical evaluation recommended\n';
    plan += '• Consider imaging studies if indicated\n';
    plan += '• Rule out serious underlying pathology\n\n';
  }
  
  plan += 'Follow-up:\n';
  plan += '• Continue patient self-monitoring\n';
  plan += '• Schedule follow-up in 2-4 weeks\n';
  plan += '• Review pain diary for trends\n';
  plan += '• Adjust treatment plan based on response\n';
  
  return plan.trim();
};

const generateRawDataSection = (report: ProviderSummaryReport): string => {
  return `APPENDIX - DATA SUMMARY:
═══════════════════════════════════════════════════════════════════════════════

STATISTICAL OVERVIEW:
• Total Entries: ${report.painSummary.totalEntries}
• Reporting Period: ${report.dateRange.totalDays} days
• Average Pain: ${report.painSummary.averagePain}/10
• Most Affected Area: ${BODY_PARTS.find(part => part.id === report.painSummary.mostAffectedArea)?.displayName || report.painSummary.mostAffectedArea}
• Dominant Pain Type: ${report.painSummary.dominantPainType}

SYMPTOM KEYWORDS DETECTED:
${report.flaggedSymptoms.length > 0 
  ? report.flaggedSymptoms.map(symptom => 
      `• ${symptom.keyword} (${symptom.severity}): ${symptom.count} occurrences`
    ).join('\n')
  : '• No specific symptom keywords flagged'
}

PAIN PATTERN ANALYSIS:
• Peak pain dates: ${report.painSummary.peakPainDates.length} severe episodes
• Pain-free days: ${report.painSummary.painFreeDays}/${report.dateRange.totalDays}
• Compliance: Patient actively monitoring symptoms`;
};

const generateFooter = (): string => {
  return `═══════════════════════════════════════════════════════════════════════════════
DISCLAIMER: This report is generated from patient self-reported data and should be used in conjunction with clinical examination and professional medical judgment. Data accuracy depends on patient compliance and reporting consistency.

Generated by: ReliefLog Provider Dashboard
Report Date: ${new Date().toLocaleDateString()}
Report Time: ${new Date().toLocaleTimeString()}`;
};

// Structured format for EMR integration
export const generateStructuredEMRData = (report: ProviderSummaryReport) => {
  return {
    patient: {
      name: report.patient.name,
      email: report.patient.email,
      dateOfBirth: report.patient.dateOfBirth
    },
    assessment: {
      chiefComplaint: `${report.painSummary.dominantPainType} pain in ${report.painSummary.mostAffectedArea}`,
      averagePainLevel: report.painSummary.averagePain,
      urgencyLevel: report.urgencyAssessment.level,
      riskScore: report.urgencyAssessment.score
    },
    symptoms: report.flaggedSymptoms.map(symptom => ({
      keyword: symptom.keyword,
      severity: symptom.severity,
      frequency: symptom.count,
      dates: symptom.dates
    })),
    timeline: {
      startDate: report.dateRange.start,
      endDate: report.dateRange.end,
      totalEntries: report.painSummary.totalEntries,
      peakPainDates: report.painSummary.peakPainDates,
      painFreeDays: report.painSummary.painFreeDays
    },
    recommendations: report.urgencyAssessment.recommendations,
    clinicalNotes: report.clinicalNotes
  };
};