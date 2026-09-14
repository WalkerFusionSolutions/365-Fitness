import { EmptyState } from "@/components/dashboard/EmptyState";
import { getCoachDashboardData } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

export default async function MessagesDashboardPage() {
  const { conversations } = await getCoachDashboardData();
  const first = conversations[0];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-black">Messages</h1>
        <p className="mt-2 text-muted">Conversation summaries come from the existing Phase 6 messaging tables.</p>
      </div>
      <section className="grid min-h-[32rem] overflow-hidden border border-line bg-panel lg:grid-cols-[22rem_1fr]">
        <aside className="border-b border-line lg:border-b-0 lg:border-r">
          {conversations.length ? conversations.map((conversation) => (
            <div key={conversation.id} className="border-b border-line p-4">
              <p className="font-bold">Conversation</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{conversation.last_message_preview ?? "No message preview"}</p>
              <p className="mt-3 text-xs font-semibold text-muted">{conversation.last_message_at ? formatDateTime(conversation.last_message_at) : "No recent message"}</p>
            </div>
          )) : <div className="p-4"><EmptyState title="No conversations" body="Coach conversations visible through RLS will appear here." /></div>}
        </aside>
        <div className="flex flex-col justify-between p-6">
          {first ? (
            <>
              <div>
                <p className="text-sm font-black uppercase text-brand">Selected conversation</p>
                <h2 className="mt-3 text-2xl font-black">Conversation preview</h2>
                <p className="mt-3 text-muted">{first.last_message_preview ?? "No recent message body available."}</p>
              </div>
              <p className="border-t border-line pt-4 text-sm text-muted">Full message send/read flows stay for Web Phase 2 so existing Phase 6 security is not rushed.</p>
            </>
          ) : (
            <EmptyState title="Select a conversation" body="When real conversations are returned, the web inbox can show the thread here." />
          )}
        </div>
      </section>
    </div>
  );
}
