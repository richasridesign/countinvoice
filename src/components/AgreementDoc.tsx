import { Icon } from './Icon';
import { Pill } from './ui';
import { legalReviewFlags, milestoneValue, money } from '../lib/format';
import { LAW_LINKS, type Client } from '../lib/types';

function DocNote({
  client,
  asClient,
  freelancerCountry,
}: {
  client: Client;
  asClient: boolean;
  freelancerCountry: string;
}) {
  if (asClient) {
    return <div className="doc-note">Reviewed and issued by your contractor via CountInvoice.</div>;
  }

  const flags = legalReviewFlags(client, freelancerCountry);
  if (flags.length > 0) {
    return (
      <div className="doc-note doc-note-flag">
        <Icon name="sign" />
        <span>
          <strong>Worth a second look:</strong> {flags.join('; ')} — have a lawyer review before
          sending.
        </span>
      </div>
    );
  }

  return (
    <div className="doc-note">
      Drafted by your CountInvoice agent using standard freelance contract clauses used across the
      EU.
    </div>
  );
}

/**
 * The service agreement, rendered either for the freelancer (asClient=false)
 * or as the client sees it on their signature page (asClient=true).
 */
export function AgreementDoc({
  client,
  asClient,
  freelancerCountry,
}: {
  client: Client;
  asClient: boolean;
  freelancerCountry: string;
}) {
  const law = LAW_LINKS[freelancerCountry];
  const subtitle = asClient ? `Prepared for ${client.name}` : `Between you and ${client.name}`;

  return (
    <div className="doc-wrap">
      <div className="doc">
        <div className="doc-head">
          <div>
            <h2>Service Agreement</h2>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{subtitle}</div>
          </div>
          <div className="meta">
            Status
            <span className="num">
              <Pill status={client.status} />
            </span>
          </div>
        </div>

        <div className="clause">
          <h3>Scope of work</h3>
          <p>{client.notes || 'Scope to be defined.'}</p>
        </div>

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
            This agreement is governed by the laws of {freelancerCountry} (
            {asClient ? "the contractor's jurisdiction" : 'your jurisdiction'}). Invoices unpaid 14
            days past the due date accrue statutory late-payment interest under {freelancerCountry}{' '}
            commercial law, and trigger an automatic reminder from CountInvoice.
            {law ? (
              <>
                {' '}
                <a
                  href={law.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="law-link"
                >
                  Read the {law.label}
                  <Icon name="external" />
                </a>
              </>
            ) : null}
          </p>
        </div>

        <DocNote client={client} asClient={asClient} freelancerCountry={freelancerCountry} />
      </div>
    </div>
  );
}
