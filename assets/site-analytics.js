(() => {
  "use strict";

  const measurementId = "G-H6ELFXF6G1";
  const storageKey = "mayberry_analytics_consent_v1";
  const privacySignal = navigator.globalPrivacyControl === true || navigator.doNotTrack === "1";
  const storedChoice = localStorage.getItem(storageKey);
  let analyticsAllowed = storedChoice === "granted" && !privacySignal;
  let gtagLoaded = false;

  const publicPageLocation = () => `${location.origin}${location.pathname}`;

  const loadAnalytics = () => {
    if (!analyticsAllowed || gtagLoaded) return;
    gtagLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      wait_for_update: 500
    });
    window.gtag("consent", "update", { analytics_storage: "granted" });
    window.gtag("config", measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: publicPageLocation(),
      page_title: document.title
    });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.append(script);
  };

  window.mayberryTrack = (eventName, parameters = {}) => {
    if (!analyticsAllowed || !window.gtag) return false;
    window.gtag("event", eventName, {
      ...parameters,
      page_location: publicPageLocation()
    });
    return true;
  };

  const setConsent = (choice) => {
    analyticsAllowed = choice === "granted" && !privacySignal;
    localStorage.setItem(storageKey, analyticsAllowed ? "granted" : "denied");
    document.querySelector("[data-analytics-consent]")?.remove();
    if (analyticsAllowed) loadAnalytics();
  };

  const showConsent = () => {
    if (storedChoice || privacySignal) return;
    const notice = document.createElement("aside");
    notice.className = "analytics-consent";
    notice.setAttribute("data-analytics-consent", "");
    notice.setAttribute("aria-label", "Analytics choices");
    notice.innerHTML = `<p><strong>Your privacy choices</strong><br>Mayberry uses optional Google Analytics to understand which pages and quote actions are useful. Analytics stays off unless you allow it. <a href="/privacy">Privacy details</a></p><div><button type="button" data-consent="denied">Essential only</button><button type="button" class="consent-allow" data-consent="granted">Allow analytics</button></div>`;
    notice.querySelectorAll("[data-consent]").forEach((button) => {
      button.addEventListener("click", () => setConsent(button.dataset.consent));
    });
    document.body.append(notice);
  };

  document.addEventListener("DOMContentLoaded", () => {
    if (analyticsAllowed) loadAnalytics();
    else showConsent();

    document.querySelectorAll("[data-reset-analytics-consent]").forEach((button) => {
      button.addEventListener("click", () => {
        localStorage.removeItem(storageKey);
        location.reload();
      });
    });

    document.addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      const label = link.textContent.trim().slice(0, 80);
      if (href.startsWith("tel:")) {
        window.mayberryTrack("phone_click", { link_text: label });
      } else if (/contact(?:\.html)?(?:[?#]|$)/.test(href)) {
        const quoteIntent = /quote|estimate|book|schedule/i.test(label);
        window.mayberryTrack(quoteIntent ? "quote_request" : "contact_click", { link_text: label });
      }
    });
  });
})();
