import { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Lang } from '../../types';

export default function Header() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const langs: { code: Lang; label: string }[] = [
    { code: 'de', label: 'Deutsch' },
    { code: 'en', label: 'English' },
    { code: 'ru', label: 'Русский' },
  ];

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-6">
      <div />

      <div className="relative flex items-center gap-4" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-text-muted hover:bg-background"
        >
          <span>{user?.email}</span>
          <ChevronDown size={14} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-10 z-50 w-48 rounded-lg border border-border bg-surface py-1 shadow-lg">
            <div className="border-b border-border px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Globe size={12} />
                <span>{t('settings.language')}</span>
              </div>
              <div className="mt-1 flex gap-1">
                {langs.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className={`rounded px-2 py-0.5 text-xs ${
                      lang === l.code
                        ? 'bg-accent text-white'
                        : 'text-text-muted hover:bg-background'
                    }`}
                  >
                    {l.code.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => {
                setMenuOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-muted hover:bg-background"
            >
              <LogOut size={14} />
              {t('auth.logout')}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
