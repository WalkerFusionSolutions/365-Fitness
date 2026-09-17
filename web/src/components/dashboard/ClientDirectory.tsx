"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { initials } from "@/lib/format";
import type { Profile } from "@/types/app";

export function ClientDirectory({ clients }: { clients: Profile[] }) {
  const [query, setQuery] = useState("");
  const filteredClients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return clients;
    return clients.filter((client) => [client.full_name, client.phone_number ?? ""].some((value) => value.toLowerCase().includes(normalized)));
  }, [clients, query]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 border-y border-line py-4 md:flex-row md:items-center md:justify-between">
        <input className="input max-w-md" placeholder="Search clients" value={query} onChange={(event) => setQuery(event.target.value)} />
        <p className="text-sm font-semibold text-muted">{filteredClients.length} visible client{filteredClients.length === 1 ? "" : "s"}</p>
      </div>
      <div className="overflow-hidden border border-line bg-panel">
        <div className="hidden grid-cols-[1.3fr_1fr_auto] gap-4 border-b border-line bg-secondary px-4 py-2 text-xs font-semibold text-muted md:grid">
          <span>Client</span><span>Phone</span><span>Action</span>
        </div>
        {filteredClients.map((client) => (
          <Link key={client.id} href={`/dashboard/clients/${client.id}`} className="grid gap-4 border-b border-line p-4 transition last:border-b-0 hover:bg-background md:grid-cols-[1.3fr_1fr_auto] md:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center bg-brand text-sm font-black text-white">{initials(client.full_name)}</div>
              <div>
                <h2 className="font-bold">{client.full_name}</h2>
                <p className="text-xs font-semibold uppercase text-muted">Client</p>
              </div>
            </div>
            <p className="text-sm text-muted">{client.phone_number ?? "No phone on profile"}</p>
            <span className="text-sm font-black text-brand">Open</span>
          </Link>
        ))}
      </div>
      {!filteredClients.length ? (
        <div className="border-y border-dashed border-line py-6">
          <h3 className="font-bold">No clients match that search.</h3>
          <p className="mt-1 text-sm text-muted">Try a different name or phone number.</p>
        </div>
      ) : null}
    </div>
  );
}
