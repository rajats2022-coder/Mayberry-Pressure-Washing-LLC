#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
const dataPath = join(root, "data", "google-reviews.json");
const envPath = join(root, ".env.local");
const args = new Set(process.argv.slice(2));
const updateSite = args.has("--update-site") || args.has("--local-data");
const localDataOnly = args.has("--local-data");
const replyUnanswered = args.has("--reply-unanswered");
const discoverLocations = args.has("--discover-locations");
const maybePost = args.has("--maybe-post");
const expectedManagerEmail = "s4aiagency@gmail.com";
const googlePostStatePath = join(root, "data", "google-post-automation.json");

loadDotEnv(envPath);

function loadDotEnv(path) {
  if (!existsSync(path)) return;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, value] = match;
    if (process.env[key] === undefined) {
      process.env[key] = value.replace(/^["']|["']$/g, "");
    }
  }
}

function readCurrentData() {
  return JSON.parse(readFileSync(dataPath, "utf8"));
}

function writeJsonIfChanged(path, value) {
  const next = `${JSON.stringify(value, null, 2)}\n`;
  const prev = existsSync(path) ? readFileSync(path, "utf8") : "";
  if (prev !== next) {
    writeFileSync(path, next);
    return true;
  }
  return false;
}

function htmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugify(value) {
  return String(value ?? "review")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "review";
}

function starToNumber(value) {
  if (typeof value === "number") return value;
  const map = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
  return map[String(value ?? "").toUpperCase()] ?? 5;
}

function normalizeReview(review, index = 0) {
  const author = review?.reviewer?.displayName || review?.author_name || review?.author || "Google reviewer";
  const text = review?.comment || review?.text || "5-star Google review";
  const createTime = review?.createTime || (review?.time ? new Date(review.time * 1000).toISOString() : undefined);
  return {
    id: review?.reviewId || review?.name || review?.id || `${slugify(author)}-${index + 1}`,
    name: review?.name,
    author,
    rating: starToNumber(review?.starRating ?? review?.rating),
    text,
    createTime,
    updateTime: review?.updateTime,
    reply: review?.reviewReply?.comment || review?.reply || null,
    replyUpdateTime: review?.reviewReply?.updateTime || null
  };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`${options.label || "Request"} failed: ${response.status} ${text}`);
  }
  return payload;
}

async function getGoogleAccessToken() {
  if (process.env.GOOGLE_BUSINESS_PROFILE_ACCESS_TOKEN) {
    return process.env.GOOGLE_BUSINESS_PROFILE_ACCESS_TOKEN;
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token"
  });
  const payload = await fetchJson("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    label: "Google OAuth refresh"
  });
  return payload.access_token;
}

function googleAuthHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

function accountNameFromEnv() {
  const raw = process.env.GOOGLE_BUSINESS_PROFILE_ACCOUNT_ID || "";
  if (!raw) return "";
  return raw.startsWith("accounts/") ? raw : `accounts/${raw}`;
}

function locationNameFromEnv(accountName) {
  const raw = process.env.GOOGLE_BUSINESS_PROFILE_LOCATION_ID || "";
  if (!raw) return "";
  if (raw.startsWith("accounts/")) return raw;
  if (raw.startsWith("locations/")) return `${accountName}/${raw}`;
  return `${accountName}/locations/${raw}`;
}

function locationPathFromEnv() {
  const accountName = accountNameFromEnv();
  const locationName = locationNameFromEnv(accountName);
  return { accountName, locationName };
}

async function listBusinessAccounts(token) {
  const payload = await fetchJson("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
    headers: googleAuthHeaders(token),
    label: "Google Business Profile accounts.list"
  });
  return payload.accounts ?? [];
}

async function listBusinessLocations(token, accountName) {
  const url = new URL(`https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`);
  url.searchParams.set("readMask", "name,title,storefrontAddress,metadata");
  url.searchParams.set("pageSize", "100");
  const payload = await fetchJson(url, {
    headers: googleAuthHeaders(token),
    label: "Google Business Profile locations.list"
  });
  return payload.locations ?? [];
}

