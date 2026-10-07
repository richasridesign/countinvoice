import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AgreementUploadFields } from '../components/AgreementFiles';
import { Icon } from '../components/Icon';
import { Topbar } from '../components/ui';
import { readUploadChoice, storeUpload } from '../lib/files';
import { useSelectors, useStore } from '../lib/hooks';
import { COUNTRIES, TODAY, type EngagementType } from '../lib/types';

/** Demo values the simulated agent "reads" from an uploaded file into empty fields. */
const AGENT_READ: Record<string, (fileName: string) => string> = {
  type: () => 'Retainer',
  rate: () => '60',
  upfront: () => '50',
  delivery: () => '50',
  notes: (name) => `As set out in ${name}.`,
};

function PrefillTag({ show }: { show: boolean }) {
  return show ? <span className="prefill-tag">Pre-filled</span> : null;
}

export function ClientForm() {
  const { id } = useParams();
  const { state, dispatch, toast } = useStore();
  const { clientById } = useSelectors();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const editing = Boolean(id);
  const client = clientById(id);

  const [mode, setMode] = useState<'draft' | 'upload'>(
    params.get('agreement') === 'upload' ? 'upload' : 'draft',
  );
  const [file, setFile] = useState<File | null>(null);
  const [reading, setReading] = useState<'idle' | 'reading' | 'done'>('idle');
  const [prefilled, setPrefilled] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const uploading = !editing && mode === 'upload';

  // Simulated agent read: after a beat, fill empty term fields from the "file".
  useEffect(() => {
    if (!file || !uploading) return;
    const t = window.setTimeout(() => {
      const filled = new Set<string>();
      for (const [name, value] of Object.entries(AGENT_READ)) {
        const el = form.current?.elements.namedItem(name) as HTMLInputElement | null;
        if (!el) continue;
        if (!el.value || el.dataset.touched !== 'true') {
          if (!el.value) el.value = value(file.name);
          filled.add(name);
        }
      }
      setPrefilled(filled);
      setReading('done');
    }, 1200);
    return () => window.clearTimeout(t);
  }, [file, uploading]);

  function onFile(f: File | null) {
    setFile(f);
    if (f) {
      setReading('reading');
    } else {
      setReading('idle');
      setPrefilled(new Set());
    }
  }

  function touch(e: React.FormEvent<HTMLElement>) {
    const el = e.target as HTMLInputElement;
    el.dataset.touched = 'true';
    if (prefilled.has(el.name)) {
      const next = new Set(prefilled);
      next.delete(el.name);
      setPrefilled(next);
    }
  }

  if (editing && !client) {
    return (
      <>
        <Topbar eyebrow="Clients" title="Not found" />
        <div className="content empty">This client doesn't exist.</div>
      </>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const milestones = [
      { label: 'Upfront', pct: Number(f.get('upfront')) || 0 },
      { label: 'On delivery', pct: Number(f.get('delivery')) || 0 },
    ];

    const fields = {
      name: String(f.get('name')),
      email: String(f.get('email')),
      country: String(f.get('country')),
      city: String(f.get('city')) || '—',
      type: String(f.get('type')) as EngagementType,
      rate: Number(f.get('rate')) || 0,
      milestones,
      notes: String(f.get('notes')),
    };

    if (editing && client) {
      dispatch({ type: 'updateClient', id: client.id, patch: fields });
      toast('Client details updated');
      navigate(`/clients/${client.id}`);
      return;
    }

    // The new client's id is derived from the sequence the reducer will consume.
    const newId = `c${state.seq}`;

    if (uploading) {
      if (!file) return;
      const choice = readUploadChoice(f);
      setSaving(true);
      try {
        const agreementFile = await storeUpload(file, choice.providedBy, TODAY);
        dispatch({ type: 'addClient', client: fields, agreementFile, signed: choice.signed });
      } catch {
        setSaving(false);
        toast("Couldn't save the file in this browser");
        return;
      }
      toast(
        choice.signed
          ? `Agreement saved. ${fields.name} is now active.`
          : 'Agreement uploaded. Review it, then share.',
      );
      navigate(`/agreement/${newId}`);
      return;
    }

    dispatch({ type: 'addClient', client: fields });
    toast('Client added — review the draft agreement');
    navigate(`/agreement/${newId}`);
  }

  return (
    <>
      <Topbar eyebrow="Clients" title={editing ? 'Edit client' : 'Add a client'} />
      <div className="content">
        <div className="breadcrumb">
          <Link to="/clients">← All clients</Link>
        </div>

        <form
          ref={form}
          className="form"
          onSubmit={onSubmit}
          onInput={touch}
          style={{ marginTop: 10 }}
        >
          {editing ? null : (
            <fieldset className="field">
              <legend>Agreement</legend>
              <div className="choice-cards">
                <label className={mode === 'draft' ? 'choice selected' : 'choice'}>
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === 'draft'}
                    onChange={() => setMode('draft')}
                  />
                  <strong>Draft one for me</strong>
                  <span>Your agent drafts it from the terms below.</span>
                </label>
                <label className={mode === 'upload' ? 'choice selected' : 'choice'}>
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === 'upload'}
                    onChange={() => setMode('upload')}
                  />
                  <strong>Upload an existing one</strong>
                  <span>Already signed, or the client has their own.</span>
                </label>
              </div>
            </fieldset>
          )}

          {uploading ? (
            <AgreementUploadFields file={file} onFile={onFile}>
              {reading === 'idle' ? null : (
                <div className={`agent-strip${reading === 'done' ? ' agent-strip-done' : ''}`}>
                  {reading === 'reading' ? (
                    <>
                      <span className="spinner" aria-hidden="true" /> Reading {file?.name}…
                    </>
                  ) : (
                    <>
                      <Icon name="check" /> Your agent read the agreement and filled in the terms
                      below. Check them before saving.
                    </>
                  )}
                </div>
              )}
            </AgreementUploadFields>
          ) : null}

          <div className="field-row">
            <div className="field">
              <label>
                Client or company name <span className="req">*</span>
              </label>
              <input
                type="text"
                name="name"
                placeholder="e.g. Marlowe & Co"
                defaultValue={client?.name ?? ''}
                required
              />
            </div>
            <div className="field">
              <label>
                Client email <span className="req">*</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="e.g. hello@marlowe.co"
                defaultValue={client?.email ?? ''}
                required
              />
              <span className="hint">Where we'll send the agreement for signature.</span>
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Country</label>
              <select name="country" defaultValue={client?.country ?? 'Germany'}>
                {COUNTRIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <span className="hint">
                Where the client is based — used for their invoice address.
              </span>
            </div>
            <div className="field">
              <label>City</label>
              <input
                type="text"
                name="city"
                placeholder="e.g. Porto"
                defaultValue={client?.city ?? ''}
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>
                Engagement type <PrefillTag show={prefilled.has('type')} />
              </label>
              <select name="type" defaultValue={client?.type ?? 'Retainer'}>
                <option>Retainer</option>
                <option>Project</option>
              </select>
            </div>
            <div className="field">
              <label>
                Rate <span className="req">*</span> <PrefillTag show={prefilled.has('rate')} />
              </label>
              <input
                className="mono-input"
                type="number"
                name="rate"
                min="0"
                placeholder="e.g. 60"
                defaultValue={client?.rate ?? ''}
                required
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>
                Upfront % <PrefillTag show={prefilled.has('upfront')} />
              </label>
              <input
                className="mono-input"
                type="number"
                name="upfront"
                min="0"
                max="100"
                defaultValue={client?.milestones[0]?.pct ?? 50}
              />
            </div>
            <div className="field">
              <label>
                On delivery % <PrefillTag show={prefilled.has('delivery')} />
              </label>
              <input
                className="mono-input"
                type="number"
                name="delivery"
                min="0"
                max="100"
                defaultValue={client?.milestones[1]?.pct ?? 50}
              />
            </div>
          </div>

          <div className="field">
            <label>
              Scope notes <PrefillTag show={prefilled.has('notes')} />
            </label>
            <textarea
              name="notes"
              placeholder="What is this engagement covering?"
              defaultValue={client?.notes ?? ''}
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || (uploading && (!file || reading === 'reading'))}
            >
              <Icon name={editing || uploading ? 'check' : 'file'} />{' '}
              {editing ? 'Save changes' : uploading ? 'Save agreement' : 'Draft agreement'}
            </button>
            <Link className="btn btn-ghost" to={client ? `/clients/${client.id}` : '/clients'}>
              Cancel
            </Link>
          </div>

          <p className="hint">
            <span className="req">*</span> Required
          </p>
        </form>
      </div>
    </>
  );
}
