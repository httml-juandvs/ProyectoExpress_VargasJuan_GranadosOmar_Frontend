const API_BASE = "http://localhost:3000/api/v1";

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
    const title = it.title_es || it.title || "Sin título";

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
        <div class="card__poster">
          <img src="${poster}" alt="${title}" loading="lazy">
        </div>
        <h3 class="card__title">${title}</h3>
        <p class="card__meta">${(it.genres || []).join(" • ")}</p>
      `;

    // ➕ Guarda datos en data-* (los clones conservarán esto)
    card.dataset.titleEs = it.title_es || "";
    card.dataset.title = it.title || "";
    card.dataset.name = it.name || "";
    card.dataset.poster = it.poster || "";
    card.dataset.backdrop = it.backdrop || "";
    card.dataset.overview = it.overview || "";
    card.dataset.vote = String(it.vote_average || 0);
    card.dataset.genres = (it.genres || []).join("|");

    // click en el original (por si ves originales, no clones)
    card.addEventListener("click", (ev) => {
      ev.stopPropagation();                 // evita duplicado con la delegación
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
  const dots = container.querySelector(".hero-dots");

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
    dot.setAttribute("aria-label", `Ir al slide ${i + 1}`);
    dots.appendChild(dot);
  });

  // mini carrusel
  let index = 0;
  const slides = [...track.children];
  const navPrev = container.querySelector(".hero-nav.prev");
  const navNext = container.querySelector(".hero-nav.next");

  function show(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.querySelectorAll("button").forEach((d, k) => {
      d.classList.toggle("active", k === index);
    });
  }

  navPrev.addEventListener("click", (e) => {
    e.stopPropagation(); // ⬅️ evita abrir modal al dar flecha
    show(index - 1);
  });

  navNext.addEventListener("click", (e) => {
    e.stopPropagation();
    show(index + 1);
  });

  dots.querySelectorAll("button").forEach((d, i) =>
    d.addEventListener("click", (e) => {
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
  const prev = section.querySelector(".row-nav.prev");
  const next = section.querySelector(".row-nav.next");
  if (!track) return;

  if (!track._modalDelegated) {
    track.addEventListener("click", (e) => {
      const card = e.target.closest(".card");
      if (!card || !track.contains(card)) return;

      const item = {
        title_es: card.dataset.titleEs || undefined,
        title: card.dataset.title || undefined,
        name: card.dataset.name || undefined,
        poster: card.dataset.poster || undefined,
        backdrop: card.dataset.backdrop || undefined,
        overview: card.dataset.overview || undefined,
        vote_average: Number(card.dataset.vote || 0),
        genres: card.dataset.genres ? card.dataset.genres.split("|") : []
      };
      openModal(item);
    });
    track._modalDelegated = true; // evita duplicar el listener
  }

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
    renderHero(document.querySelector("#hero"), shuffled.slice(0, 3));

    // Últimos lanzamientos (por fecha)
    const ultimos = [...data]
      .sort((a, b) => new Date(b.release_date) - new Date(a.release_date))
      .slice(0, 10);
    renderCards(document.querySelector("#ultimos .row-track"), ultimos);
    initRow(document.querySelector("#ultimos"));

    // Más populares
    const populares = [...data]
      .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
      .slice(0, 10);
    renderCards(document.querySelector("#populares .row-track"), populares);
    initRow(document.querySelector("#populares"));

    // Mejor valoradas
    const mejor = [...data]
      .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
      .slice(0, 10);
    renderCards(document.querySelector("#mejor .row-track"), mejor);
    initRow(document.querySelector("#mejor"));

    // Películas (random)
    const pelis = data.filter(it => it.categoria === "movie").sort(() => Math.random() - 0.5).slice(0, 10);
    renderCards(document.querySelector("#peliculas .row-track"), pelis);
    initRow(document.querySelector("#peliculas"));

    // Series (random)
    const series = data.filter(it => it.categoria === "serie").sort(() => Math.random() - 0.5).slice(0, 10);
    renderCards(document.querySelector("#series .row-track"), series);
    initRow(document.querySelector("#series"));

    // Anime (random)
    const anime = data.filter(it => it.categoria === "anime").sort(() => Math.random() - 0.5).slice(0, 10);
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

/* ================= Config ================= */
// <- ajusta a tu backend
const REVIEWS_PATH = "/review";    // p.ej. "/reseñas" en tu server, aquí sin ñ para URL

/* =============== Auth helpers =============== */
function getAuth() {
  // Adapta a tu login real. Ejemplo: guarda { token, user: {id, name, isAdmin} }
  try { return JSON.parse(localStorage.getItem("auth")) || null; }
  catch { return null; }
}
function authHeaders() {
  const a = getAuth();
  return a?.token ? { "Authorization": `Bearer ${a.token}` } : {};
}

/* =============== Open / Close Modal =============== */
function openModal(item) {
  const modal = document.querySelector("#detailModal");
  const backdrop = modal.querySelector(".modal-backdrop");
  const title = modal.querySelector("#modalTitle");
  const meta = modal.querySelector("#modalMeta");
  const rating = modal.querySelector("#modalRating");
  const desc = modal.querySelector("#modalDesc");
  const posterEl = modal.querySelector("#modalPoster");

  // Fondo y texto
  backdrop.style.backgroundImage = `url(${item.backdrop || item.poster || "../storage/poster2.jpg"})`;
  const displayTitle = item.title_es || item.title || item.name || "Sin título";
  title.textContent = displayTitle;
  meta.textContent = (item.genres || []).join(" • ");
  desc.textContent = item.overview || "Sin descripción.";
  rating.innerHTML = renderStars(item.vote_average || 0);

  // Póster
  posterEl.src = item.poster || "../storage/poster2.jpg";
  posterEl.alt = `Póster de ${displayTitle}`;

  // Guardar id del item en la sección de reseñas
  //const reviewsSection = modal.querySelector("#reviewsSection");
  //reviewsSection.dataset.itemId = item.id || item._id || item.tmdb_id || displayTitle;

  // Preparar UI reseñas
  //setupReviewsUI(modal);

  // Mostrar modal
  modal.removeAttribute("hidden");
  modal.querySelector(".modal-close").onclick = () => closeModal();
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
  document.addEventListener("keydown", escClose);
}

function closeModal() {
  const modal = document.querySelector("#detailModal");
  if (!modal || modal.hasAttribute("hidden")) return;

  // Limpia listeners de reseñas para evitar duplicados
  //teardownReviewsUI(modal);

  modal.setAttribute("hidden", "");
  document.removeEventListener("keydown", escClose);
}
function escClose(e) {
  if (e.key === "Escape") closeModal();
}

/* =============== Reseñas: UI y lógica =============== 
let ratingCurrent = 0;

function setupReviewsUI(modalRoot) {
  const auth = getAuth();
  const reviewsSection = modalRoot.querySelector("#reviewsSection");
  const ratingStars = modalRoot.querySelector("#ratingStars");
  const reviewForm  = modalRoot.querySelector("#reviewForm");
  const reviewText  = modalRoot.querySelector("#reviewText");
  const reviewIdInp = modalRoot.querySelector("#reviewId");
  const submitBtn   = modalRoot.querySelector("#reviewSubmitBtn");
  const cancelBtn   = modalRoot.querySelector("#reviewCancelBtn");
  const statusHint  = modalRoot.querySelector("#reviewStatusHint");
  const reviewsList = modalRoot.querySelector("#reviewsList");

  // Si no hay login, deshabilita form
  if (!auth) {
    reviewText.disabled = true;
    submitBtn.disabled = true;
    statusHint.textContent = "Inicia sesión para escribir una reseña.";
  } else {
    reviewText.disabled = false;
    submitBtn.disabled = false;
    statusHint.textContent = "";
  }

  // Estrellas: click handler
  function onStarClick(e) {
    const btn = e.target.closest("button[data-score]");
    if (!btn) return;
    ratingCurrent = Number(btn.dataset.score) || 0;
    [...ratingStars.querySelectorAll("button")].forEach(b => {
      b.classList.toggle("active", Number(b.dataset.score) <= ratingCurrent);
    });
  }
  ratingStars.addEventListener("click", onStarClick);
  ratingStars._handler = onStarClick; // para teardown

  // Submit (crear/editar)
  async function onSubmit(e) {
    e.preventDefault();
    if (!auth) return;

    const itemId = reviewsSection.dataset.itemId;
    const text = reviewText.value.trim();
    if (!ratingCurrent || !text) {
      statusHint.textContent = "Calificación y texto son obligatorios.";
      return;
    }

    submitBtn.disabled = true;
    statusHint.textContent = "Enviando…";

    const body = {
      itemId,
      rating: ratingCurrent,
      text
    };

    const isEdit = !!reviewIdInp.value;
    const url = isEdit
      ? `${API_BASE}${REVIEWS_PATH}/${encodeURIComponent(reviewIdInp.value)}`
      : `${API_BASE}${REVIEWS_PATH}`;
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Limpia form y re-carga
      reviewIdInp.value = "";
      cancelBtn.hidden = true;
      submitBtn.textContent = "Enviar reseña";
      statusHint.textContent = "¡Reseña enviada para aprobación!";
      ratingCurrent = 0;
      [...ratingStars.querySelectorAll("button")].forEach(b => b.classList.remove("active"));
      reviewText.value = "";
      await loadReviews(itemId, reviewsList);
    } catch (err) {
      statusHint.textContent = "Error al enviar la reseña.";
      console.error(err);
    } finally {
      submitBtn.disabled = false;
    }
  }
  reviewForm.addEventListener("submit", onSubmit);
  reviewForm._submitHandler = onSubmit;

  // Cancelar edición
  function onCancelEdit() {
    reviewIdInp.value = "";
    cancelBtn.hidden = true;
    submitBtn.textContent = "Enviar reseña";
    reviewText.value = "";
    ratingCurrent = 0;
    [...ratingStars.querySelectorAll("button")].forEach(b => b.classList.remove("active"));
    statusHint.textContent = "";
  }
  cancelBtn.addEventListener("click", onCancelEdit);
  cancelBtn._handler = onCancelEdit;

  // Cargar reseñas visibles + de usuario
  const itemId = reviewsSection.dataset.itemId;
  loadReviews(itemId, reviewsList, { onEdit, onDelete });

  // Handlers para botones de cada tarjeta
  function onEdit(review) {
    // Solo permitir si es del usuario
    const auth = getAuth();
    if (!auth || auth.user?.id !== review.userId) return;

    // Prefill
    reviewIdInp.value = review.id;
    reviewText.value = review.text || "";
    ratingCurrent = Number(review.rating) || 0;
    [...ratingStars.querySelectorAll("button")].forEach(b => {
      b.classList.toggle("active", Number(b.dataset.score) <= ratingCurrent);
    });
    cancelBtn.hidden = false;
    submitBtn.textContent = "Guardar cambios";
    statusHint.textContent = review.status !== "approved"
      ? "Tu reseña está pendiente de aprobación."
      : "";
  }

  async function onDelete(review) {
    const auth = getAuth();
    if (!auth || auth.user?.id !== review.userId) return;
    if (!confirm("¿Eliminar tu reseña?")) return;

    try {
      const res = await fetch(`${API_BASE}${REVIEWS_PATH}/${encodeURIComponent(review.id)}`, {
        method: "DELETE",
        headers: { ...authHeaders() }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadReviews(itemId, reviewsList, { onEdit, onDelete });
      // Si estabas editando esa misma reseña, resetea form
      if (document.querySelector("#reviewId").value === review.id) {
        cancelBtn.click();
      }
    } catch (err) {
      alert("Error eliminando la reseña.");
      console.error(err);
    }
  }
}

function teardownReviewsUI(modalRoot) {
  const ratingStars = modalRoot.querySelector("#ratingStars");
  const reviewForm  = modalRoot.querySelector("#reviewForm");
  const cancelBtn   = modalRoot.querySelector("#reviewCancelBtn");

  if (ratingStars?._handler) {
    ratingStars.removeEventListener("click", ratingStars._handler);
    delete ratingStars._handler;
  }
  if (reviewForm?._submitHandler) {
    reviewForm.removeEventListener("submit", reviewForm._submitHandler);
    delete reviewForm._submitHandler;
  }
  if (cancelBtn?._handler) {
    cancelBtn.removeEventListener("click", cancelBtn._handler);
    delete cancelBtn._handler;
  }
}

/* =============== Carga / Render de reseñas =============== 
async function loadReviews(itemId, listEl, handlers = {}) {
  const auth = getAuth();
  const isAdmin = !!auth?.user?.isAdmin;

  try {
    const res = await fetch(`${API_BASE}${REVIEWS_PATH}?itemId=${encodeURIComponent(itemId)}`, {
      headers: { "Accept": "application/json", ...authHeaders() }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const all = await res.json(); // [{id,userId,userName,rating,text,status,createdAt},...]

    // 1) Las aprobadas se muestran siempre
    const approved = all.filter(r => r.status === "approved");

    // 2) Si el usuario tiene una reseña pendiente/rechazada, también la ve (con badge)
    const mineExtra = auth ? all.filter(r => r.userId === auth.user.id && r.status !== "approved") : [];

    // 3) Si es admin y estás en este UI, podría ver todas, pero:
    //    Mantendremos la vista pública + las suyas. El módulo admin aprueba.
    const visible = approved.concat(mineExtra)
      // quitar duplicados si el mismo id aparece en ambos arrays
      .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i)
      // ordenar por fecha desc si viene createdAt
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    renderReviews(listEl, visible, handlers, auth);
  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<li class="muted">No se pudieron cargar las reseñas.</li>`;
  }
}

