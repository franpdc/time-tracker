"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useTimerStore";

const supabase = createClient();

export function SyncManager() {
  const store = useAppStore();
  const isInitialPullDone = useRef(false);
  const skipNextPush = useRef(false);

  const pullFromSupabase = useCallback(async (userId: string) => {
    try {
      console.log("Sync: Pulling data from Supabase...");
      
      const [
        { data: profile, error: profileError },
        { data: folders },
        { data: projects },
        { data: entries },
        { data: auditEntries },
        { data: progressItems },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("folders").select("*").eq("user_id", userId),
        supabase.from("projects").select("*").eq("user_id", userId),
        supabase.from("time_entries").select("*").eq("user_id", userId).order("started_at", { ascending: false }),
        supabase.from("audit_entries").select("*").eq("user_id", userId),
        supabase.from("progress_items").select("*").eq("user_id", userId),
      ]);

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Sync: Error fetching profile", profileError);
      }

      const newState: Partial<typeof store> = {};
      
      if (profile) {
        newState.dailyGoalMinutes = profile.daily_goal_minutes;
        if (profile.active_timer) {
          newState.activeTimer = profile.active_timer;
        }
      }

      if (folders) newState.folders = folders.map(f => ({ id: f.id, name: f.name, isOpen: f.is_open, color: f.color }));
      if (projects) newState.projects = projects.map(p => ({ id: p.id, name: p.name, color: p.color, folderId: p.folder_id }));
      if (entries) newState.entries = entries.map(e => ({ 
        id: e.id, 
        taskName: e.task_name, 
        projectId: e.project_id, 
        startedAt: Number(e.started_at), 
        endedAt: Number(e.ended_at), 
        duration: Number(e.duration), 
        source: e.source 
      }));
      if (auditEntries) newState.auditEntries = auditEntries.map(a => ({ 
        id: a.id, 
        name: a.name, 
        hoursPerDay: Number(a.hours_per_day), 
        daysPerWeek: Number(a.days_per_week) 
      }));
      if (progressItems) newState.progressItems = progressItems.map(p => ({
        id: p.id,
        projectId: p.project_id,
        period: p.period,
        sessionTarget: p.session_target,
        durationTargetMinutes: p.duration_target_minutes,
        behaviorDescription: p.behavior_description,
        createdAt: Number(p.created_at),
        motivations: p.motivations || [],
        sessionLogs: p.session_logs || []
      }));

      if (Object.keys(newState).length > 0) {
        skipNextPush.current = true;
        useAppStore.setState(newState);
      }
      
      isInitialPullDone.current = true;
      console.log("Sync: Pull completed.");
    } catch (error) {
      console.error("Sync: Error pulling data", error);
    }
  }, []);

  const pushToSupabase = useCallback(async (userId: string) => {
    try {
      console.log("Sync: Pushing data to Supabase...");
      
      await Promise.all([
        supabase.from("profiles").upsert({ 
          id: userId, 
          daily_goal_minutes: store.dailyGoalMinutes,
          active_timer: store.activeTimer,
          updated_at: new Date().toISOString()
        }),
        
        ...store.folders.map(f => supabase.from("folders").upsert({ 
          id: f.id, user_id: userId, name: f.name, is_open: f.isOpen, color: f.color, updated_at: new Date().toISOString() 
        })),
        
        ...store.projects.map(p => supabase.from("projects").upsert({ 
          id: p.id, user_id: userId, name: p.name, color: p.color, folder_id: p.folderId, updated_at: new Date().toISOString() 
        })),
        
        ...store.entries.map(e => supabase.from("time_entries").upsert({ 
          id: e.id, user_id: userId, task_name: e.taskName, project_id: e.projectId, started_at: e.startedAt, ended_at: e.endedAt, duration: e.duration, source: e.source, updated_at: new Date().toISOString() 
        })),
        
        ...store.auditEntries.map(a => supabase.from("audit_entries").upsert({ 
          id: a.id, user_id: userId, name: a.name, hours_per_day: a.hoursPerDay, days_per_week: a.daysPerWeek, updated_at: new Date().toISOString() 
        })),
        
        ...store.progressItems.map(p => supabase.from("progress_items").upsert({ 
          id: p.id, user_id: userId, project_id: p.projectId, period: p.period, session_target: p.sessionTarget, duration_target_minutes: p.durationTargetMinutes, behavior_description: p.behaviorDescription, motivations: p.motivations, session_logs: p.sessionLogs, created_at: p.createdAt, updated_at: new Date().toISOString() 
        })),
      ]);

      const syncDeletions = async (table: string, localIds: Set<string>) => {
        const { data: remoteItems } = await supabase.from(table).select("id").eq("user_id", userId);
        const toDelete = remoteItems?.filter(item => !localIds.has(item.id)).map(item => item.id);
        if (toDelete?.length) {
          await supabase.from(table).delete().in("id", toDelete);
        }
      };

      await Promise.all([
        syncDeletions("folders", new Set(store.folders.map(f => f.id))),
        syncDeletions("projects", new Set(store.projects.map(p => p.id))),
        syncDeletions("time_entries", new Set(store.entries.map(e => e.id))),
        syncDeletions("audit_entries", new Set(store.auditEntries.map(a => a.id))),
        syncDeletions("progress_items", new Set(store.progressItems.map(p => p.id))),
      ]);

      console.log("Sync: Push completed.");
    } catch (error) {
      console.error("Sync: Error pushing data", error);
    }
  }, [store.folders, store.projects, store.entries, store.dailyGoalMinutes, store.auditEntries, store.progressItems, store.activeTimer]);

  // 1. Initial Pull & Auth Listener
  useEffect(() => {
    const initSync = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await pullFromSupabase(user.id);
      }
    };

    initSync();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await pullFromSupabase(session.user.id);
      } else if (event === "SIGNED_OUT") {
        isInitialPullDone.current = false;
      }
    });

    return () => subscription.unsubscribe();
  }, [pullFromSupabase]);

  // 2. Push Changes (Debounced)
  useEffect(() => {
    if (!isInitialPullDone.current) return;
    if (skipNextPush.current) {
      skipNextPush.current = false;
      return;
    }

    const timeout = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await pushToSupabase(user.id);
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeout);
  }, [store.folders, store.projects, store.entries, store.dailyGoalMinutes, store.auditEntries, store.progressItems, store.activeTimer, pushToSupabase]);

  return null;
}
