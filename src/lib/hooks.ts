import { useContext, useMemo } from 'react';
import { StoreContext, type StoreValue } from './store';

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

/* ---------------- Selectors ---------------- */

export function useSelectors() {
  const { state } = useStore();

  return useMemo(
    () => ({
      clientById: (id?: string) => state.clients.find((c) => c.id === id),
      invoiceById: (id?: string) => state.invoices.find((i) => i.id === id),
      clientTasks: (id: string) => state.tasks.filter((t) => t.clientId === id),
      clientInvoices: (id: string) => state.invoices.filter((i) => i.clientId === id),
      unbilledTasks: (id: string) =>
        state.tasks.filter((t) => t.clientId === id && t.status === 'logged'),
      hasAnyData:
        state.clients.length > 0 || state.tasks.length > 0 || state.invoices.length > 0,
    }),
    [state],
  );
}
