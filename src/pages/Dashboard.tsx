import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Card, EmptyState, Pill, Topbar } from '../components/ui';
import { fmtDate, invoiceTotal, money } from '../lib/format';
import { useSelectors, useStore } from '../lib/hooks';

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
                Add a client and your agent takes it from there — drafting their agreement, then
                preparing invoices as you log work. Everything waits for your approval before it
                reaches a client.
              </p>
            </div>
            <button
              className="btn btn-primary"
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

  const outstanding = state.invoices
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .reduce((s, i) => s + invoiceTotal(i), 0);
  const overdueCount = state.invoices.filter((i) => i.status === 'overdue').length;
  const weekHours = state.tasks
    .filter((t) => t.date >= '2026-09-01')
    .reduce((s, t) => s + t.hours, 0);
  const activeClients = state.clients.filter((c) => c.status !== 'draft').length;

  const recentTasks = state.tasks.slice(-4).reverse();
  const pendingAgreements = state.clients.filter(
    (c) => c.status === 'draft' || c.status === 'sent',
  );
  const pendingInvoices = state.invoices.filter((i) => i.status === 'draft');
  const queueEmpty = pendingAgreements.length === 0 && pendingInvoices.length === 0;

  return (
    <>
      <Topbar
        title="Dashboard"
        actions={
          <>
            <button className="btn" onClick={() => navigate('/clients/new')}>
              <Icon name="sign" /> Draft agreement
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/tasks/new')}>
              <Icon name="plus" /> Log task
            </button>
          </>
        }
      />

      <div className="content">
        <div className="grid-tiles">
          <div className="tile">
            <div className="label">Outstanding</div>
            <div className="value">{money(outstanding, 'EUR')}</div>
            <div className="sub">
              {overdueCount} invoice{overdueCount === 1 ? '' : 's'} overdue
            </div>
          </div>
          <div className="tile">
            <div className="label">Logged this week</div>
            <div className="value">{weekHours}h</div>
            <div className="sub">across {activeClients} active clients</div>
          </div>
          <div className="tile">
            <div className="label">Active clients</div>
            <div className="value">{activeClients}</div>
            <div className="sub">{state.clients.length} total in workspace</div>
          </div>
        </div>

        <h3 style={{ fontSize: 15, marginBottom: 2 }}>Your agent's queue</h3>
        <p style={{ color: 'var(--muted)', fontSize: 12.5, margin: '0 0 10px 0' }}>
          Drafted automatically — nothing reaches a client until you approve it.
        </p>

        {queueEmpty ? (
          <div className="empty-state" style={{ padding: '32px 24px', marginBottom: 26 }}>
            <div className="empty-icon">
              <Icon name="sign" />
            </div>
            <h3 style={{ fontSize: 15 }}>Your agent's queue is empty</h3>
            <p style={{ marginBottom: 0 }}>Nothing drafted is waiting on your review right now.</p>
          </div>
        ) : (
          <div className="card table-wrap" style={{ marginBottom: 26 }}>
            <table>
              <thead>
                <tr>
                  <th />
                  <th>Item</th>
                  <th>Status</th>
                  <th>Note</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pendingAgreements.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Icon name="sign" />
                    </td>
                    <td>
                      <strong>{c.name}</strong>
                      <br />
                      <span style={{ color: 'var(--muted)', fontSize: 12 }}>Agreement</span>
                    </td>
                    <td>
                      <Pill status={c.status} />
                    </td>
                    <td style={{ color: 'var(--muted)' }}>
                      {c.status === 'draft'
                        ? 'Agent drafted this agreement — not sent yet'
                        : c.agreementSentAt
                          ? `Sent ${fmtDate(c.agreementSentAt)} — awaiting signature`
                          : 'Awaiting signature'}
                    </td>
                    <td className="row-actions">
                      {c.status === 'draft' ? (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => navigate(`/agreement/${c.id}`)}
                        >
                          <Icon name="mail" /> Review &amp; share
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm"
                          onClick={() => navigate(`/agreement/${c.id}`)}
                        >
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {pendingInvoices.map((i) => {
                  const c = clientById(i.clientId);
                  if (!c) return null;
                  return (
                    <tr key={i.id}>
                      <td>
                        <Icon name="file" />
                      </td>
                      <td>
                        <strong>{i.number}</strong>
                        <br />
                        <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                          Invoice for {c.name}
                        </span>
                      </td>
                      <td>
                        <Pill status="draft" />
                      </td>
                      <td style={{ color: 'var(--muted)' }}>
                        Agent drafted from logged hours — {money(invoiceTotal(i), c.currency)}
                      </td>
                      <td className="row-actions">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => navigate(`/invoices/${i.id}`)}
                        >
                          <Icon name="check" /> Review &amp; approve
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <h3 style={{ fontSize: 15, marginBottom: 10 }}>Recent activity</h3>
        {recentTasks.length > 0 ? (
          <Card>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Task</th>
                  <th>Client</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map((t) => (
                  <tr key={t.id}>
                    <td className="num">{fmtDate(t.date)}</td>
                    <td>{t.title}</td>
                    <td>{clientById(t.clientId)?.name}</td>
                    <td className="num">{t.hours ? `${t.hours}h` : '—'}</td>
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
            icon={<Icon name="check" />}
            title="No tasks logged yet"
            action={
              <Link className="btn btn-primary" to="/tasks/new">
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
