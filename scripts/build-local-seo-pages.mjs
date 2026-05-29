import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const siteUrl = "https://mayberrypressurewashing.com";
const phone = "(336) 374-8664";
const phoneHref = "tel:+13363748664";
const email = "c.bray@mayberrypw.com";
const facebook = "https://www.facebook.com/profile.php?id=61576662606045";
const instagram = "https://www.instagram.com/mayberrypressurewashingllc/";

const basePages = [
  { loc: "/", priority: "1.0" },
  { loc: "/services.html", priority: "0.9" },
  { loc: "/service-areas.html", priority: "0.9" },
  { loc: "/gallery.html", priority: "0.7" },
  { loc: "/reviews.html", priority: "0.8" },
  { loc: "/contact.html", priority: "0.9" }
];

const services = [
  {
    slug: "pressure-washing",
    name: "Pressure Washing",
    title: "Pressure Washing Services in Mount Airy, NC | Mayberry Pressure Washing",
    h1: "Pressure washing services in Mount Airy, NC and nearby Triad towns.",
    description: "Pressure washing for concrete, siding-safe exterior cleaning plans, patios, sidewalks, storefronts, and curb-facing surfaces across Mount Airy, NC and nearby Triad communities.",
    image: "assets/images/gallery/driveway-surface-cleaning.jpg",
    icon: "droplets",
    keywords: ["pressure washing Mount Airy NC", "pressure washing Winston-Salem", "pressure washing near me", "commercial pressure washing"],
    surfaces: ["driveways", "sidewalks", "patios", "walkways", "storefront entrances", "exterior flatwork"],
    copy: "Pressure washing works best when the process matches the surface. Mayberry Pressure Washing LLC cleans concrete, exterior flatwork, storefront entrances, sidewalks, patios, and other high-visibility areas that collect algae, mud, pollen, traffic marks, and buildup."
  },
  {
    slug: "house-washing",
    name: "House Washing",
    title: "House Washing in Mount Airy, NC | Mayberry Pressure Washing",
    h1: "House washing in Mount Airy, NC for siding, trim, porches, and curb appeal.",
    description: "House washing for siding, soffits, trim, porches, and entry areas in Mount Airy, Winston-Salem, Pilot Mountain, Elkin, Dobson, Wilkesboro, and nearby towns.",
    image: "assets/images/gallery/house-siding-before-after.jpg",
    icon: "home",
    keywords: ["house washing Mount Airy NC", "house washing Winston-Salem", "siding cleaning near me", "soft wash house washing"],
    surfaces: ["vinyl siding", "soffits", "fascia", "porches", "entry areas", "exterior trim"],
    copy: "House washing helps remove the staining, algae, pollen, and road film that make siding and trim look tired. The quote starts with the home exterior, access, water points, and the safest cleaning method for the material."
  },
  {
    slug: "soft-washing",
    name: "Soft Washing",
    title: "Soft Washing in Mount Airy, NC | Mayberry Pressure Washing",
    h1: "Soft washing in Mount Airy, NC for surfaces that need a careful cleaning method.",
    description: "Soft washing for siding, painted surfaces, rooflines, and delicate exterior materials across Mount Airy, NC and the Triad.",
    image: "assets/images/gallery/vinyl-siding-soft-wash.jpg",
    icon: "waves",
    keywords: ["soft washing Mount Airy NC", "soft washing Winston-Salem", "soft wash near me", "low pressure house washing"],
    surfaces: ["siding", "painted trim", "rooflines", "delicate exterior surfaces", "porches", "soffits"],
    copy: "Soft washing is a lower-pressure approach for exterior materials that need more care than a direct high-pressure blast. It is useful for many siding, roofline, trim, and painted-surface cleaning requests."
  },
  {
    slug: "driveway-cleaning",
    name: "Driveway Cleaning",
    title: "Driveway Cleaning in Mount Airy, NC | Mayberry Pressure Washing",
    h1: "Driveway cleaning in Mount Airy, NC for brighter concrete and cleaner curb appeal.",
    description: "Driveway cleaning and concrete surface cleaning for tire marks, algae, mud, and traffic stains in Mount Airy, Winston-Salem, Pilot Mountain, Elkin, Dobson, and Wilkesboro.",
    image: "assets/images/gallery/driveway-surface-cleaning.jpg",
    icon: "car",
    keywords: ["driveway cleaning Mount Airy NC", "concrete cleaning Mount Airy", "driveway pressure washing", "surface cleaning near me"],
    surfaces: ["driveways", "concrete pads", "walkways", "sidewalks", "garage aprons", "patios"],
    copy: "Driveways are one of the first surfaces people see from the street. Mayberry cleans concrete buildup from tire tracks, organic growth, mud, and high-traffic marks using an exterior cleaning process built for flatwork."
  },
  {
    slug: "roof-washing",
    name: "Roof Washing",
    title: "Roof Washing in Mount Airy, NC | Mayberry Pressure Washing",
    h1: "Roof washing in Mount Airy, NC with the cleaning method matched to the roof.",
    description: "Roof washing and roofline cleaning for exterior staining, algae, overhangs, and visible buildup around Mount Airy, NC and nearby service areas.",
    image: "assets/images/gallery/roof-overhang-cleaning.jpg",
    icon: "shield",
    keywords: ["roof washing Mount Airy NC", "roof cleaning Pilot Mountain", "roof soft washing", "roof stain cleaning"],
    surfaces: ["rooflines", "overhangs", "shingles", "gutters", "fascia", "soffits"],
    copy: "Roof washing needs a careful plan around material, slope, runoff, access, and staining. Mayberry scopes roof and roofline cleaning based on the actual property rather than using one method for every roof."
  },
  {
    slug: "gutter-cleaning",
    name: "Gutter Cleaning",
    title: "Gutter Cleaning in Mount Airy, NC | Mayberry Pressure Washing",
    h1: "Gutter cleaning in Mount Airy, NC for rooflines, drainage, and exterior appearance.",
    description: "Gutter cleaning, exterior gutter care, and gutter guard requests for homes and businesses in Mount Airy, NC and the Triad.",
    image: "assets/images/gallery/roof-overhang-cleaning.jpg",
    icon: "badge-alert",
    keywords: ["gutter cleaning Mount Airy NC", "gutter cleaning near me", "gutter guards Mount Airy", "roofline cleaning"],
    surfaces: ["gutters", "downspouts", "rooflines", "fascia", "soffits", "gutter guards"],
    copy: "Clean gutters help water move where it should and improve the look of the roofline. Mayberry can quote gutter cleaning, exterior gutter care, and gutter guard requests as part of a broader exterior cleaning job."
  },
  {
    slug: "window-cleaning",
    name: "Window Cleaning",
    title: "Window Cleaning in Mount Airy, NC | Mayberry Pressure Washing",
    h1: "Window cleaning in Mount Airy, NC as part of a cleaner exterior.",
    description: "Exterior window cleaning for homes and businesses after siding, trim, storefront, and surface cleaning in Mount Airy, NC and nearby towns.",
    image: "assets/images/gallery/window-cleaning.png",
    icon: "wind",
    keywords: ["window cleaning Mount Airy NC", "exterior window cleaning", "window cleaning near me", "commercial window cleaning"],
    surfaces: ["exterior windows", "storefront glass", "entry windows", "trim", "sills", "frames"],
    copy: "Window cleaning finishes the exterior after siding, trim, and surrounding surfaces are washed. It is a natural add-on for homeowners and businesses that want the full property to look cleaner."
  },
  {
    slug: "commercial-pressure-washing",
    name: "Commercial Pressure Washing",
    title: "Commercial Pressure Washing in Mount Airy, NC | Mayberry Pressure Washing",
    h1: "Commercial pressure washing in Mount Airy, NC for storefronts, entrances, and shared spaces.",
    description: "Commercial pressure washing for storefronts, entrances, sidewalks, awnings, common areas, and exterior surfaces across Mount Airy, NC and nearby Triad communities.",
    image: "assets/images/gallery/commercial-building-exterior-cleaning.jpg",
    icon: "building-2",
    keywords: ["commercial pressure washing Mount Airy NC", "storefront pressure washing", "commercial exterior cleaning", "business pressure washing"],
    surfaces: ["storefronts", "awnings", "walkways", "entrances", "common areas", "commercial concrete"],
    copy: "Commercial exterior cleaning helps the parts customers see first: walkways, entries, storefronts, awnings, and common areas. Mayberry can scope commercial cleaning around property access, timing, and surface type."
  }
];

