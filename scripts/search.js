// scripts/search.js
const API_BASE = "http://localhost:3000/api/v1";

/* =============== Utils =============== */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* =============== NAV: Lupa + Search =============== */
function initNavSearch() {
  const searchBtn   = $("#searchBtn");
  const navSearch   = $("#navSearch");
  const searchInput = $("#searchInput");

  if (!searchBtn || !navSearch || !searchInput) return;

  const openSearch = () => {
    navSearch.classList.add("open");
    navSearch.setAttribute("aria-hidden", "false");
    // foco en el siguiente tick para asegurar render
    setTimeout(() => searchInput.focus(), 0);
  };

  const closeSearch = () => {
    navSearch.classList.remove("open");
    navSearch.setAttribute("aria-hidden", "true");
    searchInput.blur();
  };

  // Toggle con la lupa
  searchBtn.addEventListener("click", (e) => {
    e.preventDefault();
    navSearch.classList.contains("open") ? closeSearch() : openSearch();
  });

  // Cerrar con click fuera
  document.addEventListener("click", (e) => {
    const hit = navSearch.contains(e.target) || searchBtn.contains(e.target);
    if (!hit) closeSearch();
  });

  // Cerrar con Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSearch();
  });

  // Submit: redirige a la misma página con ?q=
  navSearch.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = (searchInput.value || "").trim();
    if (!q) { closeSearch(); return; }
    const url = new URL(window.location.href);
    url.searchParams.set("q", q);
    window.location.href = url.toString();
  });

  // Si ya hay ?q= en la URL, lo ponemos en el input (opcional abrirlo)
  const paramsQ = new URLSearchParams(window.location.search).get("q");
  if (paramsQ) {
    searchInput.value = paramsQ;
    // Si quieres verlo abierto por defecto, descomenta:
    // openSearch();
  }
}

/* =============== Render resultados =============== */
function renderCards(container, items) {
  container.innerHTML = "";
  items.forEach((it) => {
    const poster = it.poster || it.poster_path || "../storage/poster2.jpg";
    const title  = it.title_es || it.title || it.name || "Sin título";
    const genres = Array.isArray(it.genres) ? it.genres.join(" • ") : (it.genres || "");

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card__poster">
        <img src="${poster}" alt="${title}" loading="lazy">
      </div>
      <h3 class="card__title">${title}</h3>
      <p class="card__meta">${genres}</p>
    `;
    container.appendChild(card);
  });
}

/* =============== Cargar búsqueda =============== */
async function loadSearchResults() {
  const container = $("#searchResults");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const q = params.get("q");

  if (!q) {
    container.innerHTML = `<p style="color:#ccc;padding:20px;">Escribe algo en la búsqueda para comenzar.</p>`;
    return;
  }

  try {
    const res  = await fetch(`${API_BASE}/catalogo/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = `<p style="color:#ccc;padding:20px;">No se encontraron resultados para <strong>${q}</strong>.</p>`;
      return;
    }

    renderCards(container, data);
  } catch (err) {
    console.error("❌ Error en búsqueda:", err);
    container.innerHTML = `<p style="color:#ff8a8a;padding:20px;">Ocurrió un error cargando los resultados.</p>`;
  }
}

/* =============== Init =============== */
document.addEventListener("DOMContentLoaded", () => {
  initNavSearch();
  loadSearchResults();
});
