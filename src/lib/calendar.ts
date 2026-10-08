import type { AppState, CalendarDraft } from './types';

/*
 * Simulated calendar import. Connecting "reads" this week's client meetings and
 * the agent matches each one to a client. No real calendar is contacted.
 */

const EVENTS: { title: string; date: string; hours: number }[] = [
  { title: 'Weekly check-in call', date: '2026-09-07', hours: 0.5 },
  { title: 'Design review', date: '2026-09-07', hours: 1.5 },
  { title: 'Workshop: onboarding flow', date: '2026-09-08', hours: 3 },
  { title: 'Feedback call', date: '2026-09-08', hours: 0.5 },
  { title: 'Handoff walkthrough', date: '2026-09-09', hours: 1 },
  { title: 'Planning session', date: '2026-09-09', hours: 1 },
];

/** Hourly clients first, since meeting time is what they're billed for. */
export function draftsFromCalendar(state: AppState): CalendarDraft[] {
  const signed = state.clients.filter((c) => c.status !== 'draft');
  const hourly = signed.filter((c) => c.type === 'Retainer');
  const pool = hourly.length ? hourly : signed.length ? signed : state.clients;
  if (pool.length === 0) return [];
  return EVENTS.map((e, i) => ({ ...e, id: `d${i + 1}`, clientId: pool[i % pool.length].id }));
}
