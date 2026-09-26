"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, Gauge } from "lucide-react";

/**
 * Synthesized lehra (nagma) with a raga selector and ornamentation.
 * Each note event = [semitone, beats, from?, glideBeats?]. When `from` is given
 * the pitch glides from it into the note — short glides read as kan (grace),
 * longer ones as meend. Full sthāyī + antarā over two Teentaal avartans (32
 * beats), harmonium (reed-organ) tone. Selectable raga, key, laya.
 */

const NOTE_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);
const midiLabel = (m) => `${NOTE_NAMES[m % 12]}${Math.floor(m / 12) - 1}`;
const SA_OPTIONS = [];
for (let m = 48; m <= 64; m++) SA_OPTIONS.push(m);

// ── Nagmas (semitones from Sa; sthāyī then antarā, 16 beats each) ──────────
const RAGAS = {
  kirwani: {
    label: "Kirwani",
    sthayi: [
      [0, 1], [3, 1, 2, 0.4], [7, 1, 5, 0.15], [5, 1, 7, 0.5],
      [7, 1], [8, 0.5, 7, 0.2], [11, 0.5, 8, 0.2], [12, 1, 11, 0.35],
      [11, 0.5], [8, 0.5, 11, 0.3], [7, 1], [5, 0.5, 7, 0.3], [3, 0.5, 5, 0.3],
      [2, 1, 3, 0.3], [3, 1], [5, 1, 7, 0.15], [3, 1, 5, 0.4],
      [2, 0.5], [0, 0.5, 2, 0.25], [-1, 1],
    ],
    antara: [
      [7, 1], [11, 0.5, 8, 0.2], [12, 0.5, 11, 0.2], [12, 1], [14, 1, 12, 0.35],
      [15, 1, 14, 0.2], [14, 0.5], [12, 0.5, 14, 0.3], [11, 1, 12, 0.3],
      [12, 0.5, 11, 0.2], [11, 0.5], [8, 1, 11, 0.4], [11, 0.5], [8, 0.5],
      [7, 1, 8, 0.3], [5, 0.5, 7, 0.3], [3, 0.5, 5, 0.3], [2, 1, 3, 0.3],
      [3, 0.5], [5, 0.5], [2, 0.5], [0, 0.5, 2, 0.25], [-1, 1],
    ],
  },
  yaman: {
    label: "Yaman",
    sthayi: [
      [2, 1, -1, 0.4], [4, 1, 2, 0.3], [6, 0.5, 4, 0.2], [9, 0.5, 6, 0.2], [7, 1, 9, 0.3],
      [6, 1], [4, 1, 6, 0.3], [2, 0.5], [4, 0.5], [0, 1, 2, 0.3],
      [-1, 1], [2, 1, -1, 0.4], [4, 0.5], [6, 0.5, 4, 0.2], [7, 1],
      [9, 1, 7, 0.3], [6, 1, 9, 0.4], [4, 0.5], [2, 0.5, 4, 0.3], [0, 1],
    ],
    antara: [
      [7, 1], [11, 0.5, 9, 0.2], [12, 0.5, 11, 0.2], [14, 1, 12, 0.3], [16, 1, 14, 0.3],
      [18, 1, 16, 0.2], [16, 0.5], [14, 0.5, 16, 0.3], [12, 1, 14, 0.3], [11, 1, 12, 0.3],
      [12, 1], [9, 0.5, 11, 0.3], [7, 0.5, 9, 0.2], [6, 1, 7, 0.3], [4, 1, 6, 0.3],
      [2, 1, 4, 0.3], [4, 0.5], [2, 0.5], [-1, 1], [0, 1],
    ],
  },
  bhairavi: {
    label: "Bhairavi",
    sthayi: [
      [0, 1], [1, 1, 0, 0.3], [3, 0.5, 1, 0.2], [5, 0.5, 3, 0.2], [3, 1, 5, 0.4],
      [5, 1], [7, 1, 5, 0.3], [8, 0.5, 7, 0.2], [7, 0.5], [5, 1, 7, 0.3],
      [3, 1], [1, 0.5, 3, 0.3], [0, 0.5, 1, 0.2], [1, 1], [3, 1, 1, 0.3],
      [5, 1, 3, 0.3], [3, 1, 5, 0.3], [1, 0.5], [0, 0.5, 1, 0.2], [-2, 1],
    ],
    antara: [
      [7, 1], [8, 0.5, 7, 0.2], [10, 0.5, 8, 0.2], [12, 1, 10, 0.3], [12, 1],
      [13, 1, 12, 0.2], [15, 0.5, 13, 0.2], [13, 0.5], [12, 1, 13, 0.3], [10, 1, 12, 0.3],
      [12, 1], [10, 0.5, 12, 0.2], [8, 0.5, 10, 0.2], [7, 1, 8, 0.3], [5, 1, 7, 0.3],
      [3, 1, 5, 0.3], [1, 0.5], [3, 0.5], [1, 0.5], [0, 0.5, 1, 0.2], [-2, 1],
    ],
  },
  bilawal: {
    label: "Bilawal",
    sthayi: [
      [0, 1], [4, 1, 2, 0.3], [7, 0.5, 5, 0.2], [9, 0.5, 7, 0.2], [7, 1, 9, 0.3],
      [5, 1], [4, 1, 5, 0.3], [2, 0.5], [4, 0.5], [0, 1, 2, 0.3],
      [7, 1], [9, 0.5, 7, 0.2], [11, 0.5, 9, 0.2], [12, 1, 11, 0.3], [11, 1, 12, 0.3],
      [9, 1, 11, 0.3], [7, 1, 9, 0.3], [4, 0.5], [2, 0.5, 4, 0.2], [-1, 1],
    ],
    antara: [
      [7, 1], [11, 0.5, 9, 0.2], [12, 0.5, 11, 0.2], [12, 1], [14, 1, 12, 0.3],
      [16, 1, 14, 0.2], [14, 0.5], [12, 0.5, 14, 0.3], [11, 1, 12, 0.3], [12, 1],
      [9, 1, 11, 0.3], [7, 0.5, 9, 0.2], [5, 0.5, 7, 0.2], [4, 1, 5, 0.3], [2, 1, 4, 0.3],
      [4, 1], [2, 0.5], [0, 0.5, 2, 0.2], [0, 1], [-1, 1],
    ],
  },
};

