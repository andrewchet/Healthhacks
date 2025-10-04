import { create } from "zustand";

interface AppStore {
  isDarkMode: boolean;
  hasCompletedOnboarding: boolean;
  toggleDarkMode: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  resetApp: () => void;
}

// Simple store without persistence for web compatibility
const useAppStore = create<AppStore>((set, get) => ({
  isDarkMode: false,
  hasCompletedOnboarding: false,
  
  toggleDarkMode: () => set({ isDarkMode: !get().isDarkMode }),
  
  completeOnboarding: () => set({ hasCompletedOnboarding: true }),
  
  resetOnboarding: () => set({ hasCompletedOnboarding: false }),
  
  resetApp: () => set({ 
    isDarkMode: false, 
    hasCompletedOnboarding: false 
  })
}));

export default useAppStore;
