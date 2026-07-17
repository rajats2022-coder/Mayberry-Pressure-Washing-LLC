#!/usr/bin/env node
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
const envPath = join(root, ".env.local");
const siteUrl = "https://www.mayberrypw.com/";
const sitemapUrl = `${siteUrl}sitemap.xml`;
const command = process.argv[2] || "status";
const reportPath = join(root, "data", "google-search-console.json");
const historyPath = join(root, "data", "google-search-console-history.jsonl");
const inspectionPath = join(root, "data", "google-url-inspection.json");

loadDotEnv(envPath);

function loadDotEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let payload = {};
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = { text }; }
  }
  if (!response.ok) throw new Error(`${options.label || "Google API request"} failed: ${response.status} ${text.slice(0, 500)}`);
  return payload;
}

async function accessToken() {
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN || "",
    grant_type: "refresh_token"
  });
  if ([...body.values()].some((value) => !value)) throw new Error("Google OAuth credentials are incomplete in .env.local.");
  const payload = await fetchJson("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body, label: "Google OAuth refresh"
  });
  return payload.access_token;
}

const authHeaders = (token) => ({ Authorization: `Bearer ${token}`, "content-type": "application/json" });
const encodedSite = encodeURIComponent(siteUrl);

function isoDate(daysAgo) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

async function querySearch(token, startDate, endDate, dimensions = []) {
  return fetchJson(`https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ startDate, endDate, dimensions, rowLimit: 25, dataState: "all" }),
    label: "Search Console searchAnalytics.query"
  });
}

function totals(payload) {
  return (payload.rows || []).reduce((sum, row) => ({
    clicks: sum.clicks + (row.clicks || 0),
    impressions: sum.impressions + (row.impressions || 0),
    weightedPosition: sum.weightedPosition + ((row.position || 0) * (row.impressions || 0))
  }), { clicks: 0, impressions: 0, weightedPosition: 0 });
}

function summarize(total) {
  return {
    clicks: total.clicks,
    impressions: total.impressions,
    ctr: total.impressions ? total.clicks / total.impressions : 0,
    averagePosition: total.impressions ? total.weightedPosition / total.impressions : 0
  };
}

async function notify(message) {
  if (process.env.MAYBERRY_TELEGRAM_NOTIFY === "0") return;
  const botToken = process.env.MAYBERRY_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "";
  const chatId = process.env.MAYBERRY_TELEGRAM_CHAT_ID || process.env.TELEGRAM_HOME_CHANNEL || "";
  if (!botToken || !chatId) return;
  const body = { chat_id: chatId, text: message, disable_web_page_preview: true };
  const threadId = process.env.MAYBERRY_TELEGRAM_THREAD_ID || process.env.TELEGRAM_HOME_CHANNEL_THREAD_ID || "";
  if (threadId) body.message_thread_id = Number(threadId);
  await fetchJson(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), label: "Telegram notification"
  });
}

async function prepare(token) {
  const payload = await fetchJson("https://www.googleapis.com/siteVerification/v1/token", {
    method: "POST", headers: authHeaders(token), body: JSON.stringify({ site: { type: "SITE", identifier: siteUrl }, verificationMethod: "FILE" }), label: "Site Verification token"
  });
  console.log(JSON.stringify({ method: payload.method, token: payload.token }, null, 2));
}

async function enableApi(token) {
  const projectNumber = process.env.GOOGLE_CLOUD_PROJECT_NUMBER || (process.env.GOOGLE_OAUTH_CLIENT_ID || "").match(/^(\d+)-/)?.[1];
  if (!projectNumber) throw new Error("Unable to determine the Google Cloud project number from the OAuth client configuration.");
  const operation = await fetchJson(`https://serviceusage.googleapis.com/v1/projects/${projectNumber}/services/siteverification.googleapis.com:enable`, {
    method: "POST", headers: authHeaders(token), body: "{}", label: "Service Usage Site Verification enable"
  });
  let current = operation;
  for (let attempt = 0; current.name && !current.done && attempt < 12; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    current = await fetchJson(`https://serviceusage.googleapis.com/v1/${current.name}`, { headers: authHeaders(token), label: "Service Usage operation" });
  }
  if (current.error) throw new Error(`Site Verification API enable failed: ${JSON.stringify(current.error)}`);
  if (current.name && !current.done) throw new Error("Timed out waiting for the Site Verification API to enable.");
  console.log("Google Site Verification API enabled.");
}

