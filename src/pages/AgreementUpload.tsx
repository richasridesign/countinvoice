import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AgreementUploadFields, KeyTerms } from '../components/AgreementFiles';
import { Icon } from '../components/Icon';
import { Topbar } from '../components/ui';
import { readUploadChoice, storeUpload } from '../lib/files';
import { useSelectors, useStore } from '../lib/hooks';
import { TODAY } from '../lib/types';

/** Replaces an existing client's drafted agreement with an uploaded file. */
export function AgreementUpload() {
  const { id } = useParams();
  const { state, dispatch, toast } = useStore();
  const { clientById } = useSelectors();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const client = clientById(id);
  if (!client) {
    return (
      <>
        <Topbar eyebrow="Agreements" title="Not found" />
        <div className="content empty">No agreement to show.</div>
      </>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file || !client) return;
    const choice = readUploadChoice(new FormData(e.currentTarget));
    setSaving(true);
    try {
      const agreementFile = await storeUpload(file, choice.providedBy, TODAY);
      dispatch({
        type: 'attachAgreement',
        id: client.id,
        file: agreementFile,
        signed: choice.signed,
      });
    } catch {
      setSaving(false);
      toast("Couldn't save the file in this browser");
      return;
    }
    toast(
      choice.signed
        ? `Agreement saved. ${client.name} is now active.`
        : 'Agreement uploaded. Review it, then share.',
    );
    navigate(`/agreement/${client.id}`);
  }

  return (
    <>
      <Topbar eyebrow="Agreements" title={`Upload agreement for ${client.name}`} />
      <div className="content">
        <div className="breadcrumb">
          <Link to={`/agreement/${client.id}`}>← Back to agreement</Link>
        </div>

        <form className="form" onSubmit={onSubmit} style={{ marginTop: 10 }}>
          <AgreementUploadFields file={file} onFile={setFile} />

          <div className="terms-summary">
            <div className="clause-intro">
              <h3>Check these still match the file</h3>
              <Link to={`/clients/${client.id}/edit`} className="law-link">
                Edit terms
              </Link>
            </div>
            <KeyTerms client={client} freelancerCountry={state.freelancer.country} />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={!file || saving}>
              <Icon name="check" /> Save agreement
            </button>
            <Link className="btn btn-ghost" to={`/agreement/${client.id}`}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
