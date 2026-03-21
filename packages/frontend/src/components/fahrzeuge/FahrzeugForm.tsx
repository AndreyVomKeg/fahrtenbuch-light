import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Fahrzeug } from '../../types';

const formSchema = z.object({
  kennzeichen: z.string().optional(),
  marke: z.string().min(1, 'Required').max(50),
  modell: z.string().min(1, 'Required').max(50),
  vin: z.string().max(17).optional().or(z.literal('')),
  kraftstoff: z.enum(['BENZIN', 'DIESEL', 'ELEKTRO', 'HYBRID']).default('BENZIN'),
  tuvDatum: z.string().optional().or(z.literal('')),
  kmInitial: z.coerce.number().int().min(0).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface FahrzeugFormProps {
  fahrzeug?: Fahrzeug | null;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function FahrzeugForm({
  fahrzeug,
  onSubmit,
  onCancel,
  loading,
}: FahrzeugFormProps) {
  const { t } = useLanguage();
  const isEdit = !!fahrzeug;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          marke: fahrzeug.marke,
          modell: fahrzeug.modell,
          vin: fahrzeug.vin || '',
          kraftstoff: fahrzeug.kraftstoff,
          tuvDatum: fahrzeug.tuvDatum
            ? new Date(fahrzeug.tuvDatum).toISOString().split('T')[0]
            : '',
        }
      : {
          kraftstoff: 'BENZIN',
          kmInitial: 0,
        },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!isEdit && (
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t('fahrzeuge.kennzeichen')}
          </label>
          <input
            {...register('kennzeichen')}
            placeholder="B AB 1234"
            className="w-full"
          />
          {errors.kennzeichen && (
            <p className="mt-1 text-xs text-error">{errors.kennzeichen.message}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t('fahrzeuge.marke')}
          </label>
          <input {...register('marke')} placeholder="BMW" className="w-full" />
          {errors.marke && (
            <p className="mt-1 text-xs text-error">{errors.marke.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t('fahrzeuge.modell')}
          </label>
          <input {...register('modell')} placeholder="320d" className="w-full" />
          {errors.modell && (
            <p className="mt-1 text-xs text-error">{errors.modell.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          {t('fahrzeuge.vin')}
        </label>
        <input {...register('vin')} placeholder="WBAXXXXXXXXXXXXXX" className="w-full" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t('fahrzeuge.kraftstoff')}
          </label>
          <select {...register('kraftstoff')} className="w-full">
            {(['BENZIN', 'DIESEL', 'ELEKTRO', 'HYBRID'] as const).map((k) => (
              <option key={k} value={k}>
                {t(`fahrzeuge.kraftstoff.${k}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t('fahrzeuge.tuv')}
          </label>
          <input type="date" {...register('tuvDatum')} className="w-full" />
        </div>
      </div>

      {!isEdit && (
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t('fahrzeuge.km_initial')}
          </label>
          <input
            type="number"
            {...register('kmInitial')}
            placeholder="0"
            className="w-full"
          />
          {errors.kmInitial && (
            <p className="mt-1 text-xs text-error">{errors.kmInitial.message}</p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2 text-sm text-text-muted hover:bg-background"
        >
          {t('fahrzeuge.cancel')}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
        >
          {loading ? t('common.loading') : t('fahrzeuge.save')}
        </button>
      </div>
    </form>
  );
}
