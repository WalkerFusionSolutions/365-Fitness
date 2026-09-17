export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-y border-dashed border-line py-7">
      <div className="mb-3 h-1 w-10 bg-brand" aria-hidden="true" />
      <h3 className="font-bold text-foreground">{title}</h3>
      <p className="mt-1 max-w-xl text-sm leading-6 text-muted">{body}</p>
    </div>
  );
}
