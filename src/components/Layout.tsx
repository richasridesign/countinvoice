import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu } from './Menu';
import { Logo } from './ui';
import { useSelectors, useStore } from '../lib/hooks';

const NAV: { to: string; label: string }[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/clients', label: 'Clients' },
  { to: '/agreements', label: 'Agreements' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/invoices', label: 'Invoices' },
];

/** Settings and the prototype's data controls, behind the workspace button. */
function WorkspaceMenu() {
  const { dispatch, toast } = useStore();
  const { hasAnyData } = useSelectors();
  const navigate = useNavigate();

  return (
    <Menu label="Your workspace" className="appbar-account">
      {(run) => (
        <>
          <button role="menuitem" onClick={run(() => navigate('/settings'))}>
            Settings
          </button>
          <div className="menu-sep" role="separator" />
          <button
            role="menuitem"
            onClick={run(() => {
              dispatch({ type: 'loadSample' });
              toast('Sample data loaded');
              navigate('/dashboard');
            })}
          >
            Load sample data
          </button>
          {hasAnyData ? (
            <button
              role="menuitem"
              onClick={run(() => {
                dispatch({ type: 'clear' });
                toast('Workspace cleared');
                navigate('/dashboard');
              })}
            >
              Clear workspace
            </button>
          ) : null}
          <button
            role="menuitem"
            onClick={run(() => {
              dispatch({ type: 'signOut' });
              navigate('/welcome');
            })}
          >
            Sign-in screen
          </button>
        </>
      )}
    </Menu>
  );
}

export function Layout() {
  return (
    <div className="app-shell">
      <header className="appbar">
        <NavLink to="/dashboard" className="appbar-logo" aria-label="CountInvoice dashboard">
          <Logo />
        </NavLink>
        <nav className="appbar-nav" aria-label="Main">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `appbar-link ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <WorkspaceMenu />
      </header>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
