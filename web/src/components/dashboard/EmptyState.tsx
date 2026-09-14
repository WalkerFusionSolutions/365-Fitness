import { Card } from "@/components/ui/Card";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-muted">{body}</p>
    </Card>
  );
}
