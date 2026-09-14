import Link from "next/link";
import { signOut } from "@/lib/actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function StaffOnly() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="max-w-lg p-8 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-accent">Staff area</p>
        <h1 className="mt-3 text-3xl font-black">This dashboard is for coaches only.</h1>
        <p className="mt-4 text-muted">
          Your account is signed in, but it is not a coach profile. Client accounts should continue using the mobile app.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/">
            <Button type="button" variant="secondary">Return to website</Button>
          </Link>
          <form action={signOut}>
            <Button type="submit">Sign out</Button>
          </form>
        </div>
      </Card>
    </main>
  );
}
