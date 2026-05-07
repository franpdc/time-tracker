import { create } from "zustand";
import { persist } from "zustand/middleware";
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from "date-fns";

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

export type GoalPeriod = "daily" | "weekly" | "monthly";

export interface ProgressMotivation {
  id: string;
  text: string;
}

export interface ProgressSessionLog {
  id: string;
  progressTrackerId: string;
  linkedSessionId: string;
  content: string;
  createdAt: number;
}

export interface ProgressItem {
  id: string;
  projectId: string;
  period: GoalPeriod;
  sessionTarget: number;
  durationTargetMinutes: number | null;
  behaviorDescription: string | null;
  createdAt: number;
  motivations: ProgressMotivation[];
  sessionLogs: ProgressSessionLog[];
}

export interface ProgressStats {
  sessionsCompleted: number;
  totalTrackedDuration: number;
  remainingDurationForCurrentGoal: number;
  isCompleted: boolean;
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

  // Progress
  progressItems: ProgressItem[];
  addProgressItem: (item: Omit<ProgressItem, "id" | "createdAt" | "motivations" | "sessionLogs" | "behaviorDescription">) => void;
  updateProgressItem: (id: string, updates: Partial<ProgressItem>) => void;
  deleteProgressItem: (id: string) => void;
  addMotivation: (itemId: string, text: string) => void;
  removeMotivation: (itemId: string, motivationId: string) => void;
  updateMotivation: (itemId: string, motivationId: string, text: string) => void;
  addSessionLog: (itemId: string, sessionId: string, content: string) => void;
  updateSessionLog: (itemId: string, logId: string, content: string) => void;
  deleteSessionLog: (itemId: string, logId: string) => void;
  calculateProgress: (itemId: string, date?: Date) => ProgressStats;

