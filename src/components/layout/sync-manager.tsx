"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useTimerStore";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

const supabase = createClient();

export function SyncManager() {
  const store = useAppStore();
  const isInitialPullDone = useRef(false);
  const isSyncing = useRef(false);
  const lastPulledData = useRef<string>("");
  const userIdRef = useRef<string | null>(null);
  const setSyncStatus = useAppStore((state) => state.setSyncStatus);
  const setServerOffset = useAppStore((state) => state.setServerOffset);
  const pathname = usePathname();


  const pullFromSupabase = useCallback(async (userId: string) => {
    if (isSyncing.current) return;
    try {
      setSyncStatus("syncing");
      
      const startLocal = Date.now();
      const { data: profileData, error: profileError } = await supabase.from("profiles").select("updated_at").limit(1).maybeSingle();
      const endLocal = Date.now();
      
      // Simple clock sync: try to estimate server time
      // If we had a dedicated RPC it would be better, but we can approximate
      // using the updated_at or just a fetch if needed.
      // For now, let's use a simple approach: if we have a profile, updated_at is a good baseline
      // But better: use a fetch header.
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, { 
          method: 'HEAD',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
          }
        });
        const serverDateStr = response.headers.get('date');
        if (serverDateStr) {
          const serverTime = new Date(serverDateStr).getTime();
          const localTime = (startLocal + endLocal) / 2;
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
      const newState: any = {};

      // Profile & Goals
      if (results[0].status === 'fulfilled' && results[0].value.data) {
        const p = results[0].value.data;
        newState.dailyGoalMinutes = p.daily_goal_minutes;
        if (p.active_timer) newState.activeTimer = p.active_timer;
      }

      // Folders
      if (results[1].status === 'fulfilled' && results[1].value.data) {
        newState.folders = results[1].value.data.map((f: any) => ({ id: f.id, name: f.name, isOpen: f.is_open, color: f.color }));
      }

      // Projects
      if (results[2].status === 'fulfilled' && results[2].value.data) {
        newState.projects = results[2].value.data.map((p: any) => ({ id: p.id, name: p.name, color: p.color, folderId: p.folder_id }));
      }

      // Entries
      if (results[3].status === 'fulfilled' && results[3].value.data) {
        newState.entries = results[3].value.data.map((e: any) => ({ 
          id: e.id, taskName: e.task_name, projectId: e.project_id, 
          startedAt: Number(e.started_at), endedAt: Number(e.ended_at), 
          duration: Number(e.duration), source: e.source 
        }));
      }

      // Audit
      if (results[4].status === 'fulfilled' && results[4].value.data) {
        newState.auditEntries = results[4].value.data.map((a: any) => ({ id: a.id, name: a.name, hoursPerDay: Number(a.hours_per_day), daysPerWeek: Number(a.days_per_week) }));
      }

      // Progress
      if (results[5].status === 'fulfilled' && results[5].value.data) {
        newState.progressItems = results[5].value.data.map((p: any) => ({
          id: p.id, projectId: p.project_id, period: p.period, 
          sessionTarget: p.session_target, durationTargetMinutes: p.duration_target_minutes, 
          behaviorDescription: p.behavior_description, createdAt: Number(p.created_at), 
          motivations: p.motivations || [], sessionLogs: p.session_logs || []
        }));
      }

      // Deep compare to avoid unnecessary state updates (and thus avoid loops)
      const dataString = JSON.stringify(newState);
      if (dataString !== lastPulledData.current) {
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
  }, [setSyncStatus]);

  const pushToSupabase = useCallback(async (userId: string) => {
    if (isSyncing.current) return;
    try {
      const state = useAppStore.getState();
      
      // Don't push if the state matches what we just pulled
      const currentStateString = JSON.stringify({
        dailyGoalMinutes: state.dailyGoalMinutes,
        activeTimer: state.activeTimer,
        folders: state.folders,
        projects: state.projects,
        entries: state.entries,
        auditEntries: state.auditEntries,
        progressItems: state.progressItems
      });

      if (currentStateString === lastPulledData.current) return;

      isSyncing.current = true;
      setSyncStatus("syncing");
      
      await Promise.all([
        supabase.from("profiles").upsert({ id: userId, daily_goal_minutes: state.dailyGoalMinutes, active_timer: state.activeTimer, updated_at: new Date().toISOString() }),
        supabase.from("folders").upsert(state.folders.map(f => ({ id: f.id, user_id: userId, name: f.name, is_open: f.isOpen, color: f.color, updated_at: new Date().toISOString() }))),
        supabase.from("projects").upsert(state.projects.map(p => ({ id: p.id, user_id: userId, name: p.name, color: p.color, folder_id: p.folderId, updated_at: new Date().toISOString() }))),
        supabase.from("time_entries").upsert(state.entries.map(e => ({ id: e.id, user_id: userId, task_name: e.taskName, project_id: e.projectId, started_at: e.startedAt, ended_at: e.endedAt, duration: e.duration, source: e.source, updated_at: new Date().toISOString() }))),
        supabase.from("audit_entries").upsert(state.auditEntries.map(a => ({ id: a.id, user_id: userId, name: a.name, hours_per_day: a.hoursPerDay, days_per_week: a.daysPerWeek, updated_at: new Date().toISOString() }))),
        supabase.from("progress_items").upsert(state.progressItems.map(p => ({ 
          id: p.id, 
          user_id: userId, 
          project_id: p.projectId, 
          period: p.period, 
          session_target: p.sessionTarget, 
          duration_target_minutes: p.durationTargetMinutes, 
          behavior_description: p.behaviorDescription, 
          motivations: p.motivations, 
          session_logs: p.sessionLogs, 
          created_at: p.createdAt, 
          updated_at: new Date().toISOString() 
        }))),
      ]);

      // Sync deletions (optional, but keep it simple for now)
      // We skip deletions here to speed up and reduce complexity during "hard" debugging
      
      lastPulledData.current = currentStateString;
      setSyncStatus("synced");
    } catch (error: any) {
      setSyncStatus("error");
      console.error("Sync:: Push error:", error);
    } finally {
      isSyncing.current = false;
    }
  }, [setSyncStatus]);

  // Initial setup
  useEffect(() => {
    let channel: any;
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userIdRef.current = user.id;
      await pullFromSupabase(user.id);

      channel = supabase.channel(`sync_${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', filter: `user_id=eq.${user.id}` }, () => {
          if (!isSyncing.current) pullFromSupabase(user.id);
        })
        .subscribe();
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        userIdRef.current = session.user.id;
        pullFromSupabase(session.user.id);
      } else if (event === "SIGNED_OUT") {
        userIdRef.current = null;
        isInitialPullDone.current = false;
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

  // Pull on every navigation (tab change)
  useEffect(() => {
    if (userIdRef.current && isInitialPullDone.current) {
      console.log("Sync:: Navigation detected, refreshing data...");
      pullFromSupabase(userIdRef.current);
    }
  }, [pathname, pullFromSupabase]);

  // Debounced push on state changes
  useEffect(() => {
    if (!isInitialPullDone.current || !userIdRef.current) return;

    const timeout = setTimeout(() => {
      pushToSupabase(userIdRef.current!);
    }, 5000); // 5s debounce to allow multiple changes to batch

    return () => clearTimeout(timeout);
  }, [
    store.folders, 
    store.projects, 
    store.entries, 
    store.dailyGoalMinutes, 
    store.auditEntries, 
    store.progressItems, 
    store.activeTimer, 
    pushToSupabase
  ]);

  return null;
}
