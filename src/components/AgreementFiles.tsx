import { useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';
import { Pill } from './ui';
import { ACCEPT, fileSize, isPdf, useFileUrl, validateFile } from '../lib/files';
import { fmtDate, milestoneValue, money } from '../lib/format';
import { LAW_LINKS, TODAY, type AgreementFile, type Client } from '../lib/types';

/** Drag-and-drop file picker for agreement uploads. Shows a file card once chosen. */
export function FileDrop({
  file,
  onChange,
  disabled = false,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  function pick(f?: File) {
    if (!f) return;
    const problem = validateFile(f);
    setError(problem);
    onChange(problem ? null : f);
  }

  if (file) {
    return (
      <div className="file-card">
        <Icon name="file" />
        <div className="file-card-body">
          <strong>{file.name}</strong>
          <span>{fileSize(file.size)}</span>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(null)}>
          Remove
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        className={`dropzone${over ? ' dropzone-over' : ''}${error ? ' dropzone-error' : ''}${disabled ? ' dropzone-disabled' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (!disabled) pick(e.dataTransfer.files[0]);
        }}
      >
        <Icon name="upload" />
        <span>
          Drop a PDF here or{' '}
          <button
            type="button"
            className="link-btn"
            disabled={disabled}
            onClick={() => input.current?.click()}
          >
            browse
          </button>
        </span>
        <input
          ref={input}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
      {error ? (
        <span className="field-error" role="alert">
          {error}
        </span>
      ) : (
        <span className="hint">PDF, DOC or DOCX, up to 10 MB. Stays in this browser.</span>
      )}
    </>
  );
}

/** A stored agreement file with a Download action. */
export function StoredFileCard({ file, extra }: { file: AgreementFile; extra?: ReactNode }) {
  const { url, missing } = useFileUrl(file);
  return (
    <div className="file-card">
      <Icon name="file" />
      <div className="file-card-body">
        <strong>{file.name}</strong>
        <span>{missing ? "This file isn't stored in this browser." : fileSize(file.size)}</span>
      </div>
      {extra}
      {url ? (
        <a className="btn btn-sm" href={url} download={file.name}>
          <Icon name="download" /> Download
        </a>
      ) : null}
    </div>
  );
}

/** Opens the file in a new tab (PDFs render in the browser's viewer). */
export function OpenFileLink({ file, children }: { file: AgreementFile; children: ReactNode }) {
  const { url } = useFileUrl(file);
  if (!url) return null;
  return (
    <a className="btn btn-sm" href={url} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

/** Download button for the topbar. */
export function DownloadButton({ file }: { file: AgreementFile }) {
  const { url } = useFileUrl(file);
  return url ? (
    <a className="btn" href={url} download={file.name}>
      <Icon name="download" /> Download
    </a>
  ) : null;
}

function FilePreview({ file }: { file: AgreementFile }) {
  const { url, missing } = useFileUrl(file);
  if (missing) {
    return <div className="file-preview-note">This file isn't stored in this browser.</div>;
  }
  if (!isPdf(file)) {
    return (
      <div className="file-preview-note">
        Preview isn't available for Word files. Download to open it.
      </div>
    );
  }
  return url ? <iframe className="pdf-frame" src={url} title={file.name} /> : null;
}

/** Key commercial terms, shared by the uploaded doc and the upload page. */
export function KeyTerms({
  client,
  freelancerCountry,
}: {
  client: Client;
  freelancerCountry: string;
}) {
  const law = LAW_LINKS[freelancerCountry];
  return (
    <>
      <div className="clause">
        <h3>Engagement</h3>
        <p>
          {client.type} engagement at{' '}
          {client.type === 'Retainer'
            ? `${money(client.rate, client.currency)} per hour.`
            : `${money(client.rate, client.currency)} fixed fee.`}
        </p>
      </div>
      <div className="clause">
        <h3>Payment milestones</h3>
        {client.milestones.map((m) => (
          <div className="milestone-row" key={m.label}>
            <span>{m.label}</span>
            <span className="num">
              {m.pct}% · {milestoneValue(client, m)}
            </span>
          </div>
        ))}
      </div>
      <div className="clause">
        <h3>Governing law</h3>
        <p>
          As set out in the uploaded agreement. Your default is {freelancerCountry}
          {law ? ` (${law.label})` : ''}.
        </p>
      </div>
    </>
  );
}

/**
 * An uploaded agreement: the file itself, previewed inline when it's a PDF,
 * with the key terms invoices are built from.
 */
export function UploadedAgreementDoc({
  client,
  asClient,
  freelancerCountry,
}: {
  client: Client;
  asClient: boolean;
  freelancerCountry: string;
}) {
  const file = client.agreementFile!;
  const providedBy =
    file.providedBy === 'client'
      ? asClient
        ? 'provided by you'
        : `provided by ${client.name}`
      : asClient
        ? 'provided by your contractor'
        : 'provided by you';

  return (
    <div className="doc-wrap">
      <div className="doc">
        <div className="doc-head">
          <div>
            <h2>Service Agreement</h2>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
              Uploaded {fmtDate(file.uploadedAt || TODAY)} · {providedBy}
            </div>
          </div>
          <div className="meta">
            Status
            <span className="num">
              <Pill status={client.status} />
            </span>
          </div>
        </div>

        <div className="no-print">
          <StoredFileCard file={file} />
          <FilePreview file={file} />
        </div>

        {asClient ? null : (
          <>
            <div className="clause-intro">
              <h3>Key terms</h3>
              <Link to={`/clients/${client.id}/edit`} className="law-link no-print">
                Edit terms
              </Link>
            </div>
            <p className="clause-hint">
              Confirmed by you from the uploaded file. Invoices use these terms.
            </p>
            <KeyTerms client={client} freelancerCountry={freelancerCountry} />
          </>
        )}

        <div className="doc-note">
          {asClient
            ? 'Shared by your contractor via CountInvoice.'
            : "Uploaded agreements aren't checked by your agent. Have a lawyer review anything you didn't write."}
        </div>
      </div>
    </div>
  );
}

/**
 * File picker plus "who provided it" and "already signed" questions. The file
 * is controlled by the parent; the other answers are read with readUploadChoice.
 */
export function AgreementUploadFields({
  file,
  onFile,
  children,
}: {
  file: File | null;
  onFile: (file: File | null) => void;
  /** Rendered between the file picker and the questions (e.g. the agent-read strip). */
  children?: ReactNode;
}) {
  const [signed, setSigned] = useState(false);
  return (
    <>
      <div className="field">
        <label>
          Agreement file <span className="req">*</span>
        </label>
        <FileDrop file={file} onChange={onFile} />
      </div>

      {children}

      <fieldset className="field">
        <legend>Who provided it?</legend>
        <div className="radio-row">
          <label>
            <input type="radio" name="providedBy" value="freelancer" defaultChecked /> Me
          </label>
          <label>
            <input type="radio" name="providedBy" value="client" /> The client
          </label>
        </div>
      </fieldset>

      <fieldset className="field">
        <legend>Is it already signed?</legend>
        <div className="radio-row">
          <label>
            <input
              type="radio"
              name="alreadySigned"
              value="yes"
              checked={signed}
              onChange={() => setSigned(true)}
            />{' '}
            Yes, it's already in effect
          </label>
          <label>
            <input
              type="radio"
              name="alreadySigned"
              value="no"
              checked={!signed}
              onChange={() => setSigned(false)}
            />{' '}
            No, I'll send it for signature
          </label>
        </div>
      </fieldset>

      {signed ? (
        <div className="field-row">
          <div className="field">
            <label>Signed on</label>
            <input type="date" name="signedOn" defaultValue={TODAY} max={TODAY} required />
          </div>
          <div className="field">
            <label>Signed by</label>
            <input type="text" name="signedBy" placeholder="Client signatory's name" />
          </div>
        </div>
      ) : null}
    </>
  );
}
