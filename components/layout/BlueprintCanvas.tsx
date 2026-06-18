"use client";

/**
 * BlueprintCanvas — Ambient architectural background layer.
 * Strictly GPU-rendered: transform: translate3d() rotate() only.
 * will-change: transform on every animated element.
 * Shapes: 1px SVG outlines, opacity 0.12–0.18.
 */
export function BlueprintCanvas() {
  return (
    <>
      <style>{`
        @keyframes bp-drift-1 {
          0%   { transform: translate3d(0px,    0px,   0) rotate(0deg);   }
          25%  { transform: translate3d(22px,   14px,  0) rotate(1.8deg); }
          50%  { transform: translate3d(10px,   32px,  0) rotate(3.2deg); }
          75%  { transform: translate3d(-12px,  18px,  0) rotate(1.4deg); }
          100% { transform: translate3d(0px,    0px,   0) rotate(0deg);   }
        }
        @keyframes bp-drift-2 {
          0%   { transform: translate3d(0px,    0px,   0) rotate(0deg);    }
          33%  { transform: translate3d(-18px, -24px,  0) rotate(-2.2deg); }
          66%  { transform: translate3d(12px,  -10px,  0) rotate(-3.8deg); }
          100% { transform: translate3d(0px,    0px,   0) rotate(0deg);    }
        }
        @keyframes bp-drift-3 {
          0%   { transform: translate3d(0px,    0px,   0) rotate(0deg);   }
          50%  { transform: translate3d(16px,  -22px,  0) rotate(2.5deg); }
          100% { transform: translate3d(0px,    0px,   0) rotate(0deg);   }
        }
      `}</style>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ zIndex: 0 }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: "absolute", inset: 0 }}
        >

          {/* ── Shape 1: Hexagonal node cluster — top right ── */}
          <g
            style={{
              willChange: "transform",
              animation: "bp-drift-1 55s ease-in-out infinite",
              transformOrigin: "1080px 180px",
            }}
          >
            {/* Outer hex */}
            <polygon
              points="1080,40 1200,110 1200,250 1080,320 960,250 960,110"
              fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.14"
            />
            {/* Inner hex */}
            <polygon
              points="1080,88 1162,133 1162,223 1080,268 998,223 998,133"
              fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.10"
            />
            {/* Vertex node circles */}
            <circle cx="1080" cy="40"  r="4" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.18" />
            <circle cx="1200" cy="110" r="4" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.18" />
            <circle cx="1200" cy="250" r="4" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.18" />
            <circle cx="1080" cy="320" r="4" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.18" />
            <circle cx="960"  cy="250" r="4" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.18" />
            <circle cx="960"  cy="110" r="4" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.18" />
            {/* Spokes to inner hex */}
            <line x1="1080" y1="40"  x2="1080" y2="88"  stroke="#110FFF" strokeWidth="1" opacity="0.10" />
            <line x1="1200" y1="110" x2="1162" y2="133" stroke="#110FFF" strokeWidth="1" opacity="0.10" />
            <line x1="1200" y1="250" x2="1162" y2="223" stroke="#110FFF" strokeWidth="1" opacity="0.10" />
            <line x1="1080" y1="320" x2="1080" y2="268" stroke="#110FFF" strokeWidth="1" opacity="0.10" />
            <line x1="960"  y1="250" x2="998"  y2="223" stroke="#110FFF" strokeWidth="1" opacity="0.10" />
            <line x1="960"  y1="110" x2="998"  y2="133" stroke="#110FFF" strokeWidth="1" opacity="0.10" />
            {/* Inner diagonals */}
            <line x1="998"  y1="133" x2="1162" y2="223" stroke="#110FFF" strokeWidth="1" opacity="0.08" />
            <line x1="1162" y1="133" x2="998"  y2="223" stroke="#110FFF" strokeWidth="1" opacity="0.08" />
            <line x1="1080" y1="88"  x2="1080" y2="268" stroke="#110FFF" strokeWidth="1" opacity="0.08" />
            {/* Center */}
            <circle cx="1080" cy="180" r="10" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.16" />
            <circle cx="1080" cy="180" r="24" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.08" strokeDasharray="4 7" />
            <circle cx="1080" cy="180" r="3"  fill="#110FFF" opacity="0.18" />
          </g>

          {/* ── Shape 2: Circuit grid fragment — bottom left (offset for sidebar) ── */}
          <g
            style={{
              willChange: "transform",
              animation: "bp-drift-2 62s ease-in-out infinite",
              transformOrigin: "380px 680px",
            }}
          >
            {/* Horizontal grid lines */}
            <line x1="220" y1="560" x2="640" y2="560" stroke="#BCA2FF" strokeWidth="1" opacity="0.13" />
            <line x1="220" y1="620" x2="640" y2="620" stroke="#BCA2FF" strokeWidth="1" opacity="0.13" />
            <line x1="220" y1="680" x2="640" y2="680" stroke="#BCA2FF" strokeWidth="1" opacity="0.13" />
            <line x1="220" y1="740" x2="640" y2="740" stroke="#BCA2FF" strokeWidth="1" opacity="0.13" />
            <line x1="220" y1="800" x2="640" y2="800" stroke="#BCA2FF" strokeWidth="1" opacity="0.13" />
            {/* Vertical grid lines */}
            <line x1="280" y1="500" x2="280" y2="860" stroke="#BCA2FF" strokeWidth="1" opacity="0.13" />
            <line x1="340" y1="500" x2="340" y2="860" stroke="#BCA2FF" strokeWidth="1" opacity="0.13" />
            <line x1="400" y1="500" x2="400" y2="860" stroke="#BCA2FF" strokeWidth="1" opacity="0.13" />
            <line x1="460" y1="500" x2="460" y2="860" stroke="#BCA2FF" strokeWidth="1" opacity="0.13" />
            <line x1="520" y1="500" x2="520" y2="860" stroke="#BCA2FF" strokeWidth="1" opacity="0.13" />
            {/* Node dots */}
            <circle cx="280" cy="560" r="3" fill="#BCA2FF" opacity="0.22" />
            <circle cx="340" cy="620" r="3" fill="#BCA2FF" opacity="0.22" />
            <circle cx="400" cy="680" r="3" fill="#BCA2FF" opacity="0.22" />
            <circle cx="460" cy="740" r="3" fill="#BCA2FF" opacity="0.22" />
            <circle cx="520" cy="800" r="3" fill="#BCA2FF" opacity="0.22" />
            <circle cx="340" cy="560" r="3" fill="#BCA2FF" opacity="0.18" />
            <circle cx="460" cy="620" r="3" fill="#BCA2FF" opacity="0.18" />
            <circle cx="280" cy="740" r="3" fill="#BCA2FF" opacity="0.18" />
            <circle cx="400" cy="800" r="3" fill="#BCA2FF" opacity="0.18" />
            {/* Circuit trace paths */}
            <path d="M280,560 L340,560 L340,620 L400,620 L400,680"
              fill="none" stroke="#BCA2FF" strokeWidth="1" opacity="0.14" strokeDasharray="3 5" />
            <path d="M460,620 L460,680 L520,680 L520,740"
              fill="none" stroke="#BCA2FF" strokeWidth="1" opacity="0.14" strokeDasharray="3 5" />
            <path d="M280,680 L340,680 L340,740 L280,740"
              fill="none" stroke="#BCA2FF" strokeWidth="1" opacity="0.12" />
            {/* Sweep arc */}
            <path d="M220,640 Q400,500 640,660"
              fill="none" stroke="#BCA2FF" strokeWidth="1" opacity="0.10" strokeDasharray="6 9" />
          </g>

          {/* ── Shape 3: Concentric rings + diamond — center canvas ── */}
          <g
            style={{
              willChange: "transform",
              animation: "bp-drift-3 48s ease-in-out infinite",
              transformOrigin: "860px 500px",
            }}
          >
            {/* Concentric dashed circles */}
            <circle cx="860" cy="500" r="160" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.10" strokeDasharray="8 11" />
            <circle cx="860" cy="500" r="220" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.07" strokeDasharray="4 15" />
            <circle cx="860" cy="500" r="300" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.05" strokeDasharray="2 20" />
            {/* Diamond */}
            <polygon
              points="860,360 1000,500 860,640 720,500"
              fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.10"
            />
            {/* Crosshairs */}
            <line x1="560" y1="500" x2="1160" y2="500" stroke="#110FFF" strokeWidth="1" opacity="0.07" strokeDasharray="10 9" />
            <line x1="860" y1="200" x2="860"  y2="800" stroke="#110FFF" strokeWidth="1" opacity="0.07" strokeDasharray="10 9" />
            {/* Diamond vertex nodes */}
            <circle cx="860" cy="360" r="4" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.15" />
            <circle cx="1000" cy="500" r="4" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.15" />
            <circle cx="860" cy="640" r="4" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.15" />
            <circle cx="720" cy="500" r="4" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.15" />
            {/* Center target */}
            <circle cx="860" cy="500" r="14" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.14" />
            <circle cx="860" cy="500" r="4"  fill="#110FFF" opacity="0.18" />
          </g>

        </svg>
      </div>
    </>
  );
}
