import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, RegisterData } from "../types/auth";

interface AuthStore {
  isAuthenticated: boolean;
  currentUser: User | null;
  users: User[]; // Mock user database
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  shareDataWithProvider: (providerEmail: string) => boolean;
  getSharedPatients: () => User[];
}

const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      currentUser: null,
      users: [
        // Demo users for testing
        {
          id: "demo-patient",
          email: "patient@demo.com",
          userType: "patient",
          name: "John Smith",
          createdAt: new Date().toISOString(),
          dateOfBirth: "1990-01-15",
          sharedWithProviders: ["provider@demo.com"]
        },
        {
          id: "demo-provider",
          email: "provider@demo.com", 
          userType: "provider",
          name: "Dr. Sarah Johnson",
          createdAt: new Date().toISOString(),
          licenseNumber: "MD12345",
          specialty: "Pain Management"
        }
      ],
      
      login: async (email: string, password: string) => {
        // Simple demo authentication - in production, this would call a real API
        const user = get().users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (user) {
          set({ 
            isAuthenticated: true, 
            currentUser: user 
          });
          return true;
        }
        
        return false;
      },
      
      register: async (userData: RegisterData) => {
        const existingUser = get().users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
        if (existingUser) {
          return false; // User already exists
        }
        
        const newUser: User = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          email: userData.email,
          userType: userData.userType,
          name: userData.name,
          createdAt: new Date().toISOString(),
          ...(userData.userType === 'provider' ? {
            licenseNumber: userData.licenseNumber,
            specialty: userData.specialty
          } : {
            dateOfBirth: userData.dateOfBirth,
            sharedWithProviders: []
          })
        };
        
        set({ 
          users: [...get().users, newUser],
          isAuthenticated: true,
          currentUser: newUser
        });
        
        return true;
      },
      
      logout: () => {
        set({ 
          isAuthenticated: false, 
          currentUser: null 
        });
      },
      
      shareDataWithProvider: (providerEmail: string) => {
        const currentUser = get().currentUser;
        if (!currentUser || currentUser.userType !== 'patient') {
          return false;
        }
        
        const provider = get().users.find(u => 
          u.email.toLowerCase() === providerEmail.toLowerCase() && 
          u.userType === 'provider'
        );
        
        if (!provider) {
          return false;
        }
        
        const updatedUser = {
          ...currentUser,
          sharedWithProviders: [
            ...(currentUser.sharedWithProviders || []),
            providerEmail
          ].filter((email, index, arr) => arr.indexOf(email) === index) // Remove duplicates
        };
        
        set({
          currentUser: updatedUser,
          users: get().users.map(u => 
            u.id === currentUser.id ? updatedUser : u
          )
        });
        
        return true;
      },
      
      getSharedPatients: () => {
        const currentUser = get().currentUser;
        if (!currentUser || currentUser.userType !== 'provider') {
          return [];
        }
        
        return get().users.filter(user => 
          user.userType === 'patient' && 
          user.sharedWithProviders?.includes(currentUser.email)
        );
      }
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useAuthStore;