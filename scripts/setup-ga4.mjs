#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
const envPath = join(root, ".env.local");
const propertyDisplayName = "Mayberry Pressure Washing";
const streamDisplayName = "Mayberry Pressure Washing Website";
const siteOrigin = "https://www.mayberrypw.com";

loadDotEnv(envPath);

function loadDotEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

function upsertEnv(updates) {
  const existing = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const lines = existing.split(/\r?\n/);
  const seen = new Set();
  const next = lines.map((line) => {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
    if (!match || !(match[1] in updates)) return line;
    seen.add(match[1]);
    return `${match[1]}=${updates[match[1]]}`;
  });
  for (const [key, value] of Object.entries(updates)) if (!seen.has(key)) next.push(`${key}=${value}`);
  writeFileSync(envPath, `${next.filter((line, index) => line || index < next.length - 1).join("\n")}\n`);
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(`${options.label || "Google API request"} failed: ${response.status} ${text}`);
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
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    label: "Google OAuth refresh"
  });
  return payload.access_token;
}

function headers(token) {
  return { Authorization: `Bearer ${token}`, "content-type": "application/json" };
}

async function accountAndProperties(token) {
  const summary = await fetchJson("https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200", {
    headers: headers(token),
    label: "Analytics accountSummaries.list"
  });
  const account = (summary.accountSummaries || []).find((item) => !item.account?.includes("deleted"));
  if (!account) throw new Error("No writable Google Analytics account is available to the configured manager.");
  return { account, properties: account.propertySummaries || [] };
}

async function ensureProperty(token) {
  const { account, properties } = await accountAndProperties(token);
  const existing = properties.find((item) => item.displayName === propertyDisplayName);
  if (existing) return { property: existing.property, created: false };
  const property = await fetchJson("https://analyticsadmin.googleapis.com/v1beta/properties", {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({
      parent: account.account,
      displayName: propertyDisplayName,
      timeZone: "America/New_York",
      currencyCode: "USD"
    }),
    label: "Analytics properties.create"
  });
  return { property: property.name, created: true };
}

async function ensureWebStream(token, property) {
  const list = await fetchJson(`https://analyticsadmin.googleapis.com/v1beta/${property}/dataStreams`, {
    headers: headers(token),
    label: "Analytics dataStreams.list"
  });
  const existing = (list.dataStreams || []).find((item) => item.type === "WEB_DATA_STREAM" && (
    item.displayName === streamDisplayName || item.webStreamData?.defaultUri?.replace(/\/$/, "") === siteOrigin
  ));
  if (existing) return { stream: existing, created: false };
  const stream = await fetchJson(`https://analyticsadmin.googleapis.com/v1beta/${property}/dataStreams`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({
      type: "WEB_DATA_STREAM",
      displayName: streamDisplayName,
      webStreamData: { defaultUri: siteOrigin }
    }),
    label: "Analytics dataStreams.create"
  });
  return { stream, created: true };
}

async function configureRetention(token, property) {
  const name = `${property}/dataRetentionSettings`;
  return fetchJson(`https://analyticsadmin.googleapis.com/v1beta/${name}?updateMask=eventDataRetention,resetUserDataOnNewActivity`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify({ name, eventDataRetention: "FOURTEEN_MONTHS", resetUserDataOnNewActivity: true }),
    label: "Analytics dataRetentionSettings.update"
  });
}

async function configureEnhancedMeasurement(token, streamName) {
  const name = `${streamName}/enhancedMeasurementSettings`;
  return fetchJson(`https://analyticsadmin.googleapis.com/v1alpha/${name}?updateMask=streamEnabled,scrollsEnabled,outboundClicksEnabled,siteSearchEnabled,videoEngagementEnabled,fileDownloadsEnabled,pageChangesEnabled,formInteractionsEnabled,searchQueryParameter`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify({
      name,
      streamEnabled: true,
      scrollsEnabled: true,
      outboundClicksEnabled: true,
      siteSearchEnabled: false,
      videoEngagementEnabled: true,
      fileDownloadsEnabled: true,
      pageChangesEnabled: true,
      formInteractionsEnabled: true,
      searchQueryParameter: "q,s,search,query,keyword"
    }),
    label: "Analytics enhancedMeasurementSettings.update"
  });
}

async function ensureKeyEvents(token, property) {
  const desired = ["generate_lead", "phone_click", "quote_request", "contact_click"];
  const existing = await fetchJson(`https://analyticsadmin.googleapis.com/v1beta/${property}/keyEvents?pageSize=50`, {
    headers: headers(token),
    label: "Analytics keyEvents.list"
  });
  const existingNames = new Set((existing.keyEvents || []).map((item) => item.eventName));
  const created = [];
  for (const eventName of desired) {
    if (existingNames.has(eventName)) continue;
    await fetchJson(`https://analyticsadmin.googleapis.com/v1beta/${property}/keyEvents`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ eventName, countingMethod: "ONCE_PER_SESSION" }),
      label: `Analytics keyEvents.create (${eventName})`
    });
    created.push(eventName);
  }
  return { desired, created };
}

async function main() {
  const token = await accessToken();
  const propertyResult = await ensureProperty(token);
  const streamResult = await ensureWebStream(token, propertyResult.property);
  await configureRetention(token, propertyResult.property);
  await configureEnhancedMeasurement(token, streamResult.stream.name);
  const keyEvents = await ensureKeyEvents(token, propertyResult.property);
  const measurementId = streamResult.stream.webStreamData?.measurementId;
  if (!measurementId) throw new Error("Google Analytics did not return a web measurement ID.");
  upsertEnv({
    MAYBERRY_GA4_PROPERTY_ID: propertyResult.property.split("/").pop(),
    MAYBERRY_GA4_DATA_STREAM_ID: streamResult.stream.name.split("/").pop(),
    MAYBERRY_GA4_MEASUREMENT_ID: measurementId
  });
  console.log(`Mayberry GA4 is ready: property=${propertyResult.created ? "created" : "existing"}, stream=${streamResult.created ? "created" : "existing"}, measurement=${measurementId}.`);
  console.log(`GA4 key events ready: ${keyEvents.desired.join(", ")}${keyEvents.created.length ? ` (${keyEvents.created.length} created)` : " (already present)"}.`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
