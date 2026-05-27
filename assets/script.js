const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

document.querySelectorAll("[data-estimate-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = form.querySelector("[data-form-status]");
    const data = new FormData(form);
    const service = data.get("service") || "Exterior cleaning";
    const city = data.get("city") || "your area";
    if (status) {
      status.textContent = `Estimate request ready for ${service} in ${city}. Connect this form to email/SMS once the client confirms contact details.`;
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
