import { useState } from 'react';
import { Translate } from '@phosphor-icons/react';
import { api } from '../lib/api';
import { toggleLanguage, useI18n } from '../lib/i18n';
import { BrandMark, ThemeSwitch } from '../components/Shell';
import { Field } from '../components/ui';

export default function Login({ onSignedIn }) {
  const { t } = useI18n();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', companyName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const body = mode === 'login' ? { email: form.email, password: form.password } : form;
      const data = await api(`/api/auth/${mode === 'login' ? 'login' : 'register'}`, { method: 'POST', body });
      onSignedIn(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <section className="auth-side">
        <div className="brand">
          <BrandMark />
          <div>
            MatFlow
            <small>Materials · Properties · Progress</small>
          </div>
        </div>
        <div className="auth-pitch">
          <h1>Every material request, from the job site to the cart.</h1>
          <p>Vendors order for their assigned properties. The office approves, compares prices and places the order in one place.</p>
        </div>
        <ol className="auth-steps">
          <li><span className="num">01</span> Vendor picks the property and the materials</li>
          <li><span className="num">02</span> The office reviews prices and approves</li>
          <li><span className="num">03</span> Approved items go straight to an Amazon cart</li>
        </ol>
      </section>

      <main className="auth-main">
        <div className="auth-card">
          <div className="lang-row">
            <ThemeSwitch />
            <button className="btn btn-ghost btn-sm" onClick={toggleLanguage}><Translate size={16} /> {t('language')}</button>
          </div>
          <div>
            <h2>{mode === 'login' ? t('welcomeBack') : t('register')}</h2>
            <p>{mode === 'login' ? t('signInSub') : t('registerSub')}</p>
          </div>
          <form className="form-grid" onSubmit={submit} noValidate={false}>
            {mode === 'register' && (
              <>
                <Field label={t('yourName')}>
                  <input className="input" value={form.name} onChange={set('name')} autoComplete="name" required maxLength={120} />
                </Field>
                <Field label={t('company')} hint={t('companyHint')}>
                  <input className="input" value={form.companyName} onChange={set('companyName')} autoComplete="organization" maxLength={160} />
                </Field>
              </>
            )}
            <Field label={t('email')}>
              <input className="input" type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
            </Field>
            <Field label={t('password')} hint={mode === 'register' ? t('passwordHint') : undefined}>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={set('password')}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={mode === 'register' ? 10 : undefined}
                required
              />
            </Field>
            {error && <div className="form-error" role="alert">{error}</div>}
            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? '…' : mode === 'login' ? t('signIn') : t('register')}
            </button>
          </form>
          <p className="auth-switch">
            {mode === 'login' ? t('noAccount') : t('haveAccount')}{' '}
            <button className="text-link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
              {mode === 'login' ? t('register') : t('signIn')}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
