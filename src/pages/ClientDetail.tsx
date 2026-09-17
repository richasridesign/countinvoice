import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Card, Pill, Topbar } from '../components/ui';
import { fmtDate, invoiceTotal, money } from '../lib/format';
import { useSelectors, useStore } from '../lib/hooks';

export function ClientDetail() {
  const { id } = useParams();
  const { state, dispatch, toast } = useStore();
  const { clientById, clientTasks, clientInvoices, unbilledTasks } = useSelectors();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const client = clientById(id);
  if (!client) {
    return (
      <>
        <Topbar eyebrow="Clients" title="Not found" />
        <div className="content empty">This client doesn't exist in the demo data.</div>
      </>
    );
  }

  const tasks = clientTasks(client.id);
  const invoices = clientInvoices(client.id);
  const unbilled = unbilledTasks(client.id);

  function generateInvoice() {
    const nextId = `i${state.seq}`;
    dispatch({ type: 'generateInvoice', clientId: client!.id });
    toast(
      `Your agent drafted INV-${state.seq} from ${unbilled.length} task${
        unbilled.length === 1 ? '' : 's'
      } — review before sending`,
    );
    navigate(`/invoices/${nextId}`);
  }

  function handleDelete() {
    dispatch({ type: 'deleteClient', id: client!.id });
    toast(`${client!.name} deleted`);
    navigate('/clients');
  }

  return (
    <>
      <Topbar
        eyebrow="Client"
        title={client.name}
        actions={
          <>
            {unbilled.length > 0 ? (
              <button className="btn" onClick={generateInvoice}>
                <Icon name="file" /> Generate invoice ({unbilled.length})
              </button>
            ) : null}
            <button className="btn" onClick={() => navigate('/tasks/new')}>
              <Icon name="plus" /> Log task
            </button>
            <button className="btn" onClick={() => navigate(`/clients/${client.id}/edit`)}>
              <Icon name="edit" /> Edit
            </button>
            <button className="btn" onClick={() => setConfirmDelete(true)}>
              <Icon name="trash" /> Delete
            </button>
          </>
        }
      />

      <div className="content">
        <div className="breadcrumb">
          <Link to="/clients">← All clients</Link>
        </div>

        {confirmDelete ? (
          <div
            className="share-strip share-strip-pending"
            style={{ maxWidth: 'none', marginBottom: 18 }}
          >
            <div>
              <strong>Delete {client.name}?</strong>
              <span>
                {' '}
                This also removes their {tasks.length} task{tasks.length === 1 ? '' : 's'} and{' '}
                {invoices.length} invoice{invoices.length === 1 ? '' : 's'}. This can't be undone.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleDelete}>
                <Icon name="trash" /> Delete client
              </button>
            </div>
          </div>
        ) : null}

        {client.email ? (
          <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 14 }}>
            {client.email}
          </div>
        ) : null}

        <div className="grid-tiles">
          <div className="tile">
            <div className="label">Engagement</div>
            <div className="value" style={{ fontSize: 16 }}>
              {client.type}
            </div>
            <div className="sub">
              {client.type === 'Retainer'
                ? `${money(client.rate, client.currency)} / hour`
                : `${money(client.rate, client.currency)} fixed`}
            </div>
          </div>
          <div className="tile">
            <div className="label">Client location</div>
            <div className="value" style={{ fontSize: 16 }}>
              {client.country}
            </div>
            <div className="sub">{client.city}</div>
          </div>
          <div className="tile">
            <div className="label">Status</div>
            <div className="value" style={{ fontSize: 16 }}>
              <Pill status={client.status} />
            </div>
            <div className="sub">
              <Link to={`/agreement/${client.id}`} style={{ textDecoration: 'underline' }}>
                View agreement
              </Link>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.3fr 1fr',
            gap: 16,
            alignItems: 'start',
          }}
        >
          <Card>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Task</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length > 0 ? (
                  tasks.map((t) => (
                    <tr key={t.id}>
                      <td className="num">{fmtDate(t.date)}</td>
                      <td>{t.title}</td>
                      <td className="num">{t.hours ? `${t.hours}h` : '—'}</td>
                      <td>
                        <Pill status={t.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="empty">
                      No tasks logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>

          <div className="card" style={{ padding: '16px 18px' }}>
            <div
              className="label"
              style={{
                fontSize: 11.5,
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                marginBottom: 8,
              }}
            >
              Payment milestones
            </div>
            {client.milestones.map((m) => (
              <div className="milestone-row" key={m.label}>
                <span>{m.label}</span>
                <span className="num">{m.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <h3 style={{ fontSize: 15, margin: '22px 0 10px' }}>Invoices</h3>
        <Card>
          <table>
            <thead>
              <tr>
                <th>Number</th>
                <th>Issued</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length > 0 ? (
                invoices.map((i) => (
                  <tr
                    key={i.id}
                    className="clickable"
                    onClick={() => navigate(`/invoices/${i.id}`)}
                  >
                    <td>{i.number}</td>
                    <td className="num">{fmtDate(i.issueDate)}</td>
                    <td className="num">{money(invoiceTotal(i), client.currency)}</td>
                    <td>
                      <Pill status={i.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="empty">
                    No invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
