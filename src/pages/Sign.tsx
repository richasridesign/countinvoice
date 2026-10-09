import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AgreementDoc } from '../components/AgreementDoc';
import { FileDrop, UploadedAgreementDoc } from '../components/AgreementFiles';
import { Icon } from '../components/Icon';
import { storeUpload } from '../lib/files';
import { fmtDate } from '../lib/format';
import { useSelectors, useStore } from '../lib/hooks';
import { TODAY } from '../lib/types';

/** Lets the client send their own agreement for the contractor to review. */
function ProposeOwnAgreement({ clientId, onDone }: { clientId: string; onDone: () => void }) {
  const { dispatch, toast } = useStore();
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;
    const note = String(new FormData(e.currentTarget).get('note') || '').trim();
    setSaving(true);
    try {
      const stored = await storeUpload(file, 'client', TODAY);
      dispatch({
        type: 'proposeClientAgreement',
        id: clientId,
        proposal: { ...stored, note: note || undefined },
      });
      toast('Sent to your contractor');
    } catch {
      setSaving(false);
      toast("Couldn't save the file in this browser");
    }
  }

  return (
    <form className="propose-panel" onSubmit={onSubmit}>
      <h3>Propose your own agreement</h3>
      <p>
        Upload the agreement your company uses. Your contractor will review it before anything is
        signed.
      </p>
      <div className="field">
        <FileDrop file={file} onChange={setFile} />
      </div>
      <div className="field">
        <label>Note for your contractor (optional)</label>
        <textarea name="note" placeholder="e.g. This is our standard services agreement." />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={!file || saving}>
          <Icon name="mail" /> Send to contractor
        </button>
        <button type="button" className="btn btn-ghost" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/**
 * The client-facing signature page, served from a shareable link. `preview`
 * renders it read-only so the freelancer can see what the client will see.
 */
export function Sign({ preview = false }: { preview?: boolean }) {
  const { id } = useParams();
  const { state, dispatch, toast } = useStore();
  const { clientById } = useSelectors();
  const navigate = useNavigate();
  const [proposing, setProposing] = useState(false);

  const client = clientById(id);

  if (!client) {
    return (
      <div className="sign-page">
        <div className="sign-header">
          <div className="brand-mark">C</div>
          <div className="brand-name display">CountInvoice</div>
        </div>
        <div className="sign-panel">
          <h3>Link not found</h3>
          <p>This agreement link is no longer valid.</p>
        </div>
      </div>
    );
  }

  function onSign(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    dispatch({
      type: 'signAgreement',
      id: client!.id,
      signatureName: String(f.get('signature')),
    });
    toast('Agreement signed');
  }

  const uploaded = Boolean(client.agreementFile);
  const doc = uploaded ? (
    <UploadedAgreementDoc client={client} asClient freelancerCountry={state.freelancer.country} />
  ) : (
    <AgreementDoc client={client} asClient freelancerCountry={state.freelancer.country} />
  );
  const agreeText = uploaded
    ? 'I have read the attached agreement and agree to its terms.'
    : 'I have reviewed and agree to the terms of this Service Agreement.';

  let body;
  if (client.status === 'draft') {
    body = (
      <>
        {doc}
        <div className="sign-panel">
          <h3>Not yet available</h3>
          <p>
            This agreement hasn't been sent for signature yet. Check back once you've been notified.
          </p>
        </div>
      </>
    );
  } else if (client.status === 'sent') {
    body = (
      <>
        {doc}
        {preview ? (
          <div className="sign-panel">
            <h3>Review and sign</h3>
            <p>This is what {client.name} will do on their own copy of this page.</p>
            <div className="preview-field">
              <span className="preview-label">Confirmation</span>
              <p>"{agreeText}"</p>
            </div>
            <div className="preview-field">
              <span className="preview-label">Signature</span>
              <p>Typed full name, entered by {client.name}.</p>
            </div>
            <div className="propose-toggle">
              <button type="button" className="link-btn" disabled>
                Want to use your own agreement?
              </button>
              <span className="hint">Your client can propose their own agreement here.</span>
            </div>
          </div>
        ) : client.clientProposal ? (
          <div className="sign-panel">
            <h3>Sent</h3>
            <p style={{ marginBottom: 0 }}>
              Your contractor is reviewing {client.clientProposal.name}. You'll get the agreement to
              sign once they've responded.
            </p>
          </div>
        ) : (
          <div className="sign-panel">
            <h3>Review and sign</h3>
            <p>Read the agreement above, then sign below to accept its terms and get started.</p>
            <form onSubmit={onSign}>
              <label className="sign-check">
                <input type="checkbox" name="agree" required /> {agreeText}
              </label>
              <div className="field">
                <label>Type your full name to sign</label>
                <input type="text" name="signature" placeholder={`e.g. ${client.name}`} required />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  <Icon name="check" /> Accept &amp; sign agreement
                </button>
              </div>
            </form>
            {proposing ? (
              <ProposeOwnAgreement clientId={client.id} onDone={() => setProposing(false)} />
            ) : (
              <div className="propose-toggle">
                <button type="button" className="link-btn" onClick={() => setProposing(true)}>
                  Want to use your own agreement?
                </button>
              </div>
            )}
          </div>
        )}
      </>
    );
  } else {
    body = (
      <>
        <div className="sign-confirm">
          <div className="empty-icon">
            <Icon name="check" />
          </div>
          <div>
            <h3>
              Signed{client.agreementSignedAt ? ` on ${fmtDate(client.agreementSignedAt)}` : ''}
            </h3>
            <p>
              {client.signatureName
                ? `${client.signatureName}, thanks for signing.`
                : 'Thanks for signing.'}{' '}
              Your contractor has been notified and will start tracking work against this agreement.
            </p>
          </div>
        </div>
        {doc}
      </>
    );
  }

  return (
    <div className="sign-page">
      <div className="sign-header">
        <div className="brand-mark">C</div>
        <div className="brand-name display">CountInvoice</div>
      </div>
      <div className="sign-eyebrow">
        {preview ? 'Preview' : `Sent to ${client.name} for signature`}
      </div>

      {preview ? (
        <div
          className="share-strip share-strip-pending"
          style={{ maxWidth: 640, margin: '0 auto 18px auto' }}
        >
          <div>
            <strong>Previewing as {client.name} would see it.</strong>
            <span>
              {' '}
              Signing is off here. Only {client.name} can sign, from their own link.
            </span>
          </div>
          <button className="btn btn-sm" onClick={() => navigate(`/agreement/${client.id}`)}>
            Back to agreement
          </button>
        </div>
      ) : null}

      {body}
    </div>
  );
}
