import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Card, EmptyState, Pill, Topbar } from '../components/ui';
import { fmtDate } from '../lib/format';
import { useSelectors, useStore } from '../lib/hooks';
import { WORKING_DATE } from '../lib/types';

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
            icon={<Icon name="check" />}
            title="Add a client first"
            action={
              <button className="btn btn-primary" onClick={() => navigate('/clients/new')}>
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
          <EmptyState
            icon={<Icon name="check" />}
            title="No tasks logged yet"
            action={
              <button className="btn btn-primary" onClick={() => navigate('/tasks/new')}>
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
          <button className="btn btn-primary" onClick={() => navigate('/tasks/new')}>
            <Icon name="plus" /> Log task
          </button>
        }
      />
      <div className="content">
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
            icon={<Icon name="users" />}
            title="Add a client first"
            action={
              <button className="btn btn-primary" onClick={() => navigate('/clients/new')}>
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
            <button type="submit" className="btn btn-primary">
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
