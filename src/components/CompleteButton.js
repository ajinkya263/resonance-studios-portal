"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Circle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Toggles a lesson's completion for the current user (lesson_progress table).
 * `initialCompleted` seeds the UI from the server.
 */
export default function CompleteButton({ lessonId, initialCompleted = false }) {
  const supabase = createClient();
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    if (completed) {
      await supabase
        .from("lesson_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("lesson_id", lessonId);
      setCompleted(false);
    } else {
      await supabase
        .from("lesson_progress")
        .upsert(
          { user_id: user.id, lesson_id: lessonId },
          { onConflict: "user_id,lesson_id" }
        );
      setCompleted(true);
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-medium transition-all duration-200 active:scale-[0.97] ${
        completed
          ? "border border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
          : "btn-primary"
      }`}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : completed ? (
        <Check size={16} />
      ) : (
        <Circle size={16} />
      )}
      {completed ? "Completed" : "Mark as complete"}
    </button>
  );
}
