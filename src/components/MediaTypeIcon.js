import { Video, Music, FileText, Image as ImageIcon, BookOpen, Activity } from "lucide-react";
import { interactiveKey } from "@/components/interactive/registry";

/**
 * Effective "kind" of a lesson. Interactive lessons are stored as media_type
 * 'text' with a media_url of `interactive:<key>` — detect that here so the
 * whole app labels/icons them consistently.
 */
export function lessonKind(lesson) {
  if (lesson && interactiveKey(lesson.media_url)) return "interactive";
  return lesson?.media_type || "text";
}

/** Maps a lesson kind to a consistent icon used across the app. */
export default function MediaTypeIcon({ type, size = 16, className = "" }) {
  const map = {
    video: Video,
    audio: Music,
    pdf: FileText,
    image: ImageIcon,
    text: BookOpen,
    interactive: Activity,
  };
  const Icon = map[type] || BookOpen;
  return <Icon size={size} className={className} />;
}

/** Human label for a lesson kind. */
export function mediaTypeLabel(type) {
  return (
    {
      video: "Video",
      audio: "Audio",
      pdf: "PDF",
      image: "Image",
      text: "Reading",
      interactive: "Interactive",
    }[type] || "Lesson"
  );
}
