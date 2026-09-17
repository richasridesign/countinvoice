import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Card, EmptyState, Pill, Topbar } from '../components/ui';
import { fmtDate, invoiceTotal, money } from '../lib/format';
import { useSelectors, useStore } from '../lib/hooks';

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
            {invoice.status === 'overdue' ? (
              <button className="btn" onClick={() => toast('Reminder sent to client')}>
                <Icon name="mail" /> Send reminder
              </button>
            ) : null}
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
          <div className="share-strip no-print">
            <div>
              <strong>Drafted by your agent.</strong>
              <span> Review the line items below, then approve it to send to {client?.name}.</span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={approve}>
              <Icon name="check" /> Approve &amp; send
            </button>
          </div>
        ) : null}

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
