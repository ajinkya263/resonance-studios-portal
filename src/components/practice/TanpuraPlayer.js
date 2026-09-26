"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, Gauge } from "lucide-react";

/**
 * Synthesized tanpura drone (no samples). Each string is plucked as an additive
 * tone with a jawari-style bright harmonic spectrum + a slightly detuned partner
 * for shimmer/beating, a soft swell envelope, and a convolution reverb for space.
 * Classic Pa–Sa–Sa–Sa̱ (lower-octave) cycle in the chosen key.
 */

const NOTE_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);
const midiLabel = (m) => `${NOTE_NAMES[m % 12]}${Math.floor(m / 12) - 1}`;

// Sa choices from C3 to E4 (covers common male/female keys).
const SA_OPTIONS = [];
for (let m = 48; m <= 64; m++) SA_OPTIONS.push(m);

// Jawari-flavoured harmonic amplitudes (index = harmonic number, 0 = DC).
const HARMONICS = [
  0, 0.5, 1.0, 0.95, 0.85, 0.78, 0.68, 0.56, 0.46, 0.37, 0.3, 0.24, 0.19, 0.15,
  0.11, 0.08,
];

// String offsets from Sa in semitones: Pa (fifth below), Sa, Sa, Sa (lower 8ve).
const STRING_OFFSETS = [-5, 0, 0, -12];
const STRING_LABELS = ["Pa", "Sa", "Sa", "Sa̱"];

export default function TanpuraPlayer() {
  const [playing, setPlaying] = useState(false);
  const [saMidi, setSaMidi] = useState(49); // C♯3
  const [volume, setVolume] = useState(0.55);
  const [pace, setPace] = useState(1.1); // seconds between plucks
  const [active, setActive] = useState(-1);

  const ctxRef = useRef(null);
  const masterRef = useRef(null);
  const waveRef = useRef(null);
  const timerRef = useRef(null);
  const stateRef = useRef({ nextTime: 0, i: 0 });
  const volRef = useRef(volume);
  const paceRef = useRef(pace);
  const saRef = useRef(saMidi);

  useEffect(() => {
    volRef.current = volume;
    if (masterRef.current && ctxRef.current) {
      masterRef.current.gain.setTargetAtTime(volume, ctxRef.current.currentTime, 0.05);
    }
  }, [volume]);
  useEffect(() => {
    paceRef.current = pace;
  }, [pace]);
  useEffect(() => {
    saRef.current = saMidi;
  }, [saMidi]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (ctxRef.current) ctxRef.current.close();
    };
  }, []);

  function makeImpulse(ctx, seconds, decay) {
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  function ensureAudio() {
    if (ctxRef.current) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.value = volume;

    const dry = ctx.createGain();
    dry.gain.value = 0.9;
    const conv = ctx.createConvolver();
    conv.buffer = makeImpulse(ctx, 2.4, 2.6);
    const wet = ctx.createGain();
    wet.gain.value = 0.25;

    master.connect(dry).connect(ctx.destination);
    master.connect(conv).connect(wet).connect(ctx.destination);

    const real = new Float32Array(HARMONICS.length);
    const imag = new Float32Array(HARMONICS);
    waveRef.current = ctx.createPeriodicWave(real, imag, {
      disableNormalization: false,
    });

    ctxRef.current = ctx;
    masterRef.current = master;
  }

  function pluck(index, time) {
    const ctx = ctxRef.current;
    const freq = midiToFreq(saRef.current + STRING_OFFSETS[index]);
    const dur = Math.max(2.6, paceRef.current * 2.5);

    const osc = ctx.createOscillator();
    osc.setPeriodicWave(waveRef.current);
    osc.frequency.value = freq;

    const shimmer = ctx.createOscillator(); // detuned partner → beating
    shimmer.setPeriodicWave(waveRef.current);
    shimmer.frequency.value = freq;
    shimmer.detune.value = 4;
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = 0.33;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.Q.value = 0.6;

    const g = ctx.createGain();
    osc.connect(g);
    shimmer.connect(shimmerGain).connect(g);
    g.connect(lp).connect(masterRef.current);

    const peak = 0.5;
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(peak, time + 0.05);
    g.gain.exponentialRampToValueAtTime(peak * 0.82, time + 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    // jawari swell: filter opens then closes
    lp.frequency.setValueAtTime(freq * 4, time);
    lp.frequency.linearRampToValueAtTime(freq * 9, time + 0.28);
    lp.frequency.exponentialRampToValueAtTime(freq * 3, time + dur);

    osc.start(time);
    shimmer.start(time);
    osc.stop(time + dur + 0.1);
    shimmer.stop(time + dur + 0.1);
  }

  function schedule() {
    const ctx = ctxRef.current;
    const st = stateRef.current;
    while (st.nextTime < ctx.currentTime + 0.2) {
      const idx = st.i % 4;
      pluck(idx, st.nextTime);
      const delayMs = Math.max(0, (st.nextTime - ctx.currentTime) * 1000);
      setTimeout(() => setActive(idx), delayMs);
      st.nextTime += paceRef.current;
      st.i++;
    }
  }

  function start() {
    ensureAudio();
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") ctx.resume();
    masterRef.current.gain.setTargetAtTime(volRef.current, ctx.currentTime, 0.05);
    stateRef.current = { nextTime: ctx.currentTime + 0.12, i: 0 };
    timerRef.current = setInterval(schedule, 40);
    setPlaying(true);
  }

  function stop() {
    clearInterval(timerRef.current);
    timerRef.current = null;
    const ctx = ctxRef.current;
    if (ctx && masterRef.current) {
      masterRef.current.gain.cancelScheduledValues(ctx.currentTime);
      masterRef.current.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.12);
    }
    setPlaying(false);
    setActive(-1);
  }

  function toggle() {
    playing ? stop() : start();
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-800 to-indigo-900 p-6 text-cream-50 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl">Tanpura</h2>
          <p className="text-sm text-indigo-300">
            Drone in {midiLabel(saMidi)} · practice your sur
          </p>
        </div>
        <span className="grid h-12 w-12 place-items-center rounded-full bg-saffron-400 font-display text-xl text-indigo-900">
          ॐ
        </span>
      </div>

      {/* Strings */}
      <div className="mb-6 grid grid-cols-4 gap-3">
        {STRING_LABELS.map((label, i) => (
          <div
            key={i}
            className={`grid place-items-center rounded-xl border py-4 transition-all duration-200 ${
              active === i
                ? "scale-105 border-saffron-400 bg-saffron-400 text-indigo-900 shadow-soft"
                : "border-indigo-600 bg-indigo-700/50 text-indigo-200"
            }`}
          >
            <span className="font-display text-lg">{label}</span>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button onClick={toggle} className="btn-primary !px-6">
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
          icon={<Volume2 size={15} />}
          label="Volume"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={setVolume}
          display={`${Math.round(volume * 100)}%`}
        />
        <Slider
          icon={<Gauge size={15} />}
          label="Pace"
          min={0.7}
          max={2}
          step={0.05}
          value={pace}
          onChange={setPace}
          display={`${pace.toFixed(2)}s`}
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
