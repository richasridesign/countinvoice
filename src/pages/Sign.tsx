import { useNavigate, useParams } from 'react-router-dom';
import { AgreementDoc } from '../components/AgreementDoc';
import { Icon } from '../components/Icon';
import { fmtDate } from '../lib/format';
import { useSelectors, useStore } from '../lib/hooks';

/**
 * The client-facing signature page, served from a shareable link. `preview`
 * renders it read-only so the freelancer can see what the client will see.
 */
export function Sign({ preview = false }: { preview?: boolean }) {
  const { id } = useParams();
  const { state, dispatch, toast } = useStore();
  const { clientById } = useSelectors();
  const navigate = useNavigate();

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

  const doc = (
    <AgreementDoc client={client} asClient freelancerCountry={state.freelancer.country} />
  );

  let body;
  if (client.status === 'draft') {
    body = (
      <>
        {doc}
        <div className="sign-panel">
          <h3>Not yet available</h3>
          <p>
            This agreement hasn't been sent for signature yet. Check back once you've been
            notified.
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
              <p>"I have reviewed and agree to the terms of this Service Agreement."</p>
            </div>
            <div className="preview-field">
              <span className="preview-label">Signature</span>
              <p>Typed full name, entered by {client.name}.</p>
            </div>
          </div>
        ) : (
          <div className="sign-panel">
            <h3>Review and sign</h3>
            <p>Read the agreement above, then sign below to accept its terms and get started.</p>
            <form onSubmit={onSign}>
              <label className="sign-check">
                <input type="checkbox" name="agree" required /> I have reviewed and agree to the
                terms of this Service Agreement.
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
              Your contractor has been notified and will start tracking work against this
              agreement.
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
            <span> Signing is disabled here — only {client.name} can sign, from their own link.</span>
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
