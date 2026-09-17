import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Card, EmptyState, Pill, Topbar } from '../components/ui';
import { money } from '../lib/format';
import { useStore } from '../lib/hooks';
import type { Client } from '../lib/types';

/** Inline delete confirmation, replacing the prototype's pendingDeleteId global. */
export function RowActions({
  client,
  pendingId,
  setPendingId,
  onDelete,
}: {
  client: Client;
  pendingId: string | null;
  setPendingId: (id: string | null) => void;
  onDelete: (id: string) => void;
}) {
  const navigate = useNavigate();

  if (pendingId === client.id) {
    return (
      <td className="row-actions">
        <div className="confirm-delete">
          <span>Delete {client.name}?</span>
          <button
            className="btn btn-sm btn-primary"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(client.id);
            }}
          >
            Delete
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={(e) => {
              e.stopPropagation();
              setPendingId(null);
            }}
          >
            Cancel
          </button>
        </div>
      </td>
    );
  }

  return (
    <td className="row-actions">
      <button
        className="icon-btn"
        title="Edit client"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/clients/${client.id}/edit`);
        }}
      >
        <Icon name="edit" />
      </button>
      <button
        className="icon-btn"
        title="Delete client"
        onClick={(e) => {
          e.stopPropagation();
          setPendingId(client.id);
        }}
      >
        <Icon name="trash" />
      </button>
    </td>
  );
}

export function Clients() {
  const { state, dispatch, toast } = useStore();
  const navigate = useNavigate();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function handleDelete(id: string) {
    const name = state.clients.find((c) => c.id === id)?.name;
    dispatch({ type: 'deleteClient', id });
    setPendingId(null);
    toast(name ? `${name} deleted` : 'Client deleted');
  }

  if (state.clients.length === 0) {
    return (
      <>
        <Topbar eyebrow="Workspace" title="Clients" />
        <div className="content">
          <EmptyState
            icon={<Icon name="users" />}
            title="No clients yet"
            action={
              <button className="btn btn-primary" onClick={() => navigate('/clients/new')}>
                <Icon name="plus" /> Add your first client
              </button>
            }
          >
            Add a client to draft their agreement — country, engagement type and payment split all
            live here.
          </EmptyState>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar
        eyebrow="Workspace"
        title="Clients"
        actions={
          <button className="btn btn-primary" onClick={() => navigate('/clients/new')}>
            <Icon name="plus" /> Add client
          </button>
        }
      />
      <div className="content">
        <Card>
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Engagement</th>
                <th>Rate</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.clients.map((c) => (
                <tr
                  key={c.id}
                  className="clickable"
                  onClick={() => navigate(`/clients/${c.id}`)}
                >
                  <td>
                    <strong>{c.name}</strong>
                    <br />
                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                      {c.email ? `${c.email} · ` : ''}
                      {c.city}, {c.country}
                    </span>
                  </td>
                  <td>{c.type}</td>
                  <td className="num">
                    {c.type === 'Retainer'
                      ? `${money(c.rate, c.currency)}/hr`
                      : money(c.rate, c.currency)}
                  </td>
                  <td>
                    <Pill status={c.status} />
                  </td>
                  <RowActions
                    client={c}
                    pendingId={pendingId}
                    setPendingId={setPendingId}
                    onDelete={handleDelete}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
