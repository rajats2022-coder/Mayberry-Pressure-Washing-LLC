const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");

const pathDepth = location.pathname
  .split("/")
  .filter(Boolean)
  .slice(0, -1)
  .length;
const relativeRoot = pathDepth > 0 ? "../".repeat(pathDepth) : "";

const navHref = (path) => `${relativeRoot}${path}`;
const currentPath = location.pathname.replace(/\/$/, "/index.html");
const isActiveNav = (paths) => paths.some((path) => currentPath.endsWith(`/${path}`) || currentPath.endsWith(path));

if (navLinks) {
  navLinks.innerHTML = `
    <div class="nav-group${isActiveNav(["services.html", "services/pressure-washing.html", "services/house-washing.html", "services/soft-washing.html", "services/driveway-cleaning.html", "services/roof-washing.html", "services/gutter-cleaning.html", "services/window-cleaning.html", "services/commercial-pressure-washing.html"]) ? " active" : ""}">
      <button type="button" class="nav-group-trigger" aria-expanded="false">Services <i data-lucide="chevron-down"></i></button>
      <div class="nav-menu">
        <a href="${navHref("services.html")}">All Services</a>
        <a href="${navHref("services/pressure-washing.html")}">Pressure Washing</a>
        <a href="${navHref("services/house-washing.html")}">House Washing</a>
        <a href="${navHref("services/driveway-cleaning.html")}">Driveway Cleaning</a>
        <a href="${navHref("services/commercial-pressure-washing.html")}">Commercial Cleaning</a>
      </div>
    </div>
    <div class="nav-group${isActiveNav(["service-areas.html"]) || currentPath.includes("/service-areas/") ? " active" : ""}">
      <button type="button" class="nav-group-trigger" aria-expanded="false">Areas <i data-lucide="chevron-down"></i></button>
      <div class="nav-menu">
        <a href="${navHref("service-areas.html")}">All Service Areas</a>
        <a href="${navHref("service-areas/mount-airy-nc.html")}">Mount Airy</a>
        <a href="${navHref("service-areas/winston-salem-nc.html")}">Winston-Salem</a>
        <a href="${navHref("service-areas/pilot-mountain-nc.html")}">Pilot Mountain</a>
        <a href="${navHref("service-areas/elkin-nc.html")}">Elkin</a>
      </div>
    </div>
    <div class="nav-group${currentPath.includes("/resources/") ? " active" : ""}">
      <button type="button" class="nav-group-trigger" aria-expanded="false">Resources <i data-lucide="chevron-down"></i></button>
      <div class="nav-menu nav-menu-wide">
        <a href="${navHref("resources/pressure-washing-cost-mount-airy-nc.html")}">Pressure Washing Cost</a>
        <a href="${navHref("resources/soft-washing-vs-pressure-washing.html")}">Soft Washing vs Pressure Washing</a>
        <a href="${navHref("resources/how-often-wash-house-north-carolina.html")}">House Washing Timing</a>
        <a href="${navHref("resources/choose-pressure-washing-company-mount-airy.html")}">Choosing a Company</a>
      </div>
    </div>
    <a href="${navHref("gallery.html")}"${isActiveNav(["gallery.html"]) ? ' aria-current="page"' : ""}>Gallery</a>
    <a href="${navHref("reviews.html")}"${isActiveNav(["reviews.html"]) ? ' aria-current="page"' : ""}>Reviews</a>
    <a href="${navHref("contact.html")}"${isActiveNav(["contact.html"]) ? ' aria-current="page"' : ""}>Contact</a>
    <a class="btn btn-phone" href="tel:+13363748664"><i data-lucide="phone"></i> Call/Text</a>
    <a class="btn btn-primary" href="${navHref("contact.html")}"><i data-lucide="clipboard-check"></i> Free Estimate</a>
  `;

  navLinks.querySelectorAll(".nav-group-trigger").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const group = trigger.closest(".nav-group");
      navLinks.querySelectorAll(".nav-group.open").forEach((openGroup) => {
        if (openGroup !== group) {
          openGroup.classList.remove("open");
          openGroup.querySelector(".nav-group-trigger")?.setAttribute("aria-expanded", "false");
        }
      });
      const isOpen = group?.classList.toggle("open");
      trigger.setAttribute("aria-expanded", String(Boolean(isOpen)));
    });
  });
}

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

