import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  Route,
  Receipt,
  Users,
  FileText,
  Settings,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard', enabled: true },
  { to: '/fahrzeuge', icon: Car, labelKey: 'nav.fahrzeuge', enabled: true },
  { to: '#', icon: Route, labelKey: 'nav.fahrten', enabled: false, phase: 'nav.phase2' },
  { to: '#', icon: Receipt, labelKey: 'nav.kosten', enabled: false, phase: 'nav.phase3' },
  { to: '#', icon: Users, labelKey: 'nav.partner', enabled: false, phase: 'nav.phase2' },
  { to: '#', icon: FileText, labelKey: 'nav.bericht', enabled: false, phase: 'nav.phase5' },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings', enabled: true },
];

export default function Sidebar() {
  const { t } = useLanguage();

  return (
    <aside className="flex w-56 flex-col border-r border-border bg-surface">
      <div className="flex h-14 items-center border-b border-border px-4">
        <span className="text-lg font-bold text-accent">FL</span>
        <span className="ml-2 text-sm font-semibold text-text">
          {t('app.name')}
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          if (!item.enabled) {
            return (
              <div
                key={item.labelKey}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-text-muted/50 cursor-not-allowed"
              >
                <Icon size={18} />
                <span className="text-sm">{t(item.labelKey)}</span>
                <span className="ml-auto text-[10px] text-text-muted/40">
                  {t(item.phase!)}
                </span>
              </div>
            );
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-accent/10 text-accent font-medium'
                    : 'text-text-muted hover:bg-background hover:text-text'
                }`
              }
            >
              <Icon size={18} />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
