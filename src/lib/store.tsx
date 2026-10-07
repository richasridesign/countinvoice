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
import type { AgreementFile, AppState, Client, ClientProposal, Invoice, Task } from './types';
import { clearFiles, deleteFile } from './files';

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
  | {
      type: 'addClient';
      client: Omit<Client, 'id' | 'currency' | 'status'>;
      agreementFile?: AgreementFile;
      signed?: SignedOutside;
    }
  | { type: 'updateClient'; id: string; patch: Partial<Client> }
  | { type: 'deleteClient'; id: string }
  | { type: 'shareAgreement'; id: string }
  | { type: 'signAgreement'; id: string; signatureName: string }
  | { type: 'attachAgreement'; id: string; file: AgreementFile; signed?: SignedOutside }
  | { type: 'removeAgreementFile'; id: string }
  | { type: 'proposeClientAgreement'; id: string; proposal: ClientProposal }
  | { type: 'acceptClientProposal'; id: string }
  | { type: 'declineClientProposal'; id: string }
  | { type: 'addTask'; task: Omit<Task, 'id' | 'status'> }
  | { type: 'generateInvoice'; clientId: string }
  | { type: 'setInvoiceStatus'; id: string; status: Invoice['status'] };

/** An uploaded agreement that was signed before it reached CountInvoice. */
export interface SignedOutside {
  date: string;
  signatureName?: string;
}

/** Status fields for an uploaded agreement, signed already or not. */
function uploadedAgreement(file: AgreementFile, signed?: SignedOutside): Partial<Client> {
  return signed
    ? {
        agreementFile: file,
        status: 'active',
        signedOutside: true,
        agreementSignedAt: signed.date,
        signatureName: signed.signatureName || undefined,
      }
    : { agreementFile: file, status: 'draft' };
}

function patchClient(state: AppState, id: string, fn: (c: Client) => Client): AppState {
  return { ...state, clients: state.clients.map((c) => (c.id === id ? fn(c) : c)) };
}

/** Stored file ids that an action is about to orphan. */
function orphanedFiles(state: AppState, action: Action): string[] {
  const c = 'id' in action ? state.clients.find((x) => x.id === action.id) : undefined;
  switch (action.type) {
    case 'deleteClient':
      return [c?.agreementFile?.id, c?.clientProposal?.id].filter(Boolean) as string[];
    case 'removeAgreementFile':
      return c?.agreementFile?.id ? [c.agreementFile.id] : [];
    case 'declineClientProposal':
      return c?.clientProposal?.id ? [c.clientProposal.id] : [];
    case 'attachAgreement':
      return c?.agreementFile?.id ? [c.agreementFile.id] : [];
    default:
      return [];
  }
}

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
        ...(action.agreementFile ? uploadedAgreement(action.agreementFile, action.signed) : {}),
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

    case 'attachAgreement':
      return patchClient(state, action.id, (c) => ({
        ...c,
        ...uploadedAgreement(action.file, action.signed),
      }));

    case 'removeAgreementFile':
      return patchClient(state, action.id, (c) =>
        c.status === 'draft' ? { ...c, agreementFile: undefined } : c,
      );

    case 'proposeClientAgreement':
      return patchClient(state, action.id, (c) => ({ ...c, clientProposal: action.proposal }));

    case 'acceptClientProposal':
      return patchClient(state, action.id, (c) => {
        if (!c.clientProposal) return c;
        const { note: _note, ...file } = c.clientProposal;
        return {
          ...c,
          agreementFile: { ...file, providedBy: 'client' },
          clientProposal: undefined,
          status: 'sent',
          agreementSentAt: TODAY,
        };
      });

    case 'declineClientProposal':
      return patchClient(state, action.id, (c) => ({ ...c, clientProposal: undefined }));

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
  const [state, rawDispatch] = useReducer(reducer, null, loadState);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Uploaded files live outside app state, so clean them up alongside it.
  const dispatch = useCallback((action: Action) => {
    const stale =
      action.type === 'clear' || action.type === 'loadSample'
        ? null
        : orphanedFiles(stateRef.current, action);
    if (stale === null) clearFiles().catch(() => {});
    else stale.forEach((id) => deleteFile(id).catch(() => {}));
    rawDispatch(action);
  }, []);
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

  const value = useMemo(() => ({ state, dispatch, toast }), [state, dispatch, toast]);

  return (
    <StoreContext.Provider value={value}>
      {children}
      <div id="toast" className={toastMsg ? 'show' : ''}>
        {toastMsg}
      </div>
    </StoreContext.Provider>
  );
}