const mobileCta = document.createElement("div");
mobileCta.className = "mobile-quick-cta";
mobileCta.innerHTML = `
  <a class="mobile-quick-cta-call" href="tel:+13363748664" aria-label="Call or text Mayberry Pressure Washing">
    <i data-lucide="phone"></i><span>Call/Text</span>
  </a>
  <a class="mobile-quick-cta-estimate" href="${relativeRoot}contact.html" aria-label="Request a free estimate from Mayberry Pressure Washing">
    <i data-lucide="clipboard-check"></i><span>Free Estimate</span>
  </a>
`;
document.body.append(mobileCta);
window.lucide?.createIcons();

document.querySelectorAll(".comparison-gallery, .instagram-grid").forEach((scroller) => {
  const rail = document.createElement("div");
  const thumb = document.createElement("span");
  rail.className = "horizontal-scrollbar";
  rail.setAttribute("aria-hidden", "true");
  thumb.className = "horizontal-scrollbar-thumb";
  rail.append(thumb);
  scroller.insertAdjacentElement("afterend", rail);

  const updateScrollbar = () => {
    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
    const railWidth = rail.clientWidth;
    if (maxScroll <= 1 || railWidth <= 1) {
      rail.hidden = true;
      return;
    }

    rail.hidden = false;
    const thumbWidth = Math.max((scroller.clientWidth / scroller.scrollWidth) * railWidth, 46);
    const maxThumbTravel = railWidth - thumbWidth;
    const thumbLeft = (scroller.scrollLeft / maxScroll) * maxThumbTravel;
    rail.style.setProperty("--scroll-thumb-width", `${thumbWidth}px`);
    rail.style.setProperty("--scroll-thumb-left", `${thumbLeft}px`);
  };

  scroller.addEventListener("scroll", updateScrollbar, { passive: true });
  window.addEventListener("resize", updateScrollbar);
  window.addEventListener("load", updateScrollbar);
  updateScrollbar();
});

document.querySelectorAll("[data-estimate-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = form.querySelector("[data-form-status]");
    const data = new FormData(form);
    const service = data.get("service") || "Exterior cleaning";
    const city = data.get("city") || "your area";
    if (status) {
      status.textContent = `Estimate request ready for ${service} in ${city}. Use the phone, email, or Facebook links for live contact until the form is connected.`;
    }
  });
});

const firstLoadableImage = (candidates, fallback) => new Promise((resolve) => {
  const paths = candidates
    .split(",")
    .map((path) => path.trim())
    .filter(Boolean);

  let index = 0;
  const tryNext = () => {
    if (index >= paths.length) {
      resolve(fallback);
      return;
    }

    const img = new Image();
    img.onload = () => resolve(paths[index]);
    img.onerror = () => {
      index += 1;
      tryNext();
    };
    img.src = paths[index];
  };

  tryNext();
});

document.querySelectorAll("[data-comparison-slider]").forEach(async (slider) => {
  const range = slider.querySelector(".comparison-range");
  const before = slider.querySelector(".comparison-before");
  const after = slider.querySelector(".comparison-after");
  if (!range || !before || !after) return;

  const fallback = "assets/images/pressure-washing-hero.png";
  const beforeSrc = await firstLoadableImage(slider.dataset.beforeCandidates || "", fallback);
  const afterSrc = await firstLoadableImage(slider.dataset.afterCandidates || "", fallback);

  before.src = beforeSrc;
  after.src = afterSrc;

  const update = () => {
    slider.style.setProperty("--comparison-position", `${range.value}%`);
  };

  range.addEventListener("input", update);
  update();
});

const galleryGrid = document.querySelector(".gallery-page-grid");
const lightbox = document.querySelector("[data-gallery-lightbox]");

