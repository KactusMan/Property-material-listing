import { useMemo, useState } from 'react';
import { Plus, Storefront, UserPlus } from '@phosphor-icons/react';
import { api } from '../../lib/api';
import { ago, date } from '../../lib/format';
import { Empty, Field, LoadError, PageHead, SearchInput, Segmented, Sheet, Skeleton, Switch, useResource, useToast } from '../../components/ui';

const STATUS = {
  active: ['green', 'Active'],
  invited: ['blue', 'Login created'],
  'no-login': ['', 'No login yet'],
  disabled: ['red', 'Disabled']
};

function VendorStatus({ vendor }) {
  const [tone, label] = STATUS[vendor.status];
  return (
    <span style={{ display: 'grid', gap: 2, justifyItems: 'start' }}>
      <span className={`badge ${tone}`}>{label}</span>
      {vendor.status === 'active' && <span className="cell-sub">seen {ago(vendor.account.lastLoginAt)}</span>}
    </span>
  );
}

function SignupQueue({ signups, vendors, onResolved }) {
  const toast = useToast();
  const [links, setLinks] = useState({});
  const [busy, setBusy] = useState('');

  const resolve = async (signup, action) => {
    setBusy(signup.id + action);
    try {
      const body = action === 'approve' ? { contractorId: links[signup.id] || 'new' } : {};
      const vendor = await api(`/api/vendors/signups/${signup.id}/${action}`, { method: 'POST', body });
      toast(action === 'approve' ? `${signup.name} approved and linked to ${vendor.name}.` : `${signup.name}'s sign-up was rejected.`);
      onResolved(signup, action === 'approve' ? vendor : null);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy('');
    }
  };

  return (
    <section className="panel" style={{ marginBottom: 20 }}>
      <div className="panel-head">
        <h2>New sign-ups waiting for approval</h2>
        <span className="count-dot">{signups.length}</span>
      </div>
      <ul className="list">
        {signups.map((s) => (
          <li key={s.id}>
            <div className="list-row" style={{ flexWrap: 'wrap' }}>
              <span className="grow" style={{ minWidth: 200 }}>
                <span className="title">{s.name} · {s.companyName}</span>
                <span className="sub">{s.email} · registered {date(s.createdAt)}</span>
              </span>
              <select className="select" style={{ width: 'auto', maxWidth: 260 }} value={links[s.id] || 'new'} onChange={(e) => setLinks({ ...links, [s.id]: e.target.value })} aria-label={`Vendor record for ${s.name}`}>
                <option value="new">Create a new vendor “{s.companyName}”</option>
                {vendors.map((v) => <option key={v.id} value={v.id}>Link to {v.name}</option>)}
              </select>
              <button className="btn btn-danger btn-sm" disabled={!!busy} onClick={() => resolve(s, 'reject')}>Reject</button>
              <button className="btn btn-primary btn-sm" disabled={!!busy} onClick={() => resolve(s, 'approve')}>Approve</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function VendorSheet({ vendor, properties, onClose, onSaved }) {
  const toast = useToast();
  const isNew = !vendor;
  const [form, setForm] = useState({ name: '', companyName: '', phone: '', trade: '', notes: '', active: true, ...vendor });
  const [assigned, setAssigned] = useState(vendor?.assignedProperties || []);
  const [login, setLogin] = useState({ email: vendor?.account?.email || vendor?.email || '', password: '' });
  const [busy, setBusy] = useState('');
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const run = async (key, fn) => {
    setBusy(key);
    try {
      await fn();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy('');
    }
  };

  const saveAll = () =>
    run('save', async () => {
      let saved = await api(isNew ? '/api/vendors' : `/api/vendors/${vendor.id}`, { method: isNew ? 'POST' : 'PUT', body: form });
      saved = await api(`/api/vendors/${saved.id}/properties`, { method: 'PUT', body: { assignedProperties: assigned } });
      toast(`${saved.name} saved.`);
      onSaved(saved, isNew);
    });

  const createLogin = () =>
    run('login', async () => {
      const saved = await api(`/api/vendors/${vendor.id}/account`, { method: 'POST', body: login });
      toast(`Login ready for ${saved.name}. Share the email and password with them directly.`);
      setLogin({ ...login, password: '' });
      onSaved(saved, false, true);
    });

  const toggleProperty = (id) => setAssigned((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  return (
    <Sheet
      title={isNew ? 'New vendor' : vendor.name}
      sub={isNew ? 'Add a vendor, then assign the properties they work on.' : `${vendor.id} · ${vendor.requestCount} request${vendor.requestCount === 1 ? '' : 's'}`}
      onClose={onClose}
      footer={(
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!!busy || !form.name.trim()} onClick={saveAll}>{busy === 'save' ? 'Saving…' : 'Save vendor'}</button>
        </>
      )}
    >
      <div className="form-grid">
        <Field label="Vendor name"><input className="input" value={form.name} onChange={set('name')} required maxLength={160} /></Field>
        <div className="form-row">
          <Field label="Trade"><input className="input" value={form.trade} onChange={set('trade')} placeholder="Plumbing, HVAC, general" maxLength={80} /></Field>
          <Field label="Phone"><input className="input" type="tel" value={form.phone} onChange={set('phone')} maxLength={40} /></Field>
        </div>
        <Field label="Notes"><textarea className="textarea" value={form.notes} onChange={set('notes')} maxLength={500} /></Field>
        {!isNew && (
          <label className="check-row" style={{ padding: 0 }}>
            <Switch checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Vendor enabled" />
            <span>Enabled. Disabled vendors cannot order, even with a login.</span>
          </label>
        )}
      </div>

      <div>
        <h3 style={{ fontSize: 14, marginBottom: 4 }}>Assigned properties</h3>
        <p className="small muted" style={{ marginBottom: 10 }}>The vendor can only order for these. <span className="num">{assigned.length}</span> selected.</p>
        <div className="check-list">
          {properties.map((p) => (
            <label key={p.id} className="check-row">
              <input type="checkbox" checked={assigned.includes(p.id)} onChange={() => toggleProperty(p.id)} />
              <span>{p.name}{!p.active && <span className="muted"> · inactive</span>}</span>
            </label>
          ))}
        </div>
      </div>

      {!isNew && (
        <div className="panel panel-pad form-grid">
          <div>
            <h3 style={{ fontSize: 14 }}>Login</h3>
            <p className="small muted" style={{ marginTop: 4 }}>
              {vendor.account
                ? vendor.account.lastLoginAt
                  ? `${vendor.account.email} · last signed in ${ago(vendor.account.lastLoginAt)}`
                  : `${vendor.account.email} · has not signed in yet`
                : 'No login yet. Create one and send the details to the vendor, or approve their sign-up when they register.'}
            </p>
          </div>
          <div className="form-row">
            <Field label="Email"><input className="input" type="email" value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} autoComplete="off" /></Field>
            <Field label={vendor.account ? 'New password' : 'Password'} hint="At least 10 characters.">
              <input className="input" type="password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} autoComplete="new-password" />
            </Field>
          </div>
          <button className="btn" disabled={!!busy || !login.email || login.password.length < 10} onClick={createLogin}>
            <UserPlus size={16} /> {busy === 'login' ? 'Saving…' : vendor.account ? 'Reset password' : 'Create login'}
          </button>
        </div>
      )}
    </Sheet>
  );
}

export default function Vendors({ refreshActivity }) {
  const vendors = useResource('/api/vendors');
  const properties = useResource('/api/properties');
  const signups = useResource('/api/vendors/signups');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);

  const list = useMemo(() => vendors.data || [], [vendors.data]);
  const propertyName = useMemo(() => new Map((properties.data || []).map((p) => [p.id, p.name])), [properties.data]);
  const counts = useMemo(() => ({
    active: list.filter((v) => v.status === 'active').length,
    assigned: list.filter((v) => v.assignedProperties.length).length
  }), [list]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list
      .filter((v) => {
        if (filter === 'active' && v.status !== 'active') return false;
        if (filter === 'login' && !v.account) return false;
        if (filter === 'assigned' && !v.assignedProperties.length) return false;
        if (filter === 'disabled' && v.active) return false;
        return !q || `${v.name} ${v.trade} ${v.account?.email || ''}`.toLowerCase().includes(q);
      })
      .sort((a, b) => (b.status === 'active') - (a.status === 'active') || a.name.localeCompare(b.name));
  }, [list, filter, query]);

  const error = vendors.error || properties.error;
  if (error) return <LoadError error={error} onRetry={() => { vendors.reload(); properties.reload(); signups.reload(); }} />;

  const upsert = (saved, created) => {
    vendors.setData((rows) => (created ? [...rows, saved] : rows.map((r) => (r.id === saved.id ? saved : r))));
    properties.reload();
  };

  return (
    <>
      <PageHead title="Vendors" sub={`Everyone you buy for or pay. ${counts.active} have signed in to the portal; ${counts.assigned} have properties assigned.`}>
        <button className="btn btn-primary" onClick={() => setEditing('new')}><Plus size={16} weight="bold" /> Add vendor</button>
      </PageHead>

      {signups.data?.length > 0 && (
        <SignupQueue
          signups={signups.data}
          vendors={list}
          onResolved={(signup, vendor) => {
            signups.setData((rows) => rows.filter((r) => r.id !== signup.id));
            if (vendor) upsert(vendor, !list.some((v) => v.id === vendor.id));
            refreshActivity();
          }}
        />
      )}

      <div className="toolbar">
        <Segmented
          label="Show"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: `All ${list.length || ''}`.trim() },
            { value: 'active', label: 'Active in portal' },
            { value: 'assigned', label: 'Has properties' },
            { value: 'login', label: 'Has login' },
            { value: 'disabled', label: 'Disabled' }
          ]}
        />
        <SearchInput value={query} onChange={setQuery} placeholder="Search vendors" />
      </div>

      {vendors.loading || properties.loading ? (
        <Skeleton rows={8} height={48} />
      ) : shown.length === 0 ? (
        <div className="panel"><Empty icon={Storefront} title="No vendors match">Try another filter or clear the search.</Empty></div>
      ) : (
        <>
          <div className="panel table-wrap table-desktop">
            <table className="table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Portal</th>
                  <th>Assigned properties</th>
                  <th className="right">Requests</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((v) => (
                  <tr key={v.id} className={`clickable ${v.active ? '' : 'inactive'}`} onClick={() => setEditing(v)}>
                    <td>
                      <button className="text-link" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 550, textAlign: 'left' }} onClick={(e) => { e.stopPropagation(); setEditing(v); }}>{v.name}</button>
                      <div className="cell-sub">{[v.trade, v.account?.email].filter(Boolean).join(' · ') || v.id}</div>
                    </td>
                    <td><VendorStatus vendor={v} /></td>
                    <td>
                      {v.assignedProperties.length ? (
                        <div className="chips">
                          {v.assignedProperties.slice(0, 3).map((id) => <span key={id} className="chip">{propertyName.get(id) || id}</span>)}
                          {v.assignedProperties.length > 3 && <span className="chip">+{v.assignedProperties.length - 3}</span>}
                        </div>
                      ) : (
                        <span className="muted small">None</span>
                      )}
                    </td>
                    <td className="right num">{v.requestCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cards">
            {shown.map((v) => (
              <button key={v.id} className="card" onClick={() => setEditing(v)}>
                <div className="card-top">
                  <h3>{v.name}</h3>
                  <VendorStatus vendor={v} />
                </div>
                <div className="card-meta">
                  <span>{v.assignedProperties.length} propert{v.assignedProperties.length === 1 ? 'y' : 'ies'}</span>
                  <span>{v.requestCount} requests</span>
                  {v.trade && <span>{v.trade}</span>}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {editing && (
        <VendorSheet
          key={editing === 'new' ? 'new' : editing.id}
          vendor={editing === 'new' ? null : editing}
          properties={properties.data || []}
          onClose={() => setEditing(null)}
          onSaved={(saved, created, keepOpen) => {
            upsert(saved, created);
            setEditing(keepOpen ? saved : null);
          }}
        />
      )}
    </>
  );
}
