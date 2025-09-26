const API_BASE = "http://localhost:3000/api/v1";

/* =============== Modal helpers =============== */
function openModal(item) {
  const modal   = document.querySelector("#detailModal");
  const backdrop = modal.querySelector(".modal-backdrop");
  const title   = modal.querySelector("#modalTitle");
  const meta    = modal.querySelector("#modalMeta");
  const rating  = modal.querySelector("#modalRating");
  const desc    = modal.querySelector("#modalDesc");

  // Fondo del modal
  backdrop.style.backgroundImage = `url(${item.backdrop || item.poster || "../storage/poster2.jpg"})`;

  // Info
  title.textContent  = item.title_es || item.title || item.name || "Sin título";
  meta.textContent   = (item.genres || []).join(" • ");
  desc.textContent   = item.overview || "Sin descripción.";
  rating.innerHTML   = renderStars(item.vote_average || 0);

  modal.removeAttribute("hidden");

  // Cerrar con la X, clic fuera o Escape
  modal.querySelector(".modal-close").onclick = () => closeModal();
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
  document.addEventListener("keydown", escClose);
}

function closeModal() {
  const modal = document.querySelector("#detailModal");
  if (!modal) return;
  modal.setAttribute("hidden", "");
  document.removeEventListener("keydown", escClose);
}

function escClose(e) {
  if (e.key === "Escape") closeModal();
}

// Generador de estrellas (0–10 → 0–5)
function renderStars(rating) {
  const stars = Math.round(rating / 2);
  return "⭐".repeat(stars) + ` (${rating.toFixed(1)})`;
}

