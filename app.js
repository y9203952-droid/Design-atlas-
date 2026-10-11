const state = {
  kind: "all",
  source: "all",
  category: "all",
  query: "",
  data: null,
};

const GROUP = {
  "Inspiration & Community (Showcases, Portfolios, Galleries)": "Inspiration",
  Inspiration: "Inspiration",
  Landing: "Inspiration",
  Web: "Inspiration",
  SaaS: "Inspiration",
  Dark: "Inspiration",
  Portfolio: "Inspiration",
  Mobile: "Inspiration",
  eCommerce: "Inspiration",
  Navbar: "Inspiration",
  Footer: "Inspiration",
  "404": "Inspiration",
  OG: "Inspiration",
  Deck: "Inspiration",
  Archive: "Inspiration",
  Arts: "Inspiration",
  Interface: "Inspiration",
  "UI & UX": "Inspiration",
  "Color": "Color",
  "Colors & Palettes": "Color",
  "Typography (Fonts, Pairing, Generators)": "Typography",
  Typography: "Typography",
  Font: "Typography",
  "Sans serif": "Typography",
  Serif: "Typography",
  "Icon sets": "Icons",
  "Icons & Illustrations (SVGs, Packs, Tools)": "Icons",
  Icons: "Icons",
  Illustration: "Icons",
  Illustrations: "Icons",
  Logo: "Icons",
  Logos: "Icons",
  "UI Kits & Component Libraries": "UI kits",
  Component: "UI kits",
  "Design Systems": "UI kits",
  "Design Systems & Frameworks": "UI kits",
  "Web Design Frameworks": "UI kits",
  "UI Design": "UI kits",
  "Images & Backgrounds": "Images",
  Background: "Images",
  Photos: "Images",
  "Templates (Landing Pages, Presentations, Mockups)": "Templates",
  "Production Tools (Gradients, Shadows, Converters, GenAI)": "Tools",
  "Figma plugins & resources": "Tools",
  "Prototyping & Tools": "Tools",
  Development: "Tools",
  Software: "Tools",
  "Chrome Extensions": "Tools",
  "Animations, 3D and Sound": "Motion",
  Motion: "Motion",
  "Brand systems": "Brand systems",
  "Design Principles": "Learn",
  "Design guides (and studies)": "Learn",
  Learn: "Learn",
  "Learning & Courses": "Learn",
  "Learning (Courses, Articles, Books, Case Studies)": "Learn",
  "News & Blogs (Curated resources, newsletters)": "Learn",
  Accessibility: "Learn",
  Book: "Learn",
  Books: "Learn",
  Communities: "Learn",
};

const GROUP_ORDER = [
  "Inspiration",
  "UI kits",
  "Color",
  "Typography",
  "Icons",
  "Images",
  "Tools",
  "Motion",
  "Templates",
  "Learn",
  "Brand systems",
  "Other",
];

function groupOf(category) {
  return GROUP[category] || "Other";
}

function $(id) {
  return document.getElementById(id);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function matches(item) {
  if (state.kind !== "all" && item.kind !== state.kind) return false;
  if (state.source !== "all" && item.source !== state.source) return false;
  if (state.category !== "all" && groupOf(item.category) !== state.category) return false;
  if (!state.query) return true;
  const q = state.query;
  return (
    item.name.toLowerCase().includes(q) ||
    (item.desc && item.desc.toLowerCase().includes(q)) ||
    item.category.toLowerCase().includes(q) ||
    item.sourceLabel.toLowerCase().includes(q) ||
    (item.slug && item.slug.toLowerCase().includes(q))
  );
}

function swatches(item) {
  if (!item.colors) return "";
  const keys = ["primary", "canvas", "ink", "surface-1", "block-lime", "cyan"];
  const seen = new Set();
  const hexes = [];
  for (const k of keys) {
    const v = item.colors[k];
    if (v && !seen.has(v)) {
      seen.add(v);
      hexes.push(v);
    }
  }
  for (const v of Object.values(item.colors)) {
    if (hexes.length >= 5) break;
    if (typeof v === "string" && v.startsWith("#") && !seen.has(v)) {
      seen.add(v);
      hexes.push(v);
    }
  }
  return `<div class="swatches">${hexes
    .slice(0, 5)
    .map((h) => `<span class="swatch" style="background:${escapeHtml(h)}" title="${escapeHtml(h)}"></span>`)
    .join("")}</div>`;
}

function render() {
  if (!state.data) return;
  const items = state.data.items.filter(matches);
  $("count").textContent = `${items.length} of ${state.data.items.length}`;
  $("empty").hidden = items.length > 0;
  $("grid").innerHTML = items
    .slice(0, 240)
    .map(
      (item) => `
      <a class="card" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
        <div class="card-meta">
          <span class="pill">${escapeHtml(groupOf(item.category))}</span>
          <span class="pill ${item.kind === "brand" ? "kind-brand" : ""}">${escapeHtml(item.sourceLabel)}</span>
        </div>
        <h2>${escapeHtml(item.name)}</h2>
        <p class="desc">${escapeHtml(item.desc || item.url)}</p>
        ${swatches(item)}
      </a>`
    )
    .join("");
}

function setChip(container, value) {
  container.querySelectorAll(".chip").forEach((el) => {
    el.classList.toggle("is-on", el.dataset.value === value);
  });
}

function boot(data) {
  state.data = data;
  $("stats").innerHTML = `
    <div class="stat"><strong>${data.counts.total}</strong><span>indexed</span></div>
    <div class="stat"><strong>${data.counts.resources}</strong><span>resources</span></div>
    <div class="stat"><strong>${data.counts.brands}</strong><span>brand systems</span></div>
    <div class="stat"><strong>${data.sources.length}</strong><span>source lists</span></div>
  `;

  const sources = $("sources");
  sources.innerHTML = [`<button type="button" class="chip is-on" data-value="all">All sources</button>`]
    .concat(
      data.sources.map(
        (s) => `<button type="button" class="chip" data-value="${escapeHtml(s.id)}">${escapeHtml(s.label)}</button>`
      )
    )
    .join("");
  sources.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    state.source = btn.dataset.value;
    setChip(sources, state.source);
    render();
  });

  const present = new Set(data.items.map((i) => groupOf(i.category)));
  const cats = GROUP_ORDER.filter((g) => present.has(g));
  const categories = $("categories");
  categories.innerHTML = [`<button type="button" class="chip is-on" data-value="all">All categories</button>`]
    .concat(cats.map((c) => `<button type="button" class="chip" data-value="${escapeHtml(c)}">${escapeHtml(c)}</button>`))
    .join("");
  categories.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    state.category = btn.dataset.value;
    setChip(categories, state.category);
    render();
  });

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.kind = btn.dataset.kind;
      document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("is-on", b === btn));
      render();
    });
  });

  const input = $("q");
  input.addEventListener("input", () => {
    state.query = input.value.trim().toLowerCase();
    render();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== input) {
      e.preventDefault();
      input.focus();
    }
  });

  render();
}

fetch("data.json")
  .then((r) => r.json())
  .then(boot)
  .catch(() => {
    $("empty").hidden = false;
    $("empty").textContent = "Could not load data.json";
  });
