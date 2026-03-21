import { Euro, MapPin, Navigation, AlertTriangle, Info } from 'lucide-react';
import KpiCard from '../components/dashboard/KpiCard';
import { useLanguage } from '../contexts/LanguageContext';

export default function DashboardPage() {
  const { t } = useLanguage();

  const kpis = [
    {
      label: t('dashboard.gesamtkosten'),
      value: '€ —',
      icon: <Euro size={20} />,
    },
    {
      label: t('dashboard.gefahrene_km'),
      value: '— km',
      icon: <MapPin size={20} />,
    },
    {
      label: t('dashboard.anzahl_fahrten'),
      value: '—',
      icon: <Navigation size={20} />,
    },
    {
      label: t('dashboard.offene_strafen'),
      value: '—',
      icon: <AlertTriangle size={20} />,
    },
  ];

  return (
    <div>
      <h1 className="text-page-header mb-6">{t('dashboard.title')}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="mt-8 flex items-center gap-3 rounded-xl border border-border bg-surface p-5 text-sm text-text-muted">
        <Info size={18} className="shrink-0" />
        <span>{t('dashboard.next_phases')}</span>
      </div>
    </div>
  );
}
