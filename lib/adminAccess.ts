"use client";

type AdminCheck = {
  hasSession: boolean;
  authorized: boolean;
  message?: string;
};

/**
 * Verify an authenticated user against the same supported admin sources used
 * by the admin login flow. The RPC is preferred; table checks are a fallback
 * for projects where the is_admin() function is unavailable or not executable.
 */
export async function verifyAdminAccess(supabase: any): Promise<AdminCheck> {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      return { hasSession: false, authorized: false, message: `Session verification failed: ${sessionError.message}` };
    }

    const session = sessionData?.session;
    if (!session?.user) {
      return { hasSession: false, authorized: false, message: "No active sign-in was found. Please sign in again." };
    }

    try {
      const { data, error } = await supabase.rpc("is_admin");
      if (!error && data === true) return { hasSession: true, authorized: true };
    } catch {
      // Continue to explicit admin-table checks below.
    }

    const email = session.user.email?.trim().toLowerCase();
    if (!email) {
      return { hasSession: true, authorized: false, message: "Your signed-in account does not have an email address to verify." };
    }

    try {
      const { data, error } = await supabase
        .from("admin_users")
        .select("id, active")
        .eq("email", email)
        .maybeSingle();
      if (!error && data && data.active !== false) {
        return { hasSession: true, authorized: true };
      }
    } catch {
      // Try the legacy admins table next.
    }

    try {
      const { data, error } = await supabase
        .from("admins")
        .select("user_id")
        .eq("email", email)
        .maybeSingle();
      if (!error && data) return { hasSession: true, authorized: true };
    } catch {
      // Fall through to a clear access-denied result.
    }

    return {
      hasSession: true,
      authorized: false,
      message: "Your account is signed in, but its administrator role could not be confirmed. Verify that your account is active in admin_users or listed in admins, and that Supabase access policies allow the check.",
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown verification error";
    return { hasSession: false, authorized: false, message: `Unable to verify your sign-in session: ${detail}` };
  }
}
