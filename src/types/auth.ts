export interface User {
  id: string;
  email: string;
  userType: 'patient' | 'provider';
  name: string;
  createdAt: string;
  // Provider specific fields
  licenseNumber?: string;
  specialty?: string;
  // Patient specific fields  
  dateOfBirth?: string;
  sharedWithProviders?: string[]; // Array of provider emails
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  userType: 'patient' | 'provider';
  licenseNumber?: string;
  specialty?: string;
  dateOfBirth?: string;
}