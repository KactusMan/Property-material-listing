import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Calendar, Globe, FileText, CheckCircle2, Truck, Package, X } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { apiFetch } from '../lib/api';

export default function TopBar({ user, searchTerm, setSearchTerm }) {
  const { t, lang, setLanguage } = useI18n();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const dropdownRef = useRef(null);

  const currentDateStr = new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await apiFetch('/api/requests');
      if (!res.ok) return;
      const data = await res.json();

      const notifs = [];
      data.slice(0, 10).forEach((req) => {
        if (user.role === 'admin') {
          notifs.push({
            id: req.requestId + '-sub',
            title: `New Request from ${req.contractorName}`,
            message: `${req.propertyName} — $${(req.estimatedTotal || 0).toFixed(2)} (${req.items ? req.items.length : 0} items)`,
            time: new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: req.status
          });
        } else {
          notifs.push({
            id: req.requestId + '-' + req.status,
            title: `Request ${req.requestId} Update`,
            message: `Status: ${req.status} for ${req.propertyName}`,
            time: new Date(req.updatedAt || req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: req.status
          });
        }
      });

      setNotifications(notifs);
      setUnreadCount(notifs.length);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleLang = () => {
    setLanguage(lang === 'en' ? 'es' : 'en');
  };

  return (
    <header className="top-header">
      {/* Date Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-muted)' }}>
        <Calendar size={18} color="var(--primary-blue)" />
        <span style={{ textTransform: 'capitalize' }}>{currentDateStr}</span>
      </div>

      {/* Search Bar */}
      <div className="header-search">
        <Search size={18} />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Profile & Controls */}
      <div className="header-right" ref={dropdownRef} style={{ position: 'relative' }}>
        {/* Language Toggle Button */}
        <button
          onClick={toggleLang}
          className="lang-toggle-btn"
          title="Switch Language / Cambiar Idioma"
        >
          <Globe size={16} />
          <span>{lang === 'en' ? '🇺🇸 EN' : '🇪🇸 ES'}</span>
        </button>

        {/* Notification Bell */}
        <button
          onClick={() => {
            setShowNotifications(!showNotifications);
            setUnreadCount(0);
          }}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '1px solid var(--border-color)',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            position: 'relative'
          }}
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              minWidth: '16px',
              height: '16px',
              borderRadius: '10px',
              background: '#dc2626',
              color: 'white',
              fontSize: '0.68rem',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px'
            }}>
              {unreadCount}
            </span>
          )}
        </button>

        {/* Notifications Dropdown Card */}
        {showNotifications && (
          <div style={{
            position: 'absolute',
            top: '50px',
            right: '0',
            width: '340px',
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
            zIndex: 100,
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-slate)'
            }}>
              <span style={{ fontWeight: '800', fontSize: '0.95rem' }}>Activity & Notifications</span>
              <button 
                onClick={() => setShowNotifications(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  No recent activity notifications.
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-light)',
                    transition: 'background 0.2s ease'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-main)' }}>{n.title}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-subdued)' }}>{n.time}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{n.message}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* User Profile */}
        <div className="user-profile-badge">
          <div className="user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={{ textAlign: 'left', lineHeight: '1.2' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)' }}>
              {user?.name || 'User'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              {user?.role === 'admin' ? t('adminRole') : t('contractorRole')}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
