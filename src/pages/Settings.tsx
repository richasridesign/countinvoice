import { Icon } from '../components/Icon';
import { Topbar } from '../components/ui';
import { useStore } from '../lib/hooks';
import { COUNTRIES } from '../lib/types';

export function Settings() {
  const { state, dispatch, toast } = useStore();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    dispatch({ type: 'setCountry', country: String(f.get('country')) });
    toast('Settings saved');
  }

  return (
    <>
      <Topbar title="Settings" />
      <div className="content">
        <form className="form" onSubmit={onSubmit}>
          <div className="field">
            <label>Your country</label>
            <select name="country" defaultValue={state.freelancer.country}>
              {COUNTRIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <span className="hint">
              This is what governs every agreement your agent drafts — not the client's country.
              It's the law you can actually act on if a client doesn't pay.
            </span>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              <Icon name="check" /> Save
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
