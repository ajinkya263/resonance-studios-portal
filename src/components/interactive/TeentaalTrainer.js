"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";

/**
 * Interactive Teentaal cycle trainer.
 * 16 matras · 4 vibhags · markers X (Sam) / 2 / 0 (Khali) / 3.
 * A synthesized metronome (Web Audio) clicks each beat — accented on Sam,
 * softer/hollow on Khali — while the current matra + bol lights up.
 *
 * When you add real bol recordings later, drop their URLs into `BOL_AUDIO`
 * and the trainer will play them instead of the synth click.
 */

// The Teentaal theka, matra by matra (16).
const THEKA = [
  { bol: "Dha", marker: "X" }, // 1  Sam
  { bol: "Dhin" },             // 2
  { bol: "Dhin" },             // 3
  { bol: "Dha" },              // 4
  { bol: "Dha", marker: "2" }, // 5  Taali
  { bol: "Dhin" },             // 6
  { bol: "Dhin" },             // 7
  { bol: "Dha" },              // 8
  { bol: "Dha", marker: "0" }, // 9  Khali
  { bol: "Tin" },              // 10
  { bol: "Tin" },              // 11
  { bol: "Ta" },               // 12
  { bol: "Ta", marker: "3" },  // 13 Taali
  { bol: "Dhin" },             // 14
  { bol: "Dhin" },             // 15
  { bol: "Dha" },              // 16
];

// Optional: real audio per bol, e.g. { Dha: "https://.../dha.mp3" }.
const BOL_AUDIO = {};

const LAYA = [
  { label: "Vilambit", bpm: 60 },
  { label: "Madhya", bpm: 100 },
  { label: "Drut", bpm: 180 },
];

const KHALI_INDEX = 8; // matra 9

export default function TeentaalTrainer() {
  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(80);
  const [current, setCurrent] = useState(-1);
  const [muted, setMuted] = useState(false);

  const audioCtxRef = useRef(null);
  const timerRef = useRef(null);
  const beatRef = useRef(0);
  const mutedRef = useRef(muted);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  // Synthesize a short percussive click. accent: Sam > vibhag > normal; khali is hollow.
  function click(kind) {
    if (mutedRef.current) return;
    let ctx = audioCtxRef.current;
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
    }
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const freq =
      kind === "sam" ? 880 : kind === "khali" ? 330 : kind === "vibhag" ? 660 : 520;
    const peak = kind === "sam" ? 0.5 : kind === "khali" ? 0.18 : 0.3;
    osc.frequency.setValueAtTime(freq, t);
    osc.type = kind === "khali" ? "sine" : "triangle";
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  function playBeat(i) {
    const kind =
      i === 0 ? "sam" : i === KHALI_INDEX ? "khali" : i % 4 === 0 ? "vibhag" : "normal";
    const url = BOL_AUDIO[THEKA[i].bol];
    if (url) {
      const a = new Audio(url);
      a.muted = mutedRef.current;
      a.play().catch(() => click(kind));
    } else {
      click(kind);
    }
    setCurrent(i);
  }

  // Start/stop the beat loop when playing or tempo changes.
  useEffect(() => {
    if (!playing) {
      clearInterval(timerRef.current);
      return;
    }
    const interval = 60000 / bpm;
    // fire immediately, then on each interval
    playBeat(beatRef.current % 16);
    beatRef.current = (beatRef.current + 1) % 16;
    timerRef.current = setInterval(() => {
      playBeat(beatRef.current % 16);
      beatRef.current = (beatRef.current + 1) % 16;
    }, interval);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, bpm]);

  function toggle() {
    if (!playing && audioCtxRef.current?.state === "suspended") {
      audioCtxRef.current.resume();
    }
    setPlaying((p) => !p);
  }

  function reset() {
    setPlaying(false);
    beatRef.current = 0;
    setCurrent(-1);
  }

  return (
    <div className="rounded-xl bg-gradient-to-br from-indigo-800 to-indigo-900 p-5 text-cream-50 md:p-7">
      {/* Cycle: 4 vibhags of 4 */}
      <div className="grid grid-cols-4 gap-2 md:gap-3">
        {THEKA.map((m, i) => {
          const active = i === current;
          const isKhali = i === KHALI_INDEX;
          return (
            <button
              key={i}
              onClick={() => {
                beatRef.current = i;
                playBeat(i);
              }}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border transition-all duration-100 ${
                active
                  ? "scale-105 border-saffron-400 bg-saffron-400 text-indigo-900 shadow-soft"
                  : isKhali
                  ? "border-indigo-600 bg-indigo-700/40 text-indigo-200"
                  : "border-indigo-600 bg-indigo-700/70 text-cream-50 hover:bg-indigo-600"
              }`}
            >
              {/* matra marker (X / 2 / 0 / 3) */}
              {m.marker && (
                <span
                  className={`absolute left-1.5 top-1 text-[10px] font-bold ${
                    active ? "text-indigo-800" : "text-saffron-300"
                  }`}
                >
                  {m.marker}
                </span>
              )}
              {/* matra number */}
              <span
                className={`absolute right-1.5 top-1 text-[10px] ${
                  active ? "text-indigo-700" : "text-indigo-400"
                }`}
              >
                {i + 1}
              </span>
              <span className="font-display text-base md:text-lg">{m.bol}</span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-indigo-300">
        <span><b className="text-saffron-300">X</b> Sam (clap)</span>
        <span><b className="text-saffron-300">2 / 3</b> Taali (clap)</span>
        <span><b className="text-saffron-300">0</b> Khali (wave)</span>
      </div>

      {/* Controls */}
      <div className="mt-5 flex flex-col gap-4 border-t border-indigo-700/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button onClick={toggle} className="btn-primary !px-4">
            {playing ? <Pause size={18} /> : <Play size={18} />}
            {playing ? "Pause" : "Play"}
          </button>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-600 px-4 py-2.5 text-sm text-indigo-100 transition hover:bg-indigo-700"
          >
            <RotateCcw size={16} /> Reset
          </button>
          <button
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Unmute" : "Mute"}
            className="grid h-11 w-11 place-items-center rounded-xl border border-indigo-600 text-indigo-100 transition hover:bg-indigo-700"
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>

        {/* Tempo */}
        <div className="flex-1 sm:max-w-xs">
          <div className="mb-1 flex justify-between text-xs text-indigo-300">
            <span>Laya (tempo)</span>
            <span className="font-semibold text-cream-50">{bpm} BPM</span>
          </div>
          <input
            type="range"
            min={40}
            max={240}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full accent-saffron-400"
          />
          <div className="mt-2 flex gap-2">
            {LAYA.map((l) => (
              <button
                key={l.label}
                onClick={() => setBpm(l.bpm)}
                className={`rounded-full px-3 py-1 text-xs transition ${
                  bpm === l.bpm
                    ? "bg-saffron-400 text-indigo-900"
                    : "bg-indigo-700 text-indigo-100 hover:bg-indigo-600"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-indigo-300">
        Tip: tap any matra to hear it. Recite the bols aloud with the beat
        (padhant) — clap on X/2/3, wave on 0.
      </p>
    </div>
  );
}
