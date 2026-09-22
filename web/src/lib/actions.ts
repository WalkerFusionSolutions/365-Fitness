"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";

type CoachSignInResult =
  | { ok: true }
  | { ok: false; error: string };

export async function signInCoach(email: string, password: string): Promise<CoachSignInResult> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return { ok: false, error: "Enter your email and password." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error || !data.user) {
      console.warn("Coach web sign-in rejected", { code: error?.code ?? "missing_user" });
      return { ok: false, error: "The email or password is incorrect." };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle<{ role: "client" | "coach" }>();

    if (profileError) {
      console.error("Coach web profile verification failed", {
        code: profileError.code,
        userId: data.user.id,
      });
      await supabase.auth.signOut();
      return { ok: false, error: "Your account was verified, but your staff profile could not be loaded. Contact 365 Fitness support." };
    }

    if (!profile) {
      console.warn("Coach web profile missing", { userId: data.user.id });
      await supabase.auth.signOut();
      return { ok: false, error: "This account does not have a 365 Fitness profile." };
    }

    if (profile.role !== "coach") {
      await supabase.auth.signOut();
      return { ok: false, error: "The web dashboard is available to coach accounts only. Clients should use the 365 Fitness mobile app." };
    }

    return { ok: true };
  } catch (error) {
    console.error("Coach web sign-in failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return { ok: false, error: "We couldn't sign you in right now. Check your connection and try again." };
  }
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