if (galleryGrid && lightbox) {
  const lightboxImage = lightbox.querySelector("[data-lightbox-image]");
  const lightboxCaption = lightbox.querySelector("[data-lightbox-caption]");
  const closeButton = lightbox.querySelector("[data-lightbox-close]");
  const previousButton = lightbox.querySelector("[data-lightbox-prev]");
  const nextButton = lightbox.querySelector("[data-lightbox-next]");
  const galleryCards = Array.from(galleryGrid.querySelectorAll(".gallery-photo-card"));
  let activeGalleryIndex = 0;

  const getGalleryItem = (card) => {
    const image = card.querySelector("img");
    const title = card.querySelector("h3")?.textContent.trim() || image?.alt || "Gallery image";
    const description = card.querySelector("p")?.textContent.trim();
    return {
      src: image?.currentSrc || image?.src,
      alt: image?.alt || title,
      caption: description ? `${title}: ${description}` : title
    };
  };

  const openLightbox = (index) => {
    const item = getGalleryItem(galleryCards[index]);
    if (!item.src || !lightboxImage || !lightboxCaption) return;

    activeGalleryIndex = index;
    lightboxImage.src = item.src;
    lightboxImage.alt = item.alt;
    lightboxCaption.textContent = item.caption;
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
    closeButton?.focus();
  };

  const closeLightbox = () => {
    lightbox.hidden = true;
    document.body.classList.remove("lightbox-open");
    galleryCards[activeGalleryIndex]?.focus();
  };

  const showAdjacentImage = (direction) => {
    const nextIndex = (activeGalleryIndex + direction + galleryCards.length) % galleryCards.length;
    openLightbox(nextIndex);
  };

  galleryCards.forEach((card, index) => {
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `Open larger view of ${card.querySelector("h3")?.textContent.trim() || "gallery image"}`);
    card.addEventListener("click", () => openLightbox(index));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox(index);
      }
    });
  });

  closeButton?.addEventListener("click", closeLightbox);
  previousButton?.addEventListener("click", () => showAdjacentImage(-1));
  nextButton?.addEventListener("click", () => showAdjacentImage(1));
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (lightbox.hidden) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") showAdjacentImage(-1);
    if (event.key === "ArrowRight") showAdjacentImage(1);
  });
}

const chatbotConfig = {
  businessName: "Mayberry Pressure Washing LLC",
  phone: "(336) 374-8664",
  phoneHref: "tel:+13363748664",
  email: "c.bray@mayberrypw.com",
  emailHref: "mailto:c.bray@mayberrypw.com?subject=Free%20Estimate%20Request",
  facebook: "https://www.facebook.com/profile.php?id=61576662606045",
  instagram: "https://www.instagram.com/mayberrypressurewashingllc/",
  pages: {
    home: "index.html",
    services: "services.html",
    areas: "service-areas.html",
    gallery: "gallery.html",
    contact: "contact.html"
  },
  serviceAreas: "Mount Airy, NC and the Triad, including Winston-Salem, Pilot Mountain, Elkin, Dobson, Wilkesboro, and nearby communities",
  services: [
    "house washing",
    "soft washing",
    "roof washing",
    "driveway cleaning",
    "surface cleaning",
    "gutter cleaning",
    "window cleaning",
    "deck cleaning",
    "fence cleaning",
    "wood staining",
    "gutter guards",
    "commercial exterior cleaning"
  ]
};

const normalizeChatText = (value) => value
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const includesAny = (text, words) => words.some((word) => text.includes(word));

const escapeChatHTML = (value) => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

