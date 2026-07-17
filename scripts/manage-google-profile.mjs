#!/usr/bin/env node
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
const envPath = join(root, ".env.local");
const hermesEnvPath = process.env.HOME ? join(process.env.HOME, ".hermes", ".env") : "";
const args = new Set(process.argv.slice(2));
const auditPath = join(root, "data", "google-profile-audit.json");
const historyPath = join(root, "data", "google-profile-audit-history.jsonl");

loadDotEnv(envPath);
loadDotEnv(hermesEnvPath);

function loadDotEnv(path) {
  if (!path || !existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let payload = {};
  if (text) { try { payload = JSON.parse(text); } catch { payload = { raw: text }; } }
  if (!response.ok) throw new Error(`${options.label || "Google API request"} failed: ${response.status} ${text.slice(0, 500)}`);
  return payload;
}

async function token() {
  const body = new URLSearchParams({ client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || "", client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "", refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN || "", grant_type: "refresh_token" });
  if ([...body.values()].some((value) => !value)) throw new Error("Google OAuth credentials are incomplete.");
  return (await fetchJson("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body, label: "Google OAuth refresh" })).access_token;
}

const auth = (accessToken) => ({ Authorization: `Bearer ${accessToken}` });
const rawLocationId = () => (process.env.GOOGLE_BUSINESS_PROFILE_LOCATION_ID || "").split("/").filter(Boolean).pop();
const accountName = () => {
  const raw = process.env.GOOGLE_BUSINESS_PROFILE_ACCOUNT_ID || "";
  return raw.startsWith("accounts/") ? raw : `accounts/${raw}`;
};
const v4LocationName = () => `${accountName()}/locations/${rawLocationId()}`;

const profileReadMask = ["name", "title", "phoneNumbers", "categories", "websiteUri", "regularHours", "specialHours", "serviceArea", "profile", "openInfo", "metadata", "serviceItems"].join(",");
const profileDescription = "Mayberry Pressure Washing LLC is a local exterior cleaning company serving homeowners, property managers, and businesses in Mount Airy and nearby Northwest North Carolina and Triad communities. Services include pressure washing, soft washing, house washing, roof washing, driveway and concrete cleaning, gutter cleaning and brightening, window cleaning, deck and fence cleaning, wood staining, gutter guard installation, and commercial exterior cleaning. We match the cleaning method to each surface, provide clear estimates, and communicate throughout the job.";
const desiredWebsite = "https://www.mayberrypw.com/?utm_source=google&utm_medium=organic&utm_campaign=gbp_profile";
const desiredAttributes = [
  { name: "attributes/url_appointment", uriValues: [{ uri: "https://www.mayberrypw.com/contact?utm_source=google&utm_medium=organic&utm_campaign=gbp_quote" }] },
  { name: "attributes/url_facebook", uriValues: [{ uri: "https://www.facebook.com/profile.php?id=61576662606045" }] },
  { name: "attributes/url_instagram", uriValues: [{ uri: "https://www.instagram.com/mayberrypressurewashingllc/" }] }
];

async function profile(accessToken) {
  const url = new URL(`https://mybusinessbusinessinformation.googleapis.com/v1/locations/${rawLocationId()}`);
  url.searchParams.set("readMask", profileReadMask);
  return fetchJson(url, { headers: auth(accessToken), label: "GBP locations.get" });
}

async function attributes(accessToken) {
  return fetchJson(`https://mybusinessbusinessinformation.googleapis.com/v1/locations/${rawLocationId()}/attributes`, { headers: auth(accessToken), label: "GBP attributes.get" });
}

async function media(accessToken) {
  return fetchJson(`https://mybusiness.googleapis.com/v4/${v4LocationName()}/media?pageSize=100`, { headers: auth(accessToken), label: "GBP media.list" });
}

async function posts(accessToken) {
  return fetchJson(`https://mybusiness.googleapis.com/v4/${v4LocationName()}/localPosts?pageSize=100`, { headers: auth(accessToken), label: "GBP localPosts.list" });
}

async function googleUpdated(accessToken) {
  const url = new URL(`https://mybusinessbusinessinformation.googleapis.com/v1/locations/${rawLocationId()}:getGoogleUpdated`);
  url.searchParams.set("readMask", profileReadMask);
  return fetchJson(url, { headers: auth(accessToken), label: "GBP locations.getGoogleUpdated" });
}

function serviceSummary(item) {
  const structured = item.structuredServiceItem;
  const custom = item.freeFormServiceItem;
  return structured ? { type: "structured", name: structured.serviceTypeId, description: structured.description || "" } : { type: "custom", name: custom?.label?.displayName || "", description: custom?.label?.description || "" };
}

function hourSummary(regularHours) {
  return (regularHours?.periods || []).map((period) => ({ openDay: period.openDay, openTime: period.openTime || null, closeDay: period.closeDay || period.openDay, closeTime: period.closeTime || null }));
}

function summarize(current, currentAttributes, currentMedia, currentPosts, updates) {
  const areas = (current.serviceArea?.places?.placeInfos || []).map((item) => item.placeName || item.placeId).filter(Boolean);
  const services = (current.serviceItems || []).map(serviceSummary);
  const attributeList = (currentAttributes.attributes || []).map((item) => ({ name: item.name, values: item.values || null, uriValues: item.uriValues || null }));
  const mediaByCategory = {};
  for (const item of currentMedia.mediaItems || []) mediaByCategory[item.locationAssociation?.category || "UNSPECIFIED"] = (mediaByCategory[item.locationAssociation?.category || "UNSPECIFIED"] || 0) + 1;
  const findings = [];
  if (current.title !== "Mayberry Pressure Washing LLC") findings.push("Business name differs from the verified real-world name.");
  if (current.websiteUri !== desiredWebsite) findings.push("Website link is not the preferred www URL with GBP campaign tracking.");
  if (current.profile?.description !== profileDescription) findings.push("Business description needs the approved pressure-washing rewrite.");
  if (!attributeList.some((item) => item.name === "attributes/url_appointment")) findings.push("Request-a-quote link is missing.");
  if (areas.some((area) => /^(Clemmons|Greensboro)\b/i.test(area))) findings.push("Live GBP service areas differ from the client-provided website coverage; owner confirmation is required before changing them.");
  if (!(current.specialHours?.specialHourPeriods || []).length) findings.push("No special hours are currently published; add them only when the owner confirms a holiday exception.");
  if ((services.length || 0) < 10) findings.push("The profile service list is incomplete.");
  return {
    auditedAt: new Date().toISOString(),
    businessName: current.title,
    businessType: current.serviceArea?.businessType || "",
    primaryCategory: current.categories?.primaryCategory?.displayName || current.categories?.primaryCategory?.name || "",
    additionalCategories: (current.categories?.additionalCategories || []).map((item) => item.displayName || item.name),
    phoneNumbers: current.phoneNumbers || {}, websiteUri: current.websiteUri || "", description: current.profile?.description || "",
    serviceAreas: areas, regularHours: hourSummary(current.regularHours), specialHourCount: (current.specialHours?.specialHourPeriods || []).length,
    attributes: attributeList, services, serviceCount: services.length,
    media: { total: (currentMedia.mediaItems || []).length, byCategory: mediaByCategory },
    posts: { total: (currentPosts.localPosts || []).length, latestCreateTime: currentPosts.localPosts?.[0]?.createTime || null, latestState: currentPosts.localPosts?.[0]?.state || null },
    verification: { hasVoiceOfMerchant: Boolean(current.metadata?.hasVoiceOfMerchant), canModifyServiceList: Boolean(current.metadata?.canModifyServiceList) },
    googleUpdated: { diffMask: updates.diffMask || "", pendingMask: updates.pendingMask || "" },
    findings
  };
}

async function audit(accessToken, { recordHistory = true } = {}) {
  const [current, currentAttributes, currentMedia, currentPosts, updates] = await Promise.all([profile(accessToken), attributes(accessToken), media(accessToken), posts(accessToken), googleUpdated(accessToken)]);
  const report = summarize(current, currentAttributes, currentMedia, currentPosts, updates);
  writeFileSync(auditPath, `${JSON.stringify(report, null, 2)}\n`);
  if (recordHistory) appendFileSync(historyPath, `${JSON.stringify(report)}\n`);
  console.log(`GBP audit: services=${report.serviceCount}, media=${report.media.total}, posts=${report.posts.total}, findings=${report.findings.length}.`);
  return report;
}

async function patchProfile(accessToken, validateOnly) {
  const url = new URL(`https://mybusinessbusinessinformation.googleapis.com/v1/locations/${rawLocationId()}`);
  url.searchParams.set("updateMask", "websiteUri,profile.description");
  if (validateOnly) url.searchParams.set("validateOnly", "true");
  return fetchJson(url, { method: "PATCH", headers: { ...auth(accessToken), "content-type": "application/json" }, body: JSON.stringify({ name: `locations/${rawLocationId()}`, websiteUri: desiredWebsite, profile: { description: profileDescription } }), label: `GBP profile patch${validateOnly ? " validation" : ""}` });
}

async function patchAttributes(accessToken, validateOnly) {
  if (validateOnly) {
    const available = new Set();
    let pageToken = "";
    do {
      const listUrl = new URL("https://mybusinessbusinessinformation.googleapis.com/v1/attributes");
      listUrl.searchParams.set("parent", `locations/${rawLocationId()}`);
      listUrl.searchParams.set("pageSize", "100");
      if (pageToken) listUrl.searchParams.set("pageToken", pageToken);
      const page = await fetchJson(listUrl, { headers: auth(accessToken), label: "GBP attributes.list" });
      for (const item of page.attributeMetadata || []) if (!item.deprecated) available.add(item.parent);
      pageToken = page.nextPageToken || "";
    } while (pageToken);
    const unavailable = desiredAttributes.map((item) => item.name).filter((name) => !available.has(name));
    if (unavailable.length) throw new Error(`Unavailable GBP attributes: ${unavailable.join(", ")}`);
    return { validated: true, attributes: desiredAttributes.map((item) => item.name) };
  }
  const url = new URL(`https://mybusinessbusinessinformation.googleapis.com/v1/locations/${rawLocationId()}/attributes`);
  url.searchParams.set("attributeMask", desiredAttributes.map((item) => item.name).join(","));
  return fetchJson(url, { method: "PATCH", headers: { ...auth(accessToken), "content-type": "application/json" }, body: JSON.stringify({ name: `locations/${rawLocationId()}/attributes`, attributes: desiredAttributes }), label: "GBP attributes patch" });
}

const accessToken = await token();
if (!rawLocationId()) throw new Error("Mayberry GBP location is not configured.");
if (args.has("--apply")) {
  await patchProfile(accessToken, true);
  await patchAttributes(accessToken, true);
  if (!args.has("--dry-run")) {
    await patchProfile(accessToken, false);
    await patchAttributes(accessToken, false);
  }
  console.log(`GBP profile changes ${args.has("--dry-run") ? "validated" : "applied"}.`);
}
await audit(accessToken);
