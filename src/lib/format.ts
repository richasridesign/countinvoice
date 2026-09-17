import type { Client, Currency, Invoice, Milestone } from './types';
import { LAW_LINKS } from './types';

const SYMBOLS: Record<Currency, string> = { EUR: '€', USD: '$', GBP: '£' };

export function money(n: number, currency: Currency = 'EUR'): string {
  const sym = SYMBOLS[currency] ?? '€';
  return (
    sym +
    Number(n).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  );
}

export function fmtDate(d: string): string {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function invoiceTotal(inv: Invoice): number {
  return inv.items.reduce((sum, it) => sum + it.qty * it.rate, 0);
}

/** Per-milestone value: retainers are estimated at 10 hrs/month. */
export function milestoneValue(client: Client, m: Milestone): string {
  const fraction = m.pct / 100;
  return client.type === 'Retainer'
    ? `${money(client.rate * fraction * 10, client.currency)} est./mo`
    : money(client.rate * fraction, client.currency);
}

/**
 * Reasons an agreement deserves human legal review before being sent.
 * Mirrors the prototype's heuristics: unknown jurisdiction, lopsided payment
 * split, or a contract value high enough to warrant a closer look.
 */
export function legalReviewFlags(client: Client, freelancerCountry: string): string[] {
  const flags: string[] = [];

  if (!LAW_LINKS[freelancerCountry]) {
    flags.push("your country in Settings isn't one of our standard-coverage jurisdictions");
  }

  const extremeSplit = client.milestones.some((m) => m.pct >= 90 || (m.pct > 0 && m.pct <= 10));
  if (extremeSplit) {
    flags.push('the payment split is unusually one-sided');
  }

  const highValue = client.type === 'Retainer' ? client.rate > 150 : client.rate > 8000;
  if (highValue) {
    flags.push('the contract value is high enough to warrant a closer look');
  }

  return flags;
}