async function discoverGoogleLocations() {
  const token = await getGoogleAccessToken();
  if (!token) {
    console.log("No Google OAuth credentials configured. Cannot discover Business Profile accounts.");
    return;
  }
  console.log(`Expected Google manager account: ${process.env.GOOGLE_BUSINESS_PROFILE_MANAGER_EMAIL || expectedManagerEmail}`);
  const accounts = await listBusinessAccounts(token);
  console.log(`Google Business Profile accounts visible: ${accounts.length}`);
  for (const account of accounts) {
    console.log(`- ${account.name} ${account.accountName || ""}`.trim());
    const locations = await listBusinessLocations(token, account.name);
    for (const location of locations) {
      const title = location.title || "Untitled location";
      console.log(`  - ${location.name} ${title}`);
    }
  }
}

async function fetchBusinessProfileReviews() {
  const token = await getGoogleAccessToken();
  const accountName = accountNameFromEnv();
  const locationName = locationNameFromEnv(accountName);
  if (!accountName || !locationName || !token) return null;

  let pageToken = "";
  const reviews = [];
  let averageRating = null;
  let totalReviewCount = null;

  do {
    const url = new URL(`https://mybusiness.googleapis.com/v4/${locationName}/reviews`);
    url.searchParams.set("pageSize", "50");
    url.searchParams.set("orderBy", "updateTime desc");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const payload = await fetchJson(url, {
      headers: googleAuthHeaders(token),
      label: "Google Business Profile reviews.list"
    });
    averageRating ??= payload.averageRating ?? null;
    totalReviewCount ??= payload.totalReviewCount ?? null;
    reviews.push(...(payload.reviews ?? []));
    pageToken = payload.nextPageToken || "";
  } while (pageToken);

  return {
    source: "google-business-profile",
    rating: Number(averageRating ?? 5),
    reviewCount: Number(totalReviewCount ?? reviews.length),
    reviews: reviews.map(normalizeReview)
  };
}

async function fetchPlacesReviews() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID || "ChIJH1R4E00DQg4R_BKHMqJrDzc";
  if (!apiKey || !placeId) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "name,rating,user_ratings_total,reviews,url");
  url.searchParams.set("reviews_sort", "newest");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google Places details request failed: ${response.status} ${await response.text()}`);
  }
  const payload = await response.json();
  if (payload.status !== "OK") {
    throw new Error(`Google Places details returned ${payload.status}: ${payload.error_message || "no error message"}`);
  }
  const result = payload.result ?? {};
  return {
    source: "google-places-limited",
    rating: Number(result.rating ?? 5),
    reviewCount: Number(result.user_ratings_total ?? 0),
    reviews: (result.reviews ?? []).map(normalizeReview)
  };
}

function mergeReviewData(current, fetched) {
  if (!fetched) {
    return { ...current, source: current.source || "local-data" };
  }

  const currentById = new Map((current.reviews ?? []).map((review) => [review.id, review]));
  const fetchedReviews = fetched.reviews ?? [];
  const merged = [];
  const seen = new Set();

  for (const review of fetchedReviews) {
    merged.push(review);
    seen.add(review.id);
  }
  for (const review of current.reviews ?? []) {
    if (!seen.has(review.id)) merged.push(review);
  }

  for (const review of merged) {
    const prior = currentById.get(review.id);
    if (prior?.text && (!review.text || review.text === "5-star Google review")) review.text = prior.text;
  }

  return {
    ...current,
    rating: fetched.rating || current.rating || 5,
    reviewCount: Math.max(fetched.reviewCount || 0, merged.length, current.reviewCount || 0),
    source: fetched.source,
    lastFetchedAt: new Date().toISOString(),
    expectedManagerEmail: process.env.GOOGLE_BUSINESS_PROFILE_MANAGER_EMAIL || expectedManagerEmail,
    reviews: merged.slice(0, Math.max(fetched.reviewCount || merged.length, merged.length))
  };
}

function replyToneForRating(rating) {
  if (rating >= 5) return "thankful, concise, and specific";
  if (rating >= 4) return "thankful and lightly constructive";
  if (rating >= 3) return "professional, appreciative, and improvement-focused";
  return "calm, apologetic, and move the conversation offline";
}

function fallbackReply(review) {
  const author = review.author && review.author !== "Google reviewer" ? `, ${review.author.split(" ")[0]}` : "";
  if (review.rating >= 4) {
    return `Thank you${author}! We appreciate you taking the time to share your experience with Mayberry Pressure Washing.`;
  }
  return `Thank you for the feedback${author}. We appreciate the chance to improve and would welcome a direct conversation so we can better understand what happened.`;
}

async function draftReplyWithOpenRouter(review) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return fallbackReply(review);

  const model = process.env.MAYBERRY_REVIEW_REPLY_MODEL || "openai/gpt-4.1-nano";
  const payload = {
    model,
    temperature: 0.35,
    max_tokens: 120,
    messages: [
      {
        role: "system",
        content: [
          "Write one Google Business Profile owner reply for Mayberry Pressure Washing LLC.",
          "Return only the reply text.",
          "Keep it under 55 words.",
          "Sound local, professional, and human.",
          "Do not mention discounts, guarantees, fake details, or anything not in the review.",
          "For negative reviews, acknowledge feedback and invite direct follow-up without arguing."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          reviewer: review.author,
          rating: review.rating,
          tone: replyToneForRating(review.rating),
          review: review.text
        })
      }
    ]
  };

  const response = await fetchJson("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "http-referer": "https://mayberrypw.com",
      "x-title": "Mayberry Review Reply Automation"
    },
    body: JSON.stringify(payload),
    label: "OpenRouter review reply draft"
  });
  const text = response?.choices?.[0]?.message?.content?.trim();
  return text || fallbackReply(review);
}

function isReplyableBusinessProfileReview(review) {
  return review.name && !review.reply;
}

async function updateReviewReply(token, reviewName, comment) {
  const url = `https://mybusiness.googleapis.com/v4/${reviewName}/reply`;
  return fetchJson(url, {
    method: "PUT",
    headers: { ...googleAuthHeaders(token), "content-type": "application/json" },
    body: JSON.stringify({ comment }),
    label: "Google Business Profile reviews.updateReply"
  });
}

