# Mayberry Pressure Washing LLC Website

Production website and local-marketing automation for Mayberry Pressure Washing LLC. The canonical site is `https://www.mayberrypw.com`, deployed from `origin/main` by Vercel.

## Publishing

Verify first, stage only the files that belong to the change, then commit and push:

```bash
node scripts/audit-site.mjs
node scripts/test-site-analytics.mjs
git status --short
git add <changed-files>
git commit -m "Describe the site update"
git push origin main
```

Never commit `.env.local`, `logs/`, credentials, raw customer data, or discovered Google account and location identifiers.

## Business facts and scope

- Phone: `(336) 374-8664`
- Email: `c.bray@mayberrypw.com`
- Google rating at the July 17, 2026 audit: 5.0 from 27 reviews
- Google review link: `https://g.page/r/CfwShzKiaw83EAE/review`
- Profile type: service-area business; do not publish a street address
- Website coverage pages: Mount Airy, Winston-Salem, Pilot Mountain, Elkin, Dobson, and Wilkesboro

The live Google profile has a partly different service-area list. Confirm actual travel coverage, hours, and special hours with the owner before changing those fields. Do not publish insurance, licensing, prices, availability, offers, or service claims without evidence.

## Site structure

- `index.html`, `services.html`, `service-areas.html`, `gallery.html`, `reviews.html`, and `contact.html` are the main public pages.
- `services/*.html` contains the eight verified service pages.
- `service-areas/*.html` contains the six selective location pages. Older city-service combinations permanently redirect to these stronger location pages and are excluded from the sitemap.
- `resources/*.html` contains informational articles.
- `privacy.html` explains the form, optional analytics, consent, and privacy controls; it is intentionally not indexed.
- `seo-plan.html` is an internal, noindex rollout map.
- `assets/site-analytics.js` manages consent-aware GA4 loading and conversion events.
- `robots.txt` and `sitemap.xml` use the canonical `www` hostname and extensionless public URLs.
- `googlea77b0aa828653eb4.html` is the Google site-verification file.
- `04de81dd16d2ed0fb321829ebc7b5972.txt` is the public IndexNow key file.

Keep location pages selective. Add one only when Mayberry really covers the area and the page can contain distinct service detail, project media, or useful local guidance. Do not create doorway pages.

## Form and analytics

The estimate form submits to the existing Formspree form with an AJAX handler and native POST fallback. Confirm delivery to the client's preferred inbox during ownership handoff.

GA4 is a dedicated Mayberry property and stream. The consent banner blocks Analytics until opt-in and honors Global Privacy Control and Do Not Track. The site records `generate_lead`, `quote_request`, `phone_click`, and `contact_click` without deliberately sending form contents, email addresses, phone numbers, or query strings to Analytics.

```bash
node scripts/setup-ga4.mjs
node scripts/test-site-analytics.mjs
```

## Google Business Profile automation

Installed LaunchAgents:

- `com.s4ai.mayberry-google-reviews` — daily at 7:15 AM
- `com.s4ai.mayberry-google-posts` — daily check at 8:30 AM, with a 47-hour duplicate guard
- `com.s4ai.mayberry-google-analytics` — weekly GBP performance report
- `com.s4ai.mayberry-search-console` — weekly Search Console report
- `com.s4ai.mayberry-profile-health` — weekly profile, media, site, and broken-link audit

The review workflow fetches the owned profile's reviews, replies only to unanswered reviews, synchronizes the public review count, writes current-state and append-only history, and sends a concise Telegram status. Auto-publish uses exact staged paths; a GitHub push failure is reported but does not convert a successful review/reply sync into a failed job.

```bash
node scripts/sync-google-reviews.mjs --update-site --reply-unanswered
node scripts/sync-google-reviews.mjs --maybe-post --dry-run-post --local-data
node scripts/sync-google-reviews.mjs --sync-analytics --no-telegram
node scripts/manage-google-profile.mjs audit
```

Posts rotate verified services and seasonal maintenance topics, use one quote CTA, add campaign tracking, and never invent an offer, price, event, or availability.

## Search Console, IndexNow, and health checks

```bash
node scripts/setup-search-console.mjs status
node scripts/setup-search-console.mjs report
node scripts/setup-search-console.mjs inspect
node scripts/submit-indexnow.mjs
node scripts/audit-site.mjs --production
node scripts/run-profile-health.mjs
```

Current snapshots live under `data/`; matching `*.jsonl` files are append-only history. The IndexNow GitHub Actions workflow runs after production deployments and waits for the public key before submitting all canonical URLs.

To install or refresh the two repository LaunchAgent templates:

```bash
cp launchd/com.s4ai.mayberry-search-console.plist ~/Library/LaunchAgents/
cp launchd/com.s4ai.mayberry-profile-health.plist ~/Library/LaunchAgents/
plutil -lint ~/Library/LaunchAgents/com.s4ai.mayberry-*.plist
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.s4ai.mayberry-search-console.plist
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.s4ai.mayberry-profile-health.plist
```

## Photo uploads

Only upload real Mayberry media. Put approved files in `automation/google-photo-inbox/`, then run:

```bash
node scripts/upload-google-photos.mjs
```

Successful files move to `automation/google-photo-archive/`; the upload state is saved in `data/google-photo-uploads.json`. Do not generate or reuse unrelated business photography as proof of completed Mayberry work.
