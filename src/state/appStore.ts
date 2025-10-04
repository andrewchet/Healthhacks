import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AppStore {
  isDarkMode: boolean;
  hasCompletedOnboarding: boolean;
  toggleDarkMode: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  resetApp: () => void;
}

const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      isDarkMode: false,
      hasCompletedOnboarding: false,
      
      toggleDarkMode: () => set({ isDarkMode: !get().isDarkMode }),
      
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      
      resetOnboarding: () => set({ hasCompletedOnboarding: false }),
      
      resetApp: () => set({ 
        isDarkMode: false, 
        hasCompletedOnboarding: false 
      })
    }),
    {
      name: "app-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useAppStore;