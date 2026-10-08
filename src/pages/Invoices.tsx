import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { AgentNote, Card, EmptyState, Pill, Topbar } from '../components/ui';
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
    <div className="doc-aside reminders no-print" id="reminders">
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
            icon={<Icon name="file" />}
            title="No invoices yet"
            action={
              <button className="btn btn-primary" onClick={() => navigate('/clients')}>
                <Icon name="users" /> Go to clients
              </button>
            }
          >
            Invoices are generated from a client's unbilled tasks — open a client and use "Generate
            invoice" once you've logged some hours.
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

  return (
    <>
      <Topbar
        eyebrow="Invoice"
        title={invoice.number}
        actions={
          <>
            <button className="btn" onClick={() => window.print()}>
              <Icon name="print" /> Print / save PDF
            </button>
            {invoice.status === 'draft' ? (
              <button className="btn btn-primary" onClick={approve}>
                <Icon name="check" /> Approve &amp; send
              </button>
            ) : invoice.status !== 'paid' ? (
              <button className="btn btn-primary" onClick={markPaid}>
                <Icon name="check" /> Mark as paid
              </button>
            ) : null}
          </>
        }
      />

      <div className="content">
        <div className="breadcrumb no-print">
          <Link to="/invoices">← All invoices</Link>
        </div>

        {invoice.status === 'draft' ? (
          <div className="doc-aside no-print">
            <AgentNote
              did={`drafted this invoice from ${invoice.items.reduce((s, it) => s + it.qty, 0)}h of logged work.`}
              privacy={`Only the invoice is shared with ${client?.name ?? 'your client'}`}
              needsOk="It's sent only when you click Approve & send"
              action={
                <button className="btn btn-primary btn-sm" onClick={approve}>
                  <Icon name="check" /> Approve &amp; send
                </button>
              }
            />
          </div>
        ) : (
          <Reminders invoice={invoice} clientName={client?.name} clientEmail={client?.email} />
        )}

        <div className="doc-wrap">
          <div className="doc">
            <div className="doc-head">
              <div>
                <h2>Invoice</h2>
                <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
                  Bill to {client?.name}, {client?.city}
                </div>
              </div>
              <div className="meta">
                Number<span className="num">{invoice.number}</span>
                <br />
                Issued<span className="num">{fmtDate(invoice.issueDate)}</span>
                <br />
                Due<span className="num">{fmtDate(invoice.dueDate)}</span>
              </div>
            </div>

            <div className="table-wrap">
              <table className="line-items">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((it, idx) => (
                    <tr key={idx}>
                      <td>{it.desc}</td>
                      <td className="num">{it.qty}</td>
                      <td className="num">{money(it.rate, client?.currency)}</td>
                      <td className="num">{money(it.qty * it.rate, client?.currency)}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan={3}>Total</td>
                    <td className="num">{money(total, client?.currency)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="doc-note">
              Status: <Pill status={invoice.status} /> · late payment accrues interest per the
              governing agreement.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