/* =============== Dropdown =============== */

function renderReviews(listEl, reviews, { onEdit, onDelete }, auth) {
  if (!reviews?.length) {
    listEl.innerHTML = `<li class="muted">Sé el primero en reseñar.</li>`;
    return;
  }

  listEl.innerHTML = "";
  for (const r of reviews) {
    const li = document.createElement("li");
    li.className = "review-card";
    li.innerHTML = `
      <div class="review-card__head">
        <span class="review-card__user">${escapeHtml(r.userName || "Usuario")}</span>
        <span class="review-card__rating">${"★".repeat(r.rating || 0)}${"☆".repeat(Math.max(0, 5 - (r.rating || 0)))}</span>
      </div>
      <p class="review-card__text">${escapeHtml(r.text || "")}</p>
      ${renderStatusBadge(r.status)}
      <div class="review-card__actions">
        ${auth && auth.user?.id === r.userId ? `
          <button class="link" data-action="edit">Editar</button>
          <button class="link" data-action="delete">Eliminar</button>
        ` : ``}
      </div>
    `;

    if (auth && auth.user?.id === r.userId) {
      const editBtn = li.querySelector('[data-action="edit"]');
      const delBtn  = li.querySelector('[data-action="delete"]');
      editBtn?.addEventListener("click", () => onEdit?.(r));
      delBtn?.addEventListener("click", () => onDelete?.(r));
    }

    listEl.appendChild(li);
  }
}

