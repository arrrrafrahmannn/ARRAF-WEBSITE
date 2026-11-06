# ARRAFED — Research, with intention.

A responsive academic research studio with a continuous, scroll-driven WebGL material field, translucent glass surfaces and editorial typography, dedicated service routes and a working inquiry backend.

## Stack

React 19, TypeScript, Vinext (Next.js App Router conventions), Tailwind CSS 4, Cloudflare Workers, D1 + Drizzle and R2. Self-hosted font licenses and upstream notices are included in `public/fonts/licenses/`. The previous Nimbus font assets have been replaced.

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

## Typography and navigation

URW Gothic Demi—the face used in the “Good questions” headline—is used throughout the website: headlines, reading text, navigation, controls, forms, diagrams, captions, identifiers and figures. The shared role variables all point to that face. Only its compressed WOFF asset is loaded and preloaded; the four unused font assets and their preloads have been removed. Existing license notices remain in `public/fonts/licenses/`.

`app/menu-light.css` gives the navigation rail and individual links a soft silver hover light, with equivalent keyboard-focus feedback and a persistent active-page treatment. It also provides a compact menu through the narrower tablet breakpoint. Reduced-motion preferences disable the hover transitions.

## Motion and accessibility

One viewport-filling WebGL canvas lives in the root layout, behind every route and section. A batched material pass renders twelve reflective, deforming chrome forms, three twisted ribbons and three orbital filaments. A second GPU pass draws 10,000 seeded particles on desktop and mobile, including larger specular flakes. Motion is calculated on the GPU rather than by creating hundreds of DOM nodes. Analytic ellipsoid intersections replace the original expensive single-object raymarch loop. Normalised scroll position controls a continuously interpolated camera, field scale, deformation, reflection temperature and material depth. Local section progress moves reading planes, headings, highlights and wireframe detail in both scroll directions. Native scrolling is preserved; the renderer does not use once-only reveal triggers or intercept wheel/touch input.

`lib/scroll-scene.ts` contains pure choreography and allocation calculations. `components/liquid-steel.tsx` owns the animation loop, passive input listeners, cached section geometry and two render passes. `lib/material-shaders.ts` holds the material and particle shaders; `lib/particle-field.ts` creates the deterministic seed buffer. `app/liquid-glass.css` applies shared optical surfaces; `app/material-field.css` defines the new editorial composition, service index, interactive research map and shared page treatment. Typography is self-hosted; the palette is graphite, pewter and restrained champagne rather than blue/purple effects.

The renderer targets display-refresh animation with an adaptive pixel budget instead of a fixed low frame-rate throttle. The requested 10,000-point draw count stays fixed; adaptation changes canvas resolution. Point size and opacity are tuned for the denser field, with fewer large specular flakes and gentle swirling currents. It reduces resolution if sustained frame timing misses budget. Actual 60 fps performance depends on device/browser/GPU and has not been benchmarked in this environment. Rendering stops while the document is hidden. No framework state updates or layout measurements occur on each scroll event.

Reduced-motion preferences disable camera travel, deformation and section transforms. A visible motion control pauses the environment; an additional contrast control provides opaque reading surfaces. Reduced transparency, increased contrast and browsers without backdrop filtering have solid fallbacks. Text-sized reading planes protect contrast over bright specular reflections. Preferences are stored only for the current browser session. If WebGL fails, a full-viewport static multi-form chrome fallback preserves the background without section seams.

## Verification

Run `node --test tests/*.test.mjs` for scroll continuity, reversibility, frame-rate-independent easing, mobile framing, section progress, adaptive render limits, ten-thousand-point allocation, particle reproducibility, full-field distribution and batched-render integration checks. TypeScript and production build checks are part of delivery. The original inquiry backend was verified in an isolated SQLite/R2 integration harness; visual changes do not modify its API or storage schema.

The managed local preview daemon was unavailable during this update. Browser visual, responsive-device and measured frame-rate checks must be distinguished from the successful automated checks; see the delivery notes for the current outcome.
