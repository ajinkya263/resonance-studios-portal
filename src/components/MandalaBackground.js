/**
 * Fixed, non-interactive decorative layer for the whole app.
 * A repeating floral lattice + two large corner mandalas, all very low opacity
 * so text stays highly readable. Pure SVG — no images to load.
 *
 * Drop this once in the root layout, behind everything (z-0, pointer-events-none).
 */
export default function MandalaBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Warm vertical wash so the cream never looks flat */}
      <div className="absolute inset-0 bg-gradient-to-b from-cream-50 via-cream to-cream-200" />

      {/* Repeating floral lattice */}
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="floral-lattice"
            x="0"
            y="0"
            width="140"
            height="140"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <g fill="none" stroke="#2B1B5A" strokeWidth="1" opacity="0.05">
              {/* four-petal flower */}
              <path d="M70 40 C82 52 82 68 70 80 C58 68 58 52 70 40 Z" />
              <path d="M40 70 C52 58 68 58 80 70 C68 82 52 82 40 70 Z" />
              <circle cx="70" cy="70" r="4" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#floral-lattice)" />
      </svg>

      {/* Top-right mandala */}
      <Mandala className="absolute -right-24 -top-24 h-[26rem] w-[26rem] text-saffron-400/20" />
      {/* Bottom-left mandala */}
      <Mandala className="absolute -bottom-32 -left-24 h-[30rem] w-[30rem] text-indigo-400/10" />
    </div>
  );
}

/** A single layered mandala rosette. `currentColor` drives the stroke. */
function Mandala({ className = "" }) {
  const petals = Array.from({ length: 16 });
  return (
    <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="currentColor" strokeWidth="1.2">
        <circle cx="100" cy="100" r="26" />
        <circle cx="100" cy="100" r="44" />
        <circle cx="100" cy="100" r="70" />
        <circle cx="100" cy="100" r="92" />
        {petals.map((_, i) => (
          <g key={i} transform={`rotate(${(360 / petals.length) * i} 100 100)`}>
            <path d="M100 8 C112 34 112 58 100 74 C88 58 88 34 100 8 Z" />
            <circle cx="100" cy="30" r="2.5" />
          </g>
        ))}
      </g>
    </svg>
  );
}
