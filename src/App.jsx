import React, { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import ContractorDashboard from './components/ContractorDashboard';
import AdminDashboard from './components/AdminDashboard';
import PropertyCatalog from './components/PropertyCatalog';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'properties' | 'requests' | 'catalog'
  const [globalSearch, setGlobalSearch] = useState('');

  // Check saved session on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('pm_user');
    const token = localStorage.getItem('pm_token');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('pm_user');
        localStorage.removeItem('pm_token');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('pm_user');
    localStorage.removeItem('pm_token');
    setUser(null);
  };

  // If not logged in, render Split-Screen Auth Page (Screenshot 2 Match)
  if (!user) {
    return <AuthPage onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="dashboard-layout">
      {/* Left Sidebar (Screenshot 1 Match) */}
      <Sidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* Top Navigation Header (Screenshot 1 Match) */}
        <TopBar
          user={user}
          searchTerm={globalSearch}
          setSearchTerm={setGlobalSearch}
        />

        {/* Dynamic Content Area */}
        <main className="content-area">
          {activeTab === 'home' && (
            isAdmin ? (
              <AdminDashboard user={user} />
            ) : (
              <ContractorDashboard user={user} />
            )
          )}

          {activeTab === 'properties' && (
            <PropertyCatalog onSelectPropertyForOrder={() => setActiveTab('home')} />
          )}

          {activeTab === 'requests' && (
            isAdmin ? (
              <AdminDashboard user={user} />
            ) : (
              <ContractorDashboard user={user} />
            )
          )}

          {activeTab === 'catalog' && (
            <ContractorDashboard user={user} />
          )}

          {activeTab === 'contractors' && (
            <AdminDashboard user={user} />
          )}
        </main>
      </div>
    </div>
  );
}
