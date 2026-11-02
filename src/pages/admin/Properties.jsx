import { useMemo, useState } from 'react';
import { Buildings, Plus } from '@phosphor-icons/react';
import { api } from '../../lib/api';
import { Empty, Field, LoadError, PageHead, SearchInput, Sheet, Skeleton, Switch, useResource, useToast } from '../../components/ui';

function PropertySheet({ property, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', address: '', active: true, ...property });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const saved = await api(property ? `/api/properties/${property.id}` : '/api/properties', { method: property ? 'PUT' : 'POST', body: form });
      toast(property ? 'Property updated.' : 'Property added.');
      onSaved({ vendors: property?.vendors || [], ...saved }, !property);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      title={property ? property.name : 'New property'}
      sub={property ? property.id : 'Assign vendors to it from the Vendors page.'}
      onClose={onClose}
      footer={(
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" form="property-form" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </>
      )}
    >
      <form id="property-form" className="form-grid" onSubmit={save}>
        <Field label="Name" hint="Usually the street address."><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={160} /></Field>
        <Field label="Full address"><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} maxLength={240} /></Field>
        {property && (
          <label className="check-row" style={{ padding: 0 }}>
            <Switch checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Property active" />
            <span>Active. Inactive properties disappear from vendors' order screen.</span>
          </label>
        )}
        {error && <div className="form-error" role="alert">{error}</div>}
      </form>
      {property?.vendors?.length > 0 && (
        <div>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>Vendors on this property</h3>
          <div className="chips">{property.vendors.map((v) => <span key={v.id} className="chip">{v.name}</span>)}</div>
        </div>
      )}
    </Sheet>
  );
}

export default function Properties() {
  const { data, error, loading, reload, setData } = useResource('/api/properties');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data || []).filter((p) => !q || `${p.name} ${p.address} ${p.vendors.map((v) => v.name).join(' ')}`.toLowerCase().includes(q));
  }, [data, query]);

  if (error) return <LoadError error={error} onRetry={reload} />;

  return (
    <>
      <PageHead title="Properties" sub="Job sites vendors order for. Vendor assignments are managed on the Vendors page.">
        <button className="btn btn-primary" onClick={() => setEditing('new')}><Plus size={16} weight="bold" /> Add property</button>
      </PageHead>
      <div className="toolbar"><SearchInput value={query} onChange={setQuery} placeholder="Search address or vendor" /></div>
      {loading ? (
        <Skeleton rows={8} height={44} />
      ) : shown.length === 0 ? (
        <div className="panel"><Empty icon={Buildings} title="No properties match">Clear the search to see every property.</Empty></div>
      ) : (
        <div className="panel">
          <ul className="list">
            {shown.map((p, i) => (
              <li key={p.id} style={i === 0 ? { borderTop: 0 } : undefined}>
                <button className="list-row" onClick={() => setEditing(p)}>
                  <span className="grow">
                    <span className="title" style={p.active ? undefined : { color: 'var(--ink-3)' }}>{p.name}</span>
                    <span className="sub">{p.vendors.length ? p.vendors.map((v) => v.name).join(', ') : 'No vendor assigned'}</span>
                  </span>
                  {!p.active && <span className="badge">Inactive</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {editing && (
        <PropertySheet
          property={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(saved, created) => {
            setData((rows) => (created ? [...rows, saved].sort((a, b) => a.name.localeCompare(b.name)) : rows.map((r) => (r.id === saved.id ? { ...r, ...saved } : r))));
            setEditing(null);
          }}
        />
      )}
    </>
  );
}
