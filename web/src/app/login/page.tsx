import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/dashboard/LoginForm";
import { PhpIcon, PhpReferenceShell } from "@/components/marketing/PhpReferenceSite";
import { getSessionProfile } from "@/lib/data";

export const metadata: Metadata = {
  title: "Login",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const { profile } = await getSessionProfile();

  if (profile?.role === "coach") {
    redirect("/dashboard");
  }

  return (
    <PhpReferenceShell>
      <div className="php-container">
        <div className="php-content-section">
          <div className="php-grid php-grid-2 php-align-center">
            <div>
              <div className="php-hero-badge">MEMBER ACCESS</div>
              <h1 className="php-section-title" style={{ textAlign: "left", marginBottom: "1.5rem" }}>
                MEMBER <span>LOGIN</span>
              </h1>
              <p className="php-lead">This page uses the colleague PHP login visual direction, but authentication remains the real Supabase email/password flow.</p>
              <div className="php-grid php-grid-3" style={{ marginTop: "2rem" }}>
                <div className="php-card php-center"><div className="php-card-body"><PhpIcon>APP</PhpIcon><p>Real sessions</p></div></div>
                <div className="php-card php-center"><div className="php-card-body"><PhpIcon>365</PhpIcon><p>Coach dashboard</p></div></div>
                <div className="php-card php-center"><div className="php-card-body"><PhpIcon>OK</PhpIcon><p>Safe errors</p></div></div>
              </div>
            </div>
            <div className="php-card php-login-shell">
              <div className="php-card-body">
                <div className="php-center">
                  <PhpIcon>365</PhpIcon>
                  <h2 className="php-heading-teal">Welcome Back</h2>
                  <p>Sign in with your 365 Fitness account.</p>
                </div>
                <LoginForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PhpReferenceShell>
  );
}
