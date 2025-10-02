"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    // Report the error to Sentry
    const eventId = Sentry.captureException(error);
    console.error("Unhandled application error:", error);
    console.log(`Error reported to Sentry with ID: ${eventId}`);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          className="error-container"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            padding: "2rem",
            textAlign: "center",
            fontFamily: "system-ui, -apple-system, sans-serif",
            backgroundColor: "#f8f9fa",
            color: "#343a40",
          }}
        >
          <div
            style={{
              maxWidth: "500px",
              padding: "2rem",
              borderRadius: "0.5rem",
              backgroundColor: "white",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
          >
            <h1 style={{ fontSize: "1.75rem", marginBottom: "1rem" }}>
              Something went wrong!
            </h1>
            <p style={{ marginBottom: "1.5rem", color: "#6c757d" }}>
              The application encountered an unexpected error. Our team has been
              notified.
            </p>
            <button
              onClick={() => reset()}
              style={{
                backgroundColor: "#0070f3",
                color: "white",
                border: "none",
                padding: "0.5rem 1rem",
                borderRadius: "0.25rem",
                cursor: "pointer",
                fontWeight: "500",
                marginRight: "1rem",
              }}
            >
              Try again
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              style={{
                backgroundColor: "transparent",
                color: "#6c757d",
                border: "1px solid #dee2e6",
                padding: "0.5rem 1rem",
                borderRadius: "0.25rem",
                cursor: "pointer",
              }}
            >
              Go to homepage
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