const chatbotAnswers = [
  {
    name: "greeting",
    match: (text) => includesAny(text, ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "whats up"]),
    reply: () => ({
      text: "Hey, thanks for reaching out. I can help you find the right exterior cleaning service, show you project photos, check service areas, or get you to a quick estimate.",
      actions: [
        ["View services", chatbotConfig.pages.services],
        ["Get estimate", chatbotConfig.pages.contact],
        ["See gallery", chatbotConfig.pages.gallery]
      ]
    })
  },
  {
    name: "estimate",
    match: (text) => includesAny(text, ["estimate", "quote", "price", "cost", "how much", "book", "schedule", "appointment"]),
    reply: () => ({
      text: `For the fastest estimate, send the property city, what needs cleaned, and a few photos. You can call or text ${chatbotConfig.phone}, use the contact page, email us, or message on Facebook.`,
      actions: [
        ["Start estimate", chatbotConfig.pages.contact],
        ["Call/Text", chatbotConfig.phoneHref],
        ["Email", chatbotConfig.emailHref],
        ["Facebook", chatbotConfig.facebook]
      ]
    })
  },
  {
    name: "services",
    match: (text) => includesAny(text, ["service", "services", "what do you do", "clean", "washing", "wash"]),
    reply: () => ({
      text: `We handle ${chatbotConfig.services.join(", ")}. The goal is to match the cleaning method to the surface so the property looks better without using the wrong pressure.`,
      actions: [
        ["Compare services", chatbotConfig.pages.services],
        ["Request estimate", chatbotConfig.pages.contact]
      ]
    })
  },
  {
    name: "house",
    match: (text) => includesAny(text, ["house", "siding", "vinyl", "soffit", "fascia", "porch"]),
    reply: () => ({
      text: "For house washing, we look at the siding, trim, soffits, porches, entry areas, and staining first. Many homes call for a softer wash approach instead of blasting the siding with high pressure.",
      actions: [
        ["House washing services", chatbotConfig.pages.services],
        ["Get house estimate", chatbotConfig.pages.contact],
        ["View photos", chatbotConfig.pages.gallery]
      ]
    })
  },
  {
    name: "softwash",
    match: (text) => includesAny(text, ["soft wash", "softwash", "low pressure", "delicate"]),
    reply: () => ({
      text: "Soft washing is a lower-pressure cleaning method for surfaces that need care, like siding, painted areas, and many roof situations. We choose the method by surface, not by guesswork.",
      actions: [
        ["View services", chatbotConfig.pages.services],
        ["Ask about soft washing", chatbotConfig.pages.contact]
      ]
    })
  },
  {
    name: "roof",
    match: (text) => includesAny(text, ["roof", "shingle", "black streak", "roofline"]),
    reply: () => ({
      text: "Roof washing depends on roof material, staining, access, and runoff. Send a couple photos and the property location so we can recommend the safest cleaning plan.",
      actions: [
        ["Roof washing info", chatbotConfig.pages.services],
        ["Send roof photos", chatbotConfig.pages.contact]
      ]
    })
  },
  {
    name: "concrete",
    match: (text) => includesAny(text, ["driveway", "concrete", "sidewalk", "patio", "pool deck", "flatwork", "surface cleaning"]),
    reply: () => ({
      text: "Driveways, sidewalks, patios, pool decks, and other flatwork can usually be surface cleaned for a cleaner, more even result. Photos help us judge the size and buildup quickly.",
      actions: [
        ["Concrete photos", chatbotConfig.pages.gallery],
        ["Quote concrete cleaning", chatbotConfig.pages.contact]
      ]
    })
  },
  {
    name: "wood",
    match: (text) => includesAny(text, ["deck", "fence", "wood", "stain", "staining", "rail", "railing"]),
    reply: () => ({
      text: "Decks, fences, rails, and wood surfaces need the right touch. We can help with cleaning and staining conversations, but we will want photos so we can see the condition of the wood.",
      actions: [
        ["Deck and fence services", chatbotConfig.pages.services],
        ["View deck photos", chatbotConfig.pages.gallery],
        ["Ask for estimate", chatbotConfig.pages.contact]
      ]
    })
  },
  {
    name: "commercial",
    match: (text) => includesAny(text, ["commercial", "business", "storefront", "apartment", "hoa", "awning", "building"]),
    reply: () => ({
      text: "Yes, we handle commercial exterior cleaning too, including storefronts, entrances, awnings, sidewalks, concrete, common areas, and larger building exteriors.",
      actions: [
        ["Commercial services", chatbotConfig.pages.services],
        ["Commercial gallery", chatbotConfig.pages.gallery],
        ["Request commercial quote", chatbotConfig.pages.contact]
      ]
    })
  },
  {
    name: "areas",
    match: (text) => includesAny(text, ["area", "areas", "serve", "service area", "mount airy", "winston", "pilot mountain", "elkin", "dobson", "wilkesboro", "near me", "location"]),
    reply: () => ({
      text: `We serve ${chatbotConfig.serviceAreas}. If your town is close by but not listed, send it over and we can confirm coverage.`,
      actions: [
        ["Service areas", chatbotConfig.pages.areas],
        ["Check my town", chatbotConfig.pages.contact]
      ]
    })
  },
  {
    name: "gallery",
    match: (text) => includesAny(text, ["gallery", "photos", "pictures", "before after", "before and after", "results", "proof", "work"]),
    reply: () => ({
      text: "You can see real Mayberry project photos in the gallery, including siding, concrete, decks, awnings, commercial exteriors, fences, and patios.",
      actions: [
        ["Open gallery", chatbotConfig.pages.gallery],
        ["Request estimate", chatbotConfig.pages.contact]
      ]
    })
  },
  {
    name: "contact",
    match: (text) => includesAny(text, ["contact", "call", "text", "phone", "number", "email", "facebook", "instagram", "message"]),
    reply: () => ({
      text: `You can call or text ${chatbotConfig.phone}, email ${chatbotConfig.email}, message us on Facebook, or use the contact page. Texting photos is usually the fastest way to get the quote moving.`,
      actions: [
        ["Call/Text", chatbotConfig.phoneHref],
        ["Email", chatbotConfig.emailHref],
        ["Contact page", chatbotConfig.pages.contact],
        ["Facebook", chatbotConfig.facebook],
        ["Instagram", chatbotConfig.instagram]
      ]
    })
  },
  {
    name: "licensed",
    match: (text) => includesAny(text, ["licensed", "insured", "insurance", "legit"]),
    reply: () => ({
      text: "Yes, Mayberry Pressure Washing is listed as licensed and insured for residential and commercial exterior cleaning.",
      actions: [
        ["Start estimate", chatbotConfig.pages.contact],
        ["View services", chatbotConfig.pages.services]
      ]
    })
  },
  {
    name: "hours",
    match: (text) => includesAny(text, ["hours", "open", "available", "when are you open"]),
    reply: () => ({
      text: "The site lists Mayberry as always open. For the quickest response, call or text with the city, service needed, and photos of the surfaces.",
      actions: [
        ["Call/Text", chatbotConfig.phoneHref],
        ["Contact page", chatbotConfig.pages.contact]
      ]
    })
  },
  {
    name: "thanks",
    match: (text) => includesAny(text, ["thanks", "thank you", "appreciate"]),
    reply: () => ({
      text: "You are welcome. If you want, I can point you to services, gallery photos, service areas, or the estimate page.",
      actions: [
        ["Services", chatbotConfig.pages.services],
        ["Gallery", chatbotConfig.pages.gallery],
        ["Estimate", chatbotConfig.pages.contact]
      ]
    })
  }
];

