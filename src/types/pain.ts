export interface PainLog {
  id: string;
  date: string;
  time: string;
  bodyPart: string;
  severity: number; // 1-10 scale
  painType: 'sharp' | 'dull' | 'aching' | 'burning' | 'stabbing' | 'throbbing';
  cause: 'injury' | 'overuse' | 'unknown' | 'woke_up_with_it' | 'activity';
  activity?: string;
  description?: string;
  duration?: string;
  reliefMethods?: string[];
  photos?: string[]; // Array of photo URIs
  tags?: string[]; // Custom user tags
}

export interface BodyPart {
  id: string;
  name: string;
  displayName: string;
  category: 'head' | 'torso' | 'arms' | 'legs';
}

export const BODY_PARTS: BodyPart[] = [
  // Head
  { id: 'head', name: 'head', displayName: 'Head', category: 'head' },
  { id: 'neck', name: 'neck', displayName: 'Neck', category: 'head' },
  
  // Torso
  { id: 'chest', name: 'chest', displayName: 'Chest', category: 'torso' },
  { id: 'upper_back', name: 'upper_back', displayName: 'Upper Back', category: 'torso' },
  { id: 'lower_back', name: 'lower_back', displayName: 'Lower Back', category: 'torso' },
  { id: 'abdomen', name: 'abdomen', displayName: 'Abdomen', category: 'torso' },
  
  // Arms
  { id: 'left_shoulder', name: 'left_shoulder', displayName: 'Left Shoulder', category: 'arms' },
  { id: 'right_shoulder', name: 'right_shoulder', displayName: 'Right Shoulder', category: 'arms' },
  { id: 'left_upper_arm', name: 'left_upper_arm', displayName: 'Left Upper Arm', category: 'arms' },
  { id: 'right_upper_arm', name: 'right_upper_arm', displayName: 'Right Upper Arm', category: 'arms' },
  { id: 'left_elbow', name: 'left_elbow', displayName: 'Left Elbow', category: 'arms' },
  { id: 'right_elbow', name: 'right_elbow', displayName: 'Right Elbow', category: 'arms' },
  { id: 'left_forearm', name: 'left_forearm', displayName: 'Left Forearm', category: 'arms' },
  { id: 'right_forearm', name: 'right_forearm', displayName: 'Right Forearm', category: 'arms' },
  { id: 'left_wrist', name: 'left_wrist', displayName: 'Left Wrist', category: 'arms' },
  { id: 'right_wrist', name: 'right_wrist', displayName: 'Right Wrist', category: 'arms' },
  { id: 'left_hand', name: 'left_hand', displayName: 'Left Hand', category: 'arms' },
  { id: 'right_hand', name: 'right_hand', displayName: 'Right Hand', category: 'arms' },
  
  // Legs
  { id: 'left_hip', name: 'left_hip', displayName: 'Left Hip', category: 'legs' },
  { id: 'right_hip', name: 'right_hip', displayName: 'Right Hip', category: 'legs' },
  { id: 'left_thigh', name: 'left_thigh', displayName: 'Left Thigh', category: 'legs' },
  { id: 'right_thigh', name: 'right_thigh', displayName: 'Right Thigh', category: 'legs' },
  { id: 'left_knee', name: 'left_knee', displayName: 'Left Knee', category: 'legs' },
  { id: 'right_knee', name: 'right_knee', displayName: 'Right Knee', category: 'legs' },
  { id: 'left_calf', name: 'left_calf', displayName: 'Left Calf', category: 'legs' },
  { id: 'right_calf', name: 'right_calf', displayName: 'Right Calf', category: 'legs' },
  { id: 'left_ankle', name: 'left_ankle', displayName: 'Left Ankle', category: 'legs' },
  { id: 'right_ankle', name: 'right_ankle', displayName: 'Right Ankle', category: 'legs' },
  { id: 'left_foot', name: 'left_foot', displayName: 'Left Foot', category: 'legs' },
  { id: 'right_foot', name: 'right_foot', displayName: 'Right Foot', category: 'legs' }
];