const cities = [
  { slug: "mount-airy-nc", name: "Mount Airy", state: "NC", angle: "home-base", intro: "near Mayberry's home base" },
  { slug: "winston-salem-nc", name: "Winston-Salem", state: "NC", angle: "Triad", intro: "across the broader Triad service area" },
  { slug: "pilot-mountain-nc", name: "Pilot Mountain", state: "NC", angle: "nearby", intro: "near Pilot Mountain and surrounding communities" },
  { slug: "elkin-nc", name: "Elkin", state: "NC", angle: "nearby", intro: "in and around Elkin" },
  { slug: "dobson-nc", name: "Dobson", state: "NC", angle: "nearby", intro: "around Dobson and nearby Surry County communities" },
  { slug: "wilkesboro-nc", name: "Wilkesboro", state: "NC", angle: "nearby", intro: "west of Mount Airy around Wilkesboro" }
];

const cityServiceSlugs = [
  ["mount-airy-nc", "pressure-washing"],
  ["mount-airy-nc", "house-washing"],
  ["mount-airy-nc", "driveway-cleaning"],
  ["winston-salem-nc", "pressure-washing"],
  ["winston-salem-nc", "house-washing"],
  ["winston-salem-nc", "commercial-pressure-washing"],
  ["pilot-mountain-nc", "pressure-washing"],
  ["pilot-mountain-nc", "driveway-cleaning"],
  ["elkin-nc", "soft-washing"],
  ["dobson-nc", "roof-washing"],
  ["wilkesboro-nc", "commercial-pressure-washing"]
];

const cityDetails = {
  "mount-airy-nc": {
    proof: "Good fit for older homes, brick walkways, concrete driveways, storefront entries, and properties around Mount Airy that deal with pollen, red clay, shaded siding, and high-visibility curb appeal.",
    local: ["Downtown Mount Airy storefronts", "older siding and porches", "concrete driveways", "Surry County homes"]
  },
  "winston-salem-nc": {
    proof: "Useful for larger residential lots, rentals, storefronts, office entries, apartment walkways, and Triad properties where scheduling and access matter as much as the cleaning itself.",
    local: ["Triad homes and businesses", "storefront entrances", "rental properties", "walkways and common areas"]
  },
  "pilot-mountain-nc": {
    proof: "Common requests include driveway cleaning, siding washdowns, patios, and exterior surfaces that collect tree cover, shade staining, pollen, and road grime near Pilot Mountain.",
    local: ["Pilot Mountain homes", "shaded siding", "driveways and patios", "nearby Surry County routes"]
  },
  "elkin-nc": {
    proof: "A strong fit for house washing, soft washing, decks, fences, and concrete cleanup around homes and small businesses in the Elkin service area.",
    local: ["Elkin homes", "decks and fences", "siding and trim", "small business exteriors"]
  },
  "dobson-nc": {
    proof: "Dobson jobs often need practical exterior cleaning for siding, rooflines, gutters, driveways, and rural or semi-rural properties with organic buildup.",
    local: ["Dobson homes", "rooflines and gutters", "driveways", "nearby Surry County properties"]
  },
  "wilkesboro-nc": {
    proof: "Wilkesboro pages support commercial exterior cleaning, storefront washing, sidewalks, entries, and larger exterior surfaces west of Mount Airy.",
    local: ["Wilkesboro businesses", "storefronts", "sidewalks and entries", "commercial exterior surfaces"]
  }
};

