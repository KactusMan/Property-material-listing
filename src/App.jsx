import React, { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import ContractorDashboard from './components/ContractorDashboard';
import AdminDashboard from './components/AdminDashboard';
import PropertyCatalog from './components/PropertyCatalog';
import { apiFetch } from './lib/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'properties' | 'requests' | 'contractors' | 'products'
  const [selectedPropertyForOrder, setSelectedPropertyForOrder] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');

  // Restore session
  useEffect(() => {
    const savedUser = localStorage.getItem('pm_user');
    const token = localStorage.getItem('pm_token');
    if (savedUser && token) {
      apiFetch('/api/auth/me')
        .then(async (response) => {
          if (!response.ok) throw new Error('Session expired');
          const currentUser = await response.json();
          localStorage.setItem('pm_user', JSON.stringify(currentUser));
          setUser(currentUser);
        })
        .catch(() => {
          localStorage.removeItem('pm_user');
          localStorage.removeItem('pm_token');
        });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('pm_user');
    localStorage.removeItem('pm_token');
    setUser(null);
  };

  const handleSelectPropertyForOrder = (propertyName) => {
    setSelectedPropertyForOrder(propertyName);
    setActiveTab('home');
  };

  // Render auth page if not logged in
  if (!user) {
    return <AuthPage onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="dashboard-layout">
      {/* Left Sidebar */}
      <Sidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'home') setSelectedPropertyForOrder('');
        }}
        onLogout={handleLogout}
      />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* Top Navigation Header */}
        <TopBar
          user={user}
          searchTerm={globalSearch}
          setSearchTerm={setGlobalSearch}
        />

        {/* Dynamic Content Area */}
        <main className="content-area">
          {activeTab === 'home' && (
            isAdmin ? (
              <AdminDashboard user={user} activeTab={activeTab} />
            ) : (
              <ContractorDashboard
                user={user}
                initialSelectedProperty={selectedPropertyForOrder}
              />
            )
          )}

          {activeTab === 'properties' && (
            <PropertyCatalog onSelectPropertyForOrder={handleSelectPropertyForOrder} />
          )}

          {isAdmin && activeTab !== 'home' && activeTab !== 'properties' && (
            <AdminDashboard user={user} activeTab={activeTab} />
          )}
        </main>
      </div>
    </div>
  );
}
