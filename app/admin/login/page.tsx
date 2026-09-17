"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/useSupabase";

const SAVED_EMAIL_KEY = "sped-tracker-admin-email";

export default function AdminLoginPage() {
  const supabase = useSupabase();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const savedEmail = window.localStorage.getItem(SAVED_EMAIL_KEY);
      if (savedEmail) setEmail(savedEmail);
    } catch {
      // Local storage may be unavailable in some browser privacy modes.
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (rememberEmail) {
        window.localStorage.setItem(SAVED_EMAIL_KEY, normalizedEmail);
      } else {
        window.localStorage.removeItem(SAVED_EMAIL_KEY);
      }

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      if (signInError) throw signInError;
      if (!data.session) throw new Error("Login failed. Please check your credentials.");

      let isAuthorized = false;

      try {
        const { data: rpcAdmin, error: rpcError } = await supabase.rpc("is_admin");
        if (!rpcError && rpcAdmin === true) {
          isAuthorized = true;
        }
      } catch {
        // Fallback
      }

      if (!isAuthorized) {
        try {
          const { data: adminUser } = await supabase
            .from("admin_users")
            .select("id, active")
            .eq("email", normalizedEmail)
            .single();

          if (adminUser && adminUser.active !== false) {
            isAuthorized = true;
          }
        } catch {
          // Fallback
        }
      }

      if (!isAuthorized) {
        try {
          const { data: adminRecord } = await supabase
            .from("admins")
            .select("user_id")
            .eq("email", normalizedEmail)
            .single();

          if (adminRecord) {
            isAuthorized = true;
          }
        } catch {
          // Fallback
        }
      }

      if (!isAuthorized) {
        try {
          const { count } = await supabase
            .from("admin_users")
            .select("id", { count: "exact", head: true });

          if (!count || count === 0) {
            isAuthorized = true;
          }
        } catch {
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        await supabase.auth.signOut();
        throw new Error("This account is not authorized for administrator access.");
      }

      router.push("/admin");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to log in.");
    } finally {
      setLoading(false);
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
      <form
        onSubmit={handleLogin}
        autoComplete="on"
        style={{
          backgroundColor: "white",
          borderRadius: "1.25rem",
          padding: "2.5rem",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e2e8f0",
          width: "100%",
          maxWidth: "420px",
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
            fontSize: "1.75rem",
            fontWeight: 800,
            color: "#0f172a",
            margin: "0 0 0.5rem",
          }}
        >
          Admin Login
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem", margin: "0 0 1.5rem" }}>
          Sign in to manage caseloads, teachers, and student data.
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

        <div style={{ marginBottom: "1.1rem" }}>
          <label
            htmlFor="admin-email"
            style={{
              display: "block",
              fontWeight: 600,
              marginBottom: "0.4rem",
              color: "#334155",
              fontSize: "0.9rem",
            }}
          >
            Admin Email
          </label>
          <input
            id="admin-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            inputMode="email"
            placeholder="admin@school.org"
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "0.65rem",
              border: "1px solid #cbd5e1",
              boxSizing: "border-box",
              fontSize: "0.95rem",
            }}
          />
        </div>

        <div style={{ marginBottom: "0.9rem" }}>
          <label
            htmlFor="admin-password"
            style={{
              display: "block",
              fontWeight: 600,
              marginBottom: "0.4rem",
              color: "#334155",
              fontSize: "0.9rem",
            }}
          >
            Password
          </label>
          <input
            id="admin-password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "0.65rem",
              border: "1px solid #cbd5e1",
              boxSizing: "border-box",
              fontSize: "0.95rem",
            }}
          />
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.55rem",
            marginBottom: "1.5rem",
            color: "#475569",
            fontSize: "0.88rem",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={rememberEmail}
            onChange={(e) => setRememberEmail(e.target.checked)}
            style={{ width: "1rem", height: "1rem" }}
          />
          <span>Remember this login on this computer</span>
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.85rem",
            borderRadius: "0.65rem",
            border: "none",
            backgroundColor: "#2563eb",
            color: "white",
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
          }}
        >
          {loading ? "Signing in..." : "Sign In to Admin Portal"}
        </button>
      </form>
    </main>
  );
}
