import React from 'react';
import { 
  Building2, 
  Home, 
  Building, 
  Package, 
  FileText, 
  Users, 
  LogOut 
} from 'lucide-react';
import { useI18n } from '../lib/i18n';

export default function Sidebar({ user, activeTab, setActiveTab, onLogout }) {
  const { t } = useI18n();
  const isAdmin = user?.role === 'admin';

  return (
    <aside className="sidebar">
      <div>
        {/* Logo */}
        <div className="sidebar-logo">
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--primary-blue)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Building2 size={22} />
          </div>
          <span className="sidebar-text">EstateFlow</span>
        </div>

        {/* General Nav */}
        <div className="sidebar-section-title">Navigation</div>
        <ul className="nav-list">
          <li
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <Home size={18} />
            <span className="sidebar-text">{t('dashboard')}</span>
          </li>

          <li
            className={`nav-item ${activeTab === 'properties' ? 'active' : ''}`}
            onClick={() => setActiveTab('properties')}
          >
            <Building size={18} />
            <span className="sidebar-text">{t('properties')}</span>
          </li>

          {/* Admin Specific Sidebar Items */}
          {isAdmin && (
            <>
              <li
                className={`nav-item ${activeTab === 'requests' ? 'active' : ''}`}
                onClick={() => setActiveTab('requests')}
              >
                <FileText size={18} />
                <span className="sidebar-text">{t('materialRequests')}</span>
              </li>

              <li
                className={`nav-item ${activeTab === 'contractors' ? 'active' : ''}`}
                onClick={() => setActiveTab('contractors')}
              >
                <Users size={18} />
                <span className="sidebar-text">{t('contractors')}</span>
              </li>

              <li
                className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => setActiveTab('products')}
              >
                <Package size={18} />
                <span className="sidebar-text">{t('masterProductCatalog')}</span>
              </li>
            </>
          )}
        </ul>
      </div>

      {/* Logout */}
      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
        <button
          onClick={onLogout}
          className="nav-item"
          style={{ width: '100%', border: 'none', background: 'transparent', color: '#dc2626' }}
        >
          <LogOut size={18} />
          <span className="sidebar-text">{t('logout')}</span>
        </button>
      </div>
    </aside>
  );
}
