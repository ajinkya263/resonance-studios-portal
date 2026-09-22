"use client";

/**
 * Top-down illustration of the tabla pair (Bayan bass drum + Dayan treble drum)
 * with concentric strike zones. Used by the bol pages and the anatomy lesson.
 *
 * Props:
 *   highlights  — array of { drum: 'dayan'|'bayan', zone: 'kinar'|'maidan'|'syahi' }
 *   showLabels  — draw anatomy labels (Syahi/Maidan/Kinar/Gajra + drum names)
 *   className
 */
export default function TablaDiagram({ highlights = [], showLabels = false, className = "" }) {
  return (
    <svg
      viewBox="0 0 360 230"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Tabla strike-zone diagram"
    >
      {/* Bayan — bass drum (larger, left) */}
      <Drum
        cx={104}
        cy={120}
        r={78}
        name="Bayan"
        highlights={highlights.filter((h) => h.drum === "bayan")}
        showLabels={showLabels}
        labelSide="left"
      />
      {/* Dayan — treble drum (smaller, right) */}
      <Drum
        cx={274}
        cy={128}
        r={58}
        name="Dayan"
        highlights={highlights.filter((h) => h.drum === "dayan")}
        showLabels={showLabels}
        labelSide="right"
      />
    </svg>
  );
}

function Drum({ cx, cy, r, name, highlights, showLabels, labelSide }) {
  const rSkin = r * 0.9; // edge of playing skin (kinar outer)
  const rMaidan = r * 0.72; // kinar inner / maidan outer
  const rSyahi = r * 0.42; // maidan inner / syahi

  const zoneRadius = { kinar: r * 0.81, maidan: r * 0.57, syahi: rSyahi };
  const zoneStroke = { kinar: r * 0.14, maidan: r * 0.28, syahi: 2 };

  return (
    <g>
      {/* gajra (woven dark rim) */}
      <circle cx={cx} cy={cy} r={r} fill="#1E1240" />
      {/* playing skin */}
      <circle cx={cx} cy={cy} r={rSkin} fill="#F3E7D0" />
      {/* maidan/kinar delineation */}
      <circle cx={cx} cy={cy} r={rMaidan} fill="none" stroke="#D9D2EF" strokeWidth="1.5" />
      {/* syahi (black weighted center) */}
      <circle cx={cx} cy={cy} r={rSyahi} fill="#241249" />
      <circle cx={cx} cy={cy} r={rSyahi * 0.6} fill="#150a2e" />

      {/* Highlights */}
      {highlights.map((h, i) => {
        if (h.zone === "syahi") {
          return (
            <circle
              key={i}
              className="animate-pulse"
              cx={cx}
              cy={cy}
              r={rSyahi + 3}
              fill="none"
              stroke="#F4A300"
              strokeWidth="4"
            />
          );
        }
        return (
          <circle
            key={i}
            className="animate-pulse"
            cx={cx}
            cy={cy}
            r={zoneRadius[h.zone]}
            fill="none"
            stroke="#F4A300"
            strokeOpacity="0.85"
            strokeWidth={zoneStroke[h.zone]}
          />
        );
      })}

      {/* Drum name */}
      <text
        x={cx}
        y={cy + r + 20}
        textAnchor="middle"
        className="fill-indigo-500"
        style={{ font: "600 13px var(--font-body, sans-serif)" }}
      >
        {name}
      </text>

      {showLabels && <Labels cx={cx} cy={cy} r={r} rSyahi={rSyahi} rMaidan={rMaidan} side={labelSide} />}
    </g>
  );
}

/** Anatomy call-out labels with leader lines. */
function Labels({ cx, cy, r, rSyahi, rMaidan, side }) {
  const dir = side === "left" ? -1 : 1;
  const xEdge = cx + dir * (r + 6);
  const items = [
    { label: "Syahi", from: [cx + dir * (rSyahi * 0.5), cy - rSyahi * 0.5], y: cy - r * 0.7 },
    { label: "Maidan", from: [cx + dir * (rMaidan * 0.85), cy], y: cy - r * 0.15 },
    { label: "Kinar", from: [cx + dir * (r * 0.86), cy + r * 0.3], y: cy + r * 0.45 },
    { label: "Gajra", from: [cx + dir * r, cy + r * 0.62], y: cy + r * 0.85 },
  ];
  return (
    <g className="animate-fade-up">
      {items.map((it, i) => {
        const tx = xEdge + dir * 4;
        return (
          <g key={i}>
            <polyline
              points={`${it.from[0]},${it.from[1]} ${xEdge},${it.y} ${tx},${it.y}`}
              fill="none"
              stroke="#8E79CF"
              strokeWidth="1"
            />
            <text
              x={tx + dir * 3}
              y={it.y + 3}
              textAnchor={side === "left" ? "end" : "start"}
              className="fill-indigo-600"
              style={{ font: "600 11px var(--font-body, sans-serif)" }}
            >
              {it.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}
