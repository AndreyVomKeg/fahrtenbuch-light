import { Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { Lang } from '../types';

const languages: { code: Lang; label: string }[] = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { lang, setLang, t } = useLanguage();

  return (
    <div>
      <h1 className="text-page-header mb-6">{t('settings.title')}</h1>

      <div className="space-y-6">
        {/* Profile */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-section-header uppercase text-text-muted mb-4">
            {t('settings.profile')}
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">{t('auth.email')}</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Role</span>
              <span className="font-medium">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-section-header uppercase text-text-muted mb-4 flex items-center gap-2">
            <Globe size={14} />
            {t('settings.language')}
          </h2>
          <div className="flex gap-2">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                  lang === l.code
                    ? 'bg-accent text-white font-medium'
                    : 'border border-border text-text-muted hover:bg-background'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