const getChatbotReply = (message) => {
  const normalized = normalizeChatText(message);
  const answer = chatbotAnswers.find((item) => item.match(normalized));

  if (answer) return answer.reply(normalized);

  if (!normalized) {
    return {
      text: "Tell me what you need cleaned or where you want to go on the site, and I will point you in the right direction.",
      actions: [
        ["Services", chatbotConfig.pages.services],
        ["Gallery", chatbotConfig.pages.gallery],
        ["Contact", chatbotConfig.pages.contact]
      ]
    };
  }

  return {
    text: "I may not have the perfect answer to that, but I can still help. For the most accurate quote, send the city, photos, and what needs cleaned. I can also take you to services, service areas, the gallery, or contact options.",
    actions: [
      ["View services", chatbotConfig.pages.services],
      ["Service areas", chatbotConfig.pages.areas],
      ["Open gallery", chatbotConfig.pages.gallery],
      ["Get estimate", chatbotConfig.pages.contact]
    ]
  };
};

const createChatbot = () => {
  if (document.querySelector("[data-mayberry-chatbot]")) return;

  const widget = document.createElement("section");
  widget.className = "chatbot-widget";
  widget.setAttribute("data-mayberry-chatbot", "");
  widget.innerHTML = `
    <button class="chatbot-launcher" type="button" aria-expanded="false" aria-controls="mayberry-chat-panel">
      <i data-lucide="message-circle"></i>
      <span>Ask Mayberry</span>
    </button>
    <div class="chatbot-panel" id="mayberry-chat-panel" hidden>
      <div class="chatbot-header">
        <div>
          <strong>Ask Mayberry</strong>
          <span>Exterior cleaning help</span>
        </div>
        <button class="chatbot-close" type="button" aria-label="Close chat"><i data-lucide="x"></i></button>
      </div>
      <div class="chatbot-messages" role="log" aria-live="polite"></div>
      <div class="chatbot-suggestions" aria-label="Suggested questions"></div>
      <form class="chatbot-form">
        <label class="sr-only" for="mayberry-chat-input">Ask Mayberry a question</label>
        <input id="mayberry-chat-input" type="text" autocomplete="off" placeholder="Ask about services, prices, areas..." />
        <button type="submit" aria-label="Send message"><i data-lucide="send"></i></button>
      </form>
    </div>
  `;

  document.body.append(widget);

  const launcher = widget.querySelector(".chatbot-launcher");
  const panel = widget.querySelector(".chatbot-panel");
  const closeButton = widget.querySelector(".chatbot-close");
  const messages = widget.querySelector(".chatbot-messages");
  const suggestions = widget.querySelector(".chatbot-suggestions");
  const form = widget.querySelector(".chatbot-form");
  const input = widget.querySelector("input");
  let hasStartedConversation = false;
  const starterQuestions = [
    ["Services", "What services do you offer?"],
    ["Estimate", "Can I get an estimate?"],
    ["Areas", "Do you serve my area?"],
    ["Gallery", "Show me the gallery"]
  ];

  const appendMessage = (sender, text, actions = []) => {
    const bubble = document.createElement("div");
    bubble.className = `chatbot-message chatbot-message-${sender}`;
    bubble.innerHTML = `<p>${escapeChatHTML(text)}</p>`;

    if (actions.length) {
      const actionWrap = document.createElement("div");
      actionWrap.className = "chatbot-actions";
      actions.forEach(([label, href]) => {
        const link = document.createElement("a");
        link.href = href;
        link.textContent = label;
        if (href.startsWith("http")) {
          link.target = "_blank";
          link.rel = "noopener";
        }
        actionWrap.append(link);
      });
      bubble.append(actionWrap);
    }

    messages.append(bubble);
    messages.scrollTop = messages.scrollHeight;
  };

  const renderSuggestions = () => {
    suggestions.innerHTML = "";
    if (hasStartedConversation) return;
    starterQuestions.forEach(([label, question]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.setAttribute("aria-label", question);
      button.addEventListener("click", () => {
        input.value = question;
        form.requestSubmit();
      });
      suggestions.append(button);
    });
  };

  const answerUser = (text) => {
    if (!hasStartedConversation) {
      hasStartedConversation = true;
      widget.classList.add("has-conversation");
      suggestions.innerHTML = "";
    }
    appendMessage("user", text);
    window.setTimeout(() => {
      const reply = getChatbotReply(text);
      appendMessage("bot", reply.text, reply.actions);
    }, 220);
  };

  const openChat = () => {
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    widget.classList.add("is-open");
    document.body.classList.add("chatbot-open");
    if (!messages.children.length) {
      appendMessage(
        "bot",
        "Hey, this is Mayberry's website helper. I can answer the basics, help you pick a service, or send you to the right page."
      );
      renderSuggestions();
    }
  };

  const closeChat = () => {
    panel.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    widget.classList.remove("is-open");
    document.body.classList.remove("chatbot-open");
    launcher.focus();
  };

  launcher.addEventListener("click", () => {
    if (panel.hidden) openChat();
    else closeChat();
  });

  closeButton.addEventListener("click", closeChat);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    input.value = "";
    answerUser(value);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) closeChat();
  });

  if (window.lucide) window.lucide.createIcons();
};

createChatbot();
