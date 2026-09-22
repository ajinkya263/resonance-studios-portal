"use client";

import { useRef } from "react";
import { Volume2, Hand, Waves, Target } from "lucide-react";
import TablaDiagram from "@/components/interactive/TablaDiagram";

/**
 * One page per bol. Data-driven: media_url = `interactive:bol:<slug>`.
 * Shows an animated tabla diagram with the strike zone, the technique, a
 * practice pattern, and a "hear it" synth approximation (until real audio /
 * video is attached to the lesson).
 */

const BOLS = {
  ta: {
    name: "Ta", alt: "Na", dev: "ता", hand: "Dayan · right hand",
    highlights: [{ drum: "dayan", zone: "kinar" }],
    sound: "Sharp, ringing and open", tone: "high",
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
    sound: "Ringing and open, rounder than Ta", tone: "high",
    steps: [
      "Strike the Maidan (the skin between the syahi and the rim) with the index finger.",
      "Lift immediately so the note rings out.",
    ],
    practice: ["Tin", "Tin", "Tin", "Tin"],
  },
  ge: {
    name: "Ge", alt: "Ga", dev: "गे", hand: "Bayan · left hand",
    highlights: [{ drum: "bayan", zone: "maidan" }],
    sound: "Open, resonant bass — a deep boom", tone: "bass-open",
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
    sound: "Closed, muted bass — a flat thud", tone: "bass-closed",
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
    sound: "Closed, muted bass (palm lifted first)", tone: "bass-closed",
    steps: [
      "Remove your palm from the drum entirely.",
      "Then play Ka — strike flat and keep contact to mute.",
    ],
    practice: ["Kat", "Kat", "Kat", "Kat"],
  },
  dha: {
    name: "Dha", dev: "धा", hand: "Both hands", combo: "Ge + Ta",
    highlights: [{ drum: "bayan", zone: "maidan" }, { drum: "dayan", zone: "kinar" }],
    sound: "The full, powerful signature bol", tone: "bass-open",
    steps: [
      "Play Ge (left) and Ta (right) at exactly the same instant.",
      "Aim for one single, combined, powerful sound — not two.",
    ],
    practice: ["Dha", "Dha", "Dha", "Dha"],
  },
  dhin: {
    name: "Dhin", dev: "धिं", hand: "Both hands", combo: "Ge + Tin",
    highlights: [{ drum: "bayan", zone: "maidan" }, { drum: "dayan", zone: "maidan" }],
    sound: "Resonant and open — Ge joined with Tin", tone: "bass-open",
    steps: [
      "Play Ge (left) and Tin (right) together.",
      "Both should ring as one open, resonant note.",
    ],
    practice: ["Dhin", "Dhin", "Dhin", "Dhin"],
  },
  tete: {
    name: "TeTe", dev: "तेटे", hand: "Dayan · right hand",
    highlights: [{ drum: "dayan", zone: "syahi" }],
    sound: "Closed, dry — two fingers on the syahi", tone: "closed",
    steps: [
      "Strike the middle of the syahi with your index and middle finger.",
      "Keep it closed for a short, dry sound.",
    ],
    practice: ["Te", "Te", "Te", "Te"],
  },
  tu: {
    name: "Tu", dev: "तू", hand: "Dayan · right hand",
    highlights: [{ drum: "dayan", zone: "syahi" }],
    sound: "Open — a single finger on the syahi", tone: "high",
    steps: ["Strike the middle of the syahi with the index finger for an open ring."],
    practice: ["Tu", "Tu", "Tu", "Tu"],
  },
};

export default function BolLesson({ slug }) {
  const bol = BOLS[slug];
  const ctxRef = useRef(null);

  if (!bol) {
    return (
      <div className="rounded-xl border border-dashed border-indigo-200 bg-cream-50 p-8 text-center text-indigo-400">
        Unknown bol: {slug}
      </div>
    );
  }

  function play() {
    let ctx = ctxRef.current;
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;
    }
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const spec = {
      high: { f: 620, type: "triangle", dur: 0.35, peak: 0.35 },
      "bass-open": { f: 130, type: "sine", dur: 0.7, peak: 0.5 },
      "bass-closed": { f: 110, type: "sine", dur: 0.12, peak: 0.4 },
      closed: { f: 300, type: "square", dur: 0.09, peak: 0.25 },
    }[bol.tone] || { f: 440, type: "sine", dur: 0.3, peak: 0.3 };

    osc.type = spec.type;
    osc.frequency.setValueAtTime(spec.f, t);
    if (spec.type === "triangle") osc.frequency.exponentialRampToValueAtTime(spec.f * 0.8, t + spec.dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(spec.peak, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + spec.dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + spec.dur + 0.05);
  }

  const delay = (i) => ({ animationDelay: `${i * 90}ms` });

  return (
    <div className="overflow-hidden rounded-2xl border border-cream-200 bg-gradient-to-br from-cream-50 to-cream-100">
      <div className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
        {/* Left: identity + diagram */}
        <div className="animate-fade-up">
          <div className="flex items-end gap-4">
            <span className="font-display text-6xl leading-none text-indigo-800">
              {bol.name}
            </span>
            <span className="pb-1 font-display text-3xl text-saffron-500">{bol.dev}</span>
          </div>
          {bol.alt && (
            <p className="mt-1 text-sm text-indigo-400">also called “{bol.alt}”</p>
          )}

          <div className="mt-5 rounded-xl bg-white/70 p-3">
            <TablaDiagram highlights={bol.highlights} className="mx-auto h-48 w-full" />
          </div>

          <button onClick={play} className="btn-primary mt-4 w-full">
            <Volume2 size={18} /> Hear it
          </button>
          <p className="mt-2 text-center text-[11px] text-indigo-400">
            Synth preview — a demonstration video can be added to this lesson.
          </p>
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
                  className="rounded-lg bg-indigo-700 px-4 py-2 font-display text-lg text-cream-50 transition hover:bg-indigo-600"
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
