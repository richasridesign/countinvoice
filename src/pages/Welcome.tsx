import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useStore } from '../lib/hooks';

export function Welcome() {
  const { dispatch } = useStore();
  const navigate = useNavigate();

  function enter() {
    dispatch({ type: 'onboard' });
    navigate('/dashboard');
  }

  return (
    <>
      <div className="welcome">
        <div className="welcome-card">
          <div className="welcome-mark">C</div>
          <h1>
            An agent that runs
            <br />
            your paperwork.
          </h1>
          <p className="lede">
            Your CountInvoice agent drafts each client's agreement, tracks the hours, and prepares
            the invoices — nothing goes out to a client until you approve it.
          </p>

          <div className="field">
            <label htmlFor="wemail">Email</label>
            <input type="email" id="wemail" defaultValue="you@gmail.com" placeholder="you@gmail.com" />
          </div>

          <button className="btn btn-primary" onClick={enter}>
            <Icon name="mail" /> Send sign-in link
          </button>

          <div className="divider-row">or</div>

          <button
            className="btn"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={enter}
          >
            <Icon name="google" /> Continue with Google
          </button>

          <p className="fine">Prototype build — sign-in is simulated, no email is sent.</p>
        </div>
      </div>
      <div className="proto-badge">Prototype · v0.1</div>
    </>
  );
}
