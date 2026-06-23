#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
const dataPath = join(root, "data", "google-reviews.json");
const envPath = join(root, ".env.local");
const hermesEnvPath = process.env.HOME ? join(process.env.HOME, ".hermes", ".env") : "";
const args = new Set(process.argv.slice(2));
const updateSite = args.has("--update-site") || args.has("--local-data");
const localDataOnly = args.has("--local-data");
const replyUnanswered = args.has("--reply-unanswered");
const discoverLocations = args.has("--discover-locations");
const maybePost = args.has("--maybe-post");
const expectedManagerEmail = "s4aiagency@gmail.com";
const googlePostStatePath = join(root, "data", "google-post-automation.json");

loadDotEnv(envPath);
loadDotEnv(hermesEnvPath);

function loadDotEnv(path) {
  if (!path || !existsSync(path)) return;
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

function firstConfiguredChatId() {
  const allowed = process.env.TELEGRAM_ALLOWED_USERS || "";
  return allowed.split(",").map(value => value.trim()).find(Boolean) || "";
}

function telegramConfig() {
  return {
    enabled: process.env.MAYBERRY_TELEGRAM_NOTIFY !== "0" && !args.has("--no-telegram"),
    botToken: process.env.MAYBERRY_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "",
    chatId: process.env.MAYBERRY_TELEGRAM_CHAT_ID || process.env.TELEGRAM_HOME_CHANNEL || firstConfiguredChatId()
  };
}

async function sendTelegramMessage(message) {
  const { enabled, botToken, chatId } = telegramConfig();
  if (!enabled || !botToken || !chatId) return false;

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      disable_web_page_preview: true
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Telegram notification failed: ${response.status} ${text}`);
  }
  return true;
}

function runLabel() {
  if (maybePost && localDataOnly) return "Google post check";
  if (replyUnanswered) return "Review sync + replies";
  if (updateSite) return "Review sync";
  return "Google review automation";
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
  const merged = [...fetchedReviews];

  if (fetched.source !== "google-business-profile") {
    const seen = new Set(fetchedReviews.map((review) => review.id));
    for (const review of current.reviews ?? []) {
      if (!seen.has(review.id) && review.name) merged.push(review);
    }
  }

  for (const review of merged) {
    const prior = currentById.get(review.id);
    if (prior?.text && (!review.text || review.text === "5-star Google review")) review.text = prior.text;
  }

  const googleReviewCount = fetched.source === "google-business-profile"
    ? Math.max(Number(fetched.reviewCount || 0), fetchedReviews.filter((review) => review.name).length)
    : Number(current.googleReviewCount || merged.filter((review) => review.name).length || 0);

  return {
    ...current,
    rating: fetched.rating || current.rating || 5,
    reviewCount: googleReviewCount,
    googleReviewCount,
    websiteReviewCount: 0,
    totalReviewCount: googleReviewCount,
    source: fetched.source,
    lastFetchedAt: new Date().toISOString(),
    expectedManagerEmail: process.env.GOOGLE_BUSINESS_PROFILE_MANAGER_EMAIL || expectedManagerEmail,
    reviews: merged.slice(0, Math.max(googleReviewCount, merged.length))
  };
}

function replyToneForRating(rating) {
  if (rating >= 5) return "thankful, concise, and specific";
  if (rating >= 4) return "thankful and lightly constructive";
  if (rating >= 3) return "professional, appreciative, and improvement-focused";
  return "calm, apologetic, and move the conversation offline";
}

function firstName(author) {
  const name = String(author || "").trim();
  if (!name || name === "Google reviewer") return "";
  return name.split(/\s+/)[0].replace(/[^\p{L}'-]/gu, "");
}

function positiveReviewDetail(review) {
  const text = String(review.text || "").toLowerCase();
  const details = [
    [/house|home|siding/, "your home"],
    [/driveway|concrete|surface/, "the driveway and concrete cleaning"],
    [/garage/, "the house and garage"],
    [/window/, "the window cleaning"],
    [/roof/, "the roof washing"],
    [/gutter/, "the gutter cleaning"],
    [/deck/, "the deck cleaning"],
    [/commercial|business|storefront|property/, "your property"],
    [/quote|schedule|appointment|responsive|communication|communicative/, "the communication and scheduling"],
    [/on time|reliable|professional/, "the reliable, professional service"],
    [/price|pricing|fair/, "the fair pricing and finished work"],
    [/rain|weather/, "the work even with the weather"],
    [/recommend|10\/10|best/, "the experience enough to recommend us"]
  ];
  const matches = [];
  for (const [pattern, detail] of details) {
    if (pattern.test(text) && !matches.includes(detail)) matches.push(detail);
    if (matches.length >= 2) break;
  }
  return matches.length ? matches.join(" and ") : "the work";
}

function fallbackReply(review) {
  const contactUrl = process.env.MAYBERRY_CONTACT_URL || "https://www.mayberrypw.com/contact";
  const author = firstName(review.author);
  if (review.rating >= 4) {
    const greeting = author ? `, ${author}` : "";
    return `Thank you so much for the review${greeting}. I really appreciate you trusting Mayberry Pressure Washing with ${positiveReviewDetail(review)}, and I am glad you were happy with the result.\n\nIf you know someone in need of pressure washing, please check out our brand new website and have them fill out a request for a free estimate: ${contactUrl}.`;
  }
  const greeting = author ? `, ${author}` : "";
  return `Thank you for the feedback${greeting}. I appreciate you taking the time to share your experience, and I would welcome a direct conversation so we can better understand what happened and make it right.`;
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
  const contactUrl = process.env.MAYBERRY_CONTACT_URL || "https://www.mayberrypw.com/contact";
  const posts = [
    `House siding, brick, and trim can collect grime fast in North Carolina weather. Mayberry Pressure Washing offers house washing and soft washing around Mount Airy and nearby areas. Request a free estimate here: ${contactUrl}`,
    `Driveways, sidewalks, and concrete pads make a big first impression. If yours is stained or weathered, Mayberry Pressure Washing can help clean it up with a free exterior cleaning quote: ${contactUrl}`,
    `Getting a property ready for guests, listing photos, or a seasonal refresh? Mayberry Pressure Washing handles house washing, driveway cleaning, gutters, windows, decks, fences, and commercial exterior cleaning. Start here: ${contactUrl}`,
    `Rooflines, gutters, and exterior surfaces need the right cleaning method, not just high pressure. Mayberry Pressure Washing can recommend the right service for your home or business. Request a free estimate: ${contactUrl}`,
    `Serving Mount Airy, Winston-Salem, Pilot Mountain, Elkin, Dobson, Wilkesboro, and surrounding areas. Tell Mayberry Pressure Washing what needs cleaned and get a free estimate online: ${contactUrl}`,
    `Commercial storefronts, apartments, sidewalks, and building exteriors need to look cared for. Mayberry Pressure Washing helps local properties stay clean from the curb. Request a quote here: ${contactUrl}`
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

  const contactUrl = process.env.MAYBERRY_CONTACT_URL || "https://www.mayberrypw.com/contact";
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

function reviewStats(data) {
  const googleCount = Number(data.googleReviewCount || data.reviewCount || (data.reviews ?? []).filter((review) => review.name).length || 0);
  return { googleCount, totalCount: googleCount };
}

function updateReviewPage(html, data) {
  const { googleCount } = reviewStats(data);
  const rating = ratingText(data.rating);
  const cards = data.reviews.map(reviewCard).join("\n");
  return html
    .replace(
      /<div class="reviews-grid">\n[\s\S]*?\n        <\/div>\n      <\/div>\n    <\/section>\n\n    <section class="section alt">/,
      `<div class="reviews-grid">\n${cards}\n        </div>\n      </div>\n    </section>\n\n    <section class="section alt">`
    )
    .replace(/A snapshot of (?:the )?\d+ [^<]*?(?:Google|customer) reviews[^<]*/g, `A snapshot of ${googleCount} ${rating}-star Google Business Profile reviews.`);
}

function updateHtmlCounts(html, data) {
  const { googleCount } = reviewStats(data);
  const rating = ratingText(data.rating);
  const schemaRating = Number(data.rating || 5).toFixed(1);
  return html
    .replace(/"ratingValue":\s*"\d+(?:\.\d+)?"/g, `"ratingValue": "${schemaRating}"`)
    .replace(/"reviewCount":\s*"\d+"/g, `"reviewCount": "${googleCount}"`)
    .replace(/Mayberry Pressure Washing Reviews \| \d+ Google Reviews \+ \d+ Website Reviews/g, `Mayberry Pressure Washing Reviews | ${googleCount} 5-Star Google Reviews`)
    .replace(/Mayberry Pressure Washing Reviews \| \d+ 5-Star Google Reviews/g, `Mayberry Pressure Washing Reviews | ${googleCount} 5-Star Google Reviews`)
    .replace(/See Mayberry Pressure Washing LLC's \d+(?:\.\d+)? Google rating from \d+ Google reviews plus \d+ website reviews\./g, `See Mayberry Pressure Washing LLC's ${schemaRating} Google rating from ${googleCount} Google reviews.`)
    .replace(/See Mayberry Pressure Washing LLC's \d+(?:\.\d+)? Google rating from \d+ reviews and open the live Google Business Profile\./g, `See Mayberry Pressure Washing LLC's ${schemaRating} Google rating from ${googleCount} Google reviews.`)
    .replace(/Read Mayberry Pressure Washing LLC reviews, including \d+ Google reviews and \d+ website reviews for exterior cleaning service in Mount Airy, NC\./g, `Read Mayberry Pressure Washing LLC Google reviews, see the ${schemaRating} rating from ${googleCount} Google reviews, and leave a review for exterior cleaning service in Mount Airy, NC.`)
    .replace(/Read Mayberry Pressure Washing LLC Google reviews, see the \d+(?:\.\d+)? rating from \d+ Google reviews, and leave a review for exterior cleaning service in Mount Airy, NC\./g, `Read Mayberry Pressure Washing LLC Google reviews, see the ${schemaRating} rating from ${googleCount} Google reviews, and leave a review for exterior cleaning service in Mount Airy, NC.`)
    .replace(/<h1>\d+ Google reviews and \d+ website reviews\.<\/h1>/g, `<h1>${googleCount} 5-star reviews on Google.</h1>`)
    .replace(/<h1>\d+ 5-star reviews on Google\.<\/h1>/g, `<h1>${googleCount} 5-star reviews on Google.</h1>`)
    .replace(/These reviews include Mayberry Pressure Washing's Google Business Profile reviews and customer reviews featured on the website\./g, `These 5-star reviews are from Mayberry Pressure Washing's Google Business Profile.`)
    .replace(/These 5-star reviews are from Mayberry Pressure Washing's Google Business Profile\./g, `These 5-star reviews are from Mayberry Pressure Washing's Google Business Profile.`)
    .replace(/The review total and star rating are presented from the Google Business Profile\./g, `The Google review total and star rating are presented from the Google Business Profile.`)
    .replace(/<h3>Customer reviews<\/h3><strong><a href="reviews\.html">\d+ 5-star reviews<\/a><\/strong><p>Mayberry Pressure Washing has \d+ Google reviews and \d+ website reviews featured on the site\.<\/p>/g, `<h3>Google reviews</h3><strong><a href="reviews.html">${googleCount} 5-star reviews</a></strong><p>Mayberry Pressure Washing's Google Business Profile shows a ${schemaRating} rating from ${googleCount} reviews.</p>`)
    .replace(/<h3>Google reviews<\/h3><strong><a href="reviews\.html">\d+ 5-star reviews<\/a><\/strong><p>Mayberry Pressure Washing's Google Business Profile shows a \d+(?:\.\d+)? rating from \d+ reviews\.<\/p>/g, `<h3>Google reviews</h3><strong><a href="reviews.html">${googleCount} 5-star reviews</a></strong><p>Mayberry Pressure Washing's Google Business Profile shows a ${schemaRating} rating from ${googleCount} reviews.</p>`)
    .replace(/\d+ 5-Star Google Reviews/g, `${googleCount} 5-Star Google Reviews`)
    .replace(/\d+ Google Reviews/g, `${googleCount} Google Reviews`)
    .replace(/\d+ \d+(?:\.\d+)?-star Google reviews/g, `${googleCount} ${rating}-star Google reviews`)
    .replace(/\d+ \d+(?:\.\d+)?-star reviews/g, `${googleCount} ${rating}-star reviews`)
    .replace(/\d+ Google reviews/g, `${googleCount} Google reviews`)
    .replace(/from \d+ reviews/g, `from ${googleCount} reviews`)
    .replace(/from \d+ Google reviews/g, `from ${googleCount} Google reviews`)
    .replace(/Based on \d+ Google reviews/g, `Based on ${googleCount} Google reviews`)
    .replace(/review total and star rating/g, `review total and star rating`)
    .replace(/has a \d+(?:\.\d+)? rating from \d+ Google reviews/g, `has a ${schemaRating} rating from ${googleCount} Google reviews`)
    .replace(/shows a \d+(?:\.\d+)? rating from \d+ reviews/g, `shows a ${schemaRating} rating from ${googleCount} reviews`);
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
  const result = { enabled: process.env.MAYBERRY_REVIEWS_AUTO_PUSH === "1", pushed: false };
  if (!result.enabled) return result;
  const status = execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).trim();
  if (!status) return result;
  execFileSync("git", ["add", "data/google-reviews.json", "."], { cwd: root, stdio: "inherit" });
  execFileSync("git", ["commit", "-m", "Update Google reviews"], { cwd: root, stdio: "inherit" });
  execFileSync("git", ["push"], { cwd: root, stdio: "inherit" });
  result.pushed = true;
  return result;
}

function completionMessage({ dataChanged, fileChanges, reviewCount, replyResult, postResult, pushResult }) {
  const pushStatus = pushResult.pushed ? "yes" : pushResult.enabled && (dataChanged || fileChanges) ? "no changes" : pushResult.enabled ? "not needed" : "off";
  return [
    `Mayberry ${runLabel()} complete`,
    `Reviews: ${reviewCount}`,
    `Data changed: ${dataChanged ? "yes" : "no"}`,
    `HTML files changed: ${fileChanges}`,
    `Review replies: ${replyResult.published}/${replyResult.attempted}`,
    `Google post: ${postResult.published ? "published" : postResult.attempted ? "checked, not published" : "not due"}`,
    `GitHub push: ${pushStatus}`
  ].join("\n");
}

async function notifyCompletion(summary) {
  try {
    await sendTelegramMessage(completionMessage(summary));
  } catch (error) {
    console.error(error.stack || error.message);
  }
}

async function notifyFailure(error) {
  try {
    await sendTelegramMessage([
      `Mayberry ${runLabel()} failed`,
      String(error?.message || error).slice(0, 700)
    ].join("\n"));
  } catch (notifyError) {
    console.error(notifyError.stack || notifyError.message);
  }
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
  let pushResult = { enabled: process.env.MAYBERRY_REVIEWS_AUTO_PUSH === "1", pushed: false };

  if (dataChanged || fileChanges) {
    console.log(`Review sync complete: dataChanged=${dataChanged} htmlFilesChanged=${fileChanges} reviewCount=${nextData.reviewCount} repliesAttempted=${replyResult.attempted} repliesPublished=${replyResult.published} googlePostAttempted=${postResult.attempted} googlePostPublished=${postResult.published}`);
    pushResult = autoPushIfEnabled();
  } else {
    console.log(`Review sync complete: no changes reviewCount=${nextData.reviewCount} repliesAttempted=${replyResult.attempted} repliesPublished=${replyResult.published} googlePostAttempted=${postResult.attempted} googlePostPublished=${postResult.published}`);
  }
  await notifyCompletion({
    dataChanged,
    fileChanges,
    reviewCount: nextData.reviewCount,
    replyResult,
    postResult,
    pushResult
  });
}

main().catch((error) => {
  console.error(error.stack || error.message);
  notifyFailure(error).finally(() => process.exit(1));
});