const serviceDetails = {
  "pressure-washing": {
    signs: ["Concrete looks dark or streaky", "Sidewalks or patios are slick", "Mud and tire tracks keep returning", "A storefront entrance looks worn before customers walk in"],
    process: ["Check the surface and drainage", "Choose pressure and cleaning method", "Clean the high-traffic areas evenly", "Rinse edges and review the result"],
    timing: "Most smaller pressure washing jobs can often be scoped as a half-day or less, while larger commercial or multi-surface jobs need a custom schedule.",
    pricing: "Pricing should be quoted after photos or a walkthrough because square footage, buildup, access, and water availability change the job."
  },
  "house-washing": {
    signs: ["Green or black growth on siding", "Pollen film around porches and trim", "Soffits and fascia look dingy", "The home looks older from the street than it should"],
    process: ["Review siding material and staining", "Protect sensitive areas", "Apply the right wash method", "Rinse siding, trim, and entry areas"],
    timing: "Many house washing jobs can be handled in one visit, with timing based on home size, access, and the amount of buildup.",
    pricing: "A real quote should account for home size, number of stories, siding condition, porches, trim, and any add-ons like windows or gutters."
  },
  "soft-washing": {
    signs: ["The surface needs cleaning but should not be blasted", "Painted trim or siding has organic staining", "Roofline or exterior surfaces need a gentler method", "Previous pressure washing left marks or concern"],
    process: ["Identify delicate surfaces", "Apply a lower-pressure cleaning approach", "Let the solution work where needed", "Rinse and inspect the surface"],
    timing: "Soft washing timing depends on surface size, dwell time, and how much rinsing is needed around landscaping and nearby materials.",
    pricing: "Soft washing quotes depend on surface type, access, staining level, and whether the job is combined with house washing or roofline cleaning."
  },
  "driveway-cleaning": {
    signs: ["Tire marks are visible from the street", "Concrete has dark organic growth", "Walkways look uneven or stained", "A driveway hurts curb appeal even after the yard is clean"],
    process: ["Clear the surface", "Pre-treat heavy buildup where needed", "Surface clean the concrete", "Rinse edges, garage apron, and runoff paths"],
    timing: "Many driveway cleaning jobs are efficient single-visit jobs, but long drives, heavy buildup, or add-on patios and sidewalks can extend timing.",
    pricing: "Driveway cleaning should be priced by size, concrete condition, buildup, slope, water access, and any extra sidewalks or patios."
  },
  "roof-washing": {
    signs: ["Black streaks or algae are visible", "Roof edges and overhangs look stained", "Gutters and fascia make the roofline look neglected", "The roof needs cleaning before listing or photos"],
    process: ["Review roof material and access", "Plan runoff and surrounding protection", "Use the appropriate roof-safe method", "Rinse or finish based on material and staining"],
    timing: "Roof washing can take longer than flatwork because access, slope, landscaping, runoff, and roof material all matter.",
    pricing: "Roof washing needs a custom quote based on roof size, pitch, access, staining, safety needs, and whether gutters or fascia are included."
  },
  "gutter-cleaning": {
    signs: ["Water is spilling over the gutter", "Downspouts look clogged", "Roofline has dark streaking", "Leaves or debris are visible from the ground"],
    process: ["Check gutters and downspouts", "Remove visible debris", "Flush or confirm water flow where appropriate", "Recommend gutter guards when they make sense"],
    timing: "Most gutter cleaning timing depends on roof height, debris volume, downspout access, and whether exterior gutter brightening is included.",
    pricing: "Gutter cleaning quotes depend on home height, linear footage, debris level, access, and add-ons like exterior gutter care or gutter guards."
  },
  "window-cleaning": {
    signs: ["Exterior glass looks hazy after the siding is clean", "Storefront windows show water spots or grime", "Screens and trim make windows look dull", "A full exterior clean needs a finished look"],
    process: ["Review glass, frames, and access", "Clean exterior windows and surrounding trim as scoped", "Detail visible spots", "Pair with house or storefront washing when useful"],
    timing: "Window cleaning varies with pane count, access, screens, height, and whether it is paired with broader exterior cleaning.",
    pricing: "Window cleaning should be quoted by pane count, access, height, screen condition, and whether it is residential or storefront glass."
  },
  "commercial-pressure-washing": {
    signs: ["Entrances look dirty before customers walk in", "Sidewalks or common areas have traffic buildup", "Awnings or storefronts look stained", "Property managers need recurring curb appeal work"],
    process: ["Review access and business hours", "Choose timing that limits disruption", "Clean customer-facing surfaces", "Document areas completed for the property manager"],
    timing: "Commercial cleaning can be scheduled around business hours and may need a phased plan for larger properties or high-traffic areas.",
    pricing: "Commercial quotes depend on square footage, access, timing, water availability, surface type, and whether recurring service is requested."
  }
};

const reviewSnippets = [
  ["Victor Wilson", "Guys came out today and did a great job on my house! Fast great communication would highly recommend!!"],
  ["Sharon Richardson", "Pressure washed one of our properties. Did an excellent job! Was on time, did exactly as stated, and completed in a timely manner."],
  ["Owen Greenstreet", "They washed my driveway and house, everything looked outstanding. 10/10 Definitely recommend."],
  ["Sam Foxworth", "Mayberry Pressure Washing LLC did an awesome job on my house, driveway, and gutters. Carter was professional, quick, and the results were great."]
];

const resourcePages = [
  {
    slug: "pressure-washing-cost-mount-airy-nc",
    title: "How Much Does Pressure Washing Cost in Mount Airy, NC?",
    h1: "How much does pressure washing cost in Mount Airy, NC?",
    description: "A practical guide to what affects pressure washing pricing in Mount Airy, NC, including surface size, buildup, access, and bundled exterior cleaning services.",
    keyword: "pressure washing cost Mount Airy NC",
    sections: [
      ["What changes the price?", "The biggest factors are surface size, buildup level, access, water availability, height, and whether the job includes multiple surfaces like siding, gutters, windows, patios, or concrete."],
      ["Why photos help", "Photos let Mayberry see staining, square footage, slope, drainage, and obstacles before quoting. That usually makes the estimate faster and more accurate."],
      ["When to bundle services", "If the house, driveway, gutters, and windows all need attention, one combined exterior cleaning quote can be more practical than separate visits."]
    ]
  },
  {
    slug: "soft-washing-vs-pressure-washing",
    title: "Soft Washing vs Pressure Washing | Mayberry Pressure Washing",
    h1: "Soft washing vs pressure washing: which does your property need?",
    description: "Learn when soft washing makes more sense than pressure washing for siding, trim, rooflines, concrete, storefronts, and exterior surfaces.",
    keyword: "soft washing vs pressure washing",
    sections: [
      ["Pressure washing", "Pressure washing is usually better for durable flatwork and hard surfaces such as concrete, sidewalks, patios, and some commercial entries."],
      ["Soft washing", "Soft washing uses a lower-pressure approach for surfaces that need more care, including many siding, trim, painted, and roofline situations."],
      ["The right answer", "A good exterior cleaning plan starts with the material, not the machine. Mayberry scopes the surface first, then chooses the method."]
    ]
  },
  {
    slug: "how-often-wash-house-north-carolina",
    title: "How Often Should You Wash Your House in North Carolina?",
    h1: "How often should you wash your house in North Carolina?",
    description: "A homeowner guide to house washing frequency in North Carolina based on pollen, shade, siding condition, trees, road grime, and curb appeal goals.",
    keyword: "how often wash house North Carolina",
    sections: [
      ["A practical schedule", "Many homes benefit from house washing about once a year, but shaded lots, heavy pollen, trees, and road-facing siding may need attention sooner."],
      ["Signs it is time", "Green staining, black streaks, pollen film, dingy trim, and a dull porch or entry are common signals that the exterior is ready for a wash."],
      ["What to include", "House washing pairs well with driveway cleaning, exterior windows, gutters, porches, patios, decks, and fence cleaning when the goal is full curb appeal."]
    ]
  },
  {
    slug: "choose-pressure-washing-company-mount-airy",
    title: "How to Choose a Pressure Washing Company in Mount Airy, NC",
    h1: "How to choose a pressure washing company in Mount Airy, NC.",
    description: "What homeowners should look for when comparing pressure washing companies in Mount Airy, including photos, reviews, insurance, surface knowledge, and clear estimates.",
    keyword: "choose pressure washing company Mount Airy",
    sections: [
      ["Look for real proof", "Real job photos, before-and-after examples, and recent reviews matter more than generic claims. The company should be able to show work similar to your property."],
      ["Ask about the method", "The right company should explain when to use pressure washing, when to use soft washing, and how they protect siding, trim, landscaping, and runoff areas."],
      ["Make the estimate clear", "Send photos, the city, service needed, surface details, and timing notes. A clear scope prevents confusion and helps the crew quote the right job."]
    ]
  }
];

