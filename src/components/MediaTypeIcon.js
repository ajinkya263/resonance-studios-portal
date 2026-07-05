import { Video, Music, FileText, Image as ImageIcon, BookOpen } from "lucide-react";

/** Maps a lesson.media_type to a consistent icon used across the app. */
export default function MediaTypeIcon({ type, size = 16, className = "" }) {
  const map = {
    video: Video,
    audio: Music,
    pdf: FileText,
    image: ImageIcon,
    text: BookOpen,
  };
  const Icon = map[type] || BookOpen;
  return <Icon size={size} className={className} />;
}

/** Human label for a media type. */
export function mediaTypeLabel(type) {
  return (
    {
      video: "Video",
      audio: "Audio",
      pdf: "PDF",
      image: "Image",
      text: "Reading",
    }[type] || "Lesson"
  );
}
