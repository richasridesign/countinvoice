import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { AgentNote, Card, EmptyState, Pill, Topbar } from '../components/ui';
import { fmtDate } from '../lib/format';
import { useSelectors, useStore } from '../lib/hooks';
import { WORKING_DATE, type CalendarDraft } from '../lib/types';

function weekLabel(drafts: CalendarDraft[]): string {
  const dates = drafts.map((d) => d.date).sort();
  if (dates.length === 0) return '';
  const short = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const first = short(dates[0]);
  const last = short(dates[dates.length - 1]);
  return first === last ? first : `${first} to ${last}`;
}

/** Shown on the task list while calendar drafts are waiting. */
function DraftsBanner() {
  const { state } = useStore();
  const drafts = state.calendarDrafts ?? [];
  if (!drafts.length) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <AgentNote
        did={`drafted ${drafts.length} task${drafts.length === 1 ? '' : 's'} from your calendar this week.`}
        privacy="Event details stay private"
        needsOk="Nothing is invoiced until you approve"
        action={
          <Link className="btn btn-sm" to="/tasks/review">
            Review week
          </Link>
        }
      />
    </div>
  );
}

export function ReviewWeek() {
  const { state, dispatch, toast } = useStore();
  const { clientById } = useSelectors();
  const navigate = useNavigate();
  const drafts = state.calendarDrafts ?? [];
  const [editing, setEditing] = useState<string | null>(null);
  const [oneByOne, setOneByOne] = useState(false);

  function approve(ids: string[]) {
    dispatch({ type: 'approveDrafts', ids });
    toast(`${ids.length} task${ids.length === 1 ? '' : 's'} added. Ready for invoicing.`);
    if (ids.length === drafts.length) navigate('/tasks');
  }

  function skip(id: string) {
    dispatch({ type: 'skipDraft', id });
    toast('Skipped. It won’t become a task.');
  }

  if (!drafts.length) {
    return (
      <>
        <Topbar eyebrow="Tasks" title="Review week" />
        <div className="content">
          <div className="breadcrumb">
            <Link to="/tasks">← All tasks</Link>
          </div>
          <EmptyState
            title="Nothing to review"
            action={
              state.calendar ? (
                <Link className="btn" to="/tasks">
                  Back to tasks
                </Link>
              ) : (
                <Link className="btn" to="/settings#calendar">
                  <Icon name="calendar" /> Connect your calendar
                </Link>
              )
            }
          >
            {state.calendar
              ? 'Every draft from your calendar has been approved or skipped.'
              : 'Connect your calendar and your agent will draft tasks from client meetings.'}
          </EmptyState>
        </div>
      </>
    );
  }

  const shown = oneByOne ? drafts.slice(0, 1) : drafts;

  return (
    <>
      <Topbar
        eyebrow={`Tasks · ${weekLabel(drafts)}`}
        title="Review week"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setOneByOne(!oneByOne)}>
              {oneByOne ? 'Show the whole week' : 'Review one by one'}
            </button>
            <button className="btn" onClick={() => approve(drafts.map((d) => d.id))}>
              <Icon name="check" /> Approve week
            </button>
          </>
        }
      />
      <div className="content">
        <div className="breadcrumb">
          <Link to="/tasks">← All tasks</Link>
        </div>

        <div style={{ margin: '10px 0 16px 0' }}>
          <AgentNote
            did={`drafted ${drafts.length} task${drafts.length === 1 ? '' : 's'} from your ${state.calendar?.provider ?? ''} calendar this week.`}
            privacy="Event details stay private"
            needsOk="Nothing is invoiced until you approve"
          />
        </div>

        {oneByOne ? (
          <p className="settings-intro">
            {drafts.length} left to review. Approve or skip each one.
          </p>
        ) : null}

        <Card>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Task</th>
                <th>Client</th>
                <th>Hours</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((d) =>
                editing === d.id ? (
                  <tr key={d.id}>
                    <td className="num">{fmtDate(d.date)}</td>
                    <td>
                      <input
                        type="text"
                        aria-label="Task"
                        value={d.title}
                        onChange={(e) =>
                          dispatch({ type: 'updateDraft', id: d.id, patch: { title: e.target.value } })
                        }
                      />
                    </td>
                    <td>
                      <select
                        aria-label="Client"
                        value={d.clientId}
                        onChange={(e) =>
                          dispatch({ type: 'updateDraft', id: d.id, patch: { clientId: e.target.value } })
                        }
                      >
                        {state.clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ minWidth: 96 }}>
                      <input
                        className="mono"
                        type="number"
                        aria-label="Hours"
                        step="0.5"
                        min="0"
                        value={d.hours}
                        onChange={(e) =>
                          dispatch({
                            type: 'updateDraft',
                            id: d.id,
                            patch: { hours: Number(e.target.value) || 0 },
                          })
                        }
                      />
                    </td>
                    <td className="row-actions">
                      <button className="btn btn-sm" onClick={() => setEditing(null)}>
                        Done
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={d.id}>
                    <td className="num">{fmtDate(d.date)}</td>
                    <td>{d.title}</td>
                    <td>{clientById(d.clientId)?.name ?? '—'}</td>
                    <td className="num">{d.hours}h</td>
                    <td className="row-actions">
                      {oneByOne ? (
                        <button className="btn btn-sm" onClick={() => approve([d.id])}>
                          <Icon name="check" /> Approve
                        </button>
                      ) : null}{' '}
                      <button className="btn btn-sm" onClick={() => setEditing(d.id)}>
                        Edit
                      </button>{' '}
                      <button className="btn btn-sm btn-ghost" onClick={() => skip(d.id)}>
                        Skip
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}

