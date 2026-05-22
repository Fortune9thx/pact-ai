"use client";

/**
 * BlueprintCanvas — Ambient architectural background layer.
 * Strictly GPU-rendered: transform: translate3d() rotate() only.
 * will-change: transform on every animated element.
 * Shapes: 1px SVG outlines, opacity 0.04–0.06.
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
        className="pointer-events-none fixed inset-0 overflow-hidden"
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
              fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.055"
            />
            {/* Inner hex */}
            <polygon
              points="1080,88 1162,133 1162,223 1080,268 998,223 998,133"
              fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.04"
            />
            {/* Vertex node circles */}
            <circle cx="1080" cy="40"  r="4" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.07" />
            <circle cx="1200" cy="110" r="4" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.07" />
            <circle cx="1200" cy="250" r="4" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.07" />
            <circle cx="1080" cy="320" r="4" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.07" />
            <circle cx="960"  cy="250" r="4" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.07" />
            <circle cx="960"  cy="110" r="4" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.07" />
            {/* Spokes to inner hex */}
            <line x1="1080" y1="40"  x2="1080" y2="88"  stroke="#110FFF" strokeWidth="1" opacity="0.04" />
            <line x1="1200" y1="110" x2="1162" y2="133" stroke="#110FFF" strokeWidth="1" opacity="0.04" />
            <line x1="1200" y1="250" x2="1162" y2="223" stroke="#110FFF" strokeWidth="1" opacity="0.04" />
            <line x1="1080" y1="320" x2="1080" y2="268" stroke="#110FFF" strokeWidth="1" opacity="0.04" />
            <line x1="960"  cy="250" x2="998"  y2="223" stroke="#110FFF" strokeWidth="1" opacity="0.04" />
            <line x1="960"  y1="110" x2="998"  y2="133" stroke="#110FFF" strokeWidth="1" opacity="0.04" />
            {/* Inner diagonals */}
            <line x1="998"  y1="133" x2="1162" y2="223" stroke="#110FFF" strokeWidth="1" opacity="0.03" />
            <line x1="1162" y1="133" x2="998"  y2="223" stroke="#110FFF" strokeWidth="1" opacity="0.03" />
            <line x1="1080" y1="88"  x2="1080" y2="268" stroke="#110FFF" strokeWidth="1" opacity="0.03" />
            {/* Center */}
            <circle cx="1080" cy="180" r="10" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.06" />
            <circle cx="1080" cy="180" r="24" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.03" strokeDasharray="4 7" />
            <circle cx="1080" cy="180" r="3"  fill="#110FFF" opacity="0.07" />
          </g>

          {/* ── Shape 2: Circuit grid fragment — bottom left ── */}
          <g
            style={{
              willChange: "transform",
              animation: "bp-drift-2 62s ease-in-out infinite",
              transformOrigin: "130px 680px",
            }}
          >
            {/* Horizontal grid lines */}
            <line x1="-80" y1="560" x2="340" y2="560" stroke="#BCA2FF" strokeWidth="1" opacity="0.05" />
            <line x1="-80" y1="620" x2="340" y2="620" stroke="#BCA2FF" strokeWidth="1" opacity="0.05" />
            <line x1="-80" y1="680" x2="340" y2="680" stroke="#BCA2FF" strokeWidth="1" opacity="0.05" />
            <line x1="-80" y1="740" x2="340" y2="740" stroke="#BCA2FF" strokeWidth="1" opacity="0.05" />
            <line x1="-80" y1="800" x2="340" y2="800" stroke="#BCA2FF" strokeWidth="1" opacity="0.05" />
            {/* Vertical grid lines */}
            <line x1="20"  y1="500" x2="20"  y2="860" stroke="#BCA2FF" strokeWidth="1" opacity="0.05" />
            <line x1="80"  y1="500" x2="80"  y2="860" stroke="#BCA2FF" strokeWidth="1" opacity="0.05" />
            <line x1="140" y1="500" x2="140" y2="860" stroke="#BCA2FF" strokeWidth="1" opacity="0.05" />
            <line x1="200" y1="500" x2="200" y2="860" stroke="#BCA2FF" strokeWidth="1" opacity="0.05" />
            <line x1="260" y1="500" x2="260" y2="860" stroke="#BCA2FF" strokeWidth="1" opacity="0.05" />
            {/* Node dots */}
            <circle cx="20"  cy="560" r="3" fill="#BCA2FF" opacity="0.12" />
            <circle cx="80"  cy="620" r="3" fill="#BCA2FF" opacity="0.12" />
            <circle cx="140" cy="680" r="3" fill="#BCA2FF" opacity="0.12" />
            <circle cx="200" cy="740" r="3" fill="#BCA2FF" opacity="0.12" />
            <circle cx="260" cy="800" r="3" fill="#BCA2FF" opacity="0.12" />
            <circle cx="80"  cy="560" r="3" fill="#BCA2FF" opacity="0.10" />
            <circle cx="200" cy="620" r="3" fill="#BCA2FF" opacity="0.10" />
            <circle cx="20"  cy="740" r="3" fill="#BCA2FF" opacity="0.10" />
            <circle cx="140" cy="800" r="3" fill="#BCA2FF" opacity="0.10" />
            {/* Circuit trace paths */}
            <path d="M20,560 L80,560 L80,620 L140,620 L140,680"
              fill="none" stroke="#BCA2FF" strokeWidth="1" opacity="0.06" strokeDasharray="3 5" />
            <path d="M200,620 L200,680 L260,680 L260,740"
              fill="none" stroke="#BCA2FF" strokeWidth="1" opacity="0.06" strokeDasharray="3 5" />
            <path d="M20,680 L80,680 L80,740 L20,740"
              fill="none" stroke="#BCA2FF" strokeWidth="1" opacity="0.05" />
            {/* Sweep arc */}
            <path d="M-80,640 Q140,500 340,660"
              fill="none" stroke="#BCA2FF" strokeWidth="1" opacity="0.04" strokeDasharray="6 9" />
          </g>

          {/* ── Shape 3: Concentric rings + diamond — center canvas ── */}
          <g
            style={{
              willChange: "transform",
              animation: "bp-drift-3 48s ease-in-out infinite",
              transformOrigin: "680px 500px",
            }}
          >
            {/* Concentric dashed circles */}
            <circle cx="680" cy="500" r="160" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.04" strokeDasharray="8 11" />
            <circle cx="680" cy="500" r="220" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.03" strokeDasharray="4 15" />
            <circle cx="680" cy="500" r="300" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.025" strokeDasharray="2 20" />
            {/* Diamond */}
            <polygon
              points="680,360 820,500 680,640 540,500"
              fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.04"
            />
            {/* Crosshairs */}
            <line x1="380" y1="500" x2="980" y2="500" stroke="#110FFF" strokeWidth="1" opacity="0.03" strokeDasharray="10 9" />
            <line x1="680" y1="200" x2="680" y2="800" stroke="#110FFF" strokeWidth="1" opacity="0.03" strokeDasharray="10 9" />
            {/* Diamond vertex nodes */}
            <circle cx="680" cy="360" r="4" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.06" />
            <circle cx="820" cy="500" r="4" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.06" />
            <circle cx="680" cy="640" r="4" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.06" />
            <circle cx="540" cy="500" r="4" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.06" />
            {/* Center target */}
            <circle cx="680" cy="500" r="14" fill="none" stroke="#110FFF" strokeWidth="1" opacity="0.06" />
            <circle cx="680" cy="500" r="4"  fill="#110FFF" opacity="0.07" />
          </g>

        </svg>
      </div>
    </>
  );
}