async function verify(token) {
  await fetchJson("https://www.googleapis.com/siteVerification/v1/webResource?verificationMethod=FILE", {
    method: "POST", headers: authHeaders(token), body: JSON.stringify({ site: { type: "SITE", identifier: siteUrl } }), label: "Site Verification"
  });
  await fetchJson(`https://www.googleapis.com/webmasters/v3/sites/${encodedSite}`, {
    method: "PUT", headers: authHeaders(token), label: "Search Console sites.add"
  });
  await fetchJson(`https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps/${encodeURIComponent(sitemapUrl)}`, {
    method: "PUT", headers: authHeaders(token), label: "Search Console sitemaps.submit"
  });
  console.log("Search Console ownership verified and sitemap submitted.");
}

async function status(token) {
  const sites = await fetchJson("https://www.googleapis.com/webmasters/v3/sites", { headers: authHeaders(token), label: "Search Console sites.list" });
  const entry = (sites.siteEntry || []).find((item) => item.siteUrl === siteUrl);
  if (!entry) throw new Error("The Mayberry www Search Console property is not present for this account.");
  const sitemaps = await fetchJson(`https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps`, { headers: authHeaders(token), label: "Search Console sitemaps.list" });
  console.log(`Search Console property ready (${entry.permissionLevel}); sitemap entries=${(sitemaps.sitemap || []).length}.`);
}

async function report(token) {
  const periods = { current: { startDate: isoDate(30), endDate: isoDate(3) }, previous: { startDate: isoDate(58), endDate: isoDate(31) } };
  const [currentTotal, previousTotal, queries, pages] = await Promise.all([
    querySearch(token, periods.current.startDate, periods.current.endDate),
    querySearch(token, periods.previous.startDate, periods.previous.endDate),
    querySearch(token, periods.current.startDate, periods.current.endDate, ["query"]),
    querySearch(token, periods.current.startDate, periods.current.endDate, ["page"])
  ]);
  const snapshot = {
    generatedAt: new Date().toISOString(), siteUrl, periods,
    current: summarize(totals(currentTotal)), previous: summarize(totals(previousTotal)),
    topQueries: (queries.rows || []).map((row) => ({ query: row.keys?.[0] || "", clicks: row.clicks || 0, impressions: row.impressions || 0, ctr: row.ctr || 0, position: row.position || 0 })),
    topPages: (pages.rows || []).map((row) => ({ page: row.keys?.[0] || "", clicks: row.clicks || 0, impressions: row.impressions || 0, ctr: row.ctr || 0, position: row.position || 0 }))
  };
  writeFileSync(reportPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  appendFileSync(historyPath, `${JSON.stringify(snapshot)}\n`);
  await notify(`[MAYBERRY SEARCH] ${snapshot.current.clicks} clicks, ${snapshot.current.impressions} impressions, ${(snapshot.current.ctr * 100).toFixed(1)}% CTR, avg position ${snapshot.current.averagePosition.toFixed(1)}. 28-day report saved.`);
  console.log(`Search Console report saved: clicks=${snapshot.current.clicks}, impressions=${snapshot.current.impressions}, queries=${snapshot.topQueries.length}, pages=${snapshot.topPages.length}.`);
}

async function inspect(token) {
  const urls = [siteUrl, `${siteUrl}services`, `${siteUrl}contact`, `${siteUrl}services/pressure-washing`, `${siteUrl}service-areas/mount-airy-nc`];
  const inspections = [];
  for (const inspectionUrl of urls) {
    try {
      const payload = await fetchJson("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
        method: "POST", headers: authHeaders(token), body: JSON.stringify({ inspectionUrl, siteUrl, languageCode: "en-US" }), label: "Search Console URL Inspection"
      });
      const result = payload.inspectionResult?.indexStatusResult || {};
      inspections.push({ inspectionUrl, verdict: result.verdict || "UNKNOWN", coverageState: result.coverageState || "", robotsTxtState: result.robotsTxtState || "", indexingState: result.indexingState || "", pageFetchState: result.pageFetchState || "", googleCanonical: result.googleCanonical || "", userCanonical: result.userCanonical || "", lastCrawlTime: result.lastCrawlTime || null });
    } catch (error) {
      inspections.push({ inspectionUrl, verdict: "ERROR", error: error.message.replace(/accounts\/\d+|locations\/\d+/g, "[masked]") });
    }
  }
  const snapshot = { generatedAt: new Date().toISOString(), siteUrl, inspections };
  writeFileSync(inspectionPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`URL Inspection saved for ${inspections.length} priority URLs.`);
}

const token = await accessToken();
if (command === "enable-api") await enableApi(token);
else if (command === "prepare") await prepare(token);
else if (command === "verify") await verify(token);
else if (command === "report") await report(token);
else if (command === "inspect") await inspect(token);
else if (command === "status") await status(token);
else throw new Error(`Unknown command: ${command}`);
