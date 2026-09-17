import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/dashboard/LoginForm";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { assets } from "@/components/marketing/LovableAssets";
import { getSessionProfile } from "@/lib/data";

export const metadata: Metadata = { title: "Login", robots: { index: false, follow: false } };
export default async function LoginPage(){const {profile}=await getSessionProfile();if(profile?.role==="coach")redirect("/dashboard");return <MarketingShell><section className="marketing-login-page"><Image src={assets.online} alt="365 Fitness coaching" fill sizes="100vw" priority/><div className="marketing-login-shade"/><div className="marketing-frame marketing-login-grid"><div className="marketing-login-copy"><p className="marketing-kicker">365 Fitness member access</p><h1>Your plan is ready when you are.</h1><p>Sign in to continue to the real coaching workspace.</p></div><div className="marketing-login-form"><h2>Welcome back</h2><p>Use your 365 Fitness account.</p><LoginForm /></div></div></section></MarketingShell>}
