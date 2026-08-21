"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/useSupabase";

export default function AdminLoginPage() {
  const supabase = useSupabase();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError) throw signInError;
      if (!data.session) throw new Error("Login failed. Please try again.");

      const { data: isAdmin, error: adminCheckError } = await supabase.rpc(
        "is_admin"
      );

      if (adminCheckError) throw adminCheckError;

      if (!isAdmin) {
        await supabase.auth.signOut();
        throw new Error("This account is not authorized for admin access.");
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
        backgroundColor: "#f9fafb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          backgroundColor: "white",
          borderRadius: "1.5rem",
          padding: "2.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <div
          style={{
            display: "inline-block",
            fontSize: "12px",
            padding: "6px 12px",
            borderRadius: "999px",
            background: "#ede9fe",
            color: "#6d28d9",
            marginBottom: "10px",
            fontWeight: 600,
          }}
        >
          Administration
        </div>

        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 800,
            color: "#111827",
            margin: "0 0 1.5rem",
          }}
        >
          Admin Login
        </h1>

        {error && (
          <div
            style={{
              color: "#b91c1c",
              background: "#fee2e2",
              padding: "0.9rem",
              borderRadius: "0.9rem",
              marginBottom: "1.25rem",
              fontSize: "0.9rem",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginBottom: "1.1rem" }}>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              marginBottom: "0.4rem",
              color: "#111827",
              fontSize: "0.9rem",
            }}
          >
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.85rem",
              borderRadius: "0.8rem",
              border: "1px solid #d1d5db",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              marginBottom: "0.4rem",
              color: "#111827",
              fontSize: "0.9rem",
            }}
          >
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.85rem",
              borderRadius: "0.8rem",
              border: "1px solid #d1d5db",
              boxSizing: "border-box",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.9rem",
            borderRadius: "0.8rem",
            border: "none",
            backgroundColor: "#2563eb",
            color: "white",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </main>
  );
}