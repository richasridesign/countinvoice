import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Card, EmptyState, PaperStack, Pill, Topbar } from '../components/ui';
import { fmtDate, invoiceTotal, money } from '../lib/format';
import { TODAY } from '../lib/types';
import type { Invoice } from '../lib/types';
import { useSelectors, useStore } from '../lib/hooks';
import { gettingPaid } from '../lib/reminders';

export function Dashboard() {
  const { state } = useStore();
  const { clientById } = useSelectors();
  const navigate = useNavigate();

  if (state.clients.length === 0) {
    return (
      <>
        <Topbar title="Dashboard" />
        <div className="content">
          <div className="empty-hero">
            <div>
              <h2>Meet your agent.</h2>
              <p>
                Add a client and your agent takes it from there. It drafts their agreement, then
                prepares invoices as you log work. Everything waits for your approval before it
                reaches a client.
              </p>
            </div>
            <button
              className="btn"
              style={{ flex: 'none' }}
              onClick={() => navigate('/clients/new')}
            >
              <Icon name="plus" /> Add your first client
            </button>
          </div>

          <div className="steps">
            <div className="step done">
              <div className="step-num">1</div>
              <div className="step-body">
                <strong>Your agent drafts the agreement</strong>
                <span>Governed by your own country, set once in Settings.</span>
              </div>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <div className="step-body">
                <strong>You log the hours</strong>
                <span>Track the time you put into their work.</span>
              </div>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <div className="step-body">
                <strong>Your agent drafts the invoice</strong>
                <span>You review it, then approve it to send.</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const sumOf = (list: Invoice[]) => list.reduce((s, i) => s + invoiceTotal(i), 0);
  const overdue = state.invoices.filter((i) => i.status === 'overdue');
  const waiting = state.invoices.filter((i) => i.status === 'sent');
  const outstanding = sumOf(overdue) + sumOf(waiting);
  const paidTotal = sumOf(state.invoices.filter((i) => i.status === 'paid'));
  const unbilledHours = state.tasks
    .filter((t) => t.status === 'logged')
    .reduce((s, t) => s + t.hours, 0);

  const recentTasks = state.tasks.slice(-4).reverse();
  const pendingAgreements = state.clients.filter(
    (c) => c.status === 'draft' || c.status === 'sent' || c.clientProposal,
  );
  const pendingInvoices = state.invoices.filter((i) => i.status === 'draft');
  const paid = gettingPaid(state);
  const queueCount = pendingAgreements.length + pendingInvoices.length + paid.needsOk.length;
  const urgent = mostUrgent(state.invoices, paid.needsOk);
  const urgentClient = urgent ? clientById(urgent.invoice.clientId) : undefined;

  return (
    <>
      <Topbar
        title="Dashboard"
        actions={
          <>
            <button className="btn" onClick={() => navigate('/clients/new')}>
              <Icon name="sign" /> Draft agreement
            </button>
            <button className="btn" onClick={() => navigate('/tasks/new')}>
              <Icon name="plus" /> Log task
            </button>
          </>
        }
      />

      <div className="content">
        <section className="dash-hero" aria-label="Getting paid">
          <div>
            <div className="dash-label">Outstanding · as of {fmtDate(TODAY)}</div>
            <div className="money dash-total">{money(outstanding, 'EUR')}</div>
            <dl className="dash-stats">
              <div>
                <dt>Overdue</dt>
                <dd className={overdue.length ? 'is-overdue num' : 'num'}>
                  {money(sumOf(overdue), 'EUR')}
                </dd>
              </div>
              <div>
                <dt>Waiting on client</dt>
                <dd className="num">{money(sumOf(waiting), 'EUR')}</dd>
              </div>
              <div>
                <dt>Hours not invoiced</dt>
                <dd className="num">{unbilledHours} h</dd>
              </div>
              <div>
                <dt>Paid to date</dt>
                <dd className="num">{money(paidTotal, 'EUR')}</dd>
              </div>
            </dl>
          </div>
          <PaidChart invoices={state.invoices} />
        </section>

        {urgent ? (
          <div className="urgent">
            <div className="urgent-body">
              <span className="urgent-label">Most urgent</span>
              <strong>
                {urgent.kind === 'draft'
                  ? `${urgent.invoice.number} for ${urgentClient?.name} is ready to check.`
                  : `${urgentClient?.name} owes ${money(invoiceTotal(urgent.invoice), urgentClient?.currency)}. It was due ${fmtDate(urgent.invoice.dueDate)}, ${daysLate(urgent.invoice)} days ago.`}
              </strong>
              <span>
                {urgent.kind === 'reminder'
                  ? 'Your agent drafted a firmer reminder. It won’t send until you approve it.'
                  : urgent.kind === 'overdue'
                    ? 'Your agent is sending reminders by your rules.'
                    : 'Your agent drafted it from your logged hours. It won’t send until you approve it.'}
              </span>
            </div>
            <button className="btn" onClick={() => navigate(`/invoices/${urgent.invoice.id}`)}>
              {urgent.kind === 'reminder'
                ? 'Review reminder'
                : urgent.kind === 'overdue'
                  ? 'View invoice'
                  : 'Review invoice'}
            </button>
          </div>
        ) : null}

        <div className="section-head">
          <h2>Needs you</h2>
          <span>
            {queueCount} item{queueCount === 1 ? '' : 's'}
          </span>
        </div>

        {queueCount === 0 ? (
          <div className="empty-state" style={{ padding: '32px 24px', marginBottom: 32 }}>
            <PaperStack small />
            <h3 style={{ fontSize: 16 }}>Nothing needs you right now</h3>
            <p style={{ marginBottom: 0 }}>
              When your agent drafts something, it waits here for your review.
            </p>
          </div>
        ) : (
          <>
            <ul className="queue">
              {pendingAgreements.map((c) => {
                const byAgent = c.status === 'draft' && !c.agreementFile && !c.clientProposal;
                return (
                  <li key={c.id} className={byAgent ? 'queue-row by-agent' : 'queue-row'}>
                    <span className="queue-ref">Agreement</span>
                    <strong className="queue-client">{c.name}</strong>
                    <span className="queue-note">
                      {c.clientProposal
                        ? `${c.name} sent their own agreement. Review it.`
                        : c.status === 'draft' && c.agreementFile
                          ? 'You uploaded this agreement. Not sent yet.'
                          : c.status === 'draft'
                            ? 'Your agent drafted this agreement. Not sent yet.'
                            : c.agreementSentAt
                              ? `Sent ${fmtDate(c.agreementSentAt)}. Waiting on their signature.`
                              : 'Waiting on their signature.'}
                    </span>
                    <span className="queue-status">
                      <Pill status={c.clientProposal ? 'draft' : c.status} />
                    </span>
                    <button
                      className="btn btn-sm queue-action"
                      onClick={() => navigate(`/agreement/${c.id}`)}
                    >
                      {c.clientProposal || c.status === 'draft' ? 'Review' : 'View'}
                    </button>
                  </li>
                );
              })}

              {paid.needsOk.map((i) => {
                const c = clientById(i.clientId);
                return (
                  <li key={`r${i.id}`} className="queue-row by-agent">
                    <span className="queue-ref num">{i.number}</span>
                    <strong className="queue-client">{c?.name}</strong>
                    <span className="queue-note">
                      {daysLate(i)} days late. Your agent drafted a firmer reminder.
                    </span>
                    <span className="queue-status">
                      <Pill status="overdue" />
                    </span>
                    <button
                      className="btn btn-sm queue-action"
                      onClick={() => navigate(`/invoices/${i.id}`)}
                    >
                      Review reminder
                    </button>
                  </li>
                );
              })}

              {pendingInvoices.map((i) => {
                const c = clientById(i.clientId);
                if (!c) return null;
                return (
                  <li key={i.id} className="queue-row by-agent">
                    <span className="queue-ref num">{i.number}</span>
                    <strong className="queue-client">{c.name}</strong>
                    <span className="queue-note">
                      Your agent drafted it from logged hours:{' '}
                      <span className="num">{money(invoiceTotal(i), c.currency)}</span>
                    </span>
                    <span className="queue-status">
                      <Pill status="draft" />
                    </span>
                    <button
                      className="btn btn-sm queue-action"
                      onClick={() => navigate(`/invoices/${i.id}`)}
                    >
                      Review
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="queue-legend">
              Red margin line = written by your agent. Nothing leaves without your OK.
            </p>
          </>
        )}

        <div className="section-head">
          <h2>Recent activity</h2>
        </div>
        {recentTasks.length > 0 ? (
          <Card>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Task</th>
                  <th>Client</th>
                  <th className="num-col">Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map((t) => (
                  <tr key={t.id}>
                    <td className="num">{fmtDate(t.date)}</td>
                    <td>{t.title}</td>
                    <td>{clientById(t.clientId)?.name}</td>
                    <td className="num num-col">{t.hours ? `${t.hours}h` : '—'}</td>
                    <td>
                      <Pill status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <EmptyState
            title="No tasks logged yet"
            action={
              <Link className="btn" to="/tasks/new">
                <Icon name="plus" /> Log task
              </Link>
            }
          >
            Once you log time against a client, it will show up here.
          </EmptyState>
        )}
      </div>
    </>
  );
}

function daysLate(i: Invoice): number {
  const ms = new Date(TODAY + 'T00:00:00Z').getTime() - new Date(i.dueDate + 'T00:00:00Z').getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

/** The one thing worth a tinted panel: a reminder waiting on you, then the oldest overdue, then a draft. */
function mostUrgent(
  invoices: Invoice[],
  needsOk: Invoice[],
): { invoice: Invoice; kind: 'reminder' | 'overdue' | 'draft' } | null {
  if (needsOk.length) return { invoice: needsOk[0], kind: 'reminder' };
  const overdue = invoices
    .filter((i) => i.status === 'overdue')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  if (overdue.length) return { invoice: overdue[0], kind: 'overdue' };
  const draft = invoices.find((i) => i.status === 'draft');
  return draft ? { invoice: draft, kind: 'draft' } : null;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Billed per month by issue date, split into paid and still owed. Drafts are left out. */
function PaidChart({ invoices }: { invoices: Invoice[] }) {
  const billed = invoices.filter((i) => i.status !== 'draft');
  const end = new Date(TODAY + 'T00:00:00Z');
  const first = billed.reduce(
    (min, i) => (i.issueDate < min ? i.issueDate : min),
    TODAY,
  );
  const startDate = new Date(first.slice(0, 7) + '-01T00:00:00Z');
  let span =
    (end.getUTCFullYear() - startDate.getUTCFullYear()) * 12 +
    end.getUTCMonth() -
    startDate.getUTCMonth() +
    1;
  span = Math.min(6, Math.max(3, span));

  const months = Array.from({ length: span }, (_, k) => {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (span - 1 - k), 1));
    const key = d.toISOString().slice(0, 7);
    const inMonth = billed.filter((i) => i.issueDate.startsWith(key));
    const paid = inMonth.filter((i) => i.status === 'paid').reduce((s, i) => s + invoiceTotal(i), 0);
    const owed = inMonth.filter((i) => i.status !== 'paid').reduce((s, i) => s + invoiceTotal(i), 0);
    return { label: MONTHS[d.getUTCMonth()], paid, owed };
  });
  const max = Math.max(1, ...months.map((m) => Math.max(m.paid, m.owed)));
  const summary = months
    .map((m) => `${m.label}: ${money(m.paid, 'EUR')} paid, ${money(m.owed, 'EUR')} owed`)
    .join('; ');

  return (
    <figure className="chart">
      <figcaption className="chart-head">
        <span>Paid vs owed · by month billed</span>
        <span className="chart-legend" aria-hidden="true">
          <span className="key-paid">Paid</span>
          <span className="key-owed">Owed</span>
        </span>
      </figcaption>
      <div className="chart-bars" role="img" aria-label={summary}>
        {months.map((m) => (
          <div key={m.label} className="chart-month">
            <div className="chart-pair">
              <span className="bar bar-paid" style={{ height: `${(m.paid / max) * 100}%` }} />
              <span className="bar bar-owed" style={{ height: `${(m.owed / max) * 100}%` }} />
            </div>
            <span className="chart-label">{m.label}</span>
          </div>
        ))}
      </div>
    </figure>
  );
}
