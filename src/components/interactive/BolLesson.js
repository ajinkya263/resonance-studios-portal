"use client";

import { Hand, Waves, Target } from "lucide-react";
import TablaDiagram from "@/components/interactive/TablaDiagram";

/**
 * Bol page(s). media_url = `interactive:bol:<slug>`.
 * A slug may be a single bol ("ta") or a merged group ("ka-kat", "dha-dhin"),
 * in which case both bols render on one page (they share a tutorial video).
 */

const BOLS = {
  ta: {
    name: "Ta", alt: "Na", dev: "ता", hand: "Dayan · right hand",
    highlights: [{ drum: "dayan", zone: "kinar" }],
    sound: "Sharp, ringing and open",
    steps: [
      "Strike the Kinar (the outer rim of the skin) with a stiff index finger.",
      "Strike and lift immediately — don't let the finger rest.",
      "Listen for a clean, ringing edge tone.",
    ],
    practice: ["Ta", "Ta", "Ta", "Ta"],
  },
  tin: {
    name: "Tin", dev: "तिं", hand: "Dayan · right hand",
    highlights: [{ drum: "dayan", zone: "maidan" }],
    sound: "Ringing and open, rounder than Ta",
    steps: [
      "Strike the Maidan (the skin between the syahi and the rim) with the index finger.",
      "Lift immediately so the note rings out.",
    ],
    practice: ["Tin", "Tin", "Tin", "Tin"],
  },
  ge: {
    name: "Ge", alt: "Ga", dev: "गे", hand: "Bayan · left hand",
    highlights: [{ drum: "bayan", zone: "maidan" }],
    sound: "Open, resonant bass — a deep boom",
    steps: [
      "Rest your wrist on the drum, fingers relaxed.",
      "Strike the skin with your index or middle finger and let it resonate.",
      "The bass note should ring, not thud.",
    ],
    practice: ["Ge", "Ge", "Ge", "Ge"],
  },
  ka: {
    name: "Ka", alt: "Ke", dev: "के", hand: "Bayan · left hand",
    highlights: [{ drum: "bayan", zone: "syahi" }],
    sound: "Closed, muted bass — a flat thud",
    steps: [
      "Strike the skin with a flat palm / fingers.",
      "Do NOT lift — keep contact to mute the sound.",
      "Use the first part of the palm just after the wrist.",
    ],
    practice: ["Ka", "Ka", "Ka", "Ka"],
  },
  kat: {
    name: "Kat", dev: "कत्", hand: "Bayan · left hand",
    highlights: [{ drum: "bayan", zone: "syahi" }],
    sound: "Closed, muted bass (palm lifted first)",
    steps: [
      "Remove your palm from the drum entirely.",
      "Then play Ka — strike flat and keep contact to mute.",
    ],
    practice: ["Kat", "Kat", "Kat", "Kat"],
  },
  dha: {
    name: "Dha", dev: "धा", hand: "Both hands", combo: "Ge + Ta",
    highlights: [{ drum: "bayan", zone: "maidan" }, { drum: "dayan", zone: "kinar" }],
    sound: "The full, powerful signature bol",
    steps: [
      "Play Ge (left) and Ta (right) at exactly the same instant.",
      "Aim for one single, combined, powerful sound — not two.",
    ],
    practice: ["Dha", "Dha", "Dha", "Dha"],
  },
  dhin: {
    name: "Dhin", dev: "धिं", hand: "Both hands", combo: "Ge + Tin",
    highlights: [{ drum: "bayan", zone: "maidan" }, { drum: "dayan", zone: "maidan" }],
    sound: "Resonant and open — Ge joined with Tin",
    steps: [
      "Play Ge (left) and Tin (right) together.",
      "Both should ring as one open, resonant note.",
    ],
    practice: ["Dhin", "Dhin", "Dhin", "Dhin"],
  },
  tete: {
    name: "TeTe", dev: "तेटे", hand: "Dayan · right hand",
    highlights: [{ drum: "dayan", zone: "syahi" }],
    sound: "Closed, dry — two fingers on the syahi",
    steps: [
      "Strike the middle of the syahi with your index and middle finger.",
      "Keep it closed for a short, dry sound.",
    ],
    practice: ["Te", "Te", "Te", "Te"],
  },
  tu: {
    name: "Tu", dev: "तू", hand: "Dayan · right hand",
    highlights: [{ drum: "dayan", zone: "syahi" }],
    sound: "Open — a single finger on the syahi",
    steps: ["Strike the middle of the syahi with the index finger for an open ring."],
    practice: ["Tu", "Tu", "Tu", "Tu"],
  },
};

