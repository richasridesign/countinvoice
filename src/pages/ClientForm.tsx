import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Topbar } from '../components/ui';
import { useSelectors, useStore } from '../lib/hooks';
import { COUNTRIES, type EngagementType } from '../lib/types';

export function ClientForm() {
  const { id } = useParams();
  const { state, dispatch, toast } = useStore();
  const { clientById } = useSelectors();
  const navigate = useNavigate();

  const editing = Boolean(id);
  const client = clientById(id);

  if (editing && !client) {
    return (
      <>
        <Topbar eyebrow="Clients" title="Not found" />
        <div className="content empty">This client doesn't exist.</div>
      </>
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
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

        <form className="form" onSubmit={onSubmit} style={{ marginTop: 10 }}>
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
              <label>Engagement type</label>
              <select name="type" defaultValue={client?.type ?? 'Retainer'}>
                <option>Retainer</option>
                <option>Project</option>
              </select>
            </div>
            <div className="field">
              <label>
                Rate <span className="req">*</span>
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
              <label>Upfront %</label>
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
              <label>On delivery %</label>
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
            <label>Scope notes</label>
            <textarea
              name="notes"
              placeholder="What is this engagement covering?"
              defaultValue={client?.notes ?? ''}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              <Icon name={editing ? 'check' : 'file'} />{' '}
              {editing ? 'Save changes' : 'Draft agreement'}
            </button>
            <Link
              className="btn btn-ghost"
              to={client ? `/clients/${client.id}` : '/clients'}
            >
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