// ---------- Render helpers ----------
function renderCards(container, items) {
  container.innerHTML = "";
  items.forEach(it => {
    const poster = it.poster || "../storage/poster2.jpg";
    const title  = it.title_es || it.title || "Sin título";

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card__poster">
        <img src="${poster}" alt="${title}" loading="lazy">
      </div>
      <h3 class="card__title">${title}</h3>
      <p class="card__meta">${(it.genres || []).join(" • ")}</p>
    `;

    // click abre modal
    card.addEventListener("click", () => {
      openModal(it);
    });

    container.appendChild(card);
  });
}

// ---------- Hero dinámico (3 aleatorias) ----------
function renderHero(container, items) {
  if (!items.length) {
    container.innerHTML = "<p>No hay destacados</p>";
    return;
  }

  container.innerHTML = `
    <div class="hero-track"></div>
    <button class="hero-nav prev">❮</button>
    <button class="hero-nav next">❯</button>
    <div class="hero-dots"></div>
  `;

  const track = container.querySelector(".hero-track");
  const dots  = container.querySelector(".hero-dots");

  items.forEach((it, i) => {
    const slide = document.createElement("article");
    slide.className = "hero-slide";
    slide.style.backgroundImage = `url(${it.backdrop || it.poster || "../storage/poster2.jpg"})`;
    slide.innerHTML = `
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <p class="hero-year">${it.year || ""}</p>
        <h2 class="hero-title">${it.title_es || it.title || "Sin título"}</h2>
        <p class="hero-meta">⭐ ${(it.vote_average || 0).toFixed(1)} • ${(it.genres || []).join(" • ")}</p>
        <p class="hero-desc">${it.overview || ""}</p>
      </div>
    `;

    // click abre modal
    slide.addEventListener("click", () => {
      openModal(it);
    });

    track.appendChild(slide);

    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Ir al slide ${i+1}`);
    dots.appendChild(dot);
  });

  // mini carrusel
  let index = 0;
  const slides = [...track.children];
  const navPrev = container.querySelector(".hero-nav.prev");
  const navNext = container.querySelector(".hero-nav.next");

  function show(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${index*100}%)`;
    dots.querySelectorAll("button").forEach((d,k)=> {
      d.classList.toggle("active", k===index);
    });
  }

  navPrev.addEventListener("click", (e) => {
    e.stopPropagation(); // ⬅️ evita abrir modal al dar flecha
    show(index-1);
  });

  navNext.addEventListener("click", (e) => {
    e.stopPropagation();
    show(index+1);
  });

  dots.querySelectorAll("button").forEach((d,i)=> 
    d.addEventListener("click", (e)=> {
      e.stopPropagation();
      show(i);
    })
  );

  // arranque
  track.style.display = "grid";
  track.style.gridAutoFlow = "column";
  track.style.gridAutoColumns = "100%";
  show(0);
}


/* =============== Carruseles horizontales con loop infinito =============== */
function initRow(section) {
  const track = section.querySelector(".row-track");
  const prev  = section.querySelector(".row-nav.prev");
  const next  = section.querySelector(".row-nav.next");
  if (!track) return;

  const original = [...track.children];
  if (!original.length) return;

  for (let i = 0; i < 3; i++) {
    original.forEach(el => track.appendChild(el.cloneNode(true)));
  }

  const cards = [...track.children];
  const cardW = cards[0].offsetWidth + 18;
  let index = Math.floor(cards.length / 2);
  track.scrollLeft = cardW * index;

  function goTo(i) {
    index = i;
    track.scrollTo({ left: cardW * index, behavior: "smooth" });
  }

  prev?.addEventListener("click", () => {
    if (index <= 0) {
      index = cards.length / 2;
      track.scrollLeft = cardW * index;
    }
    goTo(index - 1);
  });

  next?.addEventListener("click", () => {
    if (index >= cards.length - original.length) {
      index = cards.length / 2 - 1;
      track.scrollLeft = cardW * index;
    }
    goTo(index + 1);
  });
}

/* =============== Cargar datos del backend =============== */
async function loadCatalogo() {
  try {
    const res = await fetch(`${API_BASE}/catalogo`);
    const data = await res.json();

    // Hero (3 aleatorias)
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    renderHero(document.querySelector("#hero"), shuffled.slice(0,3));

    // Últimos lanzamientos (por fecha)
    const ultimos = [...data]
      .sort((a,b) => new Date(b.release_date) - new Date(a.release_date))
      .slice(0,10);
    renderCards(document.querySelector("#ultimos .row-track"), ultimos);
    initRow(document.querySelector("#ultimos"));

    // Más populares
    const populares = [...data]
      .sort((a,b) => (b.vote_count || 0) - (a.vote_count || 0))
      .slice(0,10);
    renderCards(document.querySelector("#populares .row-track"), populares);
    initRow(document.querySelector("#populares"));

    // Mejor valoradas
    const mejor = [...data]
      .sort((a,b) => (b.vote_average || 0) - (a.vote_average || 0))
      .slice(0,10);
    renderCards(document.querySelector("#mejor .row-track"), mejor);
    initRow(document.querySelector("#mejor"));

    // Películas (random)
    const pelis = data.filter(it => it.categoria === "movie").sort(() => Math.random()-0.5).slice(0,10);
    renderCards(document.querySelector("#peliculas .row-track"), pelis);
    initRow(document.querySelector("#peliculas"));

    // Series (random)
    const series = data.filter(it => it.categoria === "serie").sort(() => Math.random()-0.5).slice(0,10);
    renderCards(document.querySelector("#series .row-track"), series);
    initRow(document.querySelector("#series"));

    // Anime (random)
    const anime = data.filter(it => it.categoria === "anime").sort(() => Math.random()-0.5).slice(0,10);
    renderCards(document.querySelector("#anime .row-track"), anime);
    initRow(document.querySelector("#anime"));

  } catch (err) {
    console.error("Error cargando catálogo:", err);
  }
}

/* =============== Búsqueda por input (formulario) =============== */
function initSearch() {
  const form = document.getElementById("navSearch");
  const input = document.getElementById("searchInput");
  if (!form || !input) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;

    try {
      const res = await fetch(`${API_BASE}/catalogo/search?q=${encodeURIComponent(q)}`);
      const results = await res.json();

      localStorage.setItem("SEARCH_RESULTS", JSON.stringify(results));
      window.location.href = "./search.html?q=" + encodeURIComponent(q);
    } catch (err) {
      console.error("Error en búsqueda:", err);
    }
  });
}

/* =============== Búsqueda por género =============== */
function initGenreMenu() {
  const genreMenu = document.getElementById("genreMenu");
  if (!genreMenu) return;

  genreMenu.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", async () => {
      const genre = btn.textContent.trim();
      try {
        const res = await fetch(`${API_BASE}/catalogo/genre/${encodeURIComponent(genre)}`);
        const results = await res.json();

        localStorage.setItem("SEARCH_RESULTS", JSON.stringify(results));
        window.location.href = "./search.html?genre=" + encodeURIComponent(genre);
      } catch (err) {
        console.error("Error en búsqueda de género:", err);
      }
    });
  });
}

/* =============== Toggle barra de búsqueda con la lupa =============== */
function initNavSearchToggle() {
  const searchBtn = document.getElementById("searchBtn");
  const navSearch = document.getElementById("navSearch");
  const searchInput = document.getElementById("searchInput");
  const header = document.querySelector(".home-nav");

  if (!searchBtn || !navSearch || !searchInput) return;

  function openSearch() {
    navSearch.classList.add("open");
    navSearch.setAttribute("aria-hidden", "false");
    header?.classList.add("search-open");
    setTimeout(() => searchInput.focus(), 0);
  }

  function closeSearch() {
    navSearch.classList.remove("open");
    navSearch.setAttribute("aria-hidden", "true");
    header?.classList.remove("search-open");
    searchInput.blur();
  }

  searchBtn.addEventListener("click", (e) => {
    e.preventDefault();
    navSearch.classList.contains("open") ? closeSearch() : openSearch();
  });

  document.addEventListener("click", (e) => {
    if (!navSearch.classList.contains("open")) return;
    const inside = navSearch.contains(e.target) || searchBtn.contains(e.target);
    if (!inside) closeSearch();
  });
}

/* =============== Inicializar todo =============== */
document.addEventListener("DOMContentLoaded", () => {
  loadCatalogo();
  initSearch();
  initGenreMenu();
  initNavSearchToggle();
});
