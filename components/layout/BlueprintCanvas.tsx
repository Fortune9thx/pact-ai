"use client";

/**
 * BlueprintCanvas
 * Ambient architectural background layer — absolute lowest z-index.
 * 3 large geometric node/circuit shapes rendered as 1px vector outlines.
 * Electric Blue (#110FFF) or Lavender (#BCA2FF) at opacity 0.03–0.05.
 * GPU-only animation: transform: translate3d() rotate() on 45–60s loops.
 */
export function BlueprintCanvas() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
      >
        {/* ── Shape 1: Large hexagonal node cluster — top-right ── */}
        <g
          style={{
            willChange: "transform",
            animation: "blueprint-drift-1 55s linear infinite",
            transformOrigin: "75% 20%",
          }}
          opacity="0.045"
          stroke="#110FFF"
          strokeWidth="1"
          fill="none"
        >
          {/* Outer hexagon */}
          <polygon points="820,40 940,110 940,250 820,320 700,250 700,110" />
          {/* Inner hexagon */}
          <polygon points="820,90 900,135 900,225 820,270 740,225 740,135" />
          {/* Node circles at vertices */}
          <circle cx="820" cy="40"  r="5" />
          <circle cx="940" cy="110" r="5" />
          <circle cx="940" cy="250" r="5" />
          <circle cx="820" cy="320" r="5" />
          <circle cx="700" cy="250" r="5" />
          <circle cx="700" cy="110" r="5" />
          {/* Connecting spokes */}
          <line x1="820" y1="40"  x2="820" y2="90"  />
          <line x1="940" y1="110" x2="900" y2="135" />
          <line x1="940" y1="250" x2="900" y2="225" />
          <line x1="820" y1="320" x2="820" y2="270" />
          <line x1="700" y1="250" x2="740" y2="225" />
          <line x1="700" y1="110" x2="740" y2="135" />
          {/* Cross lines */}
          <line x1="820" y1="90"  x2="820" y2="270" />
          <line x1="740" y1="135" x2="900" y2="225" />
          <line x1="900" y1="135" x2="740" y2="225" />
          {/* Center dot */}
          <circle cx="820" cy="180" r="8" />
          <circle cx="820" cy="180" r="20" strokeDasharray="4 6" />
        </g>

        {/* ── Shape 2: Circuit board grid fragment — bottom-left ── */}
        <g
          style={{
            willChange: "transform",
            animation: "blueprint-drift-2 60s linear infinite",
            transformOrigin: "15% 75%",
          }}
          opacity="0.035"
          stroke="#BCA2FF"
          strokeWidth="1"
          fill="none"
        >
          {/* Grid lines horizontal */}
          <line x1="-60" y1="520" x2="300" y2="520" />
          <line x1="-60" y1="580" x2="300" y2="580" />
          <line x1="-60" y1="640" x2="300" y2="640" />
          <line x1="-60" y1="700" x2="300" y2="700" />
          <line x1="-60" y1="760" x2="300" y2="760" />
          {/* Grid lines vertical */}
          <line x1="0"   y1="470" x2="0"   y2="810" />
          <line x1="60"  y1="470" x2="60"  y2="810" />
          <line x1="120" y1="470" x2="120" y2="810" />
          <line x1="180" y1="470" x2="180" y2="810" />
          <line x1="240" y1="470" x2="240" y2="810" />
          {/* Node dots at intersections */}
          <circle cx="0"   cy="520" r="3" fill="#BCA2FF" opacity="0.4" />
          <circle cx="60"  cy="580" r="3" fill="#BCA2FF" opacity="0.4" />
          <circle cx="120" cy="640" r="3" fill="#BCA2FF" opacity="0.4" />
          <circle cx="180" cy="700" r="3" fill="#BCA2FF" opacity="0.4" />
          <circle cx="240" cy="760" r="3" fill="#BCA2FF" opacity="0.4" />
          <circle cx="60"  cy="520" r="3" fill="#BCA2FF" opacity="0.4" />
          <circle cx="180" cy="580" r="3" fill="#BCA2FF" opacity="0.4" />
          <circle cx="0"   cy="700" r="3" fill="#BCA2FF" opacity="0.4" />
          {/* Trace paths */}
          <path d="M0,520 L60,520 L60,580 L120,580 L120,640" strokeDasharray="3 5" />
          <path d="M180,580 L180,640 L240,640 L240,700" strokeDasharray="3 5" />
          <path d="M0,640 L60,640 L60,700 L0,700" />
          {/* Large arc */}
          <path d="M-60,600 Q120,480 300,620" strokeDasharray="6 8" />
        </g>

        {/* ── Shape 3: Concentric rings + diamond — center ── */}
        <g
          style={{
            willChange: "transform",
            animation: "blueprint-drift-3 48s linear infinite",
            transformOrigin: "50% 55%",
          }}
          opacity="0.03"
          stroke="#110FFF"
          strokeWidth="1"
          fill="none"
        >
          {/* Concentric circles */}
          <circle cx="50%" cy="55%" r="180" strokeDasharray="8 10" />
          <circle cx="50%" cy="55%" r="240" strokeDasharray="4 14" />
          <circle cx="50%" cy="55%" r="320" strokeDasharray="2 18" />
          {/* Diamond */}
          <polygon
            points="50%,calc(55% - 140px) calc(50% + 140px),55% 50%,calc(55% + 140px) calc(50% - 140px),55%"
          />
          {/* Cross hairs */}
          <line x1="calc(50% - 320px)" y1="55%" x2="calc(50% + 320px)" y2="55%" strokeDasharray="10 8" />
          <line x1="50%" y1="calc(55% - 320px)" x2="50%" y2="calc(55% + 320px)" strokeDasharray="10 8" />
          {/* Center target */}
          <circle cx="50%" cy="55%" r="12" />
          <circle cx="50%" cy="55%" r="4" fill="#110FFF" opacity="0.06" />
        </g>
      </svg>

      {/* CSS keyframe animations injected via style tag */}
      <style>{`
        @keyframes blueprint-drift-1 {
          0%   { transform: translate3d(0px, 0px, 0) rotate(0deg); }
          25%  { transform: translate3d(18px, 12px, 0) rotate(1.5deg); }
          50%  { transform: translate3d(8px, 28px, 0) rotate(3deg); }
          75%  { transform: translate3d(-10px, 16px, 0) rotate(1.8deg); }
          100% { transform: translate3d(0px, 0px, 0) rotate(0deg); }
        }
        @keyframes blueprint-drift-2 {
          0%   { transform: translate3d(0px, 0px, 0) rotate(0deg); }
          33%  { transform: translate3d(-14px, -20px, 0) rotate(-2deg); }
          66%  { transform: translate3d(10px, -12px, 0) rotate(-3.5deg); }
          100% { transform: translate3d(0px, 0px, 0) rotate(0deg); }
        }
        @keyframes blueprint-drift-3 {
          0%   { transform: translate3d(0px, 0px, 0) rotate(0deg); }
          50%  { transform: translate3d(12px, -18px, 0) rotate(2deg); }
          100% { transform: translate3d(0px, 0px, 0) rotate(0deg); }
        }
      `}</style>
    </div>
  );
}
