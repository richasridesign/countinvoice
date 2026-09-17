import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { seedEmpty, seedSample } from './data';
import { DB_KEY, TODAY, WORKING_DATE } from './types';
import type { AppState, Client, Invoice, Task } from './types';

/* ---------------- Persistence ---------------- */

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (!parsed.freelancer) parsed.freelancer = { country: 'Portugal' };
      return parsed;
    }
  } catch {
    // Private browsing, blocked site data, or corrupt JSON — fall through.
  }
  return seedEmpty();
}

/* ---------------- Actions ---------------- */

export type Action =
  | { type: 'onboard' }
  | { type: 'signOut' }
  | { type: 'loadSample' }
  | { type: 'clear' }
  | { type: 'setCountry'; country: string }
  | { type: 'addClient'; client: Omit<Client, 'id' | 'currency' | 'status'> }
  | { type: 'updateClient'; id: string; patch: Partial<Client> }
  | { type: 'deleteClient'; id: string }
  | { type: 'shareAgreement'; id: string }
  | { type: 'signAgreement'; id: string; signatureName: string }
  | { type: 'addTask'; task: Omit<Task, 'id' | 'status'> }
  | { type: 'generateInvoice'; clientId: string }
  | { type: 'setInvoiceStatus'; id: string; status: Invoice['status'] };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'onboard':
      return { ...state, onboarded: true };

    case 'signOut':
      return { ...state, onboarded: false };

    case 'loadSample':
      return { ...seedSample(), onboarded: state.onboarded };

    case 'clear':
      return { ...seedEmpty(), onboarded: state.onboarded };

    case 'setCountry':
      return { ...state, freelancer: { ...state.freelancer, country: action.country } };

    case 'addClient': {
      const id = `c${state.seq}`;
      const client: Client = {
        ...action.client,
        id,
        currency: 'EUR',
        status: 'draft',
      };
      return { ...state, clients: [...state.clients, client], seq: state.seq + 1 };
    }

    case 'updateClient':
      return {
        ...state,
        clients: state.clients.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)),
      };

    case 'deleteClient':
      return {
        ...state,
        clients: state.clients.filter((c) => c.id !== action.id),
        tasks: state.tasks.filter((t) => t.clientId !== action.id),
        invoices: state.invoices.filter((i) => i.clientId !== action.id),
      };

    case 'shareAgreement':
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === action.id ? { ...c, status: 'sent', agreementSentAt: TODAY } : c,
        ),
      };

    case 'signAgreement':
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === action.id
            ? {
                ...c,
                status: 'active',
                agreementSignedAt: TODAY,
                signatureName: action.signatureName,
              }
            : c,
        ),
      };

    case 'addTask': {
      const task: Task = { ...action.task, id: `t${state.seq}`, status: 'logged' };
      return { ...state, tasks: [...state.tasks, task], seq: state.seq + 1 };
    }

    case 'generateInvoice': {
      const client = state.clients.find((c) => c.id === action.clientId);
      if (!client) return state;

      const unbilled = state.tasks.filter(
        (t) => t.clientId === action.clientId && t.status === 'logged',
      );
      if (unbilled.length === 0) return state;

      const seq = state.seq;
      const invoice: Invoice = {
        id: `i${seq}`,
        // Sequence starts at 1000, so the counter doubles as the invoice number.
        number: `INV-${seq}`,
        clientId: action.clientId,
        issueDate: WORKING_DATE,
        dueDate: '2026-09-22',
        status: 'draft',
        items: unbilled.map((t) => ({ desc: t.title, qty: t.hours, rate: client.rate })),
      };

      const billed = new Set(unbilled.map((t) => t.id));
      return {
        ...state,
        invoices: [...state.invoices, invoice],
        tasks: state.tasks.map((t) => (billed.has(t.id) ? { ...t, status: 'invoiced' } : t)),
        seq: seq + 1,
      };
    }

    case 'setInvoiceStatus':
      return {
        ...state,
        invoices: state.invoices.map((i) =>
          i.id === action.id ? { ...i, status: action.status } : i,
        ),
      };

    default:
      return state;
  }
}

/* ---------------- Context ---------------- */

export interface StoreValue {
  state: AppState;
  dispatch: (action: Action) => void;
  toast: (msg: string) => void;
}

export const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, loadState);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  // Persist on every change. Wrapped because storage can throw when blocked.
  useEffect(() => {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(state));
    } catch {
      // Non-fatal: the app stays usable for this session.
    }
  }, [state]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToastMsg(null), 2200);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const value = useMemo(() => ({ state, dispatch, toast }), [state, toast]);

  return (
    <StoreContext.Provider value={value}>
      {children}
      <div id="toast" className={toastMsg ? 'show' : ''}>
        {toastMsg}
      </div>
    </StoreContext.Provider>
  );
}