async function replyToUnansweredReviews(data) {
  if (data.source !== "google-business-profile") {
    console.log("Skipping review replies because full Google Business Profile review data is not available.");
    return { attempted: 0, published: 0 };
  }

  const token = await getGoogleAccessToken();
  if (!token) {
    console.log("Skipping review replies because Google OAuth credentials are not configured.");
    return { attempted: 0, published: 0 };
  }

  const limit = Number(process.env.MAYBERRY_REVIEW_REPLY_LIMIT || 20);
  const unanswered = (data.reviews ?? []).filter(isReplyableBusinessProfileReview).slice(0, limit);
  let published = 0;
  const dryRunReplies = args.has("--dry-run-replies") || process.env.MAYBERRY_REVIEW_REPLY_DRY_RUN === "1";

  for (const review of unanswered) {
    const reply = await draftReplyWithOpenRouter(review);
    if (dryRunReplies) {
      console.log(`[dry-run] Would reply to ${review.id}: ${reply}`);
      continue;
    }
    await updateReviewReply(token, review.name, reply);
    review.reply = reply;
    review.replyUpdateTime = new Date().toISOString();
    published += 1;
    console.log(`Replied to review ${review.id}`);
  }

  return { attempted: unanswered.length, published };
}

function readJsonIfExists(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8"));
}

function shouldCreateGooglePost(state) {
  if (args.has("--force-post")) return true;
  if (!state.lastPostedAt) return true;
  const elapsedMs = Date.now() - Date.parse(state.lastPostedAt);
  return elapsedMs >= 47 * 60 * 60 * 1000;
}