const MARKERS = { 0: "X", 4: "2", 8: "0", 12: "3" };

function buildMelody(raga) {
  const out = [];
  let pos = 0;
  [raga.sthayi, raga.antara].forEach((events, section) => {
    events.forEach(([s, b, f, g]) => {
      out.push({
        s,
        b,
        from: f === undefined ? null : f,
        glide: g === undefined ? 0.3 : g,
        matra: Math.floor(pos) % 16,
        section,
      });
      pos += b;
    });
  });
  return out;
}
const MELODIES = Object.fromEntries(
  Object.entries(RAGAS).map(([k, r]) => [k, buildMelody(r)])
);

export default function LehraPlayer() {
  const [playing, setPlaying] = useState(false);
  const [ragaKey, setRagaKey] = useState("kirwani");
  const [saMidi, setSaMidi] = useState(49);
  const [bpm, setBpm] = useState(80);
  const [volume, setVolume] = useState(0.5);
  const [matra, setMatra] = useState(-1);
  const [section, setSection] = useState(0);

  const ctxRef = useRef(null);
  const masterRef = useRef(null);
  const timerRef = useRef(null);
  const stateRef = useRef({ nextTime: 0, i: 0 });
  const volRef = useRef(volume);
  const bpmRef = useRef(bpm);
  const saRef = useRef(saMidi);
  const melRef = useRef(MELODIES[ragaKey]);

  useEffect(() => {
    volRef.current = volume;
    if (masterRef.current && ctxRef.current)
      masterRef.current.gain.setTargetAtTime(volume, ctxRef.current.currentTime, 0.05);
  }, [volume]);
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);
  useEffect(() => {
    saRef.current = saMidi;
  }, [saMidi]);
  useEffect(() => {
    melRef.current = MELODIES[ragaKey];
  }, [ragaKey]);
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (ctxRef.current) ctxRef.current.close();
    };
  }, []);

  function ensureAudio() {
    if (ctxRef.current) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
    ctxRef.current = ctx;
    masterRef.current = master;
  }

  function playNote(ev, time, dur, beat) {
    const ctx = ctxRef.current;
    const target = midiToFreq(saRef.current + ev.s);
    const startFreq =
      ev.from === null ? target : midiToFreq(saRef.current + ev.from);
    const glideSec = Math.min(dur * 0.9, ev.glide * beat);

    const oscs = [
      { type: "sawtooth", detune: 0 },
      { type: "sawtooth", detune: 7 },
      { type: "triangle", detune: -7 },
    ].map(({ type, detune }) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.detune.value = detune;
      o.frequency.setValueAtTime(startFreq, time);
      if (ev.from !== null)
        o.frequency.exponentialRampToValueAtTime(target, time + glideSec);
      return o;
    });

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = Math.min(3600, target * 6);
    lp.Q.value = 0.4;

    const g = ctx.createGain();
    oscs.forEach((o) => o.connect(g));
    g.connect(lp).connect(masterRef.current);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 5.5;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 3.2;
    lfo.connect(lfoGain);
    oscs.forEach((o) => lfoGain.connect(o.detune));

    const peak = ev.matra === 0 ? 0.26 : 0.19;
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(peak, time + Math.min(0.03, dur * 0.2));
    g.gain.setValueAtTime(peak, time + dur * 0.8);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    lfo.start(time);
    lfo.stop(time + dur + 0.05);
    oscs.forEach((o) => {
      o.start(time);
      o.stop(time + dur + 0.05);
    });
  }

  function schedule() {
    const ctx = ctxRef.current;
    const st = stateRef.current;
    const beat = 60 / bpmRef.current;
    const mel = melRef.current;
    while (st.nextTime < ctx.currentTime + 0.25) {
      const ev = mel[st.i % mel.length];
      const dur = ev.b * beat;
      playNote(ev, st.nextTime, dur * 0.98, beat);
      const delayMs = Math.max(0, (st.nextTime - ctx.currentTime) * 1000);
      setTimeout(() => {
        setMatra(ev.matra);
        setSection(ev.section);
      }, delayMs);
      st.nextTime += dur;
      st.i++;
    }
  }

  function start() {
    ensureAudio();
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") ctx.resume();
    masterRef.current.gain.setTargetAtTime(volRef.current, ctx.currentTime, 0.05);
    stateRef.current = { nextTime: ctx.currentTime + 0.15, i: 0 };
    timerRef.current = setInterval(schedule, 30);
    setPlaying(true);
  }

  function stop() {
    clearInterval(timerRef.current);
    timerRef.current = null;
    const ctx = ctxRef.current;
    if (ctx && masterRef.current) {
      masterRef.current.gain.cancelScheduledValues(ctx.currentTime);
      masterRef.current.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.1);
    }
    setPlaying(false);
    setMatra(-1);
  }

  function chooseRaga(key) {
    setRagaKey(key);
    // restart the cycle cleanly on the new nagma if playing
    if (ctxRef.current && timerRef.current) {
      melRef.current = MELODIES[key];
      stateRef.current = { nextTime: ctxRef.current.currentTime + 0.1, i: 0 };
    }
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-800 to-indigo-900 p-6 text-cream-50 md:p-8">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl">Lehra · Raag {RAGAS[ragaKey].label}</h2>
          <p className="text-sm text-indigo-300">
            Teentaal nagma in {midiLabel(saMidi)} · {bpm} BPM
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            playing ? "bg-saffron-400 text-indigo-900" : "bg-indigo-700 text-indigo-300"
          }`}
        >
          {section === 1 ? "Antarā" : "Sthāyī"}
        </span>
      </div>

      {/* Raga selector */}
      <div className="mb-5 flex flex-wrap gap-2">
        {Object.entries(RAGAS).map(([key, r]) => (
          <button
            key={key}
            onClick={() => chooseRaga(key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              ragaKey === key
                ? "bg-saffron-400 text-indigo-900"
                : "bg-indigo-700 text-indigo-100 hover:bg-indigo-600"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* 16-matra strip */}
      <div className="mb-6 grid grid-cols-8 gap-1.5">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className={`relative grid aspect-square place-items-center rounded-lg border text-xs transition-all duration-100 ${
              matra === i
                ? "scale-105 border-saffron-400 bg-saffron-400 text-indigo-900"
                : "border-indigo-600 bg-indigo-700/50 text-indigo-300"
            }`}
          >
            {MARKERS[i] && (
              <span className="absolute left-1 top-0.5 text-[9px] font-bold text-saffron-300">
                {MARKERS[i]}
              </span>
            )}
            {i + 1}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button onClick={() => (playing ? stop() : start())} className="btn-primary !px-6">
            {playing ? <Pause size={18} /> : <Play size={18} />}
            {playing ? "Stop" : "Play"}
          </button>
          <label className="flex-1">
            <span className="mb-1 block text-xs text-indigo-300">Key (Sa)</span>
            <select
              value={saMidi}
              onChange={(e) => setSaMidi(Number(e.target.value))}
              className="w-full rounded-xl border border-indigo-600 bg-indigo-800 px-3 py-2.5 text-cream-50 focus:border-saffron-400 focus:outline-none"
            >
              {SA_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {midiLabel(m)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <Slider
          icon={<Gauge size={15} />}
          label="Laya (tempo)"
          min={40}
          max={180}
          step={1}
          value={bpm}
          onChange={(v) => setBpm(Math.round(v))}
          display={`${bpm} BPM`}
        />
        <Slider
          icon={<Volume2 size={15} />}
          label="Volume"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={setVolume}
          display={`${Math.round(volume * 100)}%`}
        />
      </div>
    </div>
  );
}

function Slider({ icon, label, min, max, step, value, onChange, display }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-indigo-300">
        <span className="inline-flex items-center gap-1.5">
          {icon} {label}
        </span>
        <span className="font-semibold text-cream-50">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-saffron-400"
      />
    </div>
  );
}
