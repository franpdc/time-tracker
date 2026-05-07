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

      const isRemoteEmpty = 
        (!folders || folders.length === 0) && 
        (!projects || projects.length === 0) && 
        (!entries || entries.length === 0);

      const currentStore = useAppStore.getState();
      const hasLocalData = 
        currentStore.folders.length > 0 || 
        currentStore.projects.length > 0 || 
        currentStore.entries.length > 0;

      if (isRemoteEmpty && hasLocalData) {
        console.log("Sync: Remote is empty but local has data. Performing initial push...");
        await pushToSupabase(userId);
        isInitialPullDone.current = true;
        return;
      }

      const newState: Partial<typeof currentStore> = {};
      
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
      console.log(`Sync: Pull completed. Loaded ${folders?.length || 0} folders, ${projects?.length || 0} projects, ${entries?.length || 0} entries.`);
    } catch (error) {
      console.error("Sync: Error pulling data from Supabase:", error);
    }
  }, []);

  const pushToSupabase = useCallback(async (userId: string) => {
    try {
      const state = useAppStore.getState();
      console.log("Sync: Pushing local changes to Supabase...");
      
      // 1. Profile (no FK deps)
      const { error: profileError } = await supabase.from("profiles").upsert({ 
        id: userId, 
        daily_goal_minutes: state.dailyGoalMinutes,
        active_timer: state.activeTimer,
        updated_at: new Date().toISOString()
      });
      if (profileError) throw new Error(`Profile sync failed: ${profileError.message}`);
      
      // 2. Folders (must be first for projects FK)
      if (state.folders.length) {
        const { error } = await supabase.from("folders").upsert(
          state.folders.map(f => ({ 
            id: f.id, user_id: userId, name: f.name, is_open: f.isOpen, color: f.color, updated_at: new Date().toISOString() 
          }))
        );
        if (error) throw new Error(`Folders sync failed: ${error.message}`);
      }

      // 3. Projects (depends on folders)
      if (state.projects.length) {
        const { error } = await supabase.from("projects").upsert(
          state.projects.map(p => ({ 
            id: p.id, user_id: userId, name: p.name, color: p.color, folder_id: p.folderId, updated_at: new Date().toISOString() 
          }))
        );
        if (error) throw new Error(`Projects sync failed: ${error.message}`);
      }

      // 4. Other data
      const results = await Promise.all([
        supabase.from("time_entries").upsert(state.entries.map(e => ({ 
          id: e.id, user_id: userId, task_name: e.taskName, project_id: e.projectId, started_at: e.startedAt, ended_at: e.endedAt, duration: e.duration, source: e.source, updated_at: new Date().toISOString() 
        }))),
        supabase.from("audit_entries").upsert(state.auditEntries.map(a => ({ 
          id: a.id, user_id: userId, name: a.name, hours_per_day: a.hoursPerDay, days_per_week: a.daysPerWeek, updated_at: new Date().toISOString() 
        }))),
        supabase.from("progress_items").upsert(state.progressItems.map(p => ({ 
          id: p.id, user_id: userId, project_id: p.projectId, period: p.period, session_target: p.sessionTarget, duration_target_minutes: p.durationTargetMinutes, behavior_description: p.behaviorDescription, motivations: p.motivations, session_logs: p.sessionLogs, created_at: p.createdAt, updated_at: new Date().toISOString() 
        }))),
      ]);

      const errors = results.filter(r => r.error).map(r => r.error?.message);
      if (errors.length > 0) throw new Error(`Batch sync failed: ${errors.join(", ")}`);

      // Deletions
      const syncDeletions = async (table: string, localIds: Set<string>) => {
        const { data: remoteItems } = await supabase.from(table).select("id").eq("user_id", userId);
        const toDelete = remoteItems?.filter(item => !localIds.has(item.id)).map(item => item.id);
        if (toDelete?.length) {
          await supabase.from(table).delete().in("id", toDelete);
        }
      };

      await Promise.all([
        syncDeletions("folders", new Set(state.folders.map(f => f.id))),
        syncDeletions("projects", new Set(state.projects.map(p => p.id))),
        syncDeletions("time_entries", new Set(state.entries.map(e => e.id))),
        syncDeletions("audit_entries", new Set(state.auditEntries.map(a => a.id))),
        syncDeletions("progress_items", new Set(state.progressItems.map(p => p.id))),
      ]);

      console.log("Sync: Push completed successfully.");
    } catch (error) {
      console.error("Sync: Critical error during push:", error);
    }
  }, []);

  // Initial Sync & Realtime Subscription
  useEffect(() => {
    let channel: any;

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("Sync: No user found for realtime setup.");
        return;
      }

      console.log("Sync: Setting up realtime channel for user", user.id);
      await pullFromSupabase(user.id);

      // Subscribe to all changes for this user
      channel = supabase.channel(`sync_user_${user.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          filter: `user_id=eq.${user.id}` 
        }, (payload) => {
          console.log("Sync: Realtime change detected in user data", payload.table);
          pullFromSupabase(user.id);
        })
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'profiles', 
          filter: `id=eq.${user.id}` 
        }, (payload) => {
          console.log("Sync: Realtime change detected in profile", payload.eventType);
          pullFromSupabase(user.id);
        })
        .subscribe((status) => {
          console.log(`Sync: Realtime status for user ${user.id}:`, status);
          if (status === 'CHANNEL_ERROR') {
            console.error("Sync: Realtime subscription failed. Check RLS and Replication settings.");
          }
        });
    };

    setup();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Sync: Auth event", event);
      if (event === "SIGNED_IN" && session?.user) {
        await pullFromSupabase(session.user.id);
        if (!channel) setup();
      } else if (event === "SIGNED_OUT") {
        isInitialPullDone.current = false;
        if (channel) {
          console.log("Sync: Removing realtime channel due to logout");
          supabase.removeChannel(channel);
          channel = null;
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      if (channel) {
        console.log("Sync: Cleaning up realtime channel");
        supabase.removeChannel(channel);
      }
    };
  }, [pullFromSupabase]);

  // 3. Visibility Change (Re-sync when returning to app)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        console.log("Sync: App became visible, checking for updates...");
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await pullFromSupabase(user.id);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [pullFromSupabase]);

  // Push Changes (Debounced)
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
    }, 3000); 

    return () => clearTimeout(timeout);
  }, [store.folders, store.projects, store.entries, store.dailyGoalMinutes, store.auditEntries, store.progressItems, store.activeTimer, pushToSupabase]);

  return null;
}