const cityBySlug = new Map(cities.map((city) => [city.slug, city]));
const serviceBySlug = new Map(services.map((service) => [service.slug, service]));

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function rel(depth, file) {
  return `${"../".repeat(depth)}${file}`;
}

function jsonLd(data) {
  return JSON.stringify(data, null, 2).replaceAll("</script", "<\\/script");
}

function header({ depth, active = "" }) {
  const link = (href, label, key) => `<a href="${rel(depth, href)}"${active === key ? ' aria-current="page"' : ""}>${label}</a>`;
  return `<header class="site-header">
    <nav class="nav" aria-label="Primary navigation">
      <a class="brand" href="${rel(depth, "index.html")}" aria-label="Mayberry Pressure Washing home"><span class="brand-mark"><img src="${rel(depth, "assets/images/business-logo.jpg")}" alt="" /></span><span>Mayberry Pressure Washing <small>Residential &amp; Commercial Exterior Cleaning</small></span></a>
      <button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false"><i data-lucide="menu"></i></button>
      <div class="nav-links">${link("services.html", "Services", "services")}${link("service-areas.html", "Service Areas", "areas")}${link("gallery.html", "Gallery", "gallery")}${link("reviews.html", "Reviews", "reviews")}${link("contact.html", "Contact", "contact")}<a href="${facebook}" target="_blank" rel="noopener">Facebook</a><a class="btn btn-phone" href="${phoneHref}"><i data-lucide="phone"></i> Call/Text</a><a class="btn btn-primary" href="${rel(depth, "contact.html")}"><i data-lucide="clipboard-check"></i> Free Estimate</a></div>
    </nav>
  </header>`;
}

function footer(depth) {
  return `<footer><div class="footer-grid"><div><strong>Mayberry Pressure Washing LLC</strong><p>Local pressure washing, soft washing, house washing, roof washing, driveway cleaning, gutters, windows, decks, fences, and commercial exterior cleaning.</p></div><div><strong>Top Services</strong><p><a href="${rel(depth, "services/pressure-washing.html")}">Pressure washing</a><br><a href="${rel(depth, "services/house-washing.html")}">House washing</a><br><a href="${rel(depth, "services/driveway-cleaning.html")}">Driveway cleaning</a><br><a href="${rel(depth, "services/commercial-pressure-washing.html")}">Commercial pressure washing</a></p></div><div><strong>Contact</strong><p><a href="${phoneHref}">${phone}</a><br><a href="mailto:${email}">${email}</a><br><a href="${rel(depth, "reviews.html")}">13 5-star Google reviews</a><br><a href="${facebook}" target="_blank" rel="noopener">Facebook Mayberry Pressure Washing LLC</a><br><a href="${instagram}">@mayberrypressurewashingllc</a></p></div></div></footer>`;
}

function shell({ depth = 0, title, description, canonical, ogImage = "assets/images/pressure-washing-hero.png", active, body, schema, robots = "index, follow, max-image-preview:large" }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <meta name="theme-color" content="#33465e" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="robots" content="${robots}" />
  <link rel="canonical" href="${siteUrl}${canonical}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${siteUrl}${canonical}" />
  <meta property="og:image" content="${siteUrl}/${ogImage}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${siteUrl}/${ogImage}" />
  <link rel="preconnect" href="https://unpkg.com" />
  <link rel="stylesheet" href="${rel(depth, "assets/styles.css")}" />
  <script type="application/ld+json">
  ${jsonLd(schema)}
  </script>
</head>
<body>
  ${header({ depth, active })}
  <main>
${body}
  </main>
  ${footer(depth)}
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script><script>lucide.createIcons();</script><script src="${rel(depth, "assets/script.js?v=chatbot")}"></script>
</body>
</html>
`;
}

function businessSchema() {
  return {
    "@type": "LocalBusiness",
    "@id": `${siteUrl}/#business`,
    name: "Mayberry Pressure Washing LLC",
    url: `${siteUrl}/`,
    telephone: "+1-336-374-8664",
    email,
    image: `${siteUrl}/assets/images/business-logo.jpg`,
    logo: `${siteUrl}/assets/images/business-logo.jpg`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "1120 W Lebanon St",
      addressLocality: "Mount Airy",
      addressRegion: "NC",
      postalCode: "27030",
      addressCountry: "US"
    },
    areaServed: cities.map((city) => `${city.name} ${city.state}`),
    sameAs: [
      "https://www.google.com/maps/search/?api=1&query=Mayberry%20Pressure%20Washing%20LLC&query_place_id=ChIJH1R4E00DQg4R_BKHMqJrDzc",
      facebook,
      instagram
    ],
    aggregateRating: { "@type": "AggregateRating", ratingValue: "5.0", reviewCount: "13", bestRating: "5", worstRating: "1" },
    openingHours: "Mo-Su 00:00-23:59",
    priceRange: "$$"
  };
}

function schemaFor({ canonical, name, description, service, city, faq }) {
  const graph = [
    {
      "@type": "WebPage",
      "@id": `${siteUrl}${canonical}#webpage`,
      url: `${siteUrl}${canonical}`,
      name,
      description,
      isPartOf: { "@id": `${siteUrl}/#website` },
      about: { "@id": `${siteUrl}/#business` }
    },
    businessSchema()
  ];
  if (service) {
    graph.push({
      "@type": "Service",
      "@id": `${siteUrl}${canonical}#service`,
      name: city ? `${service.name} in ${city.name}, ${city.state}` : service.name,
      provider: { "@id": `${siteUrl}/#business` },
      areaServed: city ? `${city.name}, ${city.state}` : cities.map((item) => `${item.name}, ${item.state}`),
      serviceType: service.name,
      description
    });
  }
  if (faq) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${siteUrl}${canonical}#faq`,
      mainEntity: faq.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer }
      }))
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

function serviceLinks(depth, currentSlug = "") {
  return services
    .filter((service) => service.slug !== currentSlug)
    .slice(0, 6)
    .map((service) => `<a href="${rel(depth, `services/${service.slug}.html`)}">${service.name}</a>`)
    .join("");
}

