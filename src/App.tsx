import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AgreementDetail, Agreements } from './pages/Agreements';
import { ClientDetail } from './pages/ClientDetail';
import { ClientForm } from './pages/ClientForm';
import { Clients } from './pages/Clients';
import { Dashboard } from './pages/Dashboard';
import { InvoiceDetail, Invoices } from './pages/Invoices';
import { Settings } from './pages/Settings';
import { Sign } from './pages/Sign';
import { TaskForm, Tasks } from './pages/Tasks';
import { Welcome } from './pages/Welcome';
import { useStore } from './lib/hooks';

/** Sends first-time visitors to the sign-in screen before the app shell. */
function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const { state } = useStore();
  return state.onboarded ? <>{children}</> : <Navigate to="/welcome" replace />;
}

export function App() {
  const { state } = useStore();

  return (
    <Routes>
      <Route path="/welcome" element={<Welcome />} />

      {/* Client-facing signature pages live outside the app shell. */}
      <Route path="/sign/:id" element={<Sign />} />
      <Route path="/sign/:id/preview" element={<Sign preview />} />

      <Route
        element={
          <RequireOnboarding>
            <Layout />
          </RequireOnboarding>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/new" element={<ClientForm />} />
        <Route path="/clients/:id" element={<ClientDetail />} />
        <Route path="/clients/:id/edit" element={<ClientForm />} />
        <Route path="/agreements" element={<Agreements />} />
        <Route path="/agreement/:id" element={<AgreementDetail />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/tasks/new" element={<TaskForm />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route
        path="*"
        element={<Navigate to={state.onboarded ? '/dashboard' : '/welcome'} replace />}
      />
    </Routes>
  );
}
