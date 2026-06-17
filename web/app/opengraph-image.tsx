import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ERISTIC — Stake Your Truth";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0909",
          fontFamily: "monospace",
          position: "relative",
        }}
      >
        {/* Purple bloom */}
        <div style={{
          position: "absolute",
          top: -100,
          left: "50%",
          transform: "translateX(-50%)",
          width: 900,
          height: 500,
          background: "radial-gradient(ellipse at center, rgba(139,92,246,0.35) 0%, transparent 65%)",
          borderRadius: "50%",
        }} />

        {/* Grid lines */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        {/* Logo */}
        <div style={{
          fontSize: 18,
          letterSpacing: "0.35em",
          fontWeight: 900,
          color: "#ffffff",
          marginBottom: 32,
          textShadow: "0 0 40px rgba(139,92,246,1)",
          position: "relative",
        }}>
          ERISTIC
        </div>

        {/* Main headline */}
        <div style={{
          fontSize: 80,
          fontWeight: 900,
          color: "#ffffff",
          letterSpacing: "-0.03em",
          lineHeight: 1,
          textAlign: "center",
          position: "relative",
          marginBottom: 8,
        }}>
          Stake Your Truth.
        </div>
        <div style={{
          fontSize: 80,
          fontWeight: 900,
          letterSpacing: "-0.03em",
          lineHeight: 1,
          textAlign: "center",
          position: "relative",
          marginBottom: 40,
          background: "linear-gradient(135deg, #a78bfa, #8b5cf6)",
          backgroundClip: "text",
          color: "transparent",
        }}>
          Get Your Verdict.
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: 22,
          color: "rgba(237,235,230,0.5)",
          textAlign: "center",
          maxWidth: 700,
          lineHeight: 1.5,
          position: "relative",
        }}>
          File claims · Stake GEN tokens · AI consensus decides · No judges
        </div>

        {/* Bottom badge */}
        <div style={{
          position: "absolute",
          bottom: 40,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <div style={{
            padding: "6px 16px",
            borderRadius: 999,
            border: "1px solid rgba(139,92,246,0.4)",
            background: "rgba(139,92,246,0.15)",
            fontSize: 13,
            color: "#a78bfa",
            fontWeight: 700,
            letterSpacing: "0.1em",
          }}>
            GenLayer Bradbury Testnet
          </div>
          <div style={{
            padding: "6px 16px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            fontSize: 13,
            color: "rgba(237,235,230,0.5)",
          }}>
            eristic.vercel.app
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