/** Merged pages that share one tutorial video. */
const GROUPS = {
  "ka-kat": ["ka", "kat"],
  "dha-dhin": ["dha", "dhin"],
};

export default function BolLesson({ slug }) {
  const slugs = GROUPS[slug] || [slug];
  const known = slugs.filter((s) => BOLS[s]);

  if (known.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-indigo-200 bg-cream-50 p-8 text-center text-indigo-400">
        Unknown bol: {slug}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {known.map((s, i) => (
        <BolCard key={s} bol={BOLS[s]} index={i} />
      ))}
    </div>
  );
}

function BolCard({ bol, index }) {
  const delay = (i) => ({ animationDelay: `${i * 90}ms` });

  return (
    <div
      className="animate-fade-up overflow-hidden rounded-2xl border border-cream-200 bg-gradient-to-br from-cream-50 to-cream-100"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
        {/* Left: identity + diagram */}
        <div>
          <div className="flex items-end gap-4">
            <span className="animate-pop bg-gradient-to-br from-indigo-800 via-indigo-600 to-saffron-500 bg-clip-text font-display text-7xl leading-none text-transparent">
              {bol.name}
            </span>
            <span className="pb-1 font-display text-3xl text-saffron-500">{bol.dev}</span>
          </div>
          {bol.alt && (
            <p className="mt-1 text-sm text-indigo-400">also called “{bol.alt}”</p>
          )}

          <div className="group relative mt-5 rounded-xl bg-white/70 p-3 shadow-card ring-1 ring-cream-200 transition duration-500 hover:shadow-soft hover:ring-saffron-300/60">
            {/* soft animated halo */}
            <div className="pointer-events-none absolute inset-0 animate-glow rounded-xl" />
            <TablaDiagram
              highlights={bol.highlights}
              className="relative mx-auto h-48 w-full"
            />
          </div>
        </div>

        {/* Right: details */}
        <div className="space-y-5">
          <InfoRow icon={<Hand size={16} />} label="Hand" value={bol.hand} style={delay(1)} />
          <InfoRow icon={<Waves size={16} />} label="Sound" value={bol.sound} style={delay(2)} />
          {bol.combo && (
            <InfoRow icon={<Target size={16} />} label="Made of" value={bol.combo} style={delay(3)} />
          )}

          <div className="animate-fade-up" style={delay(4)}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-400">
              Technique
            </p>
            <ol className="space-y-2">
              {bol.steps.map((s, i) => (
                <li
                  key={i}
                  className="animate-fade-up flex gap-3 text-sm text-indigo-700"
                  style={delay(5 + i)}
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-saffron-400 text-xs font-bold text-indigo-900">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>

          <div className="animate-fade-up" style={delay(9)}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-400">
              Practice slowly
            </p>
            <div className="flex flex-wrap gap-2">
              {bol.practice.map((p, i) => (
                <span
                  key={i}
                  className="rounded-lg bg-indigo-700 px-4 py-2 font-display text-lg text-cream-50 transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-600"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, style }) {
  return (
    <div className="animate-fade-up flex items-start gap-3" style={style}>
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
        {icon}
      </span>
      <div>
        <p className="text-xs uppercase tracking-wide text-indigo-400">{label}</p>
        <p className="text-indigo-800">{value}</p>
      </div>
    </div>
  );
}
