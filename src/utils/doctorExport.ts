import { PainLog, BODY_PARTS } from '../types/pain';

export interface DoctorReport {
  summary: {
    totalEntries: number;
    dateRange: string;
    averagePain: number;
    mostCommonBodyPart: string;
    mostCommonPainType: string;
    painTrend: 'improving' | 'worsening' | 'stable';
  };
  detailedLogs: PainLog[];
  patterns: {
    painByBodyPart: Record<string, number>;
    painByType: Record<string, number>;
    painByCause: Record<string, number>;
    commonTags: Record<string, number>;
  };
  recommendations: string[];
}

export const generateDoctorReport = (painLogs: PainLog[], dateRange: string = 'All time'): DoctorReport => {
  if (painLogs.length === 0) {
    return {
      summary: {
        totalEntries: 0,
        dateRange,
        averagePain: 0,
        mostCommonBodyPart: 'None',
        mostCommonPainType: 'None',
        painTrend: 'stable',
      },
      detailedLogs: [],
      patterns: {
        painByBodyPart: {},
        painByType: {},
        painByCause: {},
        commonTags: {},
      },
      recommendations: [],
    };
  }

  // Calculate summary statistics
  const averagePain = painLogs.reduce((sum, log) => sum + log.severity, 0) / painLogs.length;
  
  // Most common body part
  const bodyPartCounts = painLogs.reduce((acc, log) => {
    acc[log.bodyPart] = (acc[log.bodyPart] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const mostCommonBodyPart = Object.entries(bodyPartCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

  // Most common pain type
  const painTypeCounts = painLogs.reduce((acc, log) => {
    acc[log.painType] = (acc[log.painType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const mostCommonPainType = Object.entries(painTypeCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

  // Pain trend analysis
  let painTrend: 'improving' | 'worsening' | 'stable' = 'stable';
  if (painLogs.length >= 4) {
    const sortedLogs = [...painLogs].sort((a, b) => 
      new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime()
    );
    const midpoint = Math.floor(sortedLogs.length / 2);
    const firstHalf = sortedLogs.slice(0, midpoint);
    const secondHalf = sortedLogs.slice(midpoint);
    
    const firstHalfAvg = firstHalf.reduce((sum, log) => sum + log.severity, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, log) => sum + log.severity, 0) / secondHalf.length;
    
    const difference = secondHalfAvg - firstHalfAvg;
    if (difference > 0.5) painTrend = 'worsening';
    else if (difference < -0.5) painTrend = 'improving';
  }

  // Pain by cause
  const painByCause = painLogs.reduce((acc, log) => {
    acc[log.cause] = (acc[log.cause] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Common tags
  const commonTags = painLogs.reduce((acc, log) => {
    if (log.tags) {
      log.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
    }
    return acc;
  }, {} as Record<string, number>);

  // Generate recommendations
  const recommendations = generateRecommendations(painLogs, {
    averagePain,
    mostCommonBodyPart,
    mostCommonPainType,
    painTrend,
    commonTags,
  });

  return {
    summary: {
      totalEntries: painLogs.length,
      dateRange,
      averagePain: Math.round(averagePain * 10) / 10,
      mostCommonBodyPart,
      mostCommonPainType,
      painTrend,
    },
    detailedLogs: painLogs.sort((a, b) => 
      new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime()
    ),
    patterns: {
      painByBodyPart: bodyPartCounts,
      painByType: painTypeCounts,
      painByCause,
      commonTags,
    },
    recommendations,
  };
};

const generateRecommendations = (
  painLogs: PainLog[], 
  summary: any
): string[] => {
  const recommendations: string[] = [];

  // High severity recommendation
  if (summary.averagePain > 7) {
    recommendations.push("Consider immediate medical evaluation due to high average pain severity");
  } else if (summary.averagePain > 5) {
    recommendations.push("Discuss pain management strategies with healthcare provider");
  }

  // Worsening trend
  if (summary.painTrend === 'worsening') {
    recommendations.push("Pain trend shows worsening - recommend medical consultation");
  } else if (summary.painTrend === 'improving') {
    recommendations.push("Pain trend shows improvement - continue current management");
  }

  // Frequent pain
  if (painLogs.length > 10) {
    recommendations.push("Consider keeping a daily pain diary for better pattern recognition");
  }

  // Activity-related pain
  const activityPain = painLogs.filter(log => log.cause === 'activity').length;
  if (activityPain > painLogs.length * 0.3) {
    recommendations.push("Consider physical therapy evaluation for activity-related pain");
  }

  // Unknown causes
  const unknownCauses = painLogs.filter(log => log.cause === 'unknown').length;
  if (unknownCauses > painLogs.length * 0.4) {
    recommendations.push("Recommend diagnostic workup for unexplained pain episodes");
  }

  // Specific body part recommendations
  if (summary.mostCommonBodyPart.includes('back')) {
    recommendations.push("Consider ergonomic assessment and core strengthening exercises");
  } else if (summary.mostCommonBodyPart.includes('neck')) {
    recommendations.push("Evaluate workstation setup and consider neck strengthening exercises");
  } else if (summary.mostCommonBodyPart.includes('knee')) {
    recommendations.push("Consider gait analysis and lower extremity strengthening");
  }

  return recommendations;
};

export const formatReportForSharing = (report: DoctorReport): string => {
  const bodyPartDisplayName = (id: string) => 
    BODY_PARTS.find(part => part.id === id)?.displayName || id;

  let reportText = `PAIN REPORT - ${new Date().toLocaleDateString()}\n`;
  reportText += `=====================================\n\n`;

  // Summary
  reportText += `SUMMARY\n`;
  reportText += `-------\n`;
  reportText += `Total Entries: ${report.summary.totalEntries}\n`;
  reportText += `Date Range: ${report.summary.dateRange}\n`;
  reportText += `Average Pain Level: ${report.summary.averagePain}/10\n`;
  reportText += `Most Affected Area: ${bodyPartDisplayName(report.summary.mostCommonBodyPart)}\n`;
  reportText += `Most Common Pain Type: ${report.summary.mostCommonPainType}\n`;
  reportText += `Pain Trend: ${report.summary.painTrend}\n\n`;

  // Patterns
  reportText += `PAIN PATTERNS\n`;
  reportText += `-------------\n`;
  
  reportText += `By Body Part:\n`;
  Object.entries(report.patterns.painByBodyPart)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .forEach(([bodyPart, count]) => {
      reportText += `  ${bodyPartDisplayName(bodyPart)}: ${count} episodes\n`;
    });

  reportText += `\nBy Pain Type:\n`;
  Object.entries(report.patterns.painByType)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      reportText += `  ${type}: ${count} episodes\n`;
    });

  reportText += `\nBy Cause:\n`;
  Object.entries(report.patterns.painByCause)
    .sort(([,a], [,b]) => b - a)
    .forEach(([cause, count]) => {
      reportText += `  ${cause.replace('_', ' ')}: ${count} episodes\n`;
    });

  if (Object.keys(report.patterns.commonTags).length > 0) {
    reportText += `\nCommon Tags:\n`;
    Object.entries(report.patterns.commonTags)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([tag, count]) => {
        reportText += `  ${tag}: ${count} times\n`;
      });
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    reportText += `\nRECOMMENDATIONS\n`;
    reportText += `---------------\n`;
    report.recommendations.forEach((rec, index) => {
      reportText += `${index + 1}. ${rec}\n`;
    });
  }

  // Recent entries (last 10)
  reportText += `\nRECENT PAIN ENTRIES\n`;
  reportText += `-------------------\n`;
  report.detailedLogs.slice(0, 10).forEach((log, index) => {
    reportText += `${index + 1}. ${new Date(log.date).toLocaleDateString()} ${log.time}\n`;
    reportText += `   ${bodyPartDisplayName(log.bodyPart)} - ${log.painType} pain (${log.severity}/10)\n`;
    reportText += `   Cause: ${log.cause.replace('_', ' ')}\n`;
    if (log.description) {
      reportText += `   Notes: ${log.description}\n`;
    }
    if (log.tags && log.tags.length > 0) {
      reportText += `   Tags: ${log.tags.join(', ')}\n`;
    }
    reportText += `\n`;
  });

  reportText += `\nGenerated by ReliefLog - Pain Tracking App\n`;
  reportText += `This report is for informational purposes only and does not replace professional medical advice.`;

  return reportText;
};