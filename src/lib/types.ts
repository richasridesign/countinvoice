/** Demo "today" — the sample data is written relative to this date. */
export const TODAY = '2026-09-09';

/** Date used when logging a new task or issuing a new invoice. */
export const WORKING_DATE = '2026-09-08';

export const DB_KEY = 'countinvoice_prototype_v1';

export type ClientStatus = 'draft' | 'sent' | 'active' | 'overdue';
export type TaskStatus = 'logged' | 'invoiced';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';
export type PillStatus = ClientStatus | TaskStatus | InvoiceStatus;

export type EngagementType = 'Retainer' | 'Project';
export type Currency = 'EUR' | 'USD' | 'GBP';

export interface Milestone {
  label: string;
  pct: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  country: string;
  city: string;
  type: EngagementType;
  rate: number;
  currency: Currency;
  status: ClientStatus;
  milestones: Milestone[];
  notes?: string;
  agreementSentAt?: string;
  agreementSignedAt?: string;
  signatureName?: string;
}

export interface Task {
  id: string;
  clientId: string;
  title: string;
  date: string;
  hours: number;
  status: TaskStatus;
}

export interface InvoiceItem {
  desc: string;
  qty: number;
  rate: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
}

export interface Freelancer {
  country: string;
}

export interface AppState {
  onboarded: boolean;
  freelancer: Freelancer;
  clients: Client[];
  tasks: Task[];
  invoices: Invoice[];
  seq: number;
}

export const COUNTRIES = [
  'Germany',
  'Netherlands',
  'Portugal',
  'France',
  'Spain',
  'Ireland',
  'Other',
] as const;

export interface LawLink {
  label: string;
  url: string;
}

/**
 * Official primary-source links per jurisdiction. A country absent from this
 * map is outside "standard coverage" and triggers a legal-review flag.
 */
export const LAW_LINKS: Record<string, LawLink> = {
  Germany: {
    label: 'German Civil Code (BGB)',
    url: 'https://www.gesetze-im-internet.de/englisch_bgb/',
  },
  Netherlands: {
    label: 'Dutch Civil Code (BW)',
    url: 'https://wetten.overheid.nl/BWBR0005290',
  },
  Portugal: {
    label: 'Diário da República (official gazette)',
    url: 'https://dre.pt/',
  },
  France: {
    label: 'Code civil, via Légifrance',
    url: 'https://www.legifrance.gouv.fr/',
  },
  Spain: {
    label: 'Boletín Oficial del Estado',
    url: 'https://www.boe.es/',
  },
  Ireland: {
    label: 'Irish Statute Book',
    url: 'https://www.irishstatutebook.ie/',
  },
};
