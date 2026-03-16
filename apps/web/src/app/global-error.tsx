"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          backgroundColor: "#18181b",
          color: "#fafafa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            '"Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif',
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center", padding: "1rem" }}>
          <div
            style={{
              width: "4rem",
              height: "4rem",
              borderRadius: "50%",
              backgroundColor: "rgba(239,68,68,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              fontSize: "1.5rem",
            }}
          >
            ⚠
          </div>

          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
            }}
          >
            Critical Error
          </h1>
          <p
            style={{
              color: "#a1a1aa",
              fontSize: "0.875rem",
              marginBottom: "1.5rem",
            }}
          >
            The application encountered a critical error. Please try reloading the page.
          </p>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={reset}
              style={{
                padding: "0.5rem 1rem",
                border: "1px solid #3f3f46",
                borderRadius: "0.375rem",
                backgroundColor: "transparent",
                color: "#fafafa",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{
                padding: "0.5rem 1rem",
                border: "1px solid #3f3f46",
                borderRadius: "0.375rem",
                backgroundColor: "#fafafa",
                color: "#18181b",
                textDecoration: "none",
                fontSize: "0.875rem",
              }}
            >
              Back to Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
