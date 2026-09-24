import React from 'react';
import { Search, Bell, Calendar, User, ChevronDown } from 'lucide-react';

export default function TopBar({ user, searchTerm, setSearchTerm }) {
  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="top-header">
      {/* Date Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-muted)' }}>
        <Calendar size={18} color="var(--primary-blue)" />
        <span>{currentDateStr}</span>
      </div>

      {/* Search Bar */}
      <div className="header-search">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search properties, materials, requests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Profile & Controls */}
      <div className="header-right">
        <button
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
          <span style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--primary-blue)'
          }} />
        </button>

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
              {user?.role === 'admin' ? '👑 Admin' : '🌸 Contractor'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
