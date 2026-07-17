#!/usr/bin/env node
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
const host = "www.mayberrypw.com";
const key = "04de81dd16d2ed0fb321829ebc7b5972";
const keyLocation = `https://${host}/${key}.txt`;
const sitemapPath = join(root, "sitemap.xml");
const currentPath = join(root, "data", "indexnow-submission.json");
const historyPath = join(root, "data", "indexnow-submission-history.jsonl");
const dryRun = process.argv.includes("--dry-run");

const xml = readFileSync(sitemapPath, "utf8");
const urlList = [...xml.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/g)].map((match) => match[1]);
if (!urlList.length) throw new Error("No canonical URLs were found in sitemap.xml.");
if (urlList.some((url) => new URL(url).host !== host)) throw new Error("The sitemap contains a URL outside the preferred www host.");

const result = {
  checkedAt: new Date().toISOString(),
  host,
  keyLocation,
  urlCount: urlList.length,
  endpoint: "https://api.indexnow.org/indexnow",
  status: dryRun ? "dry-run" : "pending"
};

if (!dryRun) {
  const keyResponse = await fetch(keyLocation, { redirect: "follow" });
  const keyBody = await keyResponse.text();
  if (!keyResponse.ok || keyBody.trim() !== key) throw new Error(`IndexNow key verification failed with HTTP ${keyResponse.status}.`);
  const response = await fetch(result.endpoint, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key, keyLocation, urlList })
  });
  result.httpStatus = response.status;
  result.status = response.status === 200 ? "submitted" : response.status === 202 ? "accepted-key-validation-pending" : "failed";
  if (![200, 202].includes(response.status)) throw new Error(`IndexNow submission failed with HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
}

writeFileSync(currentPath, `${JSON.stringify(result, null, 2)}\n`);
appendFileSync(historyPath, `${JSON.stringify(result)}\n`);
console.log(`IndexNow ${result.status}: ${result.urlCount} canonical URLs${result.httpStatus ? `, HTTP ${result.httpStatus}` : ""}.`);
