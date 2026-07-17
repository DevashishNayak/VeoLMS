import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "VeoLMS — Learn Without Limits";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default Open Graph / Twitter preview image for link shares. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "linear-gradient(135deg, #071510 0%, #0d241c 48%, #123028 100%)",
          color: "#f4faf7",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              color: "#052e1c",
            }}
          >
            V
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -0.5 }}>
            VeoLMS
          </div>
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: -1.5,
            maxWidth: 900,
          }}
        >
          Learn Without Limits
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 28,
            color: "rgba(244,250,247,0.72)",
            maxWidth: 820,
            lineHeight: 1.35,
          }}
        >
          Browse courses, learn at your pace, and track your progress.
        </div>
      </div>
    ),
    { ...size }
  );
}
