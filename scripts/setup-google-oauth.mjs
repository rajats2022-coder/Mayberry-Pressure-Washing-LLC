#!/usr/bin/env node
import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
const envPath = join(root, ".env.local");
const redirectUri = "http://127.0.0.1:8787/oauth2callback";
const scope = "https://www.googleapis.com/auth/business.manage";

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

function upsertEnv(path, updates) {
  const existing = existsSync(path) ? readFileSync(path, "utf8") : "";
  const lines = existing.split(/\r?\n/);
  const seen = new Set();
  const next = lines.map((line) => {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
    if (!match || !(match[1] in updates)) return line;
    seen.add(match[1]);
    return `${match[1]}=${updates[match[1]]}`;
  });
  for (const [key, value] of Object.entries(updates)) {
    if (!seen.has(key)) next.push(`${key}=${value}`);
  }
  writeFileSync(path, `${next.filter((line, index) => line || index < next.length - 1).join("\n")}\n`);
}

async function exchangeCode(code) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: "authorization_code"
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`Google OAuth token exchange failed: ${response.status} ${JSON.stringify(payload)}`);
  }
  return payload;
}

async function main() {
  if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
    throw new Error("Fill GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in .env.local first.");
  }

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", process.env.GOOGLE_OAUTH_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("login_hint", process.env.GOOGLE_BUSINESS_PROFILE_MANAGER_EMAIL || "s4aiagency@gmail.com");

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, redirectUri);
      if (url.pathname !== "/oauth2callback") {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      const code = url.searchParams.get("code");
      if (!code) {
        throw new Error(url.searchParams.get("error") || "Missing OAuth code");
      }
      const token = await exchangeCode(code);
      if (!token.refresh_token) {
        throw new Error("Google did not return a refresh token. Re-run with consent prompt or revoke the old grant first.");
      }
      upsertEnv(envPath, {
        GOOGLE_OAUTH_REFRESH_TOKEN: token.refresh_token,
        GOOGLE_BUSINESS_PROFILE_MANAGER_EMAIL: process.env.GOOGLE_BUSINESS_PROFILE_MANAGER_EMAIL || "s4aiagency@gmail.com"
      });
      response.writeHead(200, { "content-type": "text/plain" });
      response.end("Google OAuth is connected. You can close this tab.");
      console.log("Google OAuth refresh token saved to .env.local.");
      server.close();
    } catch (error) {
      response.writeHead(500, { "content-type": "text/plain" });
      response.end(error.message);
      console.error(error.message);
      server.close();
      process.exitCode = 1;
    }
  });

  server.listen(8787, "127.0.0.1", () => {
    console.log("Opening Google OAuth. Sign in as s4aiagency@gmail.com.");
    execFileSync("open", [authUrl.toString()]);
  });
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
