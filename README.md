# CountInvoice

Interactive design prototype of an invoicing tool for freelancers, framed as
"an agent that runs your paperwork": it drafts each client's service agreement,
tracks logged hours, and prepares invoices — with nothing reaching a client
until the freelancer approves it.

Ported from a single-file HTML prototype to React + TypeScript.

## Running locally

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # typecheck + production build into dist/
npm run preview # serve the production build
```

## How it works

State lives in one reducer (`src/lib/store.tsx`) and is persisted to
`localStorage` under `countinvoice_prototype_v1`. There is no backend: each
visitor gets their own copy of the data in their own browser, which is what
makes this safe to publish as a public case study.

The sidebar has **Load sample data** (three clients, seven tasks, three
invoices) and **Clear** for resetting to the empty state.

Because the sample data is written relative to a fixed demo date, `TODAY` and
`WORKING_DATE` in `src/lib/types.ts` are pinned to September 2026 rather than
reading the system clock.

### Screens

| Route | Screen |
|---|---|
| `/welcome` | Simulated sign-in |
| `/dashboard` | Stat tiles, the agent's approval queue, recent activity |
| `/clients`, `/clients/:id` | Client list, detail, new/edit form |
| `/agreements`, `/agreement/:id` | Agreement list and document, with share/sign state |
| `/sign/:id`, `/sign/:id/preview` | Client-facing signature page, outside the app shell |
| `/tasks`, `/tasks/new` | Logged hours |
| `/invoices`, `/invoices/:id` | Invoice list and document |
| `/settings` | The freelancer's own country, which governs every agreement |

## Design notes

All styling is plain CSS in `src/index.css`, carried over from the original
prototype. Colors are custom properties on `:root` with a dark-mode override,
so both themes come from one set of tokens.

Status pills use four visual tiers rather than color alone — outline for not
started, filled for in progress, bold for resolved, inverted for needs
attention — which keeps them legible in both themes and without color vision.

Agreement documents link to the official primary legal source per jurisdiction
(`LAW_LINKS` in `src/lib/types.ts`) and flag agreements that warrant human
legal review: an unsupported jurisdiction, a lopsided payment split, or an
unusually high contract value.

## Deploying to Netlify

`netlify.toml` sets the build command (`npm run build`), publish directory
(`dist`) and Node version. `public/_redirects` adds the SPA fallback so deep
links like `/sign/c3` resolve instead of 404ing.

1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import an existing project**, pick the repo.
   The settings are read from `netlify.toml`, so no manual config is needed.
3. **Domain management → Add a domain** → `countinvoice.richadesign.in`.
   A subdomain keeps the apex free for a portfolio index, and avoids the
   apex-`CNAME` restriction in the DNS spec.
4. At the registrar (GoDaddy), add one record — leave the existing apex
   records alone:

   | Type    | Name           | Value                   |
   | ------- | -------------- | ----------------------- |
   | `CNAME` | `countinvoice` | `<site>.netlify.app`    |

   The name is just `countinvoice`; GoDaddy appends the zone itself. The
   value is a bare hostname, with no scheme and no trailing slash.
5. HTTPS is provisioned automatically via Let's Encrypt once DNS resolves
   (usually 5–30 minutes). Check with
   `dig countinvoice.richadesign.in CNAME +short`.

## Scope

This is a prototype, not a billing system. Sign-in is simulated, no email is
sent, and no invoice is a real financial or legal document. Sending real
invoices would need authentication, a server-side database, sequential and
immutable invoice numbering, VAT handling, and data-retention and GDPR
considerations — none of which are present here.
