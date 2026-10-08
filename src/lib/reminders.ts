import { TODAY } from './types';
import type { AppState, Invoice, ReminderRules, ReminderStep } from './types';

/*
 * Payment reminders. The schedule is derived from each invoice's due date and
 * the freelancer's rules, so nothing runs in the background: "sent" means the
 * date has passed in the demo calendar. Only manual sends and approvals of the
 * 14-day reminder are stored on the invoice.
 */

export const REMINDER_STEPS: { key: ReminderStep; offset: number; label: string; ask?: boolean }[] = [
  { key: 'before3', offset: -3, label: '3 days before due' },
  { key: 'due', offset: 0, label: 'On the due date' },
  { key: 'over7', offset: 7, label: '7 days overdue' },
  { key: 'over14', offset: 14, label: '14 days overdue: ask me first', ask: true },
];

export const DEFAULT_RULES: ReminderRules = { before3: true, due: true, over7: true, over14: true };

export const DEFAULT_TEMPLATE =
  'Hi {client}, a friendly reminder that invoice {number} for {amount} is due on {due}. ' +
  'You can reply to this email if anything is unclear. Thank you!';

export function rulesOf(state: AppState): ReminderRules {
  return state.reminderRules ?? DEFAULT_RULES;
}

export function addDays(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export type TimelineState = 'done' | 'needs-ok' | 'next' | 'scheduled' | 'paused';

export interface TimelineEntry {
  date: string;
  label: string;
  state: TimelineState;
  step?: ReminderStep;
}

const STEP_SENT: Record<ReminderStep, string> = {
  before3: 'Reminder sent, 3 days before due (auto)',
  due: 'Reminder sent on the due date (auto)',
  over7: 'Reminder sent, 7 days overdue (auto)',
  over14: 'Firmer reminder sent, 14 days overdue (you approved)',
};

const STEP_UPCOMING: Record<ReminderStep, string> = {
  before3: '3 days before due',
  due: 'On the due date',
  over7: '7 days overdue',
  over14: '14 days overdue, needs your OK',
};

/** What the agent sent for an invoice and what comes next. Empty for drafts. */
export function reminderTimeline(invoice: Invoice, rules: ReminderRules): TimelineEntry[] {
  if (invoice.status === 'draft') return [];
  const logs = invoice.reminders ?? [];
  const entries: TimelineEntry[] = [
    { date: invoice.issueDate, label: 'Invoice sent', state: 'done' },
  ];

  for (const step of REMINDER_STEPS) {
    if (!rules[step.key]) continue;
    const date = addDays(invoice.dueDate, step.offset);
    if (date < invoice.issueDate) continue;
    const approved = logs.find((l) => l.step === step.key);

    if (approved) {
      entries.push({ date: approved.date, label: STEP_SENT[step.key], state: 'done', step: step.key });
    } else if (date <= TODAY) {
      if (invoice.status === 'paid') {
        if (!step.ask) entries.push({ date, label: STEP_SENT[step.key], state: 'done', step: step.key });
      } else if (step.ask) {
        entries.push({ date, label: 'Firmer reminder drafted, waiting for your OK', state: 'needs-ok', step: step.key });
      } else {
        entries.push({ date, label: STEP_SENT[step.key], state: 'done', step: step.key });
      }
    } else if (invoice.status !== 'paid') {
      entries.push({
        date,
        label: STEP_UPCOMING[step.key],
        state: invoice.remindersPaused ? 'paused' : 'scheduled',
        step: step.key,
      });
    }
  }

  for (const log of logs) {
    if (log.step === 'manual') entries.push({ date: log.date, label: 'Reminder sent by you', state: 'done' });
  }

  entries.sort((a, b) => a.date.localeCompare(b.date));
  const next = entries.find((e) => e.state === 'scheduled');
  if (next) next.state = 'next';
  return entries;
}

/** Summary for the dashboard "Getting paid" strip. */
export function gettingPaid(state: AppState) {
  const rules = rulesOf(state);
  const open = state.invoices.filter((i) => i.status === 'sent' || i.status === 'overdue');
  let nextDate: string | null = null;
  const needsOk: Invoice[] = [];
  for (const inv of open) {
    const t = reminderTimeline(inv, rules);
    if (t.some((e) => e.state === 'needs-ok')) needsOk.push(inv);
    const n = t.find((e) => e.state === 'next');
    if (n && (!nextDate || n.date < nextDate)) nextDate = n.date;
  }
  return { open, needsOk, nextDate };
}
