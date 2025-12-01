import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSupabaseTestSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const sessionRef = useRef<string | null>(null);

  // Create or get existing session
  const createSession = useCallback(async (testId: string, studentId: string) => {
    if (!testId || !studentId) return null;
    setIsCreating(true);

    try {
      // Check for existing session
      const { data: existing } = await supabase
        .from("test_sessions")
        .select("*")
        .eq("test_id", testId)
        .eq("student_id", studentId)
        .single();

      if (existing) {
        setSessionId(existing.id);
        sessionRef.current = existing.id;
        setIsCreating(false);
        return existing.id;
      }

      // Create new session
      const { data, error } = await supabase
        .from("test_sessions")
        .insert({
          test_id: testId,
          student_id: studentId,
          status: "in_progress",
          started_at: new Date().toISOString(),
          total_warnings: 0,
          tab_switch_count: 0,
          fullscreen_exit_count: 0,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating session:", error);
        setIsCreating(false);
        return null;
      }

      setSessionId(data.id);
      sessionRef.current = data.id;
      setIsCreating(false);
      return data.id;
    } catch (error) {
      console.error("Error in createSession:", error);
      setIsCreating(false);
      return null;
    }
  }, []);

  // Log monitoring event
  const logMonitoringEvent = useCallback(async (eventType: string, eventData?: any) => {
    const currentSessionId = sessionRef.current;
    if (!currentSessionId) {
      console.warn("No session ID available for logging event:", eventType);
      return;
    }

    try {
      await supabase
        .from("monitoring_logs")
        .insert({
          session_id: currentSessionId,
          event_type: eventType,
          event_data: eventData || {},
        });
    } catch (error) {
      console.error("Error logging event:", error);
    }
  }, []);

  // Update session warnings
  const updateWarnings = useCallback(async (totalWarnings: number, tabSwitches: number, fullscreenExits: number) => {
    const currentSessionId = sessionRef.current;
    if (!currentSessionId) return;

    try {
      await supabase
        .from("test_sessions")
        .update({
          total_warnings: totalWarnings,
          tab_switch_count: tabSwitches,
          fullscreen_exit_count: fullscreenExits,
        })
        .eq("id", currentSessionId);
    } catch (error) {
      console.error("Error updating warnings:", error);
    }
  }, []);

  // Update session status
  const updateStatus = useCallback(async (status: string) => {
    const currentSessionId = sessionRef.current;
    if (!currentSessionId) return;

    try {
      const updates: any = { status };
      if (status === "submitted" || status === "terminated") {
        updates.submitted_at = new Date().toISOString();
      }

      await supabase
        .from("test_sessions")
        .update(updates)
        .eq("id", currentSessionId);

      // Log the status change
      await logMonitoringEvent(`status_${status}`, { timestamp: new Date().toISOString() });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  }, [logMonitoringEvent]);

  return {
    sessionId,
    isCreating,
    createSession,
    logMonitoringEvent,
    updateWarnings,
    updateStatus,
  };
}
