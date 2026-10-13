import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import {
  AgentMark,
  AgentNote,
  ApprovalStamp,
  Card,
  EmptyState,
  Pill,
  Topbar,
} from '../components/ui';
import { fmtDate, invoiceTotal, money } from '../lib/format';
import { useSelectors, useStore } from '../lib/hooks';
import { reminderTimeline, rulesOf } from '../lib/reminders';
import type { Invoice } from '../lib/types';

/** What the agent sent for this invoice and what comes next. */
function Reminders({
  invoice,
  clientName,
  clientEmail,
}: {
  invoice: Invoice;
  clientName?: string;
  clientEmail?: string;
}) {
  const { state, dispatch, toast } = useStore();
  const timeline = reminderTimeline(invoice, rulesOf(state));
  const open = invoice.status !== 'paid';
  const who = clientEmail || clientName || 'your client';

  return (
    <div className="reminders" id="reminders">
      <div className="reminders-head">
        <div>
          <h3>Reminders</h3>
          <span>
            {open
              ? invoice.remindersPaused
                ? 'Paused. Your agent won’t send anything until you resume.'
                : 'Your agent follows your reminder rules.'
              : 'Paid. No more reminders.'}{' '}
            <Link to="/settings#reminders">Edit rules</Link>
          </span>
        </div>
        {open ? (
          <div className="reminders-actions">
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => {
                dispatch({ type: 'pauseReminders', id: invoice.id, paused: !invoice.remindersPaused });
                toast(invoice.remindersPaused ? 'Reminders resumed' : 'Reminders paused');
              }}
            >
              {invoice.remindersPaused ? 'Resume reminders' : 'Pause reminders'}
            </button>
            <button
              className="btn btn-sm"
              onClick={() => {
                dispatch({ type: 'sendReminder', id: invoice.id });
                toast(`Reminder sent to ${who}`);
              }}
            >
              <Icon name="mail" /> Send now
            </button>
          </div>
        ) : null}
      </div>

      <ol className="timeline">
        {timeline.map((e, n) => (
          <li key={n} className={`timeline-item timeline-${e.state}`}>
            <span className="timeline-dot" aria-hidden="true" />
            <span className="timeline-date num">{fmtDate(e.date)}</span>
            <span className="timeline-label">
              {e.state === 'next' ? 'Next: ' : ''}
              {e.label}
              {e.state === 'paused' ? ' (paused)' : ''}
            </span>
            {e.state === 'needs-ok' && e.step ? (
              <button
                className="btn btn-sm btn-primary"
                onClick={() => {
                  dispatch({ type: 'approveReminder', id: invoice.id, step: e.step! });
                  toast(`Firmer reminder sent to ${who}`);
                }}
              >
                Approve and send
              </button>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Invoices() {
  const { state } = useStore();
  const { clientById } = useSelectors();
  const navigate = useNavigate();

  if (state.invoices.length === 0) {
    return (
      <>
        <Topbar eyebrow="Billing" title="Invoices" />
        <div className="content">
          <EmptyState
            title="No invoices yet"
            action={
              <button className="btn" onClick={() => navigate('/clients')}>
                <Icon name="users" /> Go to clients
              </button>
            }
          >
            Log your hours, then open the client and choose "Generate invoice". Your agent drafts
            it for you to check.
          </EmptyState>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar eyebrow="Billing" title="Invoices" />
      <div className="content">
        <Card>
          <table>
            <thead>
              <tr>
                <th>Number</th>
                <th>Client</th>
                <th>Issued</th>
                <th>Due</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {state.invoices
                .slice()
                .reverse()
                .map((i) => {
                  const c = clientById(i.clientId);
                  return (
                    <tr
                      key={i.id}
                      className="clickable"
                      onClick={() => navigate(`/invoices/${i.id}`)}
                    >
                      <td>{i.number}</td>
                      <td>{c?.name ?? '—'}</td>
                      <td className="num">{fmtDate(i.issueDate)}</td>
                      <td className="num">{fmtDate(i.dueDate)}</td>
                      <td className="num">{money(invoiceTotal(i), c?.currency)}</td>
                      <td>
                        <Pill status={i.status} />
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}

export function InvoiceDetail() {
  const { id } = useParams();
  const { dispatch, toast } = useStore();
  const { invoiceById, clientById } = useSelectors();

  const invoice = invoiceById(id);
  if (!invoice) {
    return (
      <>
        <Topbar eyebrow="Invoices" title="Not found" />
        <div className="content empty">This invoice doesn't exist.</div>
      </>
    );
  }

  const client = clientById(invoice.clientId);
  const total = invoiceTotal(invoice);

  function approve() {
    dispatch({ type: 'setInvoiceStatus', id: invoice!.id, status: 'sent' });
    toast(`Invoice ${invoice!.number} sent to ${client?.email || client?.name}`);
  }

  function markPaid() {
    dispatch({ type: 'setInvoiceStatus', id: invoice!.id, status: 'paid' });
    toast('Invoice marked as paid');
  }

  const draft = invoice.status === 'draft';
  const hours = invoice.items.reduce((s, it) => s + it.qty, 0);
  // Retainers bill hours; fixed-fee projects bill milestones, where qty is a count.
  const hourly = client?.type !== 'Project';
  const rates = new Set(invoice.items.map((it) => it.rate));
  const lines = `${invoice.items.length} line${invoice.items.length === 1 ? '' : 's'}`;
  const summary = !hourly
    ? lines
    : rates.size === 1
      ? `${hours}h × ${money(invoice.items[0].rate, client?.currency)}`
      : `${hours}h across ${lines}`;
  const approvedOn = invoice.approvedAt ?? invoice.issueDate;

  return (
    <>
      <Topbar
        back={{ to: '/invoices', label: '← All invoices' }}
        title={invoice.number}
        actions={
          <>
            <button className="btn" onClick={() => window.print()}>
              <Icon name="print" /> Print / save PDF
            </button>
            {draft ? (
              <button className="btn btn-primary" onClick={approve}>
                <Icon name="check" /> Approve &amp; send
              </button>
            ) : invoice.status !== 'paid' ? (
              <button className="btn" onClick={markPaid}>
                <Icon name="check" /> Mark as paid
              </button>
            ) : null}
          </>
        }
      />

      <div className="content">

        <div className="doc-layout">
          <div className={draft ? 'doc doc-paper doc-draft' : 'doc doc-paper'}>
            {draft ? <div className="draft-tag no-print">Draft by agent</div> : null}
            {draft ? null : invoice.status === 'paid' ? (
              <ApprovalStamp
                label="Paid"
                by={client?.name ?? 'Client'}
                date={fmtDate(invoice.paidAt ?? approvedOn)}
              />
            ) : (
              <div className="no-print">
                <ApprovalStamp label="Approved" by="by you" date={fmtDate(approvedOn)} />
              </div>
            )}
            <h2 className="doc-title">Invoice</h2>
            <dl className="doc-meta">
              <div>
                <dt>No.</dt>
                <dd className="num">{invoice.number}</dd>
              </div>
              <div>
                <dt>Billed to</dt>
                <dd>
                  {client?.name}
                  {client?.city ? <span>{client.city}</span> : null}
                </dd>
              </div>
              <div>
                <dt>Issued</dt>
                <dd className="num">{fmtDate(invoice.issueDate)}</dd>
              </div>
              <div>
                <dt>Due</dt>
                <dd className="num">{fmtDate(invoice.dueDate)}</dd>
              </div>
            </dl>

            <div className="table-wrap">
              <table className="line-items">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th className="num-col">{hourly ? 'Hours' : 'Qty'}</th>
                    <th className="num-col">Rate</th>
                    <th className="num-col">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((it, idx) => (
                    <tr key={idx}>
                      <td>{it.desc}</td>
                      <td className="num num-col">{hourly ? `${it.qty}h` : it.qty}</td>
                      <td className="num num-col">{money(it.rate, client?.currency)}</td>
                      <td className="num num-col">
                        <strong>{money(it.qty * it.rate, client?.currency)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="doc-total">
              <div className="doc-total-text">
                <span className="doc-total-label">Total due · {client?.currency ?? 'EUR'}</span>
                <span className="doc-total-sum num">{summary}</span>
              </div>
              <span className="doc-total-amount money">{money(total, client?.currency)}</span>
            </div>

            <div className="doc-provenance">
              <AgentMark />
              <span>
                Prepared by your agent ·{' '}
                {draft ? 'Waiting for your approval' : `Approved by you, ${fmtDate(approvedOn)}`}
              </span>
            </div>

            <div className="doc-note">
              Status: <Pill status={invoice.status} /> · late payment accrues interest per the
              governing agreement.
            </div>
          </div>

          <aside className="doc-side no-print">
            {draft ? (
              <AgentNote
                did={
                  hourly
                    ? `drafted this invoice from ${hours}h of logged work.`
                    : 'drafted this invoice from the agreed milestones.'
                }
                privacy={`Only the invoice is shared with ${client?.name ?? 'your client'}`}
                needsOk="It's sent only when you click Approve & send"
              />
            ) : (
              <Reminders invoice={invoice} clientName={client?.name} clientEmail={client?.email} />
            )}

            <AgentLog
              invoice={invoice}
              source={hourly ? `${hours}h of logged work` : 'the agreed milestones'}
              clientName={client?.name}
            />
          </aside>
        </div>
      </div>
    </>
  );
}

/** Who prepared the invoice, who approved it, and what the agent did along the way. */
function AgentLog({
  invoice,
  source,
  clientName,
}: {
  invoice: Invoice;
  source: string;
  clientName?: string;
}) {
  const draft = invoice.status === 'draft';
  const approvedOn = invoice.approvedAt ?? invoice.issueDate;
  const log: { date: string; who: 'Agent' | 'You'; what: string }[] = [
    {
      date: invoice.issueDate,
      who: 'Agent',
      what: `Drafted ${invoice.number} from ${source} for ${clientName ?? 'this client'}`,
    },
  ];
  if (draft) log.push({ date: invoice.issueDate, who: 'Agent', what: 'Waiting for your OK' });
  else log.push({ date: approvedOn, who: 'You', what: `Approved and sent it to ${clientName ?? 'the client'}` });
  for (const r of invoice.reminders ?? []) {
    log.push({
      date: r.date,
      who: 'You',
      what: r.step === 'manual' ? 'Sent a reminder by hand' : 'Approved the firmer reminder',
    });
  }
  if (invoice.status === 'paid')
    log.push({ date: invoice.paidAt ?? approvedOn, who: 'You', what: 'Marked it as paid' });

  return (
    <section className="agent-log" aria-labelledby="agent-log-title">
      <h3 id="agent-log-title">Agent log</h3>
      <ol>
        {log.map((e, n) => (
          <li key={n} className={e.who === 'You' ? 'by-you' : 'by-agent'}>
            <span className="agent-log-meta">
              <span className="num">{fmtDate(e.date)}</span> · {e.who}
            </span>
            <span>{e.what}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