function cityLinks(depth, currentSlug = "") {
  return cities
    .filter((city) => city.slug !== currentSlug)
    .map((city) => `<a href="${rel(depth, `service-areas/${city.slug}.html`)}">${city.name}, ${city.state}</a>`)
    .join("");
}

function cityServiceLinks(depth, filter = {}) {
  return cityServiceSlugs
    .filter(([citySlug, serviceSlug]) => (!filter.citySlug || citySlug === filter.citySlug) && (!filter.serviceSlug || serviceSlug === filter.serviceSlug))
    .slice(0, 8)
    .map(([citySlug, serviceSlug]) => {
      const city = cityBySlug.get(citySlug);
      const service = serviceBySlug.get(serviceSlug);
      return `<a href="${rel(depth, `service-areas/${city.slug}/${service.slug}.html`)}">${service.name} in ${city.name}</a>`;
    })
    .join("");
}

function pageHero({ eyebrow, h1, text, depth, cta = "Request Free Estimate", secondaryHref = "services.html", secondaryLabel = "View Services" }) {
  return `    <section class="page-hero local-seo-hero">
      <div class="wrap hero-split">
        <div>
          <p class="eyebrow"><i data-lucide="map-pin"></i> ${esc(eyebrow)}</p>
          <h1>${esc(h1)}</h1>
          <p>${esc(text)}</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="${rel(depth, "contact.html")}"><i data-lucide="send"></i> ${esc(cta)}</a>
            <a class="btn btn-secondary" href="${rel(depth, secondaryHref)}"><i data-lucide="list-checks"></i> ${esc(secondaryLabel)}</a>
            <a class="btn btn-secondary" href="${phoneHref}"><i data-lucide="phone"></i> Call/Text ${phone}</a>
          </div>
        </div>
        <aside class="hero-stat-panel" aria-label="Estimate guidance">
          <strong>Fast estimate prep</strong>
          <span>Send the property city, the surfaces that need attention, photos, and any timing notes so Mayberry can quote the right scope.</span>
        </aside>
      </div>
    </section>`;
}

