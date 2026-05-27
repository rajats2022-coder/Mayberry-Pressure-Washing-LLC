const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const quoteForm = document.querySelector("[data-quote-form]");
const formResult = document.querySelector("[data-form-result]");
const instagramUrl = "https://www.instagram.com/mayberrypressurewashingllc/";

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

if (quoteForm && formResult) {
  quoteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(quoteForm);
    const summary = [
      "Free estimate request",
      `Name: ${formData.get("name") || ""}`,
      `Phone: ${formData.get("phone") || ""}`,
      `Email: ${formData.get("email") || ""}`,
      `Service: ${formData.get("service") || ""}`,
      `City: ${formData.get("city") || ""}`,
      `Message: ${formData.get("message") || ""}`
    ].join("\n");

    const copyRequest = navigator.clipboard?.writeText(summary);
    formResult.innerHTML =
      `Your estimate request is prepared${copyRequest ? " and copied" : ""}. Message <a href="${instagramUrl}" target="_blank" rel="noreferrer">Mayberry Pressure Washing on Instagram</a> and paste the request.`;

    copyRequest?.catch(() => {
      formResult.innerHTML =
        `Your estimate request is prepared. Copy your form details and message <a href="${instagramUrl}" target="_blank" rel="noreferrer">Mayberry Pressure Washing on Instagram</a>.`;
    });
  });
}
