import type { AppState, Client, Invoice, Task } from './types';

export function seedEmpty(): AppState {
  return {
    onboarded: false,
    freelancer: { country: 'Portugal' },
    clients: [],
    tasks: [],
    invoices: [],
    seq: 1000,
  };
}

const sampleClients: Client[] = [
  {
    id: 'c1',
    name: 'Lumen Studio',
    email: 'hi@lumenstudio.co',
    country: 'Germany',
    city: 'Berlin',
    type: 'Retainer',
    rate: 65,
    currency: 'EUR',
    status: 'active',
    milestones: [
      { label: 'Upfront', pct: 50 },
      { label: 'On delivery', pct: 50 },
    ],
    notes: 'Ongoing brand & product design retainer, ~15 hrs/month.',
  },
  {
    id: 'c2',
    name: 'Northwind Analytics',
    email: 'accounts@northwindanalytics.nl',
    country: 'Netherlands',
    city: 'Amsterdam',
    type: 'Project',
    rate: 4200,
    currency: 'EUR',
    status: 'overdue',
    milestones: [
      { label: 'Project kickoff', pct: 50 },
      { label: 'Final delivery', pct: 50 },
    ],
    notes: 'Fixed-fee dashboard redesign, delivered in two milestones.',
  },
  {
    id: 'c3',
    name: 'Cedar & Finch',
    email: 'joana@cedarfinch.pt',
    country: 'Portugal',
    city: 'Lisbon',
    type: 'Retainer',
    rate: 48,
    currency: 'EUR',
    status: 'draft',
    milestones: [
      { label: 'Upfront', pct: 40 },
      { label: 'On delivery', pct: 60 },
    ],
    notes: 'New client — agreement drafted, awaiting signature.',
  },
];

const sampleTasks: Task[] = [
  { id: 't1', clientId: 'c1', title: 'Homepage redesign — round 2', date: '2026-08-25', hours: 4, status: 'invoiced' },
  { id: 't2', clientId: 'c1', title: 'Design system: button & form states', date: '2026-08-28', hours: 3.5, status: 'invoiced' },
  { id: 't3', clientId: 'c1', title: 'Client review call + notes', date: '2026-09-02', hours: 1, status: 'logged' },
  { id: 't4', clientId: 'c1', title: 'Onboarding email templates', date: '2026-09-04', hours: 2.5, status: 'logged' },
  { id: 't5', clientId: 'c2', title: 'Milestone 1 — kickoff & wireframes', date: '2026-07-14', hours: 0, status: 'invoiced' },
  { id: 't6', clientId: 'c2', title: 'Milestone 2 — final delivery', date: '2026-08-10', hours: 0, status: 'invoiced' },
  { id: 't7', clientId: 'c3', title: 'Kickoff call & scope notes', date: '2026-09-05', hours: 1, status: 'logged' },
];

const sampleInvoices: Invoice[] = [
  {
    id: 'i1',
    number: 'INV-1001',
    clientId: 'c1',
    issueDate: '2026-08-26',
    dueDate: '2026-09-09',
    status: 'paid',
    items: [
      { desc: 'Homepage redesign — round 2', qty: 4, rate: 65 },
      { desc: 'Design system: button & form states', qty: 3.5, rate: 65 },
    ],
  },
  {
    id: 'i2',
    number: 'INV-1002',
    clientId: 'c2',
    issueDate: '2026-08-11',
    dueDate: '2026-08-25',
    status: 'overdue',
    items: [{ desc: 'Milestone 2 of 2 — final delivery', qty: 1, rate: 2100 }],
  },
  {
    id: 'i3',
    number: 'INV-1003',
    clientId: 'c2',
    issueDate: '2026-07-15',
    dueDate: '2026-07-29',
    status: 'paid',
    items: [{ desc: 'Milestone 1 of 2 — kickoff & wireframes', qty: 1, rate: 2100 }],
  },
];

export function seedSample(): AppState {
  return {
    onboarded: false,
    freelancer: { country: 'Portugal' },
    // Structured-clone so edits in the app never mutate these module constants.
    clients: structuredClone(sampleClients),
    tasks: structuredClone(sampleTasks),
    invoices: structuredClone(sampleInvoices),
    seq: 1004,
  };
}
