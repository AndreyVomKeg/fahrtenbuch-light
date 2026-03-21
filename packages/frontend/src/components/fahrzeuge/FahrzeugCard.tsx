import { Car, Pencil, Fuel } from 'lucide-react';
import Kennzeichen from '../shared/Kennzeichen';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Fahrzeug } from '../../types';

interface FahrzeugCardProps {
  fahrzeug: Fahrzeug;
  onEdit: (f: Fahrzeug) => void;
}

export default function FahrzeugCard({ fahrzeug, onEdit }: FahrzeugCardProps) {
  const { t } = useLanguage();

  return (
    <div className="rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <Kennzeichen plate={fahrzeug.kennzeichen} />
        <button
          onClick={() => onEdit(fahrzeug)}
          className="rounded-lg p-1.5 text-text-muted hover:bg-background hover:text-text"
        >
          <Pencil size={16} />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Car size={16} className="text-text-muted" />
        <span className="font-medium">
          {fahrzeug.marke} {fahrzeug.modell}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-text-muted">{t('fahrzeuge.km_current')}</span>
          <p className="font-semibold">
            {fahrzeug.kmCurrent.toLocaleString('de-DE')} km
          </p>
        </div>
        <div>
          <span className="text-text-muted">{t('fahrzeuge.kraftstoff')}</span>
          <div className="flex items-center gap-1">
            <Fuel size={13} className="text-text-muted" />
            <span>{t(`fahrzeuge.kraftstoff.${fahrzeug.kraftstoff}`)}</span>
          </div>
        </div>
      </div>

      {fahrzeug.tuvDatum && (
        <div className="mt-2 text-xs text-text-muted">
          {t('fahrzeuge.tuv')}:{' '}
          {new Date(fahrzeug.tuvDatum).toLocaleDateString('de-DE')}
        </div>
      )}
    </div>
  );
}
