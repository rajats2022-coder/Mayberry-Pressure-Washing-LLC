#!/usr/bin/env node
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const source = readFileSync(fileURLToPath(new URL("../assets/site-analytics.js", import.meta.url)), "utf8");

function run(choice, click) {
  const listeners = {};
  const scripts = [];
  const document = {
    title: "Analytics test",
    head: { append: (node) => scripts.push(node) },
    body: { append: () => {}, classList: { add() {}, remove() {} } },
    createElement: (tag) => ({ tag, querySelectorAll: () => [], setAttribute() {}, remove() {} }),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: (name, callback) => { (listeners[name] ||= []).push(callback); }
  };
  const context = {
    window: {}, document,
    navigator: { globalPrivacyControl: false, doNotTrack: "0" },
    localStorage: { getItem: () => choice, setItem() {}, removeItem() {} },
    location: { origin: "https://www.mayberrypw.com", pathname: click?.pathname || "/contact", search: "?private=test", reload() {} },
    URL, URLSearchParams, Date, console, encodeURIComponent
  };
  context.window = context;
  vm.runInNewContext(source, context);
  for (const callback of listeners.DOMContentLoaded || []) callback();
  if (click) {
    const link = { getAttribute: () => click.href, textContent: click.label, closest: (selector) => click.banner && selector === "[data-christmas-banner]" ? {} : null };
    for (const callback of listeners.click || []) callback({ target: { closest: () => link } });
  }
  return { scripts, tracked: context.window.mayberryTrack("quote_request", { link_text: "Free Estimate" }), dataLayer: context.window.dataLayer || [] };
}

const denied = run(null);
if (denied.scripts.length !== 0 || denied.tracked !== false) throw new Error("Analytics loaded or tracked before consent.");
if (/phone_click",\s*\{\s*link_text/.test(source)) throw new Error("Phone click tracking must not send visible CTA text or phone numbers.");
const granted = run("granted");
if (granted.scripts.length !== 1 || !String(granted.scripts[0].src).includes("googletagmanager.com/gtag/js")) throw new Error("Analytics did not load after stored consent.");
if (granted.tracked !== true || !granted.dataLayer.length) throw new Error("Conversion tracking did not fire after consent.");
console.log("Consent analytics test passed: blocked before consent and loaded/tracked after consent.");

const seasonal = run("granted", { pathname: "/", href: "/services/christmas-light-installation", label: "Explore Christmas lights", banner: true });
const bannerEvent = seasonal.dataLayer.find((entry) => entry[0] === "event" && entry[1] === "service_page_click");
if (!bannerEvent || bannerEvent[2].cta_location !== "seasonal_banner" || bannerEvent[2].service_intent !== "christmas_light_installation") throw new Error("Seasonal banner intent was not tracked.");
const quote = run("granted", { pathname: "/services/christmas-light-installation", href: "/contact?service=christmas-light-installation", label: "Plan my Christmas lights" });
const quoteEvent = quote.dataLayer.find((entry) => entry[0] === "event" && entry[1] === "quote_request" && entry[2].service_intent);
if (!quoteEvent || quoteEvent[2].service_intent !== "christmas_light_installation") throw new Error("Christmas quote intent was not tracked.");
if (quoteEvent[2].page_location.includes("?")) throw new Error("Analytics leaked URL query values.");
const deniedClick = run(null, { pathname: "/", href: "/services/christmas-light-installation", label: "Explore Christmas lights", banner: true });
if (deniedClick.dataLayer.length) throw new Error("Seasonal tracking fired before consent.");
console.log("Seasonal analytics test passed: banner and quote intent, query privacy, and consent gates.");
