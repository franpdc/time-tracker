import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Folder {
  id: string;
  name: string;
  isOpen: boolean;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  folderId: string | null;
}

export interface TimeEntry {
  id: string;
  taskName: string;
  projectId: string | null;
  startedAt: number;
  endedAt: number;
  duration: number; // in seconds
  source?: "timer" | "manual";
}

export interface ActiveTimer {
  id: string;
  taskName: string;
  projectId: string | null;
  startedAt: number;
  pausedAt?: number;
}

export interface AuditEntry {
  id: string;
  name: string;
  hoursPerDay: number;
  daysPerWeek: number;
}

interface AppState {
  // Folders & Projects
  folders: Folder[];
  projects: Project[];
  addFolder: (name: string, color?: string) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  addProject: (name: string, color: string, folderId: string | null) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  toggleFolder: (id: string) => void;

  // Timer
  activeTimer: ActiveTimer | null;
  startTimer: (taskName: string, projectId: string | null) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => TimeEntry | null;
  updateTimer: (taskName: string, projectId: string | null) => void;
  updateActiveTimer: (updates: Partial<ActiveTimer>) => void;

  // History
  entries: TimeEntry[];
  addEntry: (entry: TimeEntry) => void;
  updateEntry: (id: string, updates: Partial<TimeEntry>) => void;
  deleteEntry: (id: string) => void;

  // Daily goal
  dailyGoalMinutes: number;
  setDailyGoal: (minutes: number) => void;

  // Time Audit
  auditEntries: AuditEntry[];
  addAuditEntry: (name: string, hoursPerDay: number, daysPerWeek: number) => void;
  updateAuditEntry: (id: string, updates: Partial<AuditEntry>) => void;
  deleteAuditEntry: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      folders: [],
      projects: [],
      addFolder: (name, color = "#FF6B00") => {
        set((state) => ({
          folders: [...state.folders, { id: crypto.randomUUID(), name, isOpen: true, color }],
        }));
      },
      updateFolder: (id, updates) => {
        set((state) => ({
          folders: state.folders.map((f) => (f.id === id ? { ...f, ...updates } : f)),
        }));
      },
      deleteFolder: (id) => {
        set((state) => {
          return {
            folders: state.folders.filter((f) => f.id !== id),
            // Also set folderId to null for all projects in this folder
            projects: state.projects.map((p) => (p.folderId === id ? { ...p, folderId: null } : p)),
          };
        });
      },
      addProject: (name, color, folderId) => {
        set((state) => ({
          projects: [...state.projects, { id: crypto.randomUUID(), name, color, folderId }],
        }));
      },
      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
      },
      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          entries: state.entries.map((e) => (e.projectId === id ? { ...e, projectId: null } : e)),
          activeTimer: state.activeTimer?.projectId === id 
            ? { ...state.activeTimer, projectId: null } 
            : state.activeTimer,
        }));
      },
      toggleFolder: (id) => {
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, isOpen: !f.isOpen } : f
          ),
        }));
      },

      activeTimer: null,
      startTimer: (taskName, projectId) => {
        set({
          activeTimer: {
            id: crypto.randomUUID(),
            taskName,
            projectId,
            startedAt: Date.now(),
          },
        });
      },
      pauseTimer: () => {
        const { activeTimer } = get();
        if (activeTimer && !activeTimer.pausedAt) {
          set({
            activeTimer: { ...activeTimer, pausedAt: Date.now() },
          });
        }
      },
      resumeTimer: () => {
        const { activeTimer } = get();
        if (activeTimer && activeTimer.pausedAt) {
          const pauseDuration = Date.now() - activeTimer.pausedAt;
          set({
            activeTimer: {
              ...activeTimer,
              startedAt: activeTimer.startedAt + pauseDuration,
              pausedAt: undefined,
            },
          });
        }
      },
      stopTimer: () => {
        const { activeTimer, entries } = get();
        if (activeTimer) {
          const endedAt = activeTimer.pausedAt || Date.now();
          const duration = Math.floor((endedAt - activeTimer.startedAt) / 1000);
          
          const newEntry: TimeEntry = {
            id: crypto.randomUUID(),
            taskName: activeTimer.taskName,
            projectId: activeTimer.projectId,
            startedAt: activeTimer.startedAt,
            endedAt,
            duration,
            source: "timer",
          };

          set({
            activeTimer: null,
            entries: [...entries, newEntry],
          });

          return newEntry;
        }
        return null;
      },
      updateTimer: (taskName, projectId) => {
        set((state) => ({
          activeTimer: state.activeTimer
            ? { ...state.activeTimer, taskName, projectId }
            : null,
        }));
      },
      updateActiveTimer: (updates) => {
        set((state) => ({
          activeTimer: state.activeTimer
            ? { ...state.activeTimer, ...updates }
            : null,
        }));
      },

      entries: [],
      addEntry: (entry) => {
        set((state) => ({ entries: [...state.entries, entry] }));
      },
      updateEntry: (id, updates) => {
        set((state) => ({
          entries: state.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        }));
      },
      deleteEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        }));
      },

      // Daily goal (default 4h = 240 min)
      dailyGoalMinutes: 240,
      setDailyGoal: (minutes) => {
        set({ dailyGoalMinutes: minutes });
      },

      // Time Audit
      auditEntries: [],
      addAuditEntry: (name, hoursPerDay, daysPerWeek) => {
        set((state) => ({
          auditEntries: [
            ...state.auditEntries,
            { id: crypto.randomUUID(), name, hoursPerDay, daysPerWeek },
          ],
        }));
      },
      updateAuditEntry: (id, updates) => {
        set((state) => ({
          auditEntries: state.auditEntries.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        }));
      },
      deleteAuditEntry: (id) => {
        set((state) => ({
          auditEntries: state.auditEntries.filter((e) => e.id !== id),
        }));
      },
    }),
    {
      name: "time-tracker-storage",
      version: 1,
    }
  )
);
