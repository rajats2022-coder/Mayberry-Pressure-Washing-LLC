const siteUrl = "https://www.mayberrypw.com";
const canonical = "/services/christmas-light-installation";
const quoteUrl = "/contact?service=christmas-light-installation";
const title = "Christmas Light Installation in Mount Airy | Mayberry";
const description = "Plan your Christmas light installation with Mayberry Pressure Washing in Mount Airy, NC. Share your ideas, property photos, and timing to request a quote.";

const faqs = [
  ["How do I get a Christmas lighting quote?", "Send your property location, a few photos, the areas you would like illuminated, and your preferred timing. Mayberry will review the request and confirm the installation scope before scheduling."],
  ["Do you provide the lights?", "Include whether you already have lights when requesting your quote. Materials, lighting choices, and what is included are confirmed for your installation before you book."],
  ["Can we discuss rooflines, trees, and entryways?", "Yes. Share the parts of your property you have in mind. Mayberry will review access and your ideas, then explain which display areas can be included in your quote."],
  ["Are removal, storage, or maintenance included?", "These are not assumed to be included. Mention any after-installation support or removal you need so availability, scope, and pricing can be confirmed before scheduling."],
  ["Where is Christmas light installation available?", "Mayberry is based in Mount Airy, North Carolina. Include your property location in your request so Christmas lighting coverage and scheduling can be confirmed."],
  ["How much does installation cost?", "Your quote depends on the agreed display areas, materials, property access, and timing. Share photos and your priorities so Mayberry can review a plan for your property."]
];

