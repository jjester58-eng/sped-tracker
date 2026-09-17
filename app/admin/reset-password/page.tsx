"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/useSupabase";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

export default function ResetPasswordPage() {
  const supabase = useSupabase();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const showUrlError = () => {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const params = new URLSearchParams(hash);
      const errorCode = params.get("error_code");
      const errorDescription = params.get("error_description");

      if (errorCode || errorDescription) {
        const description = errorDescription
          ? decodeURIComponent(errorDescription.replace(/\+/g, " "))
          : "The password reset link could not be verified.";
        setError(`${description}${errorCode ? ` (${errorCode})` : ""}`);
        setCheckingLink(false);
        return true;
      }

      return false;
    };

    const finishChecking = (session: Session | null) => {
      if (cancelled) return;
      if (session) setReady(true);
      setCheckingLink(false);
      if (timeoutId) clearTimeout(timeoutId);
    };

    if (showUrlError()) return;

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
          finishChecking(session);
        }
      }
    );

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (cancelled) return;
      if (sessionError) {
        setError(sessionError.message);
        setCheckingLink(false);
        return;
      }
      finishChecking(data.session);
    });

    timeoutId = setTimeout(() => {
      if (cancelled) return;
      setCheckingLink(false);
      setError(
        "The reset link could not be verified. It may have expired, already been used, or been opened by your email security scanner. Request a new reset email and open the newest link directly."
      );
    }, 8000);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 6) {
      setError("Your new password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setMessage("Your password has been updated successfully.");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => router.push("/admin/login"), 1500);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          "Unable to update your password. Please request a new reset email."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", fontFamily: "inherit" }}>
      <form onSubmit={handleSubmit} autoComplete="on" style={{ backgroundColor: "white", borderRadius: "1.25rem", padding: "2.5rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)", border: "1px solid #e2e8f0", width: "100%", maxWidth: "420px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", padding: "0.35rem 0.75rem", borderRadius: "999px", background: "#ede9fe", color: "#6d28d9", marginBottom: "1rem", fontWeight: 700 }}><span>🔒</span><span>Administrator Access</span></div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.5rem" }}>Reset Password</h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem", margin: "0 0 1.5rem" }}>Choose a new password for your SPED Tracker account.</p>
        {error && <div role="alert" style={{ color: "#991b1b", background: "#fef2f2", padding: "0.85rem 1rem", borderRadius: "0.65rem", marginBottom: "1.25rem", fontSize: "0.88rem", border: "1px solid #fecaca" }}>{error}</div>}
        {message && <div role="status" style={{ color: "#166534", background: "#f0fdf4", padding: "0.85rem 1rem", borderRadius: "0.65rem", marginBottom: "1.25rem", fontSize: "0.88rem", border: "1px solid #bbf7d0" }}>{message}</div>}
        <div style={{ marginBottom: "1.1rem" }}><label htmlFor="new-password" style={{ display: "block", fontWeight: 600, marginBottom: "0.4rem", color: "#334155", fontSize: "0.9rem" }}>New Password</label><input id="new-password" name="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" placeholder="At least 6 characters" disabled={!ready} style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.65rem", border: "1px solid #cbd5e1", boxSizing: "border-box", fontSize: "0.95rem" }} /></div>
        <div style={{ marginBottom: "1.5rem" }}><label htmlFor="confirm-password" style={{ display: "block", fontWeight: 600, marginBottom: "0.4rem", color: "#334155", fontSize: "0.9rem" }}>Confirm New Password</label><input id="confirm-password" name="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} autoComplete="new-password" placeholder="Enter it again" disabled={!ready} style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.65rem", border: "1px solid #cbd5e1", boxSizing: "border-box", fontSize: "0.95rem" }} /></div>
        <button type="submit" disabled={loading || !ready} style={{ width: "100%", padding: "0.85rem", borderRadius: "0.65rem", border: "none", backgroundColor: "#2563eb", color: "white", fontWeight: 700, fontSize: "0.95rem", cursor: loading || !ready ? "not-allowed" : "pointer", opacity: loading || !ready ? 0.6 : 1 }}>{loading ? "Updating Password..." : checkingLink ? "Verifying Reset Link..." : !ready ? "Reset Link Not Valid" : "Update Password"}</button>
        <button type="button" onClick={() => router.push("/admin/login")} style={{ width: "100%", marginTop: "0.85rem", padding: "0.7rem", borderRadius: "0.65rem", border: "1px solid #cbd5e1", background: "white", color: "#475569", fontWeight: 600, cursor: "pointer" }}>Back to Login</button>
      </form>
    </main>
  );
}
