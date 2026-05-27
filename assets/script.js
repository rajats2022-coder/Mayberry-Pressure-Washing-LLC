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
