#!/usr/bin/env node
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const source = readFileSync(fileURLToPath(new URL("../assets/site-analytics.js", import.meta.url)), "utf8");

function run(choice) {
  const listeners = {};
  const scripts = [];
  const document = {
    title: "Analytics test",
    head: { append: (node) => scripts.push(node) },
    body: { append: () => {} },
    createElement: (tag) => ({ tag, querySelectorAll: () => [], setAttribute() {}, remove() {} }),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: (name, callback) => { (listeners[name] ||= []).push(callback); }
  };
  const context = {
    window: {}, document,
    navigator: { globalPrivacyControl: false, doNotTrack: "0" },
    localStorage: { getItem: () => choice, setItem() {}, removeItem() {} },
    location: { origin: "https://www.mayberrypw.com", pathname: "/contact", reload() {} },
    URL, Date, console, encodeURIComponent
  };
  context.window = context;
  vm.runInNewContext(source, context);
  for (const callback of listeners.DOMContentLoaded || []) callback();
  return { scripts, tracked: context.window.mayberryTrack("quote_request", { link_text: "Free Estimate" }), dataLayer: context.window.dataLayer || [] };
}

const denied = run(null);
if (denied.scripts.length !== 0 || denied.tracked !== false) throw new Error("Analytics loaded or tracked before consent.");
const granted = run("granted");
if (granted.scripts.length !== 1 || !String(granted.scripts[0].src).includes("googletagmanager.com/gtag/js")) throw new Error("Analytics did not load after stored consent.");
if (granted.tracked !== true || !granted.dataLayer.length) throw new Error("Conversion tracking did not fire after consent.");
console.log("Consent analytics test passed: blocked before consent and loaded/tracked after consent.");
