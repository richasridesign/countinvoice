import type { ReactNode } from 'react';
import type { PillStatus } from '../lib/types';

/** Status in plain words: who it is waiting on, not just what it is. */
const PILL_LABELS: Record<string, string> = {
  active: 'Signed',
  draft: 'Waiting on you',
  overdue: 'Overdue',
  paid: 'Paid',
  sent: 'Waiting on client',
  logged: 'Not invoiced yet',
  invoiced: 'Invoiced',
};

/** The same statuses, worded for the client on their share link. */
const CLIENT_LABELS: Record<string, string> = {
  sent: 'Waiting for your signature',
};

/**
 * Four tiers that read without colour: bold with a filled mark when it waits
 * on you or is overdue, regular with a hollow mark when it waits on someone
 * else, muted with a tick when it's done.
 */
export function Pill({ status, forClient = false }: { status: PillStatus; forClient?: boolean }) {
  const label = (forClient && CLIENT_LABELS[status]) || PILL_LABELS[status] || status;
  return <span className={`pill pill-${status}`}>{label}</span>;
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

/** Empty states are drawn with the paperwork itself: a stack of sheets and a stamp. */
export function PaperStack({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={small ? 'paper-stack paper-stack-sm' : 'paper-stack'}
      viewBox="0 0 120 100"
      aria-hidden="true"
    >
      <rect x="22" y="14" width="52" height="68" rx="3" transform="rotate(-8 48 48)" />
      <rect x="32" y="10" width="52" height="68" rx="3" transform="rotate(3 58 44)" />
      <rect className="paper-top" x="38" y="12" width="52" height="68" rx="3" />
      <path d="M46 28h36M46 38h36M46 48h36M46 58h20" />
      <circle className="paper-stamp" cx="88" cy="74" r="15" />
      <path className="paper-stamp-tick" d="M81 74l5 5 9-10" />
    </svg>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <PaperStack />
      <h3>{title}</h3>
      {children ? <p>{children}</p> : null}
      {action}
    </div>
  );
}

/** The agent's mark: a dashed monogram, so its work never looks like yours. */
export function AgentMark() {
  return (
    <span className="agent-mark" aria-hidden="true">
      ci
    </span>
  );
}

/** Ink stamp shown only once the freelancer (or client) has approved something. */
export function ApprovalStamp({ label, by, date }: { label: string; by: string; date?: string }) {
  return (
    <div className="stamp" role="img" aria-label={`${label} by ${by}${date ? `, ${date}` : ''}`}>
      <strong>{label}</strong>
      <span>{by}</span>
      {date ? <span>{date}</span> : null}
    </div>
  );
}

/**
 * The agent note: says what the agent did, what stays private, and what still
 * needs the freelancer's OK. Used wherever the agent acts on their behalf.
 */
export function AgentNote({
  did,
  privacy,
  needsOk,
  action,
}: {
  did: ReactNode;
  privacy: ReactNode;
  needsOk: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="agent-note">
      <AgentMark />
      <div className="agent-note-body">
        <strong>Your agent {did}</strong>
        <span>
          {privacy} · {needsOk}
        </span>
      </div>
      {action}
    </div>
  );
}

export function Card({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  return <div className={scroll ? 'card table-wrap' : 'card'}>{children}</div>;
}