function renderStatusBadge(status) {
  if (!status || status === "approved") return "";
  const map = {
    pending:  { cls: "badge badge--pending",  text: "Pendiente de aprobación" },
    rejected: { cls: "badge badge--rejected", text: "Rechazada" }
  };
  const v = map[status] || map.pending;
  return `<span class="${v.cls}">${v.text}</span>`;
}
async function initGenreDropdown() {
  const btn = document.getElementById("genreBtn");
  const menu = document.getElementById("genreMenu");
  if (!btn || !menu) return;

  try {
    // 🔥 consulta al backend
    const res = await fetch(`${API_BASE}/genres`);
    if (!res.ok) throw new Error("Error al cargar géneros");
    const genres = await res.json(); // asume [{_id,name}, ...]

    // genera los botones dinámicos
    menu.innerHTML = genres
      .map(g => `<button type="button" data-genre="${g.name}">${g.name}</button>`)
      .join("");

    // toggle abrir/cerrar
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!expanded));
      menu.hidden = expanded;
    });

    // click en un género → búsqueda
    menu.querySelectorAll("button").forEach(b => {
      b.addEventListener("click", async () => {
        const genre = b.dataset.genre;
        try {
          const res = await fetch(`${API_BASE}/catalogo/genre/${encodeURIComponent(genre)}`);
          const results = await res.json();
          localStorage.setItem("SEARCH_RESULTS", JSON.stringify(results));
          window.location.href = "./search.html?genre=" + encodeURIComponent(genre);
        } catch (err) {
          console.error("Error buscando por género:", err);
        }
      });
    });

    // cerrar al click fuera
    document.addEventListener("click", (e) => {
      if (!menu.hidden && !btn.contains(e.target) && !menu.contains(e.target)) {
        menu.hidden = true;
        btn.setAttribute("aria-expanded", "false");
      }
    });

  } catch (err) {
    console.error("Error cargando menú de géneros:", err);
    menu.innerHTML = `<p class="muted">No se pudieron cargar los géneros</p>`;
  }
}

