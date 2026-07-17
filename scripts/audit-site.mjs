#!/usr/bin/env node
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
const envPath = join(root, ".env.local");
const hermesEnvPath = process.env.HOME ? join(process.env.HOME, ".hermes", ".env") : "";
const production = process.argv.includes("--production");
const currentPath = join(root, "data", "site-health.json");
const historyPath = join(root, "data", "site-health-history.jsonl");
const origin = "https://www.mayberrypw.com";

loadDotEnv(envPath);
loadDotEnv(hermesEnvPath);

function loadDotEnv(path) {
  if (!path || !existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

function sitemapUrls() {
  return [...readFileSync(join(root, "sitemap.xml"), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

function sourceForUrl(url) {
  const pathname = new URL(url).pathname;
  return pathname === "/" ? join(root, "index.html") : join(root, `${pathname.slice(1)}.html`);
}

function localTargetExists(sourceFile, href) {
  if (!href || href.startsWith("#") || /^(?:https?:|mailto:|tel:|javascript:)/i.test(href)) return true;
  const clean = href.split(/[?#]/)[0];
  if (!clean) return true;
  const base = clean.startsWith("/") ? join(root, clean.slice(1)) : resolve(dirname(sourceFile), clean);
  const candidates = [base, `${base}.html`, join(base, "index.html")];
  return candidates.some((candidate) => existsSync(candidate));
}

function auditLocal(urls) {
  const findings = [];
  const titles = new Map();
  const pages = [];
  for (const url of urls) {
    const file = sourceForUrl(url);
    if (!existsSync(file)) { findings.push({ type: "missing-source", url }); continue; }
    const html = readFileSync(file, "utf8");
    const title = html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() || "";
    const description = html.match(/<meta name="description" content="([^"]*)"/i)?.[1]?.trim() || "";
    const canonical = html.match(/<link rel="canonical" href="([^"]*)"/i)?.[1] || "";
    const h1Count = (html.match(/<h1\b/gi) || []).length;
    const schemas = [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/gi)];
    if (!title) findings.push({ type: "missing-title", url });
    if (!description || description.length > 160) findings.push({ type: "meta-description", url, length: description.length });
    if (canonical !== url) findings.push({ type: "canonical-mismatch", url, canonical });
    if (h1Count !== 1) findings.push({ type: "h1-count", url, count: h1Count });
    if (!html.includes("assets/site-analytics.js") && !html.includes("../assets/site-analytics.js")) findings.push({ type: "analytics-missing", url });
    if (!html.includes('rel="icon"') || !html.includes('rel="apple-touch-icon"')) findings.push({ type: "icon-missing", url });
    for (const schema of schemas) { try { JSON.parse(schema[1]); } catch (error) { findings.push({ type: "invalid-json-ld", url, error: error.message }); } }
    for (const match of html.matchAll(/<img\b([^>]*)>/gi)) if (!/\balt=(?:"[^"]*"|'[^']*')/i.test(match[1])) findings.push({ type: "missing-image-alt", url });
    for (const match of html.matchAll(/\bhref="([^"]+)"/gi)) if (!localTargetExists(file, match[1])) findings.push({ type: "broken-local-link", url, href: match[1] });
    if (!titles.has(title)) titles.set(title, []);
    titles.get(title).push(url);
    pages.push({ url, file: relative(root, file), title, descriptionLength: description.length, canonical, h1Count, schemaCount: schemas.length });
  }
  for (const [title, duplicates] of titles) if (duplicates.length > 1) findings.push({ type: "duplicate-title", title, urls: duplicates });
  return { pages, findings };
}

async function auditProduction(urls) {
  const results = await Promise.all(urls.map(async (url) => {
    try {
      const response = await fetch(url, { redirect: "follow", headers: { "user-agent": "MayberrySiteHealth/1.0" } });
      const body = await response.text();
      const canonical = body.match(/<link rel="canonical" href="([^"]*)"/i)?.[1] || "";
      return { url, status: response.status, finalUrl: response.url, canonical, ok: response.ok && response.url === url && canonical === url };
    } catch (error) { return { url, status: 0, finalUrl: "", canonical: "", ok: false, error: error.message }; }
  }));
  const [apex, httpWww, robots, sitemap, key] = await Promise.all([
    fetch("https://mayberrypw.com/", { redirect: "manual" }),
    fetch("http://www.mayberrypw.com/", { redirect: "manual" }),
    fetch(`${origin}/robots.txt`),
    fetch(`${origin}/sitemap.xml`),
    fetch(`${origin}/04de81dd16d2ed0fb321829ebc7b5972.txt`)
  ]);
  return {
    pages: results,
    redirects: {
      apex: { status: apex.status, location: apex.headers.get("location") || "" },
      httpWww: { status: httpWww.status, location: httpWww.headers.get("location") || "" }
    },
    supportFiles: { robots: robots.status, sitemap: sitemap.status, indexNowKey: key.status },
    securityHeaders: {
      xContentTypeOptions: robots.headers.get("x-content-type-options") || "",
      referrerPolicy: robots.headers.get("referrer-policy") || "",
      permissionsPolicy: robots.headers.get("permissions-policy") || "",
      xFrameOptions: robots.headers.get("x-frame-options") || ""
    },
    findings: results.filter((item) => !item.ok).map((item) => ({ type: "production-page", ...item }))
  };
}

async function notify(report) {
  if (process.env.MAYBERRY_TELEGRAM_NOTIFY === "0") return;
  const botToken = process.env.MAYBERRY_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "";
  const chatId = process.env.MAYBERRY_TELEGRAM_CHAT_ID || process.env.TELEGRAM_HOME_CHANNEL || "";
  if (!botToken || !chatId) return;
  const profile = existsSync(join(root, "data", "google-profile-audit.json")) ? JSON.parse(readFileSync(join(root, "data", "google-profile-audit.json"), "utf8")) : null;
  const message = `[MAYBERRY HEALTH] ${report.status.toUpperCase()} — ${report.urlCount} canonical URLs, ${report.findings.length} site finding(s), ${profile?.media?.total ?? "n/a"} GBP photos, ${profile?.findings?.length ?? "n/a"} profile finding(s).`;
  const body = { chat_id: chatId, text: message, disable_web_page_preview: true };
  const threadId = process.env.MAYBERRY_TELEGRAM_THREAD_ID || process.env.TELEGRAM_HOME_CHANNEL_THREAD_ID || "";
  if (threadId) body.message_thread_id = Number(threadId);
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}

const urls = sitemapUrls();
const local = auditLocal(urls);
const live = production ? await auditProduction(urls) : null;
const findings = [...local.findings, ...(live?.findings || [])];
if (live && live.supportFiles.robots !== 200) findings.push({ type: "robots-status", status: live.supportFiles.robots });
if (live && live.supportFiles.sitemap !== 200) findings.push({ type: "sitemap-status", status: live.supportFiles.sitemap });
if (live && live.supportFiles.indexNowKey !== 200) findings.push({ type: "indexnow-key-status", status: live.supportFiles.indexNowKey });
const report = { generatedAt: new Date().toISOString(), mode: production ? "production" : "local", status: findings.length ? "attention" : "healthy", urlCount: urls.length, local, production: live, findings };
writeFileSync(currentPath, `${JSON.stringify(report, null, 2)}\n`);
appendFileSync(historyPath, `${JSON.stringify({ generatedAt: report.generatedAt, mode: report.mode, status: report.status, urlCount: report.urlCount, findingCount: findings.length })}\n`);
await notify(report);
console.log(`Site health ${report.status}: urls=${urls.length}, findings=${findings.length}, mode=${report.mode}.`);
if (findings.length) process.exitCode = 1;