export function renderChristmasPage({ shell }) {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": `${siteUrl}${canonical}#webpage`, url: `${siteUrl}${canonical}`, name: title, description, about: { "@id": `${siteUrl}${canonical}#service` } },
      { "@type": "Service", "@id": `${siteUrl}${canonical}#service`, name: "Christmas Light Installation", serviceType: "Christmas light installation", url: `${siteUrl}${canonical}`, description, provider: { "@type": "Organization", name: "Mayberry Pressure Washing LLC", url: siteUrl, telephone: "+1-336-374-8664" } },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: "Services", item: `${siteUrl}/services` },
        { "@type": "ListItem", position: 3, name: "Christmas Light Installation", item: `${siteUrl}${canonical}` }
      ] }
    ]
  };
  const body = `<div class="holiday-page">
    <section class="holiday-hero" aria-labelledby="holiday-title">
      <div class="holiday-hero-photo"><img src="/assets/images/christmas/holiday-roofline.jpg" alt="A home outlined with red and white holiday lights at night" fetchpriority="high" /></div>
      <div class="holiday-hero-shade"></div>
      <div class="holiday-wrap holiday-hero-content">
        <nav class="holiday-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/services">Services</a><span aria-hidden="true">/</span><span>Christmas lights</span></nav>
        <p class="holiday-eyebrow"><span aria-hidden="true">✦</span> Christmas light installation</p>
        <h1 id="holiday-title">Christmas lights.<br> A little <em>magic.</em></h1>
        <p class="holiday-lead">Bring a warm holiday glow to your home with Christmas light installation from Mayberry. Share your ideas, and let’s plan a display for your property.</p>
        <div class="holiday-actions"><a class="holiday-button" href="${quoteUrl}">Plan my Christmas lights <span aria-hidden="true">↗</span></a><a class="holiday-call" href="tel:+13363748664">Call (336) 374-8664</a></div>
        <p class="holiday-local">Based in Mount Airy, NC · Coverage and timing confirmed by quote</p>
      </div>
      <p class="holiday-image-note">Lighting inspiration</p>
    </section>

    <section class="holiday-intro holiday-wrap" aria-labelledby="holiday-intro-title">
      <p class="holiday-eyebrow">A season worth looking forward to</p>
      <div class="holiday-intro-grid"><h2 id="holiday-intro-title">A familiar home.<br><em>A festive new glow.</em></h2><div><p>Classic warm white. A playful touch of color. A welcoming entrance when family arrives. Tell us what Christmas looks like to you.</p><p>Mayberry will review your property, display ideas, and preferred timing to put together an installation quote. The details are agreed before you book.</p></div></div>
    </section>

    <section class="holiday-options" aria-labelledby="holiday-options-title"><div class="holiday-wrap">
      <div class="holiday-section-heading"><div><p class="holiday-eyebrow">Explore your ideas</p><h2 id="holiday-options-title">Where would you<br>like the lights?</h2></div><p>These are ideas to discuss with Mayberry. Your quote confirms suitable areas, access, materials, and the final installation scope.</p></div>
      <div class="holiday-option-grid">
        <article><span class="holiday-option-number">01</span><h3>Rooflines &amp; edges</h3><p>Talk through a look that follows your home’s shape, from a simple outline to selected architectural details.</p></article>
        <article><span class="holiday-option-number">02</span><h3>Trees &amp; landscaping</h3><p>Share the trees or planting areas you have in mind, along with photos that help us review size and access.</p></article>
        <article><span class="holiday-option-number">03</span><h3>Entries &amp; accents</h3><p>Bring your ideas for porches, entryways, or other focal points you would like considered in your display.</p></article>
      </div>
    </div></section>

    <section class="holiday-inspiration holiday-wrap" aria-labelledby="holiday-inspiration-title"><div class="holiday-section-heading"><div><p class="holiday-eyebrow">Lighting inspiration</p><h2 id="holiday-inspiration-title">Find your kind<br>of Christmas.</h2></div><p>Use these display ideas to start the conversation. Your property and agreed quote will shape the finished design.</p></div>
      <div class="holiday-photo-grid"><figure><img src="/assets/images/christmas/holiday-warm.jpg" alt="Warm white holiday lights tracing the roofline of a two-story home" loading="lazy" /><figcaption><span>Warm &amp; welcoming</span><small>Lighting inspiration</small></figcaption></figure><figure><img src="/assets/images/christmas/holiday-tree.jpg" alt="A tree and shrubs covered in warm white lights beside a brick home" loading="lazy" /><figcaption><span>A little extra sparkle</span><small>Lighting inspiration</small></figcaption></figure></div>
    </section>

    <section class="holiday-process" aria-labelledby="holiday-process-title"><div class="holiday-wrap"><p class="holiday-eyebrow">Let’s make a plan</p><h2 id="holiday-process-title">From your first idea<br>to installation day.</h2><ol class="holiday-steps"><li><span>01</span><h3>Share your vision</h3><p>Send your property location, photos, display ideas, and preferred dates. Let us know if you already have lights.</p></li><li><span>02</span><h3>Review your quote</h3><p>Confirm the display areas, materials, access, timing, and any additional requests before you book.</p></li><li><span>03</span><h3>Get ready to glow</h3><p>Once the scope and schedule are agreed, Mayberry installs the Christmas lighting included in your plan.</p></li></ol><a class="holiday-button" href="${quoteUrl}">Start with a quote <span aria-hidden="true">↗</span></a></div></section>

    <section class="holiday-faq holiday-wrap" aria-labelledby="holiday-faq-title"><div><p class="holiday-eyebrow">Before the first bulb</p><h2 id="holiday-faq-title">A few bright<br>answers.</h2><p>Have another question?<br><a href="tel:+13363748664">Call (336) 374-8664</a></p></div><div class="holiday-faq-list">${faqs.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join("")}</div></section>

    <section class="holiday-final" aria-labelledby="holiday-final-title"><div class="holiday-wrap"><span class="holiday-star" aria-hidden="true">✦</span><p class="holiday-eyebrow">Christmas lights by Mayberry</p><h2 id="holiday-final-title">Let’s give your home<br>that holiday feeling.</h2><p>Tell us what you have in mind.<br>We’ll start with your property, your ideas, and a quote.</p><div class="holiday-actions"><a class="holiday-button" href="${quoteUrl}">Request my Christmas light quote <span aria-hidden="true">↗</span></a><a class="holiday-call" href="tel:+13363748664">Call (336) 374-8664</a></div></div></section>
  </div>`;
  return shell({ depth: 1, title, description, canonical, ogImage: "assets/images/christmas/holiday-roofline.jpg", active: "services", extraCss: "assets/christmas.css", body, schema });
}
