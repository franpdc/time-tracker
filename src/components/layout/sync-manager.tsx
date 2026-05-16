"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useTimerStore";
import { toast } from "sonner";

const supabase = createClient();

export function SyncManager() {
  const store = useAppStore();
  const isInitialPullDone = useRef(false);
  const isSyncing = useRef(false);
  const lastPulledData = useRef<string>("");
  const userIdRef = useRef<string | null>(null);
  const setSyncStatus = useAppStore((state) => state.setSyncStatus);
  const setServerOffset = useAppStore((state) => state.setServerOffset);

  const pullFromSupabase = useCallback(async (userId: string) => {
    if (isSyncing.current) return;

    try {
      setSyncStatus("syncing");
      isSyncing.current = true;

      const startLocal = Date.now();

      // Clock sync
      try {
        const response = await fetch(window.location.origin, { method: 'HEAD' });
        const serverDateStr = response.headers.get('date');
        if (serverDateStr) {
          const serverTime = new Date(serverDateStr).getTime();
          const localTime = (Date.now() + startLocal) / 2;
          setServerOffset(serverTime - localTime);
        }
      } catch (e) {
        console.warn("Sync:: Could not sync clock offset", e);
      }

      const results = await Promise.allSettled([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("folders").select("*").eq("user_id", userId),
        supabase.from("projects").select("*").eq("user_id", userId),
        supabase.from("time_entries").select("*").eq("user_id", userId).order("started_at", { ascending: false }).limit(1000),
        supabase.from("audit_entries").select("*").eq("user_id", userId),
        supabase.from("progress_items").select("*").eq("user_id", userId)
      ]);

      const currentStore = useAppStore.getState();
      const newState: any = { ...currentStore };

      // Helper to check for errors in settled promises
      const hasError = (result: any) => result.status === 'rejected' || (result.status === 'fulfilled' && result.value.error);

      // Profile & Goals
      if (results[0].status === 'fulfilled' && !results[0].value.error) {
        const p = results[0].value.data;
        if (p) {
          newState.dailyGoalMinutes = p.daily_goal_minutes;
          newState.activeTimer = p.active_timer || null;
        }
      }

      // Folders
      if (results[1].status === 'fulfilled' && !results[1].value.error && results[1].value.data) {
        newState.folders = results[1].value.data.map((f: any) => ({
          id: f.id, name: f.name, isOpen: f.is_open, color: f.color
        }));
      }

      // Projects
      if (results[2].status === 'fulfilled' && !results[2].value.error && results[2].value.data) {
        newState.projects = results[2].value.data.map((p: any) => ({
          id: p.id, name: p.name, color: p.color, folderId: p.folder_id
        }));
      }

      // Entries
      if (results[3].status === 'fulfilled' && !results[3].value.error && results[3].value.data) {
        newState.entries = results[3].value.data.map((e: any) => ({
          id: e.id, taskName: e.task_name, projectId: e.project_id,
          startedAt: Number(e.started_at), endedAt: Number(e.ended_at),
          duration: Number(e.duration), source: e.source
        }));
      }

      // Audit
      if (results[4].status === 'fulfilled' && !results[4].value.error && results[4].value.data) {
        newState.auditEntries = results[4].value.data.map((a: any) => ({
          id: a.id, name: a.name, hoursPerDay: Number(a.hours_per_day), daysPerWeek: Number(a.days_per_week)
        }));
      }

      // Progress
      if (results[5].status === 'fulfilled' && !results[5].value.error && results[5].value.data) {
        newState.progressItems = results[5].value.data.map((p: any) => ({
          id: p.id, projectId: p.project_id, period: p.period,
          sessionTarget: p.session_target, durationTargetMinutes: p.duration_target_minutes,
          behaviorDescription: p.behavior_description, createdAt: Number(p.created_at),
          motivations: p.motivations || [], sessionLogs: p.session_logs || []
        }));
      }

      const compareState = {
        folders: newState.folders,
        projects: newState.projects,
        entries: newState.entries,
        auditEntries: newState.auditEntries,
        progressItems: newState.progressItems,
        activeTimer: newState.activeTimer,
        dailyGoalMinutes: newState.dailyGoalMinutes
      };

      const dataString = JSON.stringify(compareState);

      // Update state only if it changed and we are not overwriting local changes
      // (Wait, on first pull we ALWAYS overwrite local to match server truth)
      if (!isInitialPullDone.current || dataString !== lastPulledData.current) {
        lastPulledData.current = dataString;
        useAppStore.setState(newState);
      }

      isInitialPullDone.current = true;
      setSyncStatus("synced");
    } catch (error: any) {
      setSyncStatus("error");
      console.error("Sync:: Pull error:", error);
    } finally {
      isSyncing.current = false;
    }
  }, [setSyncStatus, setServerOffset]);

  const pushToSupabase = useCallback(async (userId: string) => {
    if (isSyncing.current) return;
    try {
      const state = useAppStore.getState();

      const currentState = {
        folders: state.folders,
        projects: state.projects,
        entries: state.entries,
        auditEntries: state.auditEntries,
        progressItems: state.progressItems,
        activeTimer: state.activeTimer,
        dailyGoalMinutes: state.dailyGoalMinutes
      };
      const currentStateString = JSON.stringify(currentState);

      if (currentStateString === lastPulledData.current) return;

      isSyncing.current = true;
      setSyncStatus("syncing");

      const timestamp = new Date().toISOString();

      // 1. Perform UPSERTS
      const pushPromises = [
        supabase.from("profiles").upsert({
          id: userId,
          daily_goal_minutes: state.dailyGoalMinutes,
          active_timer: state.activeTimer ? {
            ...state.activeTimer,
            startedAt: Math.round(state.activeTimer.startedAt),
            pausedAt: state.activeTimer.pausedAt ? Math.round(state.activeTimer.pausedAt) : undefined
          } : null,
          updated_at: timestamp
        }),
        supabase.from("folders").upsert(state.folders.map(f => ({ id: f.id, user_id: userId, name: f.name, is_open: f.isOpen, color: f.color, updated_at: timestamp }))),
        supabase.from("projects").upsert(state.projects.map(p => ({ id: p.id, user_id: userId, name: p.name, color: p.color, folder_id: p.folderId, updated_at: timestamp }))),
        supabase.from("time_entries").upsert(state.entries.map(e => ({ id: e.id, user_id: userId, task_name: e.taskName, project_id: e.projectId, started_at: Math.round(e.startedAt), ended_at: Math.round(e.endedAt), duration: Math.round(e.duration), source: e.source, updated_at: timestamp }))),
        supabase.from("audit_entries").upsert(state.auditEntries.map(a => ({ id: a.id, user_id: userId, name: a.name, hours_per_day: a.hoursPerDay, days_per_week: a.daysPerWeek, updated_at: timestamp }))),
        supabase.from("progress_items").upsert(state.progressItems.map(p => ({
          id: p.id, user_id: userId, project_id: p.projectId, period: p.period,
          session_target: p.sessionTarget, duration_target_minutes: p.durationTargetMinutes,
          behavior_description: p.behaviorDescription, motivations: p.motivations,
          session_logs: p.sessionLogs, created_at: Math.round(p.createdAt), updated_at: timestamp
        }))),
      ];

      const results = await Promise.all(pushPromises);
      const firstError = results.find(r => r.error);
      if (firstError) {
        console.error("Sync:: Upsert error:", firstError.error);
        throw firstError.error;
      }

      // 2. Perform DELETIONS
      // We safely delete items that are NOT in the local state.
      // For time_entries, we only delete those within the range of what we have locally to avoid wiping history.
      const folderIds = state.folders.map(f => f.id);
      const projectIds = state.projects.map(p => p.id);
      const auditIds = state.auditEntries.map(a => a.id);
      const progressIds = state.progressItems.map(p => p.id);
      const entryIds = state.entries.map(e => e.id);

      const deletionPromises = [
        supabase.from("folders").delete().eq("user_id", userId).filter("id", "not.in", `(${folderIds.join(",") || "00000000-0000-0000-0000-000000000000"})`),
        supabase.from("projects").delete().eq("user_id", userId).filter("id", "not.in", `(${projectIds.join(",") || "00000000-0000-0000-0000-000000000000"})`),
        supabase.from("audit_entries").delete().eq("user_id", userId).filter("id", "not.in", `(${auditIds.join(",") || "00000000-0000-0000-0000-000000000000"})`),
        supabase.from("progress_items").delete().eq("user_id", userId).filter("id", "not.in", `(${progressIds.join(",") || "00000000-0000-0000-0000-000000000000"})`),
      ];

      if (state.entries.length > 0) {
        const oldestLocalEntry = Math.min(...state.entries.map(e => e.startedAt));
        deletionPromises.push(
          supabase.from("time_entries")
            .delete()
            .eq("user_id", userId)
            .gte("started_at", oldestLocalEntry)
            .filter("id", "not.in", `(${entryIds.join(",")})`)
        );
      }

      const delResults = await Promise.all(deletionPromises);
      const firstDelError = delResults.find(r => r.error);
      if (firstDelError) {
        console.warn("Sync:: Deletion error (ignoring for main sync status):", firstDelError.error);
      }

      lastPulledData.current = currentStateString;
      setSyncStatus("synced");
    } catch (error: any) {
      setSyncStatus("error");
      console.error("Sync:: Push error:", error);
      toast.error("Erro ao salvar alterações no servidor.");
    } finally {
      isSyncing.current = false;
    }
  }, [setSyncStatus]);

  // Initial setup and Auth change
  useEffect(() => {
    let channel: any;

    const setupRealtime = (userId: string) => {
      if (channel) supabase.removeChannel(channel);

      channel = supabase.channel(`sync_${userId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          console.log("Sync:: Real-time change detected:", payload.eventType);
          // Only pull if we are not the ones who just pushed
          // (Small delay to allow our own push to update lastPulledData)
          setTimeout(() => {
            if (!isSyncing.current) pullFromSupabase(userId);
          }, 100);
        })
        .subscribe();
    };

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userIdRef.current = user.id;
        await pullFromSupabase(user.id);
        setupRealtime(user.id);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
        if (userIdRef.current !== session.user.id) {
          userIdRef.current = session.user.id;
          isInitialPullDone.current = false;
          pullFromSupabase(session.user.id);
          setupRealtime(session.user.id);
        }
      } else if (event === "SIGNED_OUT") {
        userIdRef.current = null;
        isInitialPullDone.current = false;
        if (channel) supabase.removeChannel(channel);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, [pullFromSupabase]);

  // Pull on visibility change
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && userIdRef.current) {
        pullFromSupabase(userIdRef.current);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [pullFromSupabase]);

  // Debounced push on state changes
  useEffect(() => {
    if (!isInitialPullDone.current || !userIdRef.current) return;

    const timeout = setTimeout(() => {
      pushToSupabase(userIdRef.current!);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [
    store.folders, store.projects, store.entries, store.dailyGoalMinutes,
    store.auditEntries, store.progressItems, store.activeTimer, pushToSupabase
  ]);

  return null;
}
