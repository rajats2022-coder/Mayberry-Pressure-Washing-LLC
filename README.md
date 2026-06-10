# Mayberry Pressure Washing LLC Website

Static website draft for Mayberry Pressure Washing LLC.

## Files

- `index.html` - homepage
- `services.html` - services overview
- `service-areas.html` - service area / local SEO page
- `services/*.html` - dedicated service SEO pages with matched title, H1, schema, FAQ, and internal links
- `service-areas/*.html` - dedicated city SEO pages
- `service-areas/*/*.html` - first city-service page batch for high-intent local searches
- `seo-plan.html` - internal noindex rollout map for keywords and backlink planning
- `gallery.html` - gallery placeholder for real client photos
- `contact.html` - static estimate form draft
- `assets/styles.css` - shared responsive styles
- `assets/script.js` - mobile nav and static form status
- `assets/images/pressure-washing-hero.png` - generated website hero image
- `robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt` - SEO / AI discovery files

## Before Publishing

Confirm phone number, email, hours, business address or service-area-only preference, owner name, logo, brand colors, and any approved customer review quotes.

The estimate form submits to Formspree (`https://formspree.io/f/xbdekgbg`) via AJAX, with a native POST fallback when JavaScript is unavailable. Submissions arrive in the Formspree inbox/email tied to that form — confirm it forwards to the client's preferred address before handoff.

## Local SEO Rollout

The current rollout targets `service + city + brand` searches without creating hundreds of thin doorway pages. Keep adding city-service pages only when there is enough useful local copy, project media, or service detail to make the page distinct.

Current priority service pages: pressure washing, house washing, soft washing, driveway cleaning, roof washing, gutter cleaning, window cleaning, and commercial pressure washing.

Current priority city pages: Mount Airy, Winston-Salem, Pilot Mountain, Elkin, Dobson, and Wilkesboro.

Backlink targets should stay local and real: Google Business Profile, Facebook, Instagram, local chamber or directory listings, supplier/vendor pages, customer mentions, sponsorships, and community pages. Avoid paid link farms and generic spam directories.

Current contact details from the provided Facebook profile screenshot:
- Facebook: https://www.facebook.com/profile.php?id=61576662606045
- Phone: (336) 374-8664
- Email: c.bray@mayberrypw.com
- Address: 1120 W Lebanon St, Mount Airy, NC 27030
- Hours: Always open

Google review details provided by the owner:
- Rating/count: 5.0 from 13 Google reviews
- Leave a review: https://g.page/r/CfwShzKiaw83EAE/review

## Google Review Automation

The site has a daily macOS LaunchAgent installed at:

`~/Library/LaunchAgents/com.s4ai.mayberry-google-reviews.plist`

It runs every morning at 7:15 AM:

```bash
node scripts/sync-google-reviews.mjs --update-site --reply-unanswered
```

The updater reads `data/google-reviews.json`, fetches Google review data when credentials are available, replies to Google reviews that do not already have an owner reply, creates a Google Business Profile post every other day, updates the featured homepage review count, rewrites `reviews.html`, and refreshes review-count/schema text across the static HTML files.

Use `s4aiagency@gmail.com` for the Google Business Profile manager account. Copy `.env.example` to `.env.local` and fill in credentials. Prefer Google Business Profile OAuth credentials because the official Reviews API returns the full owned-location review list and supports owner replies. A Places API key can update the public rating/count and a limited set of reviews, but it is not a full review-history or reply source.

After adding `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`, run:

```bash
node scripts/setup-google-oauth.mjs
node scripts/sync-google-reviews.mjs --discover-locations
```

Then fill `GOOGLE_BUSINESS_PROFILE_ACCOUNT_ID` and `GOOGLE_BUSINESS_PROFILE_LOCATION_ID` from the discovered Mayberry location. Review replies are drafted with OpenRouter using `openai/gpt-4.1-nano` by default because it is cheap and sufficient for short business replies.

Set `MAYBERRY_REVIEWS_AUTO_PUSH=1` in `.env.local` only if the morning job should commit and push changed website files automatically.

## Google Business Profile Posts

The morning review automation also checks whether a Google post is due. It publishes no more than once every 47 hours, so the result is effectively every other day.

Each post invites visitors to contact Mayberry Pressure Washing or use the website to request a free quote, and every post links to:

`https://mayberrypressurewashing.com/contact.html`

Use this dry run to preview the next post without publishing:

```bash
node scripts/sync-google-reviews.mjs --maybe-post --dry-run-post --local-data
```

## Google Photo Uploads

When the client sends photos and the request says, "Here are the pictures from Mayberry Pressure Washing," place the images in:

`automation/google-photo-inbox/`

Then upload them to the Google Business Profile:

```bash
node scripts/upload-google-photos.mjs
```

Photos are uploaded as additional business photos with this description by default:

`Finished a nice cleaning today, satisfied customer.`

After upload, files move into `automation/google-photo-archive/`, and the upload log is written to `data/google-photo-uploads.json`.
