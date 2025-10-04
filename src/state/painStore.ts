import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PainLog } from "../types/pain";

interface PainStore {
  painLogs: PainLog[];
  addPainLog: (log: Omit<PainLog, 'id'>) => void;
  updatePainLog: (id: string, updates: Partial<PainLog>) => void;
  deletePainLog: (id: string) => void;
  getPainLogsByDateRange: (startDate: string, endDate: string) => PainLog[];
  getPainLogsByBodyPart: (bodyPart: string) => PainLog[];
  getRecentLogs: (days: number) => PainLog[];
}

const usePainStore = create<PainStore>()(
  persist(
    (set, get) => ({
      painLogs: [
        // Demo pain logs for testing provider dashboard
        {
          id: "demo-log-1",
          date: new Date().toISOString().split('T')[0],
          time: "09:30:00",
          bodyPart: "left_upper_arm",
          severity: 6,
          painType: "aching",
          cause: "activity",
          activity: "lifting weights",
          description: "Sharp pain during overhead press exercise",
          tags: ["Gym day", "Morning workout"]
        },
        {
          id: "demo-log-2", 
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
          time: "14:15:00",
          bodyPart: "lower_back",
          severity: 4,
          painType: "dull",
          cause: "woke_up_with_it",
          description: "Mild lower back stiffness after sitting for long periods",
          tags: ["Work stress", "Desk work"]
        }
      ],
      
      addPainLog: (log) => {
        const newLog: PainLog = {
          ...log,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
        };
        set({ painLogs: [newLog, ...get().painLogs] });
      },
      
      updatePainLog: (id, updates) => {
        set({
          painLogs: get().painLogs.map(log => 
            log.id === id ? { ...log, ...updates } : log
          )
        });
      },
      
      deletePainLog: (id) => {
        set({
          painLogs: get().painLogs.filter(log => log.id !== id)
        });
      },
      
      getPainLogsByDateRange: (startDate, endDate) => {
        return get().painLogs.filter(log => {
          const logDate = new Date(log.date);
          const start = new Date(startDate);
          const end = new Date(endDate);
          return logDate >= start && logDate <= end;
        });
      },
      
      getPainLogsByBodyPart: (bodyPart) => {
        return get().painLogs.filter(log => log.bodyPart === bodyPart);
      },
      
      getRecentLogs: (days) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        return get().painLogs.filter(log => {
          const logDate = new Date(log.date);
          return logDate >= cutoffDate;
        });
      }
    }),
    {
      name: "pain-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default usePainStore;