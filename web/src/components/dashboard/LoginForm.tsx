"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!hasSupabaseEnv()) {
      setError("Supabase is not configured for web yet. Create web/.env.local with the public URL and publishable key.");
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 grid gap-5">
      <div>
        <label className="label-xs text-bone-dim" htmlFor="email">Email</label>
        <input id="email" className="input mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </div>
      <div>
        <label className="label-xs text-bone-dim" htmlFor="password">Password</label>
        <div className="mt-2 flex border border-line bg-charcoal/80 focus-within:border-teal">
          <input id="password" className="min-w-0 flex-1 bg-transparent px-4 py-3 text-bone outline-none" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required />
          <button className="border-l border-line px-4 text-sm font-black text-teal-bright transition hover:text-bone" type="button" onClick={() => setShowPassword((value) => !value)}>
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      {error ? <p className="border-l-2 border-red-400 p-4 text-sm text-red-200">{error}</p> : null}
      <Button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
    </form>
  );
}
