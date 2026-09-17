import type { ReactNode } from 'react';
import type { PillStatus } from '../lib/types';

const PILL_LABELS: Record<string, string> = {
  active: 'Active',
  draft: 'Draft',
  overdue: 'Overdue',
  paid: 'Paid',
  sent: 'Sent',
  logged: 'Logged',
  invoiced: 'Invoiced',
};

/**
 * Four visual tiers, keyed by status:
 * outline = not started, filled = in progress, bold = resolved,
 * inverted = needs attention.
 */
export function Pill({ status }: { status: PillStatus }) {
  return <span className={`pill pill-${status}`}>{PILL_LABELS[status] ?? status}</span>;
}

export function Topbar({
  eyebrow,
  title,
  actions,
}: {
  eyebrow?: string;
  title: string;
  actions?: ReactNode;
}) {
  return (
    <div className="topbar">
      <div>
        {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
        <h1>{title}</h1>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>{actions}</div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {children ? <p>{children}</p> : null}
      {action}
    </div>
  );
}

export function Card({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  return <div className={scroll ? 'card table-wrap' : 'card'}>{children}</div>;
}
