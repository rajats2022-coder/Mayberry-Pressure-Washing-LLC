#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
const envPath = join(root, ".env.local");
const inboxDir = join(root, "automation", "google-photo-inbox");
const archiveDir = join(root, "automation", "google-photo-archive");
const uploadLogPath = join(root, "data", "google-photo-uploads.json");
const defaultDescription = "Finished a nice cleaning today, satisfied customer.";
const defaultCategory = "ADDITIONAL";

loadDotEnv(envPath);

function loadDotEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithRetry(url, options = {}, retries = 3) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetchJson(url, options);
    } catch (error) {
      lastError = error;
      const status = String(error.message || "").match(/failed: (\d+)/)?.[1];
      if (!status || Number(status) < 500 || attempt === retries) break;
      await sleep(750 * 2 ** attempt);
    }
  }
  throw lastError;
}

async function getGoogleAccessToken() {
  if (process.env.GOOGLE_BUSINESS_PROFILE_ACCESS_TOKEN) return process.env.GOOGLE_BUSINESS_PROFILE_ACCESS_TOKEN;
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

function contentTypeFor(path) {
  const ext = extname(path).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".heic") return "image/heic";
  return "image/jpeg";
}

function candidateFiles() {
  const cliFiles = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
  if (cliFiles.length) return cliFiles;
  if (!existsSync(inboxDir)) return [];
  return readdirSync(inboxDir)
    .map((file) => join(inboxDir, file))
    .filter((path) => statSync(path).isFile())
    .filter((path) => /\.(jpe?g|png|webp|heic)$/i.test(path));
}

function readUploadLog() {
  if (!existsSync(uploadLogPath)) return { uploads: [] };
  return JSON.parse(readFileSync(uploadLogPath, "utf8"));
}

function writeUploadLog(log) {
  writeFileSync(uploadLogPath, `${JSON.stringify(log, null, 2)}\n`);
}

async function startUpload(token, locationName) {
  return fetchJson(`https://mybusiness.googleapis.com/v4/${locationName}/media:startUpload`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    label: "Google Business Profile media.startUpload"
  });
}

async function uploadBytes(token, resourceName, path) {
  const response = await fetch(`https://mybusiness.googleapis.com/upload/v1/media/${resourceName}?uploadType=media`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": contentTypeFor(path)
    },
    body: readFileSync(path)
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Google Business Profile media byte upload failed: ${response.status} ${text}`);
  }
}

async function createMedia(token, locationName, resourceName, description, category) {
  return fetchJsonWithRetry(`https://mybusiness.googleapis.com/v4/${locationName}/media`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      mediaFormat: "PHOTO",
      locationAssociation: { category },
      description,
      dataRef: { resourceName }
    }),
    label: "Google Business Profile media.create"
  });
}

async function createMediaFromUrl(token, locationName, sourceUrl, description, category) {
  return fetchJsonWithRetry(`https://mybusiness.googleapis.com/v4/${locationName}/media`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      mediaFormat: "PHOTO",
      locationAssociation: { category },
      description,
      sourceUrl
    }),
    label: "Google Business Profile media.create"
  });
}

function sourceUrlFor(file) {
  const baseUrl = process.env.MAYBERRY_PHOTO_SOURCE_BASE_URL;
  if (!baseUrl) return "";
  const rel = relative(root, file).split("/").map(encodeURIComponent).join("/");
  if (rel.startsWith("..")) return "";
  return `${baseUrl.replace(/\/$/, "")}/${rel}`;
}

async function main() {
  const token = await getGoogleAccessToken();
  const accountName = accountNameFromEnv();
  const locationName = locationNameFromEnv(accountName);
  if (!token || !locationName) {
    console.log("Google OAuth or Business Profile location is not configured. No photos uploaded.");
    return;
  }

  const description = process.env.MAYBERRY_PHOTO_DESCRIPTION || defaultDescription;
  const category = process.env.MAYBERRY_PHOTO_CATEGORY || defaultCategory;
  const files = candidateFiles();
  if (!files.length) {
    console.log("No Mayberry Google photos found to upload.");
    return;
  }

  mkdirSync(archiveDir, { recursive: true });
  const log = readUploadLog();

  for (const file of files) {
    const sourceUrl = sourceUrlFor(file);
    let media;
    let archivedPath = null;
    if (sourceUrl) {
      media = await createMediaFromUrl(token, locationName, sourceUrl, description, category);
    } else {
      const start = await startUpload(token, locationName);
      const resourceName = start.resourceName;
      await uploadBytes(token, resourceName, file);
      media = await createMedia(token, locationName, resourceName, description, category);
      archivedPath = join(archiveDir, `${Date.now()}-${basename(file)}`);
      renameSync(file, archivedPath);
    }
    log.uploads.unshift({
      uploadedAt: new Date().toISOString(),
      file: basename(file),
      sourceUrl: sourceUrl || null,
      archivedPath,
      description,
      category,
      googleMediaName: media.name || null
    });
    console.log(`Uploaded Google photo: ${basename(file)}`);
  }

  log.uploads = log.uploads.slice(0, 200);
  writeUploadLog(log);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
