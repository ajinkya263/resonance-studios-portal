"use client";

import { useState } from "react";
import TablaDiagram from "@/components/interactive/TablaDiagram";

/**
 * Interactive anatomy lesson. Click a part to highlight it on both drums.
 * media_url = `interactive:anatomy`.
 */
const PARTS = [
  { zone: "syahi", name: "Syahi", desc: "The black, weighted circle in the center — where most of the sound is focused." },
  { zone: "maidan", name: "Maidan", desc: "The open, lighter-coloured skin between the syahi and the edge." },
  { zone: "kinar", name: "Kinar", desc: "The outer rim of the drum head." },
  { zone: null, name: "Gajra", desc: "The woven outer rim that binds the skin to the drum." },
];

export default function TablaAnatomy() {
  const [active, setActive] = useState("syahi");
  const highlights =
    active && active !== "gajra"
      ? [{ drum: "dayan", zone: active }, { drum: "bayan", zone: active }]
      : [];

  return (
    <div className="rounded-2xl border border-cream-200 bg-gradient-to-br from-cream-50 to-cream-100 p-6 md:p-8">
      <div className="grid gap-6 md:grid-cols-2 md:items-center">
        <div className="animate-fade-up rounded-xl bg-white/70 p-4">
          <TablaDiagram highlights={highlights} showLabels className="mx-auto h-64 w-full" />
        </div>

        <div className="space-y-2">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-400">
            Tap a part to explore
          </p>
          {PARTS.map((p) => {
            const isActive = active === (p.zone ?? "gajra");
            return (
              <button
                key={p.name}
                onClick={() => setActive(p.zone ?? "gajra")}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  isActive
                    ? "border-saffron-400 bg-white shadow-card"
                    : "border-transparent bg-white/50 hover:bg-white"
                }`}
              >
                <p className="font-display text-lg text-indigo-800">{p.name}</p>
                <p
                  className={`overflow-hidden text-sm text-indigo-500 transition-all duration-300 ${
                    isActive ? "mt-1 max-h-24 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  {p.desc}
                </p>
              </button>
            );
          })}
          <p className="pt-2 text-sm text-indigo-500">
            The pair: the <b className="text-indigo-700">Dayan</b> (smaller, high-pitch,
            right hand) and the <b className="text-indigo-700">Bayan</b> (larger, bass,
            left hand).
          </p>
        </div>
      </div>
    </div>
  );
}