  // Sync
  syncStatus: "synced" | "syncing" | "error" | "idle";
  setSyncStatus: (status: "synced" | "syncing" | "error" | "idle") => void;
  serverOffset: number; // offset in ms (serverTime - localTime)
  setServerOffset: (offset: number) => void;
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
        const { serverOffset } = get();
        set({
          activeTimer: {
            id: crypto.randomUUID(),
            taskName,
            projectId,
            startedAt: Date.now() + serverOffset,
          },
        });
      },
      pauseTimer: () => {
        const { activeTimer, serverOffset } = get();
        if (activeTimer && !activeTimer.pausedAt) {
          set({
            activeTimer: { ...activeTimer, pausedAt: Date.now() + serverOffset },
          });
        }
      },
      resumeTimer: () => {
        const { activeTimer, serverOffset } = get();
        if (activeTimer && activeTimer.pausedAt) {
          const pauseDuration = (Date.now() + serverOffset) - activeTimer.pausedAt;
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
        const { activeTimer, entries, serverOffset } = get();
        if (activeTimer) {
          const endedAt = activeTimer.pausedAt || (Date.now() + serverOffset);
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

      // Daily goal (default 0h)
      dailyGoalMinutes: 0,
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

      // Progress
      progressItems: [],
      addProgressItem: (item) => {
        const { serverOffset } = get();
        set((state) => ({
          progressItems: [
            ...state.progressItems,
            {
              ...item,
              id: crypto.randomUUID(),
              createdAt: Date.now() + serverOffset,
              behaviorDescription: null,
              motivations: [],
              sessionLogs: [],
            },
          ],
        }));
      },
      updateProgressItem: (id, updates) => {
        set((state) => ({
          progressItems: state.progressItems.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },
      deleteProgressItem: (id) => {
        set((state) => ({
          progressItems: state.progressItems.filter((item) => item.id !== id),
        }));
      },
      addMotivation: (itemId, text) => {
        set((state) => ({
          progressItems: state.progressItems.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  motivations: [
                    ...item.motivations,
                    { id: crypto.randomUUID(), text },
                  ],
                }
              : item
          ),
        }));
      },
      removeMotivation: (itemId, motivationId) => {
        set((state) => ({
          progressItems: state.progressItems.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  motivations: item.motivations.filter((m) => m.id !== motivationId),
                }
              : item
          ),
        }));
      },
      updateMotivation: (itemId, motivationId, text) => {
        set((state) => ({
          progressItems: state.progressItems.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  motivations: item.motivations.map((m) =>
                    m.id === motivationId ? { ...m, text } : m
                  ),
                }
              : item
          ),
        }));
      },
      addSessionLog: (itemId, sessionId, content) => {
        const { serverOffset } = get();
        set((state) => ({
          progressItems: state.progressItems.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  sessionLogs: [
                    ...item.sessionLogs,
                    {
                      id: crypto.randomUUID(),
                      progressTrackerId: itemId,
                      linkedSessionId: sessionId,
                      content,
                      createdAt: Date.now() + serverOffset,
                    },
                  ],
                }
              : item
          ),
        }));
      },
      updateSessionLog: (itemId, logId, content) => {
        set((state) => ({
          progressItems: state.progressItems.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  sessionLogs: item.sessionLogs.map((log) =>
                    log.id === logId ? { ...log, content } : log
                  ),
                }
              : item
          ),
        }));
      },
      deleteSessionLog: (itemId, logId) => {
        set((state) => ({
          progressItems: state.progressItems.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  sessionLogs: item.sessionLogs.filter((log) => log.id !== logId),
                }
              : item
          ),
        }));
      },
      calculateProgress: (itemId, date = new Date()) => {
        const state = get();
        const item = state.progressItems.find((i) => i.id === itemId);
        if (!item) return { sessionsCompleted: 0, totalTrackedDuration: 0, remainingDurationForCurrentGoal: 0, isCompleted: false };

        let startTime: number;
        let endTime: number;

        if (item.period === "daily") {
          startTime = startOfDay(date).getTime();
          endTime = endOfDay(date).getTime();
        } else if (item.period === "weekly") {
          startTime = startOfWeek(date, { weekStartsOn: 1 }).getTime();
          endTime = endOfWeek(date, { weekStartsOn: 1 }).getTime();
        } else {
          startTime = startOfMonth(date).getTime();
          endTime = endOfMonth(date).getTime();
        }

        const projectSessions = state.entries.filter(
          (e) => e.projectId === item.projectId && e.startedAt >= startTime && e.startedAt <= endTime
        );

        let totalTrackedDuration = projectSessions.reduce((acc, e) => acc + e.duration, 0);

        // Add current active timer if it's for this project AND in the range
        const now = Date.now() + state.serverOffset;
        if (
          state.activeTimer &&
          state.activeTimer.projectId === item.projectId &&
          state.activeTimer.startedAt >= startTime &&
          state.activeTimer.startedAt <= endTime &&
          now <= endTime
        ) {
          const endedAt = state.activeTimer.pausedAt || now;
          const elapsed = Math.floor(
            (endedAt - state.activeTimer.startedAt) / 1000
          );
          totalTrackedDuration += elapsed;
        }

        let sessionsCompleted = 0;
        let remainingDurationForCurrentGoal = 0;

        if (item.durationTargetMinutes) {
          const targetSec = item.durationTargetMinutes * 60;
          // Calculate sessions as "units of work" based on total duration
          sessionsCompleted = totalTrackedDuration / targetSec;
          
          if (sessionsCompleted < item.sessionTarget) {
            remainingDurationForCurrentGoal = targetSec - (totalTrackedDuration % targetSec);
          }
        } else {
          // If no duration target, every discrete session entry counts as 1
          sessionsCompleted = projectSessions.length;
          
          // Count active timer as 1 if it's running
          if (
            state.activeTimer &&
            state.activeTimer.projectId === item.projectId &&
            state.activeTimer.startedAt >= startTime &&
            state.activeTimer.startedAt <= endTime
          ) {
            sessionsCompleted += 1;
          }
        }

        const isCompleted = sessionsCompleted >= item.sessionTarget;

        return {
          sessionsCompleted,
          totalTrackedDuration,
          remainingDurationForCurrentGoal: isCompleted ? 0 : remainingDurationForCurrentGoal,
          isCompleted
        };
      },

      // Sync
      syncStatus: "idle",
      setSyncStatus: (status) => set({ syncStatus: status }),
      serverOffset: 0,
      setServerOffset: (offset) => set({ serverOffset: offset }),
    }),
    {
      name: "time-tracker-storage",
      version: 1,
      migrate: (persistedState: unknown) => {
        const state = persistedState as AppState;
        
        return {
          ...state,
          // Reset progress items for the new architecture to ensure a clean slate as requested
          progressItems: [],
          auditEntries: state.auditEntries || [],
          projects: state.projects || [],
          folders: state.folders || [],
          entries: state.entries || [],
        };
      },
    }
  )
);