function renderServicePage(service) {
  const depth = 1;
  const canonical = `/services/${service.slug}.html`;
  const details = serviceDetails[service.slug];
  const faq = [
    [`Do you offer ${service.name.toLowerCase()} near Mount Airy, NC?`, `Yes. Mayberry Pressure Washing LLC quotes ${service.name.toLowerCase()} in Mount Airy, Winston-Salem, Pilot Mountain, Elkin, Dobson, Wilkesboro, and nearby communities.`],
    [`What should I send for a ${service.name.toLowerCase()} estimate?`, "Send the property city, photos of the surface, rough size if available, and any timing notes so the quote can be scoped accurately."],
    [`How much does ${service.name.toLowerCase()} cost?`, details.pricing],
    [`How long does ${service.name.toLowerCase()} usually take?`, details.timing],
    ["Can this be combined with other exterior cleaning services?", "Yes. Many jobs combine house washing, driveway cleaning, gutters, windows, roof washing, deck cleaning, fence cleaning, or commercial exterior cleaning."]
  ];
  const body = `${pageHero({
    eyebrow: service.name,
    h1: service.h1,
    text: service.description,
    depth,
    secondaryHref: "service-areas.html",
    secondaryLabel: "View Service Areas"
  })}

    <section class="section tight-section">
      <div class="wrap seo-intro">
        <div><p class="eyebrow light"><i data-lucide="${service.icon}"></i> ${esc(service.name)}</p><h2>Exterior cleaning matched to the surface.</h2></div>
        <p>${esc(service.copy)} This page gives homeowners the practical details they need before requesting a quote, including common surfaces, process, timing, proof, and service-area options.</p>
      </div>
    </section>

    <section class="section alt">
      <div class="wrap split">
        <div>
          <img class="seo-photo" src="${rel(depth, service.image)}" alt="${esc(service.name)} job photo from Mayberry Pressure Washing" loading="lazy" />
        </div>
        <div class="seo-panel">
          <p class="eyebrow light"><i data-lucide="clipboard-check"></i> Service fit</p>
          <h2>Common surfaces Mayberry can quote.</h2>
          <p>Use this page to compare what is usually included, then send photos so Mayberry can confirm the right method for the property.</p>
          <h3>Typical surfaces</h3>
          <ul class="mini-list">${service.surfaces.map((item) => `<li><i data-lucide="check"></i><span>${esc(item)}</span></li>`).join("")}</ul>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap proof-grid">
        <article class="seo-panel">
          <p class="eyebrow light"><i data-lucide="badge-dollar-sign"></i> Cost factors</p>
          <h2>What affects ${esc(service.name.toLowerCase())} pricing?</h2>
          <p>${esc(details.pricing)}</p>
          <p>${esc(details.timing)}</p>
        </article>
        <article class="seo-panel">
          <p class="eyebrow light"><i data-lucide="alert-circle"></i> Signs it is time</p>
          <h2>When to request this service.</h2>
          <ul class="mini-list">${details.signs.map((item) => `<li><i data-lucide="check"></i><span>${esc(item)}</span></li>`).join("")}</ul>
        </article>
        <article class="seo-panel">
          <p class="eyebrow light"><i data-lucide="list-checks"></i> Process</p>
          <h2>What happens on the job.</h2>
          <ol class="process compact-process">${details.process.map((item) => `<li><span>${esc(item)}</span></li>`).join("")}</ol>
        </article>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="section-head"><h2>Local ${esc(service.name.toLowerCase())} pages.</h2><p>Use these pages when the property is in a specific town and the customer needs details for that service.</p></div>
        <div class="link-grid">${cityServiceLinks(depth, { serviceSlug: service.slug }) || cityLinks(depth)}</div>
      </div>
    </section>

    <section class="section alt">
      <div class="wrap split">
        <div>
          <div class="section-head"><p class="eyebrow light"><i data-lucide="image"></i> Project proof</p><h2>Real work examples help set expectations.</h2><p>Job photos, service context, and a clear quote path help homeowners understand what Mayberry can clean before they reach out.</p></div>
          <div class="section-actions"><a class="btn btn-primary" href="${rel(depth, "gallery.html")}"><i data-lucide="images"></i> View Job Photos</a><a class="btn btn-secondary" href="${rel(depth, "contact.html")}"><i data-lucide="send"></i> Request Estimate</a></div>
        </div>
        <div class="service-proof-photos">
          <img src="${rel(depth, service.image)}" alt="${esc(service.name)} example from Mayberry Pressure Washing" loading="lazy" />
          <img src="${rel(depth, "assets/images/before-after-pics/before-1.jpg")}" alt="Before exterior cleaning by Mayberry Pressure Washing" loading="lazy" />
          <img src="${rel(depth, "assets/images/before-after-pics/after-1.jpg")}" alt="After exterior cleaning by Mayberry Pressure Washing" loading="lazy" />
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="section-head"><p class="eyebrow light"><i data-lucide="star"></i> Service proof</p><h2>Reviews near the decision point.</h2><p>These customer review snippets reinforce trust while a visitor is comparing the service.</p></div>
        <div class="reviews-grid compact-reviews">${reviewSnippets.slice(0, 3).map(([name, quote]) => `<article class="review-card"><div><strong>${esc(name)}</strong></div><p class="stars" aria-label="5 out of 5 stars">5 stars</p><blockquote>${esc(quote)}</blockquote></article>`).join("")}</div>
      </div>
    </section>

    <section class="section alt">
      <div class="wrap faq-grid">
        <div class="section-head"><p class="eyebrow light"><i data-lucide="circle-help"></i> Service FAQ</p><h2>${esc(service.name)} questions.</h2><p>Quick answers for homeowners and property managers comparing exterior cleaning options.</p></div>
        <div class="faq-list">${faq.map(([q, a], index) => `<details${index === 0 ? " open" : ""}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>
      </div>
    </section>

    <section class="cta-band"><div class="wrap"><div><h2>Need ${esc(service.name.toLowerCase())}?</h2><p>Send photos, the property city, and the surfaces that need attention.</p></div><a class="btn btn-primary" href="${rel(depth, "contact.html")}"><i data-lucide="send"></i> Request Estimate</a></div></section>`;

  return shell({
    depth,
    title: service.title,
    description: service.description,
    canonical,
    ogImage: service.image,
    active: "services",
    body,
    schema: schemaFor({ canonical, name: service.h1, description: service.description, service, faq })
  });
}

function renderCityPage(city) {
  const depth = 1;
  const canonical = `/service-areas/${city.slug}.html`;
  const title = `Pressure Washing in ${city.name}, ${city.state} | Mayberry Pressure Washing`;
  const description = `Pressure washing, house washing, driveway cleaning, roof washing, gutters, windows, decks, fences, and commercial exterior cleaning in ${city.name}, ${city.state}.`;
  const details = cityDetails[city.slug];
  const faq = [
    [`Does Mayberry Pressure Washing serve ${city.name}, ${city.state}?`, `Yes. Mayberry Pressure Washing LLC quotes exterior cleaning projects in ${city.name}, ${city.state} and nearby communities when route and job scope line up.`],
    [`What services are available in ${city.name}?`, "Common requests include pressure washing, house washing, soft washing, driveway cleaning, roof washing, gutter cleaning, window cleaning, deck cleaning, fence cleaning, and commercial exterior cleaning."],
    ["How do I get a local estimate?", "Send the property city, photos, and surfaces that need cleaned through the estimate page or by phone/text."]
  ];
  const body = `${pageHero({
    eyebrow: `${city.name}, ${city.state} service area`,
    h1: `Pressure washing in ${city.name}, ${city.state}.`,
    text: description,
    depth,
    secondaryHref: "services.html",
    secondaryLabel: "Compare Services"
  })}

    <section class="section tight-section">
      <div class="wrap seo-intro">
        <div><p class="eyebrow light"><i data-lucide="navigation"></i> Local service area</p><h2>Exterior cleaning ${esc(city.intro)}.</h2></div>
        <p>This page connects ${esc(city.name)} searches with Mayberry's core exterior cleaning services. ${esc(details.proof)} The title, H1, meta description, and internal links are all aligned around pressure washing in ${esc(city.name)}, ${esc(city.state)}.</p>
      </div>
    </section>

    <section class="section alt">
      <div class="wrap">
        <div class="section-head"><h2>${esc(city.name)} exterior cleaning services.</h2><p>Use the local service links below when a customer is searching for a specific service in ${esc(city.name)}.</p></div>
        <div class="link-grid">${cityServiceLinks(depth, { citySlug: city.slug }) || serviceLinks(depth)}</div>
      </div>
    </section>

    <section class="section">
      <div class="wrap feature-band">
        <div>
          <div class="section-head"><p class="eyebrow light"><i data-lucide="map-pin"></i> Local service fit</p><h2>Exterior cleaning needs Mayberry can quote in ${esc(city.name)}.</h2><p>These are the common property types and service requests homeowners and businesses usually need help with in this area.</p></div>
          <div class="keyword-cloud"><span>House washing</span><span>Driveway cleaning</span><span>Soft washing</span><span>Roofline and gutter care</span><span>Commercial exterior cleaning</span></div>
        </div>
        <div class="local-service-panel"><strong>Local proof points</strong><ul class="mini-list">${details.local.map((item) => `<li><i data-lucide="map-pin"></i><span>${esc(item)}</span></li>`).join("")}</ul></div>
      </div>
    </section>

    <section class="section alt">
      <div class="wrap split">
        <img class="seo-photo" src="${rel(depth, "assets/images/gallery/house-siding-before-after.jpg")}" alt="Exterior cleaning work near ${esc(city.name)}, ${esc(city.state)} by Mayberry Pressure Washing" loading="lazy" />
        <div class="seo-panel">
          <p class="eyebrow light"><i data-lucide="route"></i> Nearby coverage</p>
          <h2>Nearby Mayberry service areas.</h2>
          <p>Use these links to move between nearby towns and find the service area that best matches the property location.</p>
          <div class="link-stack">${cityLinks(depth, city.slug)}</div>
        </div>
      </div>
    </section>

    <section class="section alt">
      <div class="wrap faq-grid">
        <div class="section-head"><p class="eyebrow light"><i data-lucide="circle-help"></i> Area FAQ</p><h2>${esc(city.name)} service questions.</h2><p>Local answers for homeowners and property managers.</p></div>
        <div class="faq-list">${faq.map(([q, a], index) => `<details${index === 0 ? " open" : ""}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>
      </div>
    </section>

    <section class="cta-band"><div class="wrap"><div><h2>Need pressure washing in ${esc(city.name)}?</h2><p>Send the service, photos, and property location so Mayberry can confirm the route and scope.</p></div><a class="btn btn-primary" href="${rel(depth, "contact.html")}"><i data-lucide="send"></i> Request Estimate</a></div></section>`;

  return shell({
    depth,
    title,
    description,
    canonical,
    active: "areas",
    body,
    schema: schemaFor({ canonical, name: `Pressure washing in ${city.name}, ${city.state}`, description, city, faq })
  });
}

function renderCityServicePage(city, service) {
  const depth = 2;
  const canonical = `/service-areas/${city.slug}/${service.slug}.html`;
  const title = `${service.name} in ${city.name}, ${city.state} | Mayberry Pressure Washing`;
  const h1 = `${service.name} in ${city.name}, ${city.state}.`;
  const description = `${service.name} in ${city.name}, ${city.state} from Mayberry Pressure Washing LLC, with quotes for homes, businesses, concrete, siding, rooflines, gutters, windows, decks, fences, and exterior surfaces.`;
  const details = serviceDetails[service.slug];
  const local = cityDetails[city.slug];
  const faq = [
    [`Do you offer ${service.name.toLowerCase()} in ${city.name}, ${city.state}?`, `Yes. Mayberry Pressure Washing LLC can quote ${service.name.toLowerCase()} in ${city.name}, ${city.state} when the route, property access, and job scope line up.`],
    [`What is included with ${service.name.toLowerCase()} in ${city.name}?`, `The scope depends on the property, but common surfaces include ${service.surfaces.slice(0, 4).join(", ")}.`],
    ["What is the fastest way to request a quote?", "Send the city, service needed, photos of the surfaces, and any timing notes by phone/text or through the estimate page."]
  ];
  const body = `${pageHero({
    eyebrow: `${service.name} in ${city.name}`,
    h1,
    text: description,
    depth,
    secondaryHref: `service-areas/${city.slug}.html`,
    secondaryLabel: `${city.name} Service Area`
  })}

    <section class="section tight-section">
      <div class="wrap seo-intro">
        <div><p class="eyebrow light"><i data-lucide="${service.icon}"></i> Local service</p><h2>${esc(service.name)} details for ${esc(city.name)} properties.</h2></div>
        <p>${esc(service.copy)} ${esc(local.proof)} If the property is in or near ${esc(city.name)}, send photos and timing notes so Mayberry can confirm the route, access, and right cleaning method.</p>
      </div>
    </section>

    <section class="section alt">
      <div class="wrap split">
        <img class="seo-photo" src="${rel(depth, service.image)}" alt="${esc(service.name)} in ${esc(city.name)}, ${esc(city.state)} by Mayberry Pressure Washing" loading="lazy" />
        <div class="seo-panel">
          <p class="eyebrow light"><i data-lucide="map"></i> Local service details</p>
          <h2>${esc(service.name)} for ${esc(city.name)} homes and businesses.</h2>
          <p>Use this page when the property is in ${esc(city.name)} and the job needs a quote for ${esc(service.name.toLowerCase())}. Photos help Mayberry understand surface size, buildup, access, and timing.</p>
          <div class="keyword-cloud"><span>Photo-based estimates</span><span>Residential and commercial</span><span>Surface-specific cleaning</span></div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap proof-grid">
        <article class="seo-panel"><p class="eyebrow light"><i data-lucide="badge-dollar-sign"></i> Quote factors</p><h2>What affects the quote?</h2><p>${esc(details.pricing)}</p></article>
        <article class="seo-panel"><p class="eyebrow light"><i data-lucide="clock"></i> Timing</p><h2>How long does it take?</h2><p>${esc(details.timing)}</p></article>
        <article class="seo-panel"><p class="eyebrow light"><i data-lucide="map-pin"></i> ${esc(city.name)} details</p><h2>Local surfaces to mention.</h2><ul class="mini-list">${local.local.map((item) => `<li><i data-lucide="check"></i><span>${esc(item)}</span></li>`).join("")}</ul></article>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="section-head"><h2>Related local pages.</h2><p>These links connect the service details, town coverage, and nearby service areas in one place.</p></div>
        <div class="link-grid"><a href="${rel(depth, `services/${service.slug}.html`)}">${service.name} details</a><a href="${rel(depth, `service-areas/${city.slug}.html`)}">${city.name} service area</a>${serviceLinks(depth, service.slug)}${cityLinks(depth, city.slug)}</div>
      </div>
    </section>

    <section class="section alt">
      <div class="wrap faq-grid">
        <div class="section-head"><p class="eyebrow light"><i data-lucide="circle-help"></i> Local FAQ</p><h2>${esc(service.name)} in ${esc(city.name)} questions.</h2><p>Answers for homeowners and property managers comparing local exterior cleaning options.</p></div>
        <div class="faq-list">${faq.map(([q, a], index) => `<details${index === 0 ? " open" : ""}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>
      </div>
    </section>

    <section class="cta-band"><div class="wrap"><div><h2>Need ${esc(service.name.toLowerCase())} in ${esc(city.name)}?</h2><p>Send photos and the property location so Mayberry can confirm the scope.</p></div><a class="btn btn-primary" href="${rel(depth, "contact.html")}"><i data-lucide="send"></i> Request Estimate</a></div></section>`;

  return shell({
    depth,
    title,
    description,
    canonical,
    ogImage: service.image,
    active: "areas",
    body,
    schema: schemaFor({ canonical, name: h1, description, service, city, faq })
  });
}

function renderSeoPlan() {
  const depth = 0;
  const canonical = "/seo-plan.html";
  const description = "Website growth roadmap for Mayberry Pressure Washing LLC, including service details, town coverage, helpful homeowner resources, internal links, and local trust-building ideas.";
  const body = `${pageHero({
    eyebrow: "Website growth roadmap",
    h1: "Mayberry Pressure Washing website growth plan.",
    text: description,
    depth,
    secondaryHref: "services.html",
    secondaryLabel: "View Services"
  })}

    <section class="section tight-section">
      <div class="wrap seo-intro">
        <div><p class="eyebrow light"><i data-lucide="map"></i> Site structure</p><h2>Services, towns, proof, and clear quote paths.</h2></div>
        <p>The rollout is built around pages that match what local buyers need: clear service details, town-specific coverage, real project proof, helpful answers, and fast ways to request an estimate.</p>
      </div>
    </section>

    <section class="section alt">
      <div class="wrap">
        <div class="section-head"><h2>Priority service details.</h2><p>Each service has its own customer-facing explanation, proof, FAQ, and internal links.</p></div>
        <div class="link-grid">${services.map((service) => `<a href="services/${service.slug}.html">${service.name}</a>`).join("")}</div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="section-head"><h2>Priority city pages.</h2><p>These pages support searches like pressure washing Mount Airy NC or house washing Winston-Salem.</p></div>
        <div class="link-grid">${cities.map((city) => `<a href="service-areas/${city.slug}.html">${city.name}, ${city.state}</a>`).join("")}</div>
      </div>
    </section>

    <section class="section alt">
      <div class="wrap">
        <div class="section-head"><h2>First city-service rollout batch.</h2><p>These are the focused landing pages added first. More can be added later after the site has real project examples and search data.</p></div>
        <div class="link-grid">${cityServiceLinks(depth)}</div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="section-head"><h2>First homeowner resources.</h2><p>These answer cost, comparison, timing, and hiring questions before the visitor is ready to request a quote.</p></div>
        <div class="link-grid">${resourcePages.map((resource) => `<a href="resources/${resource.slug}.html">${resource.h1}</a>`).join("")}</div>
      </div>
    </section>

    <section class="section alt">
      <div class="wrap feature-band">
        <div>
          <div class="section-head"><p class="eyebrow light"><i data-lucide="link"></i> Backlink plan</p><h2>Build local trust links first.</h2><p>Backlinks are links from other websites to Mayberry's site. The best early links should come from real local profiles, partner pages, directories, community pages, and client/vendor mentions.</p></div>
          <div class="keyword-cloud"><span>Google Business Profile</span><span>Facebook</span><span>Instagram</span><span>local chamber</span><span>supplier pages</span><span>customer/vendor mentions</span><span>community sponsorships</span><span>local directories</span></div>
        </div>
        <div class="local-service-panel"><strong>Backlink rule</strong><p>Prioritize real, local, relevant links. Avoid spam directories, paid link farms, and duplicate low-quality listings.</p></div>
      </div>
    </section>

    <section class="cta-band"><div class="wrap"><div><h2>Ready to keep building the rollout?</h2><p>Use this page as the map for future service-city additions and backlink outreach.</p></div><a class="btn btn-primary" href="contact.html"><i data-lucide="send"></i> Request Estimate</a></div></section>`;

  return shell({
    depth,
    title: "Website Growth Plan | Mayberry Pressure Washing",
    description,
    canonical,
    active: "seo",
    body,
    schema: schemaFor({ canonical, name: "Mayberry Pressure Washing local SEO plan", description }),
    robots: "noindex, follow"
  });
}

function renderResourcePage(resource) {
  const depth = 1;
  const canonical = `/resources/${resource.slug}.html`;
  const faq = [
    [`Is this a fixed price list?`, "No. This is a practical guide. Mayberry still needs the property city, photos, service needed, and surface details to quote accurately."],
    ["What is the fastest way to get an estimate?", "Call or text Mayberry Pressure Washing LLC with photos, the property city, and what needs cleaned."],
    ["Can several services be quoted together?", "Yes. House washing, driveway cleaning, gutters, windows, roof washing, decks, fences, and commercial exterior cleaning can be scoped together."]
  ];
  const body = `${pageHero({
    eyebrow: "Homeowner resource",
    h1: resource.h1,
    text: resource.description,
    depth,
    secondaryHref: "services.html",
    secondaryLabel: "Compare Services"
  })}

    <section class="section tight-section">
      <div class="wrap seo-intro">
        <div><p class="eyebrow light"><i data-lucide="book-open-check"></i> Homeowner guide</p><h2>Practical answers before you request a quote.</h2></div>
        <p>This guide answers a real homeowner question in plain English, then connects readers to Mayberry's service details and estimate path.</p>
      </div>
    </section>

    <section class="section alt">
      <div class="wrap resource-grid">
        ${resource.sections.map(([heading, text]) => `<article class="seo-panel"><h2>${esc(heading)}</h2><p>${esc(text)}</p></article>`).join("")}
      </div>
    </section>

    <section class="section">
      <div class="wrap split">
        <img class="seo-photo" src="${rel(depth, "assets/images/gallery/driveway-surface-cleaning.jpg")}" alt="Mayberry Pressure Washing exterior cleaning example" loading="lazy" />
        <div class="seo-panel">
          <p class="eyebrow light"><i data-lucide="send"></i> Estimate prep</p>
          <h2>What to send Mayberry.</h2>
          <ul class="mini-list"><li><i data-lucide="check"></i><span>Property city and nearest town</span></li><li><i data-lucide="check"></i><span>Photos of each surface</span></li><li><i data-lucide="check"></i><span>Service needed and timing notes</span></li><li><i data-lucide="check"></i><span>Whether this is residential or commercial</span></li></ul>
        </div>
      </div>
    </section>

    <section class="section alt">
      <div class="wrap">
        <div class="section-head"><h2>Related Mayberry pages.</h2><p>Keep moving from research to the service details that fit the job.</p></div>
        <div class="link-grid"><a href="${rel(depth, "services/pressure-washing.html")}">Pressure Washing</a><a href="${rel(depth, "services/house-washing.html")}">House Washing</a><a href="${rel(depth, "services/driveway-cleaning.html")}">Driveway Cleaning</a><a href="${rel(depth, "service-areas/mount-airy-nc.html")}">Mount Airy Service Area</a><a href="${rel(depth, "contact.html")}">Request Estimate</a></div>
      </div>
    </section>

    <section class="section">
      <div class="wrap faq-grid">
        <div class="section-head"><p class="eyebrow light"><i data-lucide="circle-help"></i> Quick answers</p><h2>Estimate questions.</h2></div>
        <div class="faq-list">${faq.map(([q, a], index) => `<details${index === 0 ? " open" : ""}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>
      </div>
    </section>

    <section class="cta-band"><div class="wrap"><div><h2>Want Mayberry to quote the job?</h2><p>Send photos, the city, and what needs cleaned.</p></div><a class="btn btn-primary" href="${rel(depth, "contact.html")}"><i data-lucide="send"></i> Request Estimate</a></div></section>`;

  return shell({
    depth,
    title: resource.title,
    description: resource.description,
    canonical,
    active: "resources",
    body,
    schema: schemaFor({ canonical, name: resource.h1, description: resource.description, faq })
  });
}

function writePage(path, html) {
  const fullPath = join(process.cwd(), path);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, html);
}

for (const service of services) {
  writePage(`services/${service.slug}.html`, renderServicePage(service));
}

for (const city of cities) {
  writePage(`service-areas/${city.slug}.html`, renderCityPage(city));
}

for (const [citySlug, serviceSlug] of cityServiceSlugs) {
  const city = cityBySlug.get(citySlug);
  const service = serviceBySlug.get(serviceSlug);
  writePage(`service-areas/${city.slug}/${service.slug}.html`, renderCityServicePage(city, service));
}

writePage("seo-plan.html", renderSeoPlan());

for (const resource of resourcePages) {
  writePage(`resources/${resource.slug}.html`, renderResourcePage(resource));
}

const generatedPages = [
  ...services.map((service) => ({ loc: `/services/${service.slug}.html`, priority: "0.8" })),
  ...cities.map((city) => ({ loc: `/service-areas/${city.slug}.html`, priority: "0.8" })),
  ...cityServiceSlugs.map(([citySlug, serviceSlug]) => ({ loc: `/service-areas/${citySlug}/${serviceSlug}.html`, priority: "0.7" })),
  ...resourcePages.map((resource) => ({ loc: `/resources/${resource.slug}.html`, priority: "0.7" }))
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...basePages, ...generatedPages].map(({ loc, priority }) => `  <url><loc>${siteUrl}${loc}</loc><priority>${priority}</priority></url>`).join("\n")}
</urlset>
`;

writePage("sitemap.xml", sitemap);