/* =============== Modal Cuenta =============== */

function initAccountModal() {
  const modal = document.getElementById("accountModal");
  const closeBtn = modal?.querySelector(".modal-close");
  const accountBtn = document.querySelector('a[aria-label="Cuenta"]');

  if (!modal || !accountBtn) return;

  // Abrir modal al dar click en el icono de cuenta
  accountBtn.addEventListener("click", (e) => {
    e.preventDefault();
    modal.removeAttribute("hidden");
  });

  // Cerrar modal con el botón ✕
  closeBtn?.addEventListener("click", () => {
    modal.setAttribute("hidden", "");
  });

  // Cerrar modal si clicas fuera del contenido
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.setAttribute("hidden", "");
    }
  });

  // ==== Acciones de los botones ====
  document.getElementById("accountBtn")?.addEventListener("click", () => {
    window.location.href = "./account.html"; // o la ruta que uses
  });

  document.getElementById("supportBtn")?.addEventListener("click", () => {
    window.location.href = "./support.html"; // página de soporte
  });

  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    // Borrar auth del localStorage
    localStorage.removeItem("auth");

    // Redirigir al index
    window.location.href = "../index.html";
  });
}

/* =============== DOM =============== */
document.addEventListener("DOMContentLoaded", () => {
  loadCatalogo();
  initSearch();
  initGenreMenu();
  initNavSearchToggle();
  initGenreDropdown();

  // --- Like / Dislike handlers ---
  const likeBtn = document.getElementById("likeBtn");
  const dislikeBtn = document.getElementById("dislikeBtn");

  if (likeBtn && dislikeBtn) {
    likeBtn.addEventListener("click", () => {
      likeBtn.classList.toggle("active");
      dislikeBtn.classList.remove("active");
    });

    dislikeBtn.addEventListener("click", () => {
      dislikeBtn.classList.toggle("active");
      likeBtn.classList.remove("active");
    });
  }
});

// Inicializar junto a los otros módulos
document.addEventListener("DOMContentLoaded", () => {
  loadCatalogo();
  initSearch();
  initGenreMenu();
  initNavSearchToggle();
  initAccountModal(); // 👈 aquí
});

/* =============== Utilidades =============== */
function renderStars(v) {
  const n = Math.round(Number(v) / 2); // si vienes en /10 convierto a /5; ajusta si ya viene /5
  return "★".repeat(n) + "☆".repeat(5 - n);
}
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}



/* =============== Inicializar todo =============== */
document.addEventListener("DOMContentLoaded", () => {
  loadCatalogo();
  initSearch();
  initGenreMenu();
  initNavSearchToggle();
});
