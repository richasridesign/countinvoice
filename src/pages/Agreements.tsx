import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AgreementDoc } from '../components/AgreementDoc';
import { Icon } from '../components/Icon';
import { Card, EmptyState, Pill, Topbar } from '../components/ui';
import { RowActions } from './Clients';
import { fmtDate } from '../lib/format';
import { useSelectors, useStore } from '../lib/hooks';

export function Agreements() {
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
        <Topbar title="Agreements" />
        <div className="content">
          <EmptyState
            icon={<Icon name="sign" />}
            title="No agreements yet"
            action={
              <button className="btn btn-primary" onClick={() => navigate('/clients/new')}>
                <Icon name="sign" /> Draft your first agreement
              </button>
            }
          >
            Every client starts with a drafted agreement — country-specific governing law, payment
            milestones, and a signature flow, generated for you.
          </EmptyState>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar
        title="Agreements"
        actions={
          <button className="btn btn-primary" onClick={() => navigate('/clients/new')}>
            <Icon name="sign" /> Draft new agreement
          </button>
        }
      />
      <div className="content">
        <Card>
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Client location</th>
                <th>Payment terms</th>
                <th>Last activity</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.clients.map((c) => {
                const dateNote = c.agreementSignedAt
                  ? `Signed ${fmtDate(c.agreementSignedAt)}`
                  : c.status === 'active' || c.status === 'overdue'
                    ? 'Signed'
                    : c.agreementSentAt
                      ? `Sent ${fmtDate(c.agreementSentAt)}`
                      : c.status === 'sent'
                        ? 'Sent'
                        : 'Not sent yet';
                return (
                  <tr
                    key={c.id}
                    className="clickable"
                    onClick={() => navigate(`/agreement/${c.id}`)}
                  >
                    <td>
                      <strong>{c.name}</strong>
                    </td>
                    <td>{c.country}</td>
                    <td>{c.milestones.map((m) => `${m.label} ${m.pct}%`).join(' / ')}</td>
                    <td style={{ color: 'var(--muted)' }}>{dateNote}</td>
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
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}

export function AgreementDetail() {
  const { id } = useParams();
  const { state, dispatch, toast } = useStore();
  const { clientById } = useSelectors();
  const navigate = useNavigate();

  const client = clientById(id);
  if (!client) {
    return (
      <>
        <Topbar eyebrow="Agreement" title="Not found" />
        <div className="content empty">No agreement to show.</div>
      </>
    );
  }

  const shareLink = `${location.origin}/sign/${client.id}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast('Share link copied');
    } catch {
      toast(shareLink);
    }
  }

  function share() {
    dispatch({ type: 'shareAgreement', id: client!.id });
    toast(`Agreement emailed to ${client!.email || client!.name}`);
  }

  return (
    <>
      <Topbar
        eyebrow="Agreement"
        title={client.name}
        actions={
          <>
            <button className="btn" onClick={() => window.print()}>
              <Icon name="print" /> Print / save PDF
            </button>
            {client.status === 'draft' ? (
              <button className="btn btn-primary" onClick={share}>
                <Icon name="mail" /> Share with client
              </button>
            ) : null}
          </>
        }
      />

      <div className="content">
        <div className="breadcrumb no-print">
          <Link to={`/clients/${client.id}`}>← {client.name}</Link>
        </div>

        {client.status === 'draft' ? (
          <div className="share-strip no-print">
            <div>
              <strong>Not sent yet.</strong>
              <span>
                {' '}
                {client.email
                  ? `We'll email it to ${client.email} once you share it.`
                  : `${client.name} can't see this agreement until you share it with them.`}
              </span>
            </div>
          </div>
        ) : client.status === 'sent' ? (
          <div className="share-strip share-strip-pending no-print">
            <div>
              <strong>Sent{client.agreementSentAt ? ` on ${fmtDate(client.agreementSentAt)}` : ''}.</strong>
              <span>
                {' '}
                Emailed to {client.email || client.name} — waiting on them to review and sign.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm" onClick={copyLink}>
                <Icon name="link" /> Copy share link
              </button>
              <button
                className="btn btn-sm"
                onClick={() => navigate(`/sign/${client.id}/preview`)}
              >
                <Icon name="file" /> Preview client view
              </button>
            </div>
          </div>
        ) : (
          <div className="share-strip share-strip-done no-print">
            <div>
              <strong>
                Signed{client.agreementSignedAt ? ` on ${fmtDate(client.agreementSignedAt)}` : ''}.
              </strong>
              <span>
                {' '}
                {client.signatureName
                  ? `${client.signatureName} accepted these terms on behalf of ${client.name}.`
                  : `${client.name} has agreed to these terms.`}
              </span>
            </div>
            <button className="btn btn-sm" onClick={copyLink}>
              <Icon name="link" /> Copy share link
            </button>
          </div>
        )}

        <AgreementDoc
          client={client}
          asClient={false}
          freelancerCountry={state.freelancer.country}
        />
      </div>
    </>
  );
}
