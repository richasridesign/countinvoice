import { useEffect, useId, useRef, useState } from 'react';
import { Icon } from './Icon';
import { fmtDate, fmtDay, invoiceTotal, money } from '../lib/format';
import { callDayFrom } from '../lib/reminders';
import { TODAY } from '../lib/types';
import type { Client, Invoice } from '../lib/types';

/**
 * Approve the voice call. A native dialog: Esc closes it, focus stays inside
 * while it is open and goes back to the button that opened it.
 */
export function CallDialog({
  invoice,
  client,
  onClose,
  onSchedule,
}: {
  invoice: Invoice;
  client?: Client;
  onClose: () => void;
  onSchedule: (phone: string, callDate: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [phone, setPhone] = useState(client?.phone ?? '');
  const callDate = callDayFrom(TODAY);
  const name = client?.name ?? 'your client';
  const amount = money(invoiceTotal(invoice), client?.currency);
  const hasNumber = Boolean(client?.phone);

  useEffect(() => {
    const dlg = ref.current;
    if (dlg && !dlg.open) dlg.showModal();
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    onSchedule(phone.trim(), callDate);
  }

  return (
    <dialog
      ref={ref}
      className="call-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        // A click on the backdrop lands on the dialog element itself.
        if (e.target === ref.current) ref.current?.close();
      }}
    >
      <form onSubmit={submit}>
        <div className="call-dialog-head">
          <div>
            <h2 id={titleId}>Approve call</h2>
            <p>Your agent only calls after you approve.</p>
          </div>
          <button
            type="button"
            className="btn btn-icon"
            aria-label="Close"
            title="Close"
            onClick={() => ref.current?.close()}
          >
            <Icon name="close" />
          </button>
        </div>

        <dl className="call-facts">
          <div>
            <dt>Client:</dt>
            <dd>{name}</dd>
          </div>
          <div>
            <dt>Number:</dt>
            <dd>
              {hasNumber ? (
                <span className="num">{client?.phone}</span>
              ) : (
                <>
                  <label htmlFor="call-phone" className="visually-hidden">
                    Phone number
                  </label>
                  <input
                    id="call-phone"
                    type="text"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+31 20 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </>
              )}
            </dd>
          </div>
          <div>
            <dt>Call window:</dt>
            <dd>{fmtDay(callDate)}, 10:00 to 12:00 (client’s time)</dd>
          </div>
          <div>
            <dt>Invoice:</dt>
            <dd>
              <span className="num">
                {invoice.number}, {amount}, due {fmtDate(invoice.dueDate)}
              </span>
            </dd>
          </div>
        </dl>

        <div className="call-script">
          <strong>What the agent will say</strong>
          <p>
            Hi, this is an AI assistant calling on behalf of your contractor. I’m calling about
            invoice {invoice.number} for {amount}, due on {fmtDate(invoice.dueDate)}. Do you know
            when it will be paid?
          </p>
        </div>

        <div className="call-dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={() => ref.current?.close()}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!phone.trim()}>
            Schedule call
          </button>
        </div>
      </form>
    </dialog>
  );
}
