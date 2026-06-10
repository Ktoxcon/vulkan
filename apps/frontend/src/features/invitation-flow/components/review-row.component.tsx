type ReviewRowProps = {
  label: string;
  value: string;
};

export function ReviewRow({ label, value }: ReviewRowProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}
