import { useState } from 'react';
import { Plus, Car } from 'lucide-react';
import { useFahrzeuge, useCreateFahrzeug, useUpdateFahrzeug } from '../api/hooks/useFahrzeuge';
import FahrzeugCard from '../components/fahrzeuge/FahrzeugCard';
import FahrzeugForm from '../components/fahrzeuge/FahrzeugForm';
import Modal from '../components/shared/Modal';
import { useLanguage } from '../contexts/LanguageContext';
import type { Fahrzeug } from '../types';

export default function FahrzeugePage() {
  const { t } = useLanguage();
  const { data: fahrzeuge, isLoading } = useFahrzeuge();
  const createMutation = useCreateFahrzeug();
  const updateMutation = useUpdateFahrzeug();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingFahrzeug, setEditingFahrzeug] = useState<Fahrzeug | null>(null);

  function openCreate() {
    setEditingFahrzeug(null);
    setModalOpen(true);
  }

  function openEdit(f: Fahrzeug) {
    setEditingFahrzeug(f);
    setModalOpen(true);
  }

  function handleSubmit(data: Record<string, unknown>) {
    if (editingFahrzeug) {
      updateMutation.mutate(
        { id: editingFahrzeug.id, data: data as Record<string, string> },
        { onSuccess: () => setModalOpen(false) },
      );
    } else {
      createMutation.mutate(data as { kennzeichen: string; marke: string; modell: string; kmInitial: number }, {
        onSuccess: () => setModalOpen(false),
      });
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-page-header">{t('fahrzeuge.title')}</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
        >
          <Plus size={16} />
          {t('fahrzeuge.add')}
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      )}

      {!isLoading && (!fahrzeuge || fahrzeuge.length === 0) && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface py-16 text-center">
          <Car size={40} className="mb-3 text-text-muted/30" />
          <p className="text-text-muted">{t('fahrzeuge.empty')}</p>
          <button
            onClick={openCreate}
            className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
          >
            {t('fahrzeuge.add')}
          </button>
        </div>
      )}

      {fahrzeuge && fahrzeuge.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {fahrzeuge.map((f) => (
            <FahrzeugCard key={f.id} fahrzeug={f} onEdit={openEdit} />
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingFahrzeug ? t('fahrzeuge.edit') : t('fahrzeuge.add')}
      >
        <FahrzeugForm
          fahrzeug={editingFahrzeug}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>
    </div>
  );
}
