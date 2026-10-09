import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { AgentNote, Topbar } from '../components/ui';
import { draftsFromCalendar } from '../lib/calendar';
import { fmtDate } from '../lib/format';
import { useStore } from '../lib/hooks';
import { DEFAULT_TEMPLATE, REMINDER_STEPS, rulesOf } from '../lib/reminders';
import { COUNTRIES, type CalendarProvider, type ReminderRules } from '../lib/types';

export function Settings() {
  const { state, dispatch, toast } = useStore();
  const { hash } = useLocation();

  // Links like /settings#reminders land on that section.
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
  }, [hash]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    dispatch({ type: 'setCountry', country: String(f.get('country')) });
    toast('Settings saved');
  }

  return (
    <>
      <Topbar title="Settings" />
      <div className="content settings">
        <section className="settings-section">
          <h2>Your country</h2>
          <form className="form" onSubmit={onSubmit}>
            <div className="field">
              <label>Country</label>
              <select name="country" defaultValue={state.freelancer.country}>
                {COUNTRIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <span className="hint">
                This governs every agreement your agent drafts, not the client's country.
                It's the law you can actually act on if a client doesn't pay.
              </span>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn">
                <Icon name="check" /> Save
              </button>
            </div>
          </form>
        </section>

        <ReminderSettings />
        <CalendarSettings />
      </div>
    </>
  );
}

function ReminderSettings() {
  const { state, dispatch, toast } = useStore();
  const [rules, setRules] = useState<ReminderRules>(() => rulesOf(state));
  const [template, setTemplate] = useState(state.reminderTemplate ?? DEFAULT_TEMPLATE);
  const [editing, setEditing] = useState(false);

  function save() {
    dispatch({ type: 'setReminderRules', rules, template: template.trim() || DEFAULT_TEMPLATE });
    setEditing(false);
    toast('Reminder rules saved');
  }

  return (
    <section className="settings-section" id="reminders">
      <h2>Payment reminders</h2>
      <p className="settings-intro">Your agent sends these for you. You can turn any of them off.</p>

      <div className="rule-list">
        {REMINDER_STEPS.map((step) => (
          <label className="rule" key={step.key}>
            <span className="rule-body">
              <strong>{step.label}</strong>
              <span>
                {step.ask
                  ? 'Your agent drafts a firmer reminder and waits for your OK.'
                  : 'Sent automatically with your template.'}
              </span>
            </span>
            <input
              type="checkbox"
              role="switch"
              className="switch"
              checked={rules[step.key]}
              onChange={(e) => setRules({ ...rules, [step.key]: e.target.checked })}
            />
          </label>
        ))}
      </div>

      <AgentNote
        did="sends reminders on these dates."
        privacy="Your client only sees the reminder"
        needsOk="Anything after 14 days waits for your approval"
      />

      {editing ? (
        <div className="field">
          <label htmlFor="reminder-template">Reminder template</label>
          <textarea
            id="reminder-template"
            rows={4}
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
          />
          <span className="hint">
            {'{client}'}, {'{number}'}, {'{amount}'} and {'{due}'} are filled in for each invoice.
          </span>
        </div>
      ) : null}

      <div className="form-actions">
        <button className="btn" onClick={save}>
          <Icon name="check" /> Save rules
        </button>
        {editing ? null : (
          <button className="btn btn-ghost" onClick={() => setEditing(true)}>
            <Icon name="edit" /> Edit template
          </button>
        )}
      </div>
    </section>
  );
}

function CalendarSettings() {
  const { state, dispatch, toast } = useStore();
  const drafts = state.calendarDrafts ?? [];

  function connect(provider: CalendarProvider) {
    const count = draftsFromCalendar(state).length;
    dispatch({ type: 'connectCalendar', provider });
    toast(
      count
        ? `${provider} Calendar connected. Your agent drafted ${count} tasks.`
        : `${provider} Calendar connected. Add a client so your agent can match meetings.`,
    );
  }

  return (
    <section className="settings-section" id="calendar">
      <h2>Calendar</h2>
      <p className="settings-intro">
        Your agent turns client meetings into draft tasks. Events stay private until you approve
        them.
      </p>

      {state.calendar ? (
        <div className="file-card">
          <Icon name="calendar" />
          <div className="file-card-body">
            <strong>{state.calendar.provider} Calendar connected</strong>
            <span>
              Since {fmtDate(state.calendar.connectedAt)} ·{' '}
              {drafts.length
                ? `${drafts.length} draft task${drafts.length === 1 ? '' : 's'} to review`
                : 'nothing to review'}
            </span>
          </div>
          {drafts.length ? (
            <Link className="btn btn-sm" to="/tasks/review">
              Review week
            </Link>
          ) : null}
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => {
              dispatch({ type: 'disconnectCalendar' });
              toast('Calendar disconnected. Draft tasks were removed.');
            }}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="form-actions">
          <button className="btn" onClick={() => connect('Google')}>
            <Icon name="google" /> Connect Google
          </button>
          <button className="btn" onClick={() => connect('Outlook')}>
            <Icon name="calendar" /> Connect Outlook
          </button>
        </div>
      )}

      <AgentNote
        did="reads event titles and times only."
        privacy="Event details stay private"
        needsOk="Nothing becomes a task until you approve it"
      />
      <p className="settings-fineprint">
        Prototype: no real calendar is contacted. Connecting adds this week's sample meetings.
      </p>
    </section>
  );
}
