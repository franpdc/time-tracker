"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useTimerStore";
import { toast } from "sonner";

const supabase = createClient();

export function SyncManager() {
  const store = useAppStore();
  const isInitialPullDone = useRef(false);
  const skipNextPush = useRef(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error" | "idle">("idle");
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const pullFromSupabase = useCallback(async (userId: string) => {
    try {
      setSyncStatus("syncing");
      console.log("Sync:: Starting resilient parallel pull for user", userId);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const results = await Promise.allSettled([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle().abortSignal(controller.signal),
        supabase.from("folders").select("*").eq("user_id", userId).abortSignal(controller.signal),
        supabase.from("projects").select("*").eq("user_id", userId).abortSignal(controller.signal),
        supabase.from("time_entries").select("*").eq("user_id", userId).order("started_at", { ascending: false }).limit(1000).abortSignal(controller.signal),
        supabase.from("audit_entries").select("*").eq("user_id", userId).abortSignal(controller.signal),
        supabase.from("progress_items").select("*").eq("user_id", userId).abortSignal(controller.signal)
      ]);

      clearTimeout(timeoutId);

      const currentStore = useAppStore.getState();
      const newState: Partial<typeof currentStore> = {};

      // 1. Profile
      const profileRes = results[0];
      if (profileRes.status === 'fulfilled' && profileRes.value.data) {
        const p = profileRes.value.data;
        newState.dailyGoalMinutes = p.daily_goal_minutes;
        if (p.active_timer) newState.activeTimer = p.active_timer;
      }

      // 2. Folders
      const foldersRes = results[1];
      if (foldersRes.status === 'fulfilled' && foldersRes.value.data) {
        newState.folders = foldersRes.value.data.map((f: any) => ({ 
          id: f.id, name: f.name, isOpen: f.is_open, color: f.color 
        }));
      }

      // 3. Projects
      const projectsRes = results[2];
      if (projectsRes.status === 'fulfilled' && projectsRes.value.data) {
        newState.projects = projectsRes.value.data.map((p: any) => ({ 
          id: p.id, name: p.name, color: p.color, folderId: p.folder_id 
        }));
      }

      // 4. Entries
      const entriesRes = results[3];
      if (entriesRes.status === 'fulfilled' && entriesRes.value.data) {
        newState.entries = entriesRes.value.data.map((e: any) => ({ 
          id: e.id, taskName: e.task_name, projectId: e.project_id, 
          startedAt: Number(e.started_at), endedAt: Number(e.ended_at), 
          duration: Number(e.duration), source: e.source 
        }));
      }

      // 5. Audit
      const auditRes = results[4];
      if (auditRes.status === 'fulfilled' && auditRes.value.data) {
        newState.auditEntries = auditRes.value.data.map((a: any) => ({ 
          id: a.id, name: a.name, hoursPerDay: Number(a.hours_per_day), daysPerWeek: Number(a.days_per_week) 
        }));
      }

      // 6. Progress
      const progressRes = results[5];
      if (progressRes.status === 'fulfilled' && progressRes.value.data) {
        newState.progressItems = progressRes.value.data.map((p: any) => ({
          id: p.id, projectId: p.project_id, period: p.period, 
          sessionTarget: p.session_target, durationTargetMinutes: p.duration_target_minutes, 
          behaviorDescription: p.behavior_description, createdAt: Number(p.created_at), 
          motivations: p.motivations || [], sessionLogs: p.session_logs || []
        }));
      }

      const hasFailures = results.some(r => r.status === 'rejected');
      
      // Safety check: don't wipe local data if remote is empty on first pull
      const isRemoteEmpty = results.slice(1, 4).every(r => r.status === 'fulfilled' && (!r.value.data || r.value.data.length === 0));
      const hasLocalData = currentStore.folders.length > 0 || currentStore.projects.length > 0;

      if (isRemoteEmpty && hasLocalData && !isInitialPullDone.current) {
        console.log("Sync:: Remote empty, initial sync will push local data.");
      } else if (Object.keys(newState).length > 0) {
        skipNextPush.current = true;
        useAppStore.setState(newState);
      }
      
      isInitialPullDone.current = true;
      setSyncStatus(hasFailures ? "error" : "synced");
      setLastSync(new Date());
      
      if (hasFailures) {
        const errors = results.filter(r => r.status === 'rejected').length;
        console.warn(`Sync:: Partial failure (${errors} tables)`);
      }

    } catch (error: any) {
      setSyncStatus("error");
      console.error("Sync:: Fatal error in pullFromSupabase:", error);
      if (error.name === 'AbortError') {
        toast.error("Sincronização expirou. Verifique sua conexão.");
      }
    }
  }, []);

  const pushToSupabase = useCallback(async (userId: string) => {
    try {
      const state = useAppStore.getState();
      console.log("Sync:: Pushing local changes...");
      
      const results = await Promise.all([
        supabase.from("profiles").upsert({ 
          id: userId, daily_goal_minutes: state.dailyGoalMinutes,
          active_timer: state.activeTimer, updated_at: new Date().toISOString()
        }),
        supabase.from("folders").upsert(state.folders.map(f => ({ 
          id: f.id, user_id: userId, name: f.name, is_open: f.isOpen, color: f.color, updated_at: new Date().toISOString() 
        }))),
        supabase.from("projects").upsert(state.projects.map(p => ({ 
          id: p.id, user_id: userId, name: p.name, color: p.color, folder_id: p.folderId, updated_at: new Date().toISOString() 
        }))),
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
      if (errors.length > 0) throw new Error(errors.join(", "));

      // Deletions
      const syncDeletions = async (table: string, localIds: Set<string>) => {
        const { data: remoteItems } = await supabase.from(table).select("id").eq("user_id", userId);
        const toDelete = remoteItems?.filter(item => !localIds.has(item.id)).map(item => item.id);
        if (toDelete?.length) await supabase.from(table).delete().in("id", toDelete);
      };

      await Promise.all([
        syncDeletions("folders", new Set(state.folders.map(f => f.id))),
        syncDeletions("projects", new Set(state.projects.map(p => p.id))),
        syncDeletions("time_entries", new Set(state.entries.map(e => e.id))),
        syncDeletions("audit_entries", new Set(state.auditEntries.map(a => a.id))),
        syncDeletions("progress_items", new Set(state.progressItems.map(p => p.id))),
      ]);

      setSyncStatus("synced");
      setLastSync(new Date());
    } catch (error: any) {
      setSyncStatus("error");
      console.error("Sync:: Error during push:", error);
    }
  }, []);

  useEffect(() => {
    let channel: any;
    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await pullFromSupabase(user.id);

      channel = supabase.channel(`sync_${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', filter: `user_id=eq.${user.id}` }, () => pullFromSupabase(user.id))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, () => pullFromSupabase(user.id))
        .subscribe();
    };

    setup();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await pullFromSupabase(session.user.id);
        if (!channel) setup();
      } else if (event === "SIGNED_OUT") {
        isInitialPullDone.current = false;
        if (channel) supabase.removeChannel(channel);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, [pullFromSupabase]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await pullFromSupabase(user.id);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [pullFromSupabase]);

  useEffect(() => {
    if (!isInitialPullDone.current) return;
    if (skipNextPush.current) {
      skipNextPush.current = false;
      return;
    }
    const timeout = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await pushToSupabase(user.id);
    }, 3000); 
    return () => clearTimeout(timeout);
  }, [store.folders, store.projects, store.entries, store.dailyGoalMinutes, store.auditEntries, store.progressItems, store.activeTimer, pushToSupabase]);

  return (
    <div className="fixed bottom-4 right-4 z-[100] pointer-events-none group">
      <div className={cn(
        "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-500 flex items-center gap-2",
        syncStatus === "syncing" && "bg-cyan-glow/20 text-cyan-glow animate-pulse opacity-100",
        syncStatus === "synced" && "bg-green-500/10 text-green-500 opacity-0 group-hover:opacity-100",
        syncStatus === "error" && "bg-red-500/20 text-red-500 opacity-100",
        syncStatus === "idle" && "opacity-0"
      )}>
        <div className={cn(
          "h-1.5 w-1.5 rounded-full",
          syncStatus === "syncing" && "bg-cyan-glow",
          syncStatus === "synced" && "bg-green-500",
          syncStatus === "error" && "bg-red-500"
        )} />
        {syncStatus === "syncing" && "Sincronizando..."}
        {syncStatus === "synced" && "Sincronizado"}
        {syncStatus === "error" && "Falha na sincronização"}
      </div>
    </div>
  );
}
