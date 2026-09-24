"use client";

import { useMemo, useState } from "react";

export default function RecoveryBridgePage() {
  const [error, setError] = useState<string | null>(null);

  const confirmationUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("confirmation_url") || "";
  }, []);

  const continueToReset = async () => {
    setError(null);

    if (!confirmationUrl) {
      setError("This password reset link is incomplete. Please request a new reset email.");
      return;
    }

    try {
      const response = await fetch("/auth/recovery/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmationUrl }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Unable to continue the password reset.");
      }

      const data = await response.json();
      window.location.assign(data.redirectUrl);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to continue the password reset."
      );
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        fontFamily: "inherit",
      }}
    >
      <section
        style={{
          backgroundColor: "white",
          borderRadius: "1.25rem",
          padding: "2.5rem",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e2e8f0",
          width: "100%",
          maxWidth: "420px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            fontSize: "0.8rem",
            padding: "0.35rem 0.75rem",
            borderRadius: "999px",
            background: "#ede9fe",
            color: "#6d28d9",
            marginBottom: "1rem",
            fontWeight: 700,
          }}
        >
          <span>🔒</span>
          <span>Administrator Access</span>
        </div>

        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 800,
            color: "#0f172a",
            margin: "0 0 0.6rem",
          }}
        >
          Continue Password Reset
        </h1>

        <p
          style={{
            color: "#64748b",
            fontSize: "0.92rem",
            lineHeight: 1.5,
            margin: "0 0 1.5rem",
          }}
        >
          Click the button below to continue to the secure password reset page.
        </p>

        {error && (
          <div
            role="alert"
            style={{
              color: "#991b1b",
              background: "#fef2f2",
              padding: "0.85rem 1rem",
              borderRadius: "0.65rem",
              marginBottom: "1.25rem",
              fontSize: "0.88rem",
              border: "1px solid #fecaca",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={continueToReset}
          disabled={!confirmationUrl}
          style={{
            width: "100%",
            padding: "0.85rem",
            borderRadius: "0.65rem",
            border: "none",
            backgroundColor: "#2563eb",
            color: "white",
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: confirmationUrl ? "pointer" : "not-allowed",
            opacity: confirmationUrl ? 1 : 0.6,
          }}
        >
          Continue to Reset Password
        </button>
      </section>
    </main>
  );
}
