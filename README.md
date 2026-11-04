# ARRAFED — Research, with intention.

A responsive academic research studio with a custom WebGL liquid-steel scene, editorial typography, dedicated service routes and a working inquiry backend.

## Stack

React 19, TypeScript, Vinext (Next.js App Router conventions), Tailwind CSS 4, Cloudflare Workers, D1 + Drizzle and R2. Self-hosted Nimbus fonts are licensed under the terms in `public/fonts/LICENSE.txt`.

## Development

Use Node 22.13 or newer and pnpm. Install with `pnpm install --frozen-lockfile`, then run `pnpm dev`. Build with `pnpm build`; run `pnpm exec tsc --noEmit` for type checks. The development scripts support portable environments; the ignored execution profile selects the host integration.

The hosting manifest declares `DB` and `BUCKET`. Generate schema migrations with `pnpm db:generate`. After the first build, apply the generated SQL to the local database:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_talented_sumo.sql
```

For a standalone checkout, the Sites project profile can be configured with the Sites setup helpers; the app uses the supplied Workers hosting integration. Hosted deployment applies committed migrations. GitHub stores the source; GitHub Pages cannot run the Worker backend. The deployed service runs on Sites/Cloudflare.

## Administrator

Set the runtime secret `ADMIN_EMAILS` to a comma-separated administrator email allowlist using the hosting environment settings. Never put credentials in the repository. `/admin` uses hosting-provided ChatGPT identity and a server-side allowlist. Missing configuration fails closed. Public inquiry endpoints do not expose saved records or attachment keys. Files are downloaded only through an authenticated administrator route. Other hosting providers must replace the platform identity adapter and validate sessions server-side.

## Inquiry flow

`POST /api/inquiries` validates fields and same-origin requests, limits request/file sizes, checks supported file signatures, rate-limits repeated submissions using a hashed network identifier and persists an inquiry reference. Optional files are stored in R2. A failed database insertion attempts to remove its uploaded file. No email is sent automatically; the studio reviews inquiries in `/admin` and contacts clients separately. The user may explicitly continue the conversation through WhatsApp.

The studio desk lists the latest 200 records with search, status filters, status updates, protected downloads and confirmed deletion. `PATCH` and `DELETE /api/admin/inquiries/:id` require administrator identity and same-origin requests. Deletion removes the associated uploaded file and database record.

## Content

Business details and pricing come from the supplied ARRAFED brief. Prices are indicative BDT rates or defined support scopes, not payment offers. No testimonials or unverified project totals have been published. Privacy and academic-integrity pages describe the actual form and storage behavior. No payment or email-delivery integration is included.

## Motion and accessibility

The shader is self-contained, caps render resolution and frame rate, pauses when offscreen or hidden, and respects reduced motion. A static chrome fallback appears when WebGL is unavailable. The interface includes keyboard-operable navigation, tabs, native disclosure controls, labelled fields, visible focus and mobile layouts.

## Verification

TypeScript and production build checks are part of delivery. The managed local preview daemon was unavailable during the initial build. Browser checks, where available, use the deployed owner-private review site; see the delivery notes for their outcome.
