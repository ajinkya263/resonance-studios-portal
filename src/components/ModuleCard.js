import Link from "next/link";
import { Lock, Clock, ChevronRight, Sparkles } from "lucide-react";
import MediaTypeIcon, { mediaTypeLabel } from "@/components/MediaTypeIcon";

/**
 * A single module card for the dashboard grid.
 *
 * Props:
 *   module  — annotated module (unlocked, unlocksInDays, unlockedByOverride)
 *   lessons — array of lessons for this module (empty for locked modules)
 */
export default function ModuleCard({ module, lessons = [] }) {
  if (!module.unlocked) {
    return (
      <article
        id={`module-${module.id}`}
        className="surface relative flex flex-col overflow-hidden p-6 opacity-90"
      >
        <div className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-cream-200 text-indigo-400">
          <Lock size={16} />
        </div>
        <h3 className="pr-10 font-display text-xl text-indigo-700">
          {module.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-indigo-500">
          {module.description}
        </p>
        <div className="mt-6 flex items-center gap-2 rounded-xl bg-cream-100 px-4 py-3 text-sm text-indigo-600">
          <Clock size={16} className="text-saffron-500" />
          Unlocks in{" "}
          <span className="font-semibold">{module.unlocksInDays} day(s)</span>
        </div>
      </article>
    );
  }

  return (
    <article
      id={`module-${module.id}`}
      className="surface group flex flex-col overflow-hidden p-6 transition hover:-translate-y-0.5 hover:shadow-soft"
    >
      <div className="mb-1 flex items-start justify-between gap-3">
        <h3 className="font-display text-xl text-indigo-800">{module.title}</h3>
        {module.unlockedByOverride && (
          <span className="inline-flex items-center gap-1 rounded-full bg-saffron-100 px-2.5 py-1 text-[11px] font-semibold text-saffron-600">
            <Sparkles size={12} /> Early access
          </span>
        )}
      </div>
      <p className="text-sm text-indigo-500">{module.description}</p>

      <div className="mt-5 flex-1 space-y-1.5">
        {lessons.length === 0 && (
          <p className="text-sm italic text-indigo-400">
            Lessons coming soon.
          </p>
        )}
        {lessons.map((lesson) => (
          <Link
            key={lesson.id}
            href={`/lessons/${lesson.id}`}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-indigo-700 transition hover:bg-cream-100"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-indigo-50 text-indigo-600">
              <MediaTypeIcon type={lesson.media_type} size={15} />
            </span>
            <span className="flex-1 truncate">{lesson.title}</span>
            <span className="text-[11px] uppercase tracking-wide text-indigo-300">
              {mediaTypeLabel(lesson.media_type)}
            </span>
            <ChevronRight
              size={16}
              className="text-indigo-300 transition group-hover:translate-x-0.5"
            />
          </Link>
        ))}
      </div>
    </article>
  );
}
