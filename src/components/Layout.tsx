import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Icon, type IconName } from './Icon';
import { useSelectors, useStore } from '../lib/hooks';

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'grid' },
  { to: '/clients', label: 'Clients', icon: 'users' },
  { to: '/agreements', label: 'Agreements', icon: 'sign' },
  { to: '/tasks', label: 'Tasks', icon: 'check' },
  { to: '/invoices', label: 'Invoices', icon: 'file' },
];

export function Layout() {
  const { dispatch, toast } = useStore();
  const { hasAnyData } = useSelectors();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="brand">
          <div className="brand-mark">C</div>
          <div className="brand-name">CountInvoice</div>
        </div>

        <div className="nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="nav-spacer" />

        <div className="nav">
          <NavLink
            to="/settings"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon name="gear" />
            <span>Settings</span>
          </NavLink>
        </div>

        <div className="sidebar-footer">
          <div className="avatar">FL</div>
          <div>
            <div className="who">Your workspace</div>
            <button
              className="reset-link"
              onClick={() => {
                dispatch({ type: 'loadSample' });
                toast('Sample data loaded');
                navigate('/dashboard');
              }}
            >
              Load sample data
            </button>
            {hasAnyData ? (
              <>
                {' · '}
                <button
                  className="reset-link"
                  onClick={() => {
                    dispatch({ type: 'clear' });
                    toast('Workspace cleared');
                    navigate('/dashboard');
                  }}
                >
                  Clear
                </button>
              </>
            ) : null}
            {' · '}
            <button
              className="reset-link"
              onClick={() => {
                dispatch({ type: 'signOut' });
                navigate('/welcome');
              }}
            >
              Sign-in screen
            </button>
          </div>
        </div>
      </div>

      <div className="main">
        <Outlet />
      </div>
    </div>
  );
}
