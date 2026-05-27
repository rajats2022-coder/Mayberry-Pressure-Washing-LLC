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
