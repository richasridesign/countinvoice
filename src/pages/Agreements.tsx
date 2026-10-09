import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AgreementDoc } from '../components/AgreementDoc';
import {
  DownloadButton,
  OpenFileLink,
  StoredFileCard,
  UploadedAgreementDoc,
} from '../components/AgreementFiles';
import { Icon } from '../components/Icon';
import { Card, EmptyState, Pill, Topbar } from '../components/ui';
import { RowActions } from './Clients';
import { fmtDate } from '../lib/format';
import { useSelectors, useStore } from '../lib/hooks';
import type { Client } from '../lib/types';

function agreementSource(c: Client): string {
  if (!c.agreementFile) return 'Drafted by agent';
  return c.agreementFile.providedBy === 'client' ? "Client's agreement" : 'Uploaded by you';
}

function lastActivity(c: Client): string {
  if (c.clientProposal) return `${c.name} sent their own agreement`;
  if (c.signedOutside && c.agreementSignedAt) {
    return `Signed outside CountInvoice ${fmtDate(c.agreementSignedAt)}`;
  }
  if (c.agreementSignedAt) return `Signed ${fmtDate(c.agreementSignedAt)}`;
  if (c.status === 'active' || c.status === 'overdue') return 'Signed';
  if (c.agreementSentAt) return `Sent ${fmtDate(c.agreementSentAt)}`;
  if (c.status === 'sent') return 'Sent';
  return 'Not sent yet';
}

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
            title="No agreements yet"
            action={
              <div className="empty-actions">
                <button className="btn" onClick={() => navigate('/clients/new')}>
                  <Icon name="sign" /> Draft your first agreement
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => navigate('/clients/new?agreement=upload')}
                >
                  <Icon name="upload" /> Upload an existing agreement
                </button>
              </div>
            }
          >
            Your agent drafts one with country-specific governing law, payment milestones and a
            signature flow. Already have an agreement? Upload it instead.
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
          <>
            <button
              className="btn btn-ghost"
              onClick={() => navigate('/clients/new?agreement=upload')}
            >
              <Icon name="upload" /> Upload existing
            </button>
            <button className="btn" onClick={() => navigate('/clients/new')}>
              <Icon name="sign" /> Draft new agreement
            </button>
          </>
        }
      />
      <div className="content">
        <Card>
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Client location</th>
                <th>Source</th>
                <th>Payment terms</th>
                <th>Last activity</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.clients.map((c) => {
                const dateNote = lastActivity(c);
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
                    <td style={{ color: 'var(--muted)' }}>{agreementSource(c)}</td>
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

  function switchToDrafted() {
    dispatch({ type: 'removeAgreementFile', id: client!.id });
    toast('Switched back to the drafted agreement.');
  }

  function acceptProposal() {
    dispatch({ type: 'acceptClientProposal', id: client!.id });
    toast(`Using ${client!.name}'s agreement. Sent back for signature.`);
  }

  function keepMine() {
    dispatch({ type: 'declineClientProposal', id: client!.id });
    toast(`Kept your agreement. ${client!.name} can still sign it.`);
  }

  const uploaded = client.agreementFile;
  const proposal = client.clientProposal;

  return (
    <>
      <Topbar
        eyebrow="Agreement"
        title={client.name}
        actions={
          <>
            {client.status === 'draft' ? (
              uploaded ? (
                <button className="btn btn-ghost" onClick={switchToDrafted}>
                  <Icon name="sign" /> Use drafted agreement
                </button>
              ) : (
                <button
                  className="btn btn-ghost"
                  onClick={() => navigate(`/agreement/${client.id}/upload`)}
                >
                  <Icon name="upload" /> Upload instead
                </button>
              )
            ) : null}
            {uploaded ? (
              <DownloadButton file={uploaded} />
            ) : (
              <button className="btn" onClick={() => window.print()}>
                <Icon name="print" /> Print / save PDF
              </button>
            )}
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

        {proposal ? (
          <div className="share-strip share-strip-pending share-strip-stack no-print">
            <div>
              <strong>
                {client.name} sent their own agreement on {fmtDate(proposal.uploadedAt)}.
              </strong>
              <span> Use it instead of yours, or keep yours and let them sign it.</span>
            </div>
            {proposal.note ? (
              <blockquote className="proposal-note">{proposal.note}</blockquote>
            ) : null}
            <StoredFileCard
              file={proposal}
              extra={
                <OpenFileLink file={proposal}>
                  <Icon name="external" /> Open preview
                </OpenFileLink>
              }
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-sm btn-primary" onClick={acceptProposal}>
                <Icon name="check" /> Accept and send for signature
              </button>
              <button className="btn btn-sm btn-ghost" onClick={keepMine}>
                Keep mine
              </button>
            </div>
          </div>
        ) : client.status === 'draft' ? (
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
              <strong>
                Sent{client.agreementSentAt ? ` on ${fmtDate(client.agreementSentAt)}` : ''}.
              </strong>
              <span>
                {' '}
                Emailed to {client.email || client.name}. Waiting on them to review and sign.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm" onClick={copyLink}>
                <Icon name="link" /> Copy share link
              </button>
              <button className="btn btn-sm" onClick={() => navigate(`/sign/${client.id}/preview`)}>
                <Icon name="file" /> Preview client view
              </button>
            </div>
          </div>
        ) : (
          <div className="share-strip share-strip-done no-print">
            <div>
              {client.signedOutside ? (
                <>
                  <strong>
                    Signed outside CountInvoice
                    {client.agreementSignedAt ? ` on ${fmtDate(client.agreementSignedAt)}` : ''}
                    {client.signatureName ? ` by ${client.signatureName}` : ''}.
                  </strong>
                  <span> Already in effect, so there's nothing to send.</span>
                </>
              ) : (
                <>
                  <strong>
                    Signed
                    {client.agreementSignedAt ? ` on ${fmtDate(client.agreementSignedAt)}` : ''}.
                  </strong>
                  <span>
                    {' '}
                    {client.signatureName
                      ? `${client.signatureName} accepted these terms on behalf of ${client.name}.`
                      : `${client.name} has agreed to these terms.`}
                  </span>
                </>
              )}
            </div>
            {client.signedOutside ? null : (
              <button className="btn btn-sm" onClick={copyLink}>
                <Icon name="link" /> Copy share link
              </button>
            )}
          </div>
        )}

        {uploaded ? (
          <UploadedAgreementDoc
            client={client}
            asClient={false}
            freelancerCountry={state.freelancer.country}
          />
        ) : (
          <AgreementDoc
            client={client}
            asClient={false}
            freelancerCountry={state.freelancer.country}
          />
        )}
      </div>
    </>
  );
}
