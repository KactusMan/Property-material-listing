import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { MagnifyingGlass, Minus, Plus, X } from '@phosphor-icons/react';
import { api } from '../lib/api';
import { safeUrl, statusTone } from '../lib/format';

/* ---------- Data loading ---------- */

export function useResource(path) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const load = useCallback(async () => {
    if (!path) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await api(path);
      setState({ data, error: null, loading: false });
    } catch (error) {
      setState((s) => ({ ...s, error, loading: false }));
    }
  }, [path]);
  useEffect(() => {
    load();
  }, [load]);
  const setData = useCallback((updater) => setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater })), []);
  return { ...state, reload: load, setData };
}

/* ---------- Toasts ---------- */

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, tone = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((list) => [...list.slice(-2), { id, message, tone }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 4200);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tone === 'error' ? 'error' : ''}`}>{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/* ---------- Primitives ---------- */

export function StatusBadge({ status, label }) {
  return <span className={`badge ${statusTone[status] ?? ''}`}>{label || status}</span>;
}

export function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function SearchInput({ value, onChange, placeholder, label }) {
  return (
    <div className="search">
      <MagnifyingGlass size={17} aria-hidden="true" />
      <input className="input" type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={label || placeholder} />
    </div>
  );
}

export function Segmented({ options, value, onChange, label }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
          {o.count ? <span className="count-dot">{o.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className="switch" onClick={() => onChange(!checked)} />;
}

export function Stepper({ value, onChange, label }) {
  const set = (n) => onChange(Math.max(0, Math.round(n * 100) / 100));
  return (
    <div className="stepper">
      <button type="button" onClick={() => set(Number(value) - 1)} aria-label={`Less ${label}`}><Minus size={14} weight="bold" /></button>
      <input type="number" inputMode="decimal" min="0" value={value} onChange={(e) => set(Number(e.target.value) || 0)} aria-label={`Quantity of ${label}`} />
      <button type="button" onClick={() => set(Number(value) + 1)} aria-label={`More ${label}`}><Plus size={14} weight="bold" /></button>
    </div>
  );
}

export function Empty({ icon: Icon, title, children, action }) {
  return (
    <div className="empty">
      {Icon && <Icon size={28} className="empty-icon" aria-hidden="true" />}
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function LoadError({ error, onRetry }) {
  return (
    <div className="panel">
      <Empty title="Could not load this page" action={<button className="btn" onClick={onRetry}>Try again</button>}>
        {error?.message}
      </Empty>
    </div>
  );
}

export function Skeleton({ rows = 5, height = 48 }) {
  return (
    <div className="skeleton-stack" aria-label="Loading" role="status">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton" style={{ height }} />
      ))}
    </div>
  );
}

export function PageHead({ title, sub, children }) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </header>
  );
}

/* ---------- Sheet: side panel on desktop, bottom sheet on phones ---------- */

export function Sheet({ title, sub, onClose, children, footer, labelledBy = 'sheet-title' }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="sheet" role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1} ref={ref}>
        <div className="sheet-head">
          <div>
            <h2 id={labelledBy}>{title}</h2>
            {sub && <p>{sub}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </section>
    </div>
  );
}

// Links come from vendors and the AI, so only http(s) URLs are ever rendered as anchors.
export function ExternalLink({ href, children, className = 'text-link' }) {
  const safe = safeUrl(href);
  if (!safe) return null;
  return (
    <a className={className} href={safe} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