export function Tasks() {
  const { state } = useStore();
  const { clientById } = useSelectors();
  const navigate = useNavigate();

  if (state.clients.length === 0) {
    return (
      <>
        <Topbar eyebrow="Time & tasks" title="Tasks" />
        <div className="content">
          <EmptyState
            title="Add a client first"
            action={
              <button className="btn" onClick={() => navigate('/clients/new')}>
                <Icon name="plus" /> Add a client
              </button>
            }
          >
            Tasks are logged against a client, so start by adding the person or company you're
            working with.
          </EmptyState>
        </div>
      </>
    );
  }

  if (state.tasks.length === 0) {
    return (
      <>
        <Topbar eyebrow="Time & tasks" title="Tasks" />
        <div className="content">
          <DraftsBanner />
          <EmptyState
            title="No tasks logged yet"
            action={
              <button className="btn" onClick={() => navigate('/tasks/new')}>
                <Icon name="plus" /> Log your first task
              </button>
            }
          >
            Log the hours you work so they can be turned into an invoice later.
          </EmptyState>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar
        eyebrow="Time & tasks"
        title="Tasks"
        actions={
          <button className="btn" onClick={() => navigate('/tasks/new')}>
            <Icon name="plus" /> Log task
          </button>
        }
      />
      <div className="content">
        <DraftsBanner />
        <Card>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Task</th>
                <th>Client</th>
                <th>Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {state.tasks
                .slice()
                .reverse()
                .map((t) => {
                  const c = clientById(t.clientId);
                  return (
                    <tr key={t.id}>
                      <td className="num">{fmtDate(t.date)}</td>
                      <td>{t.title}</td>
                      <td>
                        {c ? (
                          <Link to={`/clients/${c.id}`} style={{ textDecoration: 'underline' }}>
                            {c.name}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="num">{t.hours ? `${t.hours}h` : '—'}</td>
                      <td>
                        <Pill status={t.status} />
                      </td>
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

export function TaskForm() {
  const { state, dispatch, toast } = useStore();
  const navigate = useNavigate();

  if (state.clients.length === 0) {
    return (
      <>
        <Topbar eyebrow="Tasks" title="Log a task" />
        <div className="content">
          <EmptyState
            title="Add a client first"
            action={
              <button className="btn" onClick={() => navigate('/clients/new')}>
                <Icon name="plus" /> Add a client
              </button>
            }
          >
            Tasks need to be tied to a client so their hours can be invoiced later.
          </EmptyState>
        </div>
      </>
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    dispatch({
      type: 'addTask',
      task: {
        clientId: String(f.get('clientId')),
        title: String(f.get('title')),
        date: String(f.get('date')) || WORKING_DATE,
        hours: Number(f.get('hours')) || 0,
      },
    });
    toast('Task logged');
    navigate('/tasks');
  }

  return (
    <>
      <Topbar eyebrow="Tasks" title="Log a task" />
      <div className="content">
        <div className="breadcrumb">
          <Link to="/tasks">← All tasks</Link>
        </div>

        <form className="form" onSubmit={onSubmit} style={{ marginTop: 10 }}>
          <div className="field">
            <label>Client</label>
            <select name="clientId">
              {state.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>What did you work on?</label>
            <input type="text" name="title" placeholder="e.g. Homepage revisions" required />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Date</label>
              <input type="date" name="date" defaultValue={WORKING_DATE} />
            </div>
            <div className="field">
              <label>Hours</label>
              <input
                className="mono-input"
                type="number"
                step="0.5"
                min="0"
                name="hours"
                placeholder="e.g. 2.5"
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn">
              <Icon name="check" /> Save task
            </button>
            <Link className="btn btn-ghost" to="/tasks">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