function nextGooglePostSummary(state) {
  const contactUrl = process.env.MAYBERRY_CONTACT_URL || "https://mayberrypw.com/contact.html";
  const posts = [
    `Need exterior cleaning around Mount Airy or the surrounding area? Contact Mayberry Pressure Washing for a free quote on house washing, driveway cleaning, roof washing, gutters, windows, decks, fences, or commercial pressure washing. Request your quote here: ${contactUrl}`,
    `Is your siding, concrete, roofline, deck, or storefront ready for a refresh? Mayberry Pressure Washing makes it simple to request a free exterior cleaning quote online. Start here: ${contactUrl}`,
    `Planning a cleanup before guests, listing photos, or a busy season? Reach out to Mayberry Pressure Washing for a free quote and a service plan matched to your property. Book through the website: ${contactUrl}`,
    `Mayberry Pressure Washing helps homes and businesses look cleaner from the curb. For house washing, soft washing, driveway cleaning, gutters, windows, decks, fences, and commercial exterior cleaning, request a free quote here: ${contactUrl}`
  ];
  const index = Number(state.postIndex || 0) % posts.length;
  return posts[index];
}

async function createGoogleLocalPost(summary) {
  const token = await getGoogleAccessToken();
  const { locationName } = locationPathFromEnv();
  if (!token || !locationName) {
    console.log("Skipping Google post because Google OAuth or Business Profile location is not configured.");
    return null;
  }

  const contactUrl = process.env.MAYBERRY_CONTACT_URL || "https://mayberrypw.com/contact.html";
  const url = `https://mybusiness.googleapis.com/v4/${locationName}/localPosts`;
  return fetchJson(url, {
    method: "POST",
    headers: { ...googleAuthHeaders(token), "content-type": "application/json" },
    body: JSON.stringify({
      languageCode: "en-US",
      summary,
      topicType: "STANDARD",
      callToAction: {
        actionType: "LEARN_MORE",
        url: contactUrl
      }
    }),
    label: "Google Business Profile localPosts.create"
  });
}

async function maybeCreateGooglePost() {
  const state = readJsonIfExists(googlePostStatePath, { postIndex: 0, posts: [] });
  if (!shouldCreateGooglePost(state)) {
    console.log(`Skipping Google post; lastPostedAt=${state.lastPostedAt}`);
    return { attempted: false, published: false };
  }

  const summary = nextGooglePostSummary(state);
  if (args.has("--dry-run-post")) {
    console.log(`[dry-run] Would create Google post: ${summary}`);
    return { attempted: true, published: false };
  }

  const result = await createGoogleLocalPost(summary);
  if (!result) return { attempted: true, published: false };

  const nextState = {
    lastPostedAt: new Date().toISOString(),
    postIndex: Number(state.postIndex || 0) + 1,
    posts: [
      {
        createdAt: new Date().toISOString(),
        name: result.name || null,
        summary
      },
      ...(state.posts || [])
    ].slice(0, 50)
  };
  writeJsonIfChanged(googlePostStatePath, nextState);
  console.log(`Created Google post ${result.name || ""}`.trim());
  return { attempted: true, published: true };
}

function allHtmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const rel = relative(root, path);
    if (rel.startsWith(".git/") || rel.startsWith("node_modules/")) continue;
    const stats = statSync(path);
    if (stats.isDirectory()) out.push(...allHtmlFiles(path));
    if (stats.isFile() && path.endsWith(".html")) out.push(path);
  }
  return out;
}

function reviewCard(review) {
  const author = htmlEscape(review.author || "Google reviewer");
  const rating = Number(review.rating || 5);
  const text = htmlEscape(review.text || `${rating}-star Google review`);
  return `          <article class="review-card"><div><strong>${author}</strong></div><p class="stars" aria-label="${rating} out of 5 stars">${rating} stars</p><blockquote>${text}</blockquote></article>`;
}

function ratingText(value) {
  const rating = Number(value || 5);
  return Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
}

function updateReviewPage(html, data) {
  const count = data.reviewCount;
  const rating = ratingText(data.rating);
  const cards = data.reviews.map(reviewCard).join("\n");
  return html
    .replace(
      /<div class="reviews-grid">\n[\s\S]*?\n        <\/div>\n      <\/div>\n    <\/section>\n\n    <section class="section alt">/,
      `<div class="reviews-grid">\n${cards}\n        </div>\n      </div>\n    </section>\n\n    <section class="section alt">`
    )
    .replace(/A snapshot of the \d+ [^<]*?Google reviews/g, `A snapshot of the ${count} ${rating}-star Google reviews`);
}

