import { useEffect, useRef, useState } from 'react';
import { Bell, DotsThreeOutline, Package, SignOut, Translate } from '@phosphor-icons/react';
import { ago, initials, moneyShort } from '../lib/format';
import { toggleLanguage, useI18n } from '../lib/i18n';
import { useTheme } from '../lib/theme';
import { Segmented, Sheet, StatusBadge } from './ui';

export function ThemeSwitch() {
  const { t } = useI18n();
  const [theme, setTheme] = useTheme();
  return (
    <Segmented
      label={t('theme')}
      value={theme}
      onChange={setTheme}
      options={[
        { value: 'light', label: t('themeLight') },
        { value: 'dark', label: t('themeDark') },
        { value: 'system', label: t('themeAuto') }
      ]}
    />
  );
}

export function BrandMark({ size = 16 }) {
  return (
    <span className="brand-mark" aria-hidden="true">
      <Package size={size} weight="bold" />
    </span>
  );
}

function Notifications({ activity, onNavigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const total = activity ? activity.counts.submitted + activity.counts.suggestions + activity.counts.signups : 0;

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const go = (page) => {
    setOpen(false);
    onNavigate(page);
  };

  return (
    <div className="bell-wrap" ref={ref}>
      <button className="icon-btn" aria-label={`Notifications${total ? `, ${total} need attention` : ''}`} aria-expanded={open} onClick={() => setOpen(!open)}>
        <Bell size={20} />
        {total > 0 && <span className="count-dot">{total}</span>}
      </button>
      {open && (
        <div className="popover" role="dialog" aria-label="Notifications">
          <h2>Needs your attention</h2>
          <ul className="list">
            {[
              ['requests', activity?.counts.submitted, 'material requests to review'],
              ['suggestions', activity?.counts.suggestions, 'vendor suggestions to review'],
              ['vendors', activity?.counts.signups, 'new vendor sign-ups to approve']
            ].map(([page, n, text]) => (
              <li key={page}>
                <button className="list-row" onClick={() => go(page)}>
                  <span className="grow"><span className="title"><span className="num">{n || 0}</span> {text}</span></span>
                </button>
              </li>
            ))}
          </ul>
          {activity?.events?.length > 0 && (
            <>
              <h2>Recent activity</h2>
              <ul className="list">
                {activity.events.slice(0, 5).map((e) => (
                  <li key={`${e.type}-${e.id}`}>
                    <button className="list-row" onClick={() => go(e.type === 'request' ? 'requests' : 'suggestions')}>
                      <span className="grow">
                        <span className="title" style={{ whiteSpace: 'normal' }}>{e.title}</span>
                        <span className="sub">{ago(e.at)} · <span className="num">{moneyShort(e.amount)}</span></span>
                      </span>
                      <StatusBadge status={e.status} />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Shell({ user, nav, page, onNavigate, onSignOut, activity, children }) {
  const { t } = useI18n();
  const [moreOpen, setMoreOpen] = useState(false);
  const isAdmin = user.role === 'admin';
  const primary = nav.filter((n) => n.mobile);
  const secondary = nav.filter((n) => !n.mobile);

  const navigate = (id) => {
    setMoreOpen(false);
    onNavigate(id);
  };

  return (
    <div className="app">
      <a className="skip-link" href="#main">Skip to content</a>
      <aside className="sidebar" aria-label="Main navigation">
        <div className="brand">
          <BrandMark />
          <div>
            MatFlow
            <small>{isAdmin ? 'Purchasing office' : user.companyName || 'Vendor portal'}</small>
          </div>
        </div>
        <nav className="nav">
          {nav.map((item, index) => (
            <div key={item.id} style={{ display: 'contents' }}>
              {item.divider && index > 0 && <div className="nav-divider" role="separator" />}
              <button className="nav-item" aria-current={page === item.id ? 'page' : undefined} onClick={() => onNavigate(item.id)}>
                <item.icon size={19} weight={page === item.id ? 'fill' : 'regular'} aria-hidden="true" />
                {item.label}
                {item.count > 0 && <span className="count-dot">{item.count}</span>}
              </button>
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="theme-row">
            <ThemeSwitch />
          </div>
          <div className="who">
            <span className="avatar">{initials(user.name)}</span>
            <div className="who-text">
              <b>{user.name}</b>
              <span>{isAdmin ? 'Administrator' : user.email}</span>
            </div>
          </div>
          <div className="foot-actions">
            {!isAdmin && (
              <button className="btn btn-ghost btn-sm" onClick={toggleLanguage}>
                <Translate size={16} /> {t('language')}
              </button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={onSignOut}>
              <SignOut size={16} /> {t('signOut')}
            </button>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-title">
            <BrandMark size={15} />
            MatFlow
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {isAdmin && <Notifications activity={activity} onNavigate={onNavigate} />}
          </div>
        </header>
        <main id="main" className="content" tabIndex={-1}>
          {children}
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Main navigation">
        {primary.map((item) => (
          <button key={item.id} aria-current={page === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}>
            <item.icon size={22} weight={page === item.id ? 'fill' : 'regular'} aria-hidden="true" />
            {item.short || item.label}
            {item.count > 0 && <span className="count-dot">{item.count}</span>}
          </button>
        ))}
        <button aria-current={secondary.some((n) => n.id === page) ? 'page' : undefined} onClick={() => setMoreOpen(true)} aria-haspopup="dialog">
          <DotsThreeOutline size={22} aria-hidden="true" />
          {t('more')}
          {secondary.some((n) => n.count > 0) && <span className="count-dot">{secondary.reduce((s, n) => s + (n.count || 0), 0)}</span>}
        </button>
      </nav>

      {moreOpen && (
        <Sheet title={user.name} sub={isAdmin ? 'Administrator' : user.email} onClose={() => setMoreOpen(false)}>
          <nav className="nav">
            {secondary.map((item) => (
              <button key={item.id} className="nav-item" aria-current={page === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}>
                <item.icon size={19} aria-hidden="true" />
                {item.label}
                {item.count > 0 && <span className="count-dot">{item.count}</span>}
              </button>
            ))}
            <div className="nav-divider" role="separator" />
            <div className="theme-row" style={{ padding: '4px 10px 8px' }}>
              <span className="small muted">{t('theme')}</span>
              <ThemeSwitch />
            </div>
            <button className="nav-item" onClick={toggleLanguage}>
              <Translate size={19} aria-hidden="true" /> {t('language')}
            </button>
            <button className="nav-item" onClick={onSignOut}>
              <SignOut size={19} aria-hidden="true" /> {t('signOut')}
            </button>
          </nav>
        </Sheet>
      )}
    </div>
  );
}
