"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Volume2,
  ImageOff,
} from "lucide-react";
import MediaTypeIcon, { mediaTypeLabel } from "@/components/MediaTypeIcon";

/**
 * Renders a lesson's body according to its media_type:
 *   video → embedded player (YouTube/Vimeo/native)
 *   audio → styled native <audio> player (bols, theka claps)
 *   pdf   → inline PDF viewer + download
 *   image → single image OR gallery (handwritten compositions)
 *   text  → formatted reading/theory
 *
 * Props:
 *   lesson   — { title, media_type, media_url, text_content }
 *   module   — { id, title }
 *   siblings — [{ id, title, media_type }] for prev/next nav within the module
 */
export default function LessonViewer({ lesson, module, siblings = [] }) {
  const idx = siblings.findIndex((s) => s.id === lesson.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  return (
    <div className="mx-auto w-full max-w-4xl animate-fade-up">
      {/* Breadcrumb */}
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm text-indigo-500 transition hover:text-indigo-800"
      >
        <ArrowLeft size={16} />
        Back to dashboard
      </Link>

      {/* Header */}
      <div className="mb-6">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
          <MediaTypeIcon type={lesson.media_type} size={13} />
          {mediaTypeLabel(lesson.media_type)} · {module?.title}
        </p>
        <h1 className="font-display text-3xl text-indigo-900 md:text-4xl">
          {lesson.title}
        </h1>
        <div className="gold-rule mt-3" />
      </div>

      {/* Body */}
      <div className="surface p-4 md:p-6">
        <LessonBody lesson={lesson} />
      </div>

      {/* Optional supporting notes for non-text lessons */}
      {lesson.media_type !== "text" && lesson.text_content && (
        <div className="surface mt-6 p-6">
          <h2 className="mb-3 font-display text-lg text-indigo-800">
            Notes
          </h2>
          <RichText content={lesson.text_content} />
        </div>
      )}

      {/* Prev / Next */}
      <nav className="mt-8 flex items-center justify-between gap-4">
        {prev ? (
          <Link href={`/lessons/${prev.id}`} className="btn-outline">
            <ArrowLeft size={16} /> {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/lessons/${next.id}`} className="btn-primary">
            {next.title} <ArrowLeft size={16} className="rotate-180" />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}

/* ── Dispatcher ──────────────────────────────────────────────────────────── */
function LessonBody({ lesson }) {
  switch (lesson.media_type) {
    case "video":
      return <VideoPlayer url={lesson.media_url} title={lesson.title} />;
    case "audio":
      return <AudioPlayer url={lesson.media_url} />;
    case "pdf":
      return <PdfViewer url={lesson.media_url} />;
    case "image":
      return <ImageGallery url={lesson.media_url} title={lesson.title} />;
    case "text":
    default:
      return <RichText content={lesson.text_content} />;
  }
}

/* ── VIDEO ───────────────────────────────────────────────────────────────── */
function VideoPlayer({ url, title }) {
  if (!url) return <Empty label="No video URL set yet." />;
  const embed = toEmbedUrl(url);

  // Native file (mp4/webm) vs. embed (YouTube/Vimeo)
  const isFile = /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);

  return (
    <div className="overflow-hidden rounded-xl bg-black">
      <div className="relative aspect-video w-full">
        {isFile ? (
          <video src={url} controls className="h-full w-full" />
        ) : (
          <iframe
            src={embed}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        )}
      </div>
    </div>
  );
}

/* ── AUDIO ───────────────────────────────────────────────────────────────── */
function AudioPlayer({ url }) {
  if (!url) return <Empty label="No audio URL set yet." />;
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl bg-gradient-to-br from-indigo-700 to-indigo-900 p-8 text-cream-50">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-saffron-400 text-indigo-900">
        <Volume2 size={28} />
      </span>
      <p className="text-sm text-indigo-200">Listen &amp; repeat the bol</p>
      {/* Native controls, brand-tinted container */}
      <audio src={url} controls className="w-full max-w-md">
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}

/* ── PDF ─────────────────────────────────────────────────────────────────── */
function PdfViewer({ url }) {
  if (!url) return <Empty label="No PDF URL set yet." />;
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <a href={url} target="_blank" rel="noreferrer" className="btn-outline">
          <Download size={16} /> Download PDF
        </a>
      </div>
      <iframe
        src={url}
        title="PDF document"
        className="h-[70vh] w-full rounded-xl border border-cream-200 bg-white"
      />
    </div>
  );
}

/* ── IMAGE / GALLERY ─────────────────────────────────────────────────────── */
function ImageGallery({ url, title }) {
  // media_url may hold ONE url or several separated by commas / newlines.
  const images = (url || "")
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const [active, setActive] = useState(0);

  if (images.length === 0) return <Empty label="No images uploaded yet." icon={ImageOff} />;

  return (
    <div>
      {/* Main image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[active]}
        alt={`${title} — ${active + 1}`}
        className="max-h-[70vh] w-full rounded-xl border border-cream-200 bg-white object-contain"
      />

      {/* Thumbnails (only if more than one) */}
      {images.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-20 w-24 overflow-hidden rounded-lg border-2 transition ${
                i === active
                  ? "border-saffron-400"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`thumb ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── TEXT ────────────────────────────────────────────────────────────────── */
/**
 * Lightweight renderer: paragraphs on blank lines, **bold**, *italic*.
 * Swap in `react-markdown` later if you want full Markdown/MDX.
 */
function RichText({ content }) {
  if (!content) return <Empty label="No written content yet." />;
  const paragraphs = content.split(/\n{2,}/);
  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-indigo-700">
      {paragraphs.map((p, i) => (
        <p key={i} dangerouslySetInnerHTML={{ __html: inlineFormat(p) }} />
      ))}
    </div>
  );
}

/* ── Shared empty state ──────────────────────────────────────────────────── */
function Empty({ label, icon: Icon }) {
  return (
    <div className="grid place-items-center gap-3 rounded-xl border border-dashed border-indigo-200 bg-cream-50 py-16 text-indigo-400">
      {Icon ? <Icon size={28} /> : <MediaTypeIcon type="text" size={28} />}
      <p className="text-sm">{label}</p>
    </div>
  );
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

/** Convert a YouTube/Vimeo watch URL into an embeddable URL. */
function toEmbedUrl(url) {
  try {
    const u = new URL(url);
    // youtu.be/<id>
    if (u.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    // youtube.com/watch?v=<id>
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    }
    // vimeo.com/<id>
    if (u.hostname.includes("vimeo.com") && !u.pathname.includes("video")) {
      return `https://player.vimeo.com/video${u.pathname}`;
    }
    return url; // already an embed URL or a provider we don't rewrite
  } catch {
    return url;
  }
}

/** Minimal inline formatter: escapes HTML then applies **bold** / *italic*. */
function inlineFormat(text) {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}
