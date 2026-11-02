import { useCallback, useEffect, useState } from 'react';
import {
  Buildings,
  ChartBar,
  ClipboardText,
  Lightbulb,
  ListChecks,
  Robot,
  ShoppingCartSimple,
  Storefront,
  Tag
} from '@phosphor-icons/react';
import { api } from './lib/api';
import { useI18n } from './lib/i18n';
import Shell from './components/Shell';
import { Skeleton, ToastProvider } from './components/ui';
import Login from './pages/Login';
import Overview from './pages/admin/Overview';
import Requests from './pages/admin/Requests';
import Suggestions from './pages/admin/Suggestions';
import Catalog from './pages/admin/Catalog';
import Vendors from './pages/admin/Vendors';
import Properties from './pages/admin/Properties';
import Assistant from './pages/admin/Assistant';
import OrderMaterials from './pages/vendor/OrderMaterials';
import MyRequests from './pages/vendor/MyRequests';
import Suggest from './pages/vendor/Suggest';

const readPage = () => window.location.hash.replace(/^#\/?/, '').split('?')[0];

function useActivity(enabled) {
  const [activity, setActivity] = useState(null);
  const refresh = useCallback(() => {
    if (!enabled) return;
    api('/api/activity').then(setActivity).catch(() => {});
  }, [enabled]);
  useEffect(() => {
    refresh();
    if (!enabled) return undefined;
    const timer = setInterval(refresh, 60_000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [enabled, refresh]);
  return [activity, refresh];
}

function Workspace({ user, onSignOut }) {
  const { t } = useI18n();
  const isAdmin = user.role === 'admin';
  const [page, setPage] = useState(readPage);
  const [handoff, setHandoff] = useState(null);
  const [activity, refreshActivity] = useActivity(isAdmin);

  useEffect(() => {
    const onHash = () => setPage(readPage());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const counts = activity?.counts || {};
  const nav = isAdmin
    ? [
        { id: 'overview', label: 'Overview', icon: ChartBar, mobile: true },
        { id: 'requests', label: 'Requests', icon: ClipboardText, count: counts.submitted, mobile: true },
        { id: 'assistant', label: 'Buying assistant', short: 'Assistant', icon: Robot, mobile: true },
        { id: 'catalog', label: 'Catalogue', icon: Tag, mobile: true },
        { id: 'suggestions', label: 'Suggestions', icon: Lightbulb, count: counts.suggestions, divider: true },
        { id: 'vendors', label: 'Vendors', icon: Storefront, count: counts.signups },
        { id: 'properties', label: 'Properties', icon: Buildings }
      ]
    : [
        { id: 'order', label: t('newRequest'), short: t('newRequest').split(' ')[0], icon: ShoppingCartSimple, mobile: true },
        { id: 'my-requests', label: t('myRequests'), icon: ListChecks, mobile: true },
        { id: 'suggest', label: t('suggest'), short: t('suggest').split(' ')[0], icon: Lightbulb, mobile: true }
      ];

  const active = nav.some((n) => n.id === page) ? page : nav[0].id;

  const navigate = useCallback((id, payload = null) => {
    setHandoff(payload);
    window.location.hash = `/${id}`;
    setPage(id);
    window.scrollTo({ top: 0 });
  }, []);

  const shared = { user, navigate, refreshActivity };
  const screens = {
    overview: <Overview {...shared} activity={activity} />,
    requests: <Requests {...shared} />,
    assistant: <Assistant {...shared} draft={handoff?.draft} />,
    catalog: <Catalog {...shared} />,
    suggestions: <Suggestions {...shared} />,
    vendors: <Vendors {...shared} />,
    properties: <Properties {...shared} />,
    order: <OrderMaterials {...shared} />,
    'my-requests': <MyRequests {...shared} />,
    suggest: <Suggest {...shared} />
  };

  return (
    <Shell user={user} nav={nav} page={active} onNavigate={navigate} onSignOut={onSignOut} activity={activity}>
      {screens[active]}
    </Shell>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    api('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
    const expire = () => setUser(null);
    window.addEventListener('session-expired', expire);
    return () => window.removeEventListener('session-expired', expire);
  }, []);

  const signOut = async () => {
    await api('/api/auth/logout', { method: 'POST', body: {} }).catch(() => {});
    window.location.hash = '';
    setUser(null);
  };

  return (
    <ToastProvider>
      {user === undefined ? (
        <div style={{ padding: 32, maxWidth: 480, margin: '0 auto' }}>
          <Skeleton rows={4} />
        </div>
      ) : user ? (
        <Workspace key={user.id} user={user} onSignOut={signOut} />
      ) : (
        <Login onSignedIn={setUser} />
      )}
    </ToastProvider>
  );
}
