"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Plus,
  Save,
  Trash2,
  Loader2,
  Check,
  Info,
  Layers,
  BookOpen,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
} from "@/app/(app)/admin/content-actions";

/** The five stored media_type enum values. */
const MEDIA_TYPES = ["video", "audio", "pdf", "image", "text"];

/** Shared input styling — cream border, saffron focus ring, indigo text. */
const inputCls =
  "w-full rounded-xl border border-cream-200 bg-white px-3 py-2 text-sm text-indigo-800 placeholder:text-indigo-300 transition focus:border-saffron-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/40";

/**
 * Admin content editor.
 * Props:
 *   modules — [{ id, title, description, unlock_delay_days, order_index }]
 *   lessons — [{ id, module_id, title, media_type, media_url, text_content, video_url, order_index }]
 */
export default function ContentEditor({ modules, lessons }) {
  const [pending, startTransition] = useTransition();

  // Group lessons under their module, preserving the ordered props.
  const lessonsByModule = useMemo(() => {
    const map = {};
    for (const l of lessons) {
      (map[l.module_id] ||= []).push(l);
    }
    return map;
  }, [lessons]);

  function addModule() {
    startTransition(async () => {
      await createModule();
    });
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-sm text-indigo-500">
          {modules.length} module{modules.length === 1 ? "" : "s"}
        </p>
        <button onClick={addModule} disabled={pending} className="btn-primary">
          {pending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          Add module
        </button>
      </div>

      <HelpPanel />

      {/* Modules */}
      <div className="space-y-6">
        {modules.length === 0 && (
          <p className="surface p-8 text-center text-indigo-400">
            No modules yet — click “Add module” to create your first one.
          </p>
        )}

        {modules.map((m) => (
          <ModuleCard
            key={m.id}
            module={m}
            lessons={lessonsByModule[m.id] ?? []}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Module card ─────────────────────────────────────────────────────── */

function ModuleCard({ module, lessons }) {
  const [form, setForm] = useState({
    title: module.title ?? "",
    description: module.description ?? "",
    unlock_delay_days: module.unlock_delay_days ?? 0,
    order_index: module.order_index ?? 0,
  });
  const [saving, startSaving] = useTransition();
  const [adding, startAdding] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(true);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  }

  function save() {
    setError(null);
    startSaving(async () => {
      const res = await updateModule(module.id, form);
      if (res?.ok) setSaved(true);
      else setError(res?.error || "Could not save module.");
    });
  }

  function remove() {
    if (
      !confirm(
        `Delete “${form.title || "this module"}”? This can't be undone.`
      )
    )
      return;
    setError(null);
    startSaving(async () => {
      const res = await deleteModule(module.id);
      if (!res?.ok) setError(res?.error || "Could not delete module.");
    });
  }

  function addLesson() {
    startAdding(async () => {
      await createLesson(module.id);
      setOpen(true);
    });
  }

  return (
    <article className="surface p-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 text-indigo-400 transition hover:text-indigo-700"
          title={open ? "Collapse lessons" : "Expand lessons"}
        >
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-500">
            <Layers size={13} /> Module
          </span>
        </button>
        <span className="rounded-full bg-cream-100 px-3 py-1 text-xs text-indigo-400">
          {lessons.length} lesson{lessons.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Module fields */}
      <div className="mt-4 grid gap-4">
        <Field label="Title">
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className={inputCls}
            placeholder="Module title"
          />
        </Field>

        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
            className={inputCls}
            placeholder="Short summary shown on the dashboard"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Unlock delay (days)"
            hint="Days after enrollment before students can open this module."
          >
            <input
              type="number"
              min={0}
              value={form.unlock_delay_days}
              onChange={(e) => set("unlock_delay_days", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Order" hint="Lower numbers appear first.">
            <input
              type="number"
              min={0}
              value={form.order_index}
              onChange={(e) => set("order_index", e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
      </div>

      {/* Module actions */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          Save module
        </button>
        <DeleteButton onClick={remove} disabled={saving} />
        <SavedHint saved={saved} pending={saving} error={error} />
      </div>

      {/* Lessons */}
      {open && (
        <div className="mt-5 border-t border-cream-200 pt-5">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-400">
            <BookOpen size={13} /> Lessons
          </p>

          <div className="space-y-4">
            {lessons.length === 0 && (
              <p className="rounded-xl bg-cream-50 px-4 py-3 text-sm text-indigo-400">
                No lessons yet.
              </p>
            )}
            {lessons.map((l) => (
              <LessonCard key={l.id} lesson={l} />
            ))}
          </div>

          <button
            onClick={addLesson}
            disabled={adding}
            className="btn-outline mt-4"
          >
            {adding ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            Add lesson
          </button>
        </div>
      )}
    </article>
  );
}

/* ── Lesson card ─────────────────────────────────────────────────────── */

function LessonCard({ lesson }) {
  const [form, setForm] = useState({
    title: lesson.title ?? "",
    media_type: lesson.media_type ?? "text",
    media_url: lesson.media_url ?? "",
    video_url: lesson.video_url ?? "",
    text_content: lesson.text_content ?? "",
    order_index: lesson.order_index ?? 0,
  });
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateLesson(lesson.id, form);
      if (res?.ok) setSaved(true);
      else setError(res?.error || "Could not save lesson.");
    });
  }

  function remove() {
    if (
      !confirm(`Delete “${form.title || "this lesson"}”? This can't be undone.`)
    )
      return;
    setError(null);
    startTransition(async () => {
      const res = await deleteLesson(lesson.id);
      if (!res?.ok) setError(res?.error || "Could not delete lesson.");
    });
  }

  return (
    <div className="rounded-xl border border-cream-200 bg-cream-50/60 p-4">
      <div className="grid gap-4">
        {/* Title + order + type */}
        <div className="grid gap-4 sm:grid-cols-[1fr_7rem_10rem]">
          <Field label="Title">
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className={inputCls}
              placeholder="Lesson title"
            />
          </Field>
          <Field label="Order">
            <input
              type="number"
              min={0}
              value={form.order_index}
              onChange={(e) => set("order_index", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Media type">
            <select
              value={form.media_type}
              onChange={(e) => set("media_type", e.target.value)}
              className={inputCls}
            >
              {MEDIA_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* URLs */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Media URL"
            hint="File/media source, or interactive:… (see cheatsheet)."
          >
            <input
              value={form.media_url}
              onChange={(e) => set("media_url", e.target.value)}
              className={inputCls}
              placeholder="https://…  or  interactive:anatomy"
            />
          </Field>
          <Field label="Companion video URL" hint="Optional — shown alongside the lesson.">
            <input
              value={form.video_url}
              onChange={(e) => set("video_url", e.target.value)}
              className={inputCls}
              placeholder="https://youtube.com/watch?v=…"
            />
          </Field>
        </div>

        {/* Body */}
        <Field
          label="Text content"
          hint="Written content — also used as the caption/notes for media lessons."
        >
          <textarea
            value={form.text_content}
            onChange={(e) => set("text_content", e.target.value)}
            rows={4}
            className={inputCls}
            placeholder="Lesson notes, transcript, or prose…"
          />
        </Field>
      </div>

      {/* Lesson actions */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={save} disabled={pending} className="btn-primary">
          {pending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          Save lesson
        </button>
        <DeleteButton onClick={remove} disabled={pending} />
        <SavedHint saved={saved} pending={pending} error={error} />
      </div>
    </div>
  );
}

/* ── Shared bits ─────────────────────────────────────────────────────── */

/** Labelled form control with an optional hint line. */
function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-indigo-400">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-indigo-400">{hint}</span>}
    </label>
  );
}

/** Red-tinted outline delete button. */
function DeleteButton({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 font-medium text-red-600 transition hover:border-red-400 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Trash2 size={16} /> Delete
    </button>
  );
}

/** Small pending / saved ✓ / error indicator. */
function SavedHint({ saved, pending, error }) {
  if (error) return <span className="text-sm text-red-600">{error}</span>;
  if (pending)
    return (
      <span className="inline-flex items-center gap-1 text-sm text-indigo-400">
        <Loader2 size={14} className="animate-spin" /> Saving…
      </span>
    );
  if (saved)
    return (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600">
        <Check size={15} /> Saved
      </span>
    );
  return null;
}

/** Authoring reference for interactive lessons + companion video. */
function HelpPanel() {
  return (
    <div className="surface mb-6 p-5">
      <p className="mb-3 flex items-center gap-2 font-display text-lg text-indigo-900">
        <Info size={16} className="text-saffron-500" /> Authoring cheatsheet
      </p>
      <ul className="space-y-2.5 text-sm text-indigo-600">
        <li>
          <span className="font-medium text-indigo-800">Interactive lessons</span> —
          set <Code>media_type</Code> to <Code>text</Code> and <Code>media_url</Code>{" "}
          to one of:
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            <Code>interactive:anatomy</Code>
            <Code>interactive:teentaal-trainer</Code>
            <Code>interactive:quiz:foundations</Code>
            <Code>interactive:bol:&lt;slug&gt;</Code>
          </span>
          <span className="mt-1 block text-xs text-indigo-400">
            bol slugs: ta, tin, ge, ka-kat, dha-dhin, tete, tu
          </span>
        </li>
        <li>
          <span className="font-medium text-indigo-800">Companion video</span> — set{" "}
          <Code>video_url</Code> on any lesson to show a video alongside its content
          (a YouTube watch URL is fine).
        </li>
      </ul>
    </div>
  );
}

/** Inline monospace token. */
function Code({ children }) {
  return (
    <code className="rounded bg-cream-200 px-1.5 py-0.5 font-mono text-[0.8em] text-indigo-800">
      {children}
    </code>
  );
}
