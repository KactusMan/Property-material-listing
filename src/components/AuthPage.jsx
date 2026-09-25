import React, { useState } from 'react';
import { Building2, Eye, EyeOff } from 'lucide-react';

export default function AuthPage({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const payload = mode === 'register' 
      ? { name, email, password, companyName }
      : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      localStorage.setItem('pm_token', data.token);
      localStorage.setItem('pm_user', JSON.stringify(data.user));

      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left Column (Screenshot 2 Match) */}
      <div className="auth-left">
        <div className="auth-brand-logo">
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'var(--primary-blue)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Building2 size={24} />
          </div>
          <span>EstateFlow</span>
        </div>

        <div className="auth-hero-content">
          <h1 className="auth-hero-title">
            Materials, <span>without the back-and-forth.</span>
          </h1>
          <p className="auth-hero-subtitle">
            A focused materials workflow for properties, contractors, and purchasing teams.
          </p>

        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          © 2026 Property Materials Inc. All rights reserved.
        </div>
      </div>

      {/* Right Column (Screenshot 2 Match) */}
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-header">
            <h2>{mode === 'register' ? 'Create contractor account' : 'Sign in'}</h2>
            <p>Use the account provided by your property materials team.</p>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              border: '1px solid #fecaca',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <>
                <div className="auth-form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="e.g. John Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-form-group">
              <label>Company name</label>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="e.g. Apex Builders LLC"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="auth-form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="auth-input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                placeholder={mode === 'register' ? 'At least 10 characters' : 'Your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-auth-submit"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : (mode === 'register' ? 'Create Account' : 'Sign In to Dashboard')}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
            {mode === 'login' ? (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(''); }}
                  style={{ border: 'none', background: 'transparent', color: 'var(--primary-blue)', fontWeight: '700', cursor: 'pointer' }}
                >
                  Register as Contractor
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  style={{ border: 'none', background: 'transparent', color: 'var(--primary-blue)', fontWeight: '700', cursor: 'pointer' }}
                >
                  Sign In
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
