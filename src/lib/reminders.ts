import { TODAY } from './types';
import { fmtDay } from './format';
import type { AppState, Invoice, ReminderRules, ReminderStep, VoiceCall } from './types';

/*
 * Payment reminders. The schedule is derived from each invoice's due date and
 * the freelancer's rules, so nothing runs in the background: "sent" means the
 * date has passed in the demo calendar. Only manual sends and approvals of the
 * 14-day reminder are stored on the invoice.
 */

export const REMINDER_STEPS: {
  key: ReminderStep;
  offset: number;
  label: string;
  hint: string;
  ask?: boolean;
  isNew?: boolean;
}[] = [
  { key: 'before3', offset: -3, label: '3 days before due', hint: 'Sent automatically with your template.' },
  { key: 'due', offset: 0, label: 'On the due date', hint: 'Sent automatically with your template.' },
  { key: 'over7', offset: 7, label: '7 days overdue', hint: 'Sent automatically with your template.' },
  {
    key: 'over14',
    offset: 14,
    label: '14 days overdue: ask me first',
    hint: 'Your agent drafts a firmer reminder and waits for your OK.',
    ask: true,
  },
  {
    key: 'call21',
    offset: 21,
    label: '21 days overdue: voice call, ask me first',
    hint: 'Always asks before calling. Calls are made by an AI assistant.',
    ask: true,
    isNew: true,
  },
];

/** The voice call is off until the freelancer turns it on. */
export const DEFAULT_RULES: ReminderRules = {
  before3: true,
  due: true,
  over7: true,
  over14: true,
  call21: false,
};

export const DEFAULT_TEMPLATE =
  'Hi {client}, a friendly reminder that invoice {number} for {amount} is due on {due}. ' +
  'You can reply to this email if anything is unclear. Thank you!';

export function rulesOf(state: AppState): ReminderRules {
  // Merge, so rules saved before a step existed read as that step's default.
  return { ...DEFAULT_RULES, ...state.reminderRules };
}

/** Two working days on from `date`, skipping weekends. */
export function addWorkingDays(date: string, days: number): string {
  let d = date;
  let left = days;
  while (left > 0) {
    d = addDays(d, 1);
    const day = new Date(d + 'T00:00:00Z').getUTCDay();
    if (day !== 0 && day !== 6) left -= 1;
  }
  return d;
}

/** When the voice call would be booked if approved today. */
export function callDayFrom(today: string): string {
  return addWorkingDays(today, 2);
}

export function addDays(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export type TimelineState = 'done' | 'needs-ok' | 'next' | 'scheduled' | 'paused' | 'skipped';

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
  call21: 'Voice call, 21 days overdue',
};

const STEP_UPCOMING: Record<ReminderStep, string> = {
  before3: '3 days before due',
  due: 'On the due date',
  over7: '7 days overdue',
  over14: '14 days overdue, needs your OK',
  call21: '21 days overdue: voice call, needs your OK',
};

/** How a finished call went, in the agent's words. */
export function outcomeText(call: VoiceCall): string {
  if (call.outcome === 'promised')
    return `Voice call: promised to pay by ${fmtDay(call.payDate ?? call.callDate)}`;
  if (call.outcome === 'no-answer') return 'Voice call: no answer, voicemail left';
  return 'Voice call: disputed, handed to you';
}

/**
 * The voice call comes after the firmer email. It stays upcoming until that
 * email is approved, so only one thing ever waits on the freelancer at a time.
 */
function pushCallEntry(entries: TimelineEntry[], invoice: Invoice, rules: ReminderRules, date: string) {
  const call = invoice.call;
  if (call?.status === 'scheduled') {
    entries.push({ date: call.callDate, label: `Voice call booked, ${fmtDay(call.callDate)}, 10:00 to 12:00`, state: 'next', step: 'call21' });
    return;
  }
  if (call?.status === 'done') {
    entries.push({ date: call.callDate, label: outcomeText(call), state: 'done', step: 'call21' });
    return;
  }
  if (call?.status === 'skipped') {
    entries.push({ date, label: 'Voice call skipped by you', state: 'skipped', step: 'call21' });
    return;
  }
  if (invoice.status === 'paid') return;
  const emailDone = !rules.over14 || (invoice.reminders ?? []).some((l) => l.step === 'over14');
  if (emailDone && date <= TODAY && !invoice.remindersPaused) {
    entries.push({ date, label: 'Voice call ready, waiting for your OK', state: 'needs-ok', step: 'call21' });
  } else {
    entries.push({
      date,
      label: STEP_UPCOMING.call21,
      state: invoice.remindersPaused ? 'paused' : 'scheduled',
      step: 'call21',
    });
  }
}

/** What the agent sent for an invoice and what comes next. Empty for drafts. */
export function reminderTimeline(invoice: Invoice, rules: ReminderRules): TimelineEntry[] {
  if (invoice.status === 'draft') return [];
  const logs = invoice.reminders ?? [];
  const entries: TimelineEntry[] = [
    { date: invoice.approvedAt ?? invoice.issueDate, label: 'Invoice sent', state: 'done' },
  ];

  for (const step of REMINDER_STEPS) {
    if (!rules[step.key]) continue;
    const date = addDays(invoice.dueDate, step.offset);
    if (date < invoice.issueDate) continue;
    if (step.key === 'call21') {
      pushCallEntry(entries, invoice, rules, date);
      continue;
    }
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