function updateHtmlCounts(html, data) {
  const count = data.reviewCount;
  const rating = ratingText(data.rating);
  const schemaRating = Number(data.rating || 5).toFixed(1);
  return html
    .replace(/"ratingValue":\s*"\d+(?:\.\d+)?"/g, `"ratingValue": "${schemaRating}"`)
    .replace(/"reviewCount":\s*"\d+"/g, `"reviewCount": "${count}"`)
    .replace(/Mayberry Pressure Washing Reviews \| \d+ 5-Star Google Reviews/g, `Mayberry Pressure Washing Reviews | ${count} 5-Star Google Reviews`)
    .replace(/\d+ Google Reviews/g, `${count} Google Reviews`)
    .replace(/\d+ \d+(?:\.\d+)?-star Google reviews/g, `${count} ${rating}-star Google reviews`)
    .replace(/\d+ \d+(?:\.\d+)?-star reviews/g, `${count} ${rating}-star reviews`)
    .replace(/\d+ Google reviews/g, `${count} Google reviews`)
    .replace(/from \d+ reviews/g, `from ${count} reviews`)
    .replace(/from \d+ Google reviews/g, `from ${count} Google reviews`)
    .replace(/Based on \d+ Google reviews/g, `Based on ${count} Google reviews`)
    .replace(/review total and star rating/g, `review total and star rating`)
    .replace(/has a \d+(?:\.\d+)? rating from \d+ Google reviews/g, `has a ${schemaRating} rating from ${count} Google reviews`)
    .replace(/shows a \d+(?:\.\d+)? rating from \d+ reviews/g, `shows a ${schemaRating} rating from ${count} reviews`);
}

function updateSiteFiles(data) {
  let changed = 0;
  for (const file of allHtmlFiles(root)) {
    let html = readFileSync(file, "utf8");
    let next = updateHtmlCounts(html, data);
    if (relative(root, file) === "reviews.html") {
      next = updateReviewPage(next, data);
    }
    if (next !== html) {
      writeFileSync(file, next);
      changed += 1;
    }
  }
  return changed;
}

function autoPushIfEnabled() {
  if (process.env.MAYBERRY_REVIEWS_AUTO_PUSH !== "1") return;
  const status = execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).trim();
  if (!status) return;
  execFileSync("git", ["add", "data/google-reviews.json", "."], { cwd: root, stdio: "inherit" });
  execFileSync("git", ["commit", "-m", "Update Google reviews"], { cwd: root, stdio: "inherit" });
  execFileSync("git", ["push"], { cwd: root, stdio: "inherit" });
}

async function main() {
  if (discoverLocations) {
    await discoverGoogleLocations();
    return;
  }

  const current = readCurrentData();
  const fetched = localDataOnly ? null : (await fetchBusinessProfileReviews()) || (await fetchPlacesReviews());

  if (!fetched && !localDataOnly) {
    console.log("No Google review credentials configured. Using existing local review data without changing fetched timestamp.");
  }

  const nextData = mergeReviewData(current, fetched);
  const replyResult = replyUnanswered ? await replyToUnansweredReviews(nextData) : { attempted: 0, published: 0 };
  const postResult = maybePost ? await maybeCreateGooglePost() : { attempted: false, published: false };
  const dataChanged = writeJsonIfChanged(dataPath, nextData);
  const fileChanges = updateSite ? updateSiteFiles(nextData) : 0;

  if (dataChanged || fileChanges) {
    console.log(`Review sync complete: dataChanged=${dataChanged} htmlFilesChanged=${fileChanges} reviewCount=${nextData.reviewCount} repliesAttempted=${replyResult.attempted} repliesPublished=${replyResult.published} googlePostAttempted=${postResult.attempted} googlePostPublished=${postResult.published}`);
    autoPushIfEnabled();
  } else {
    console.log(`Review sync complete: no changes reviewCount=${nextData.reviewCount} repliesAttempted=${replyResult.attempted} repliesPublished=${replyResult.published} googlePostAttempted=${postResult.attempted} googlePostPublished=${postResult.published}`);
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
