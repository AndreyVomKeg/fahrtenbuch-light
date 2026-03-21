interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

export default function KpiCard({ label, value, icon }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-section-header uppercase text-text-muted">
          {label}
        </span>
        <span className="text-text-muted">{icon}</span>
      </div>
      <div className="mt-3 text-kpi text-text">{value}</div>
    </div>
  );
}
