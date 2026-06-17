import { ImageResponse } from "next/og";

export const alt = "RecoverBright — Doctor-curated recovery guides";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
          background: "#f9f7f4",
        }}
      >
        <p
          style={{
            fontSize: 14,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(28, 26, 23, 0.4)",
            fontFamily: "monospace",
            marginBottom: 24,
          }}
        >
          recoverbright.com
        </p>
        <h1
          style={{
            fontSize: 64,
            fontWeight: 500,
            color: "#1c1a17",
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          RecoverBright
        </h1>
        <p
          style={{
            fontSize: 24,
            color: "rgba(28, 26, 23, 0.55)",
            marginTop: 20,
            maxWidth: 600,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Doctor-curated recovery products for your procedure.
        </p>
      </div>
    ),
    { ...size },
  );
}
