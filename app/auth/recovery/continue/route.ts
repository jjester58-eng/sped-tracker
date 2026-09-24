import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const confirmationUrl = body?.confirmationUrl;

    if (
      typeof confirmationUrl !== "string" ||
      !confirmationUrl.startsWith("https://")
    ) {
      return NextResponse.json(
        { error: "Invalid password reset link." },
        { status: 400 }
      );
    }

    const url = new URL(confirmationUrl);

    // Only allow Supabase Auth confirmation URLs to be passed through.
    if (
      !url.pathname.startsWith("/auth/v1/verify") ||
      !url.hostname.endsWith(".supabase.co")
    ) {
      return NextResponse.json(
        { error: "Invalid password reset destination." },
        { status: 400 }
      );
    }

    return NextResponse.json({ redirectUrl: confirmationUrl });
  } catch {
    return NextResponse.json(
      { error: "Invalid password reset request." },
      { status: 400 }
    );
  }
}
