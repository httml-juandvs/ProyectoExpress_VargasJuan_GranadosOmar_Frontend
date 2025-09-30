const API_BASE = "http://localhost:3000/api/v1";
const REVIEWS_PATH = "/reviews";

/* =============== Utils =============== */
const $  = (sel, root = document) => root.querySelector(sel);
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
function renderStars(v) {
  const n = Math.round(Number(v) / 2);
  return "★".repeat(n) + "☆".repeat(5 - n);
}
function getAuth() {
  try { return JSON.parse(localStorage.getItem("auth")) || null; }
  catch { return null; }
}
function authHeaders() {
  const a = getAuth();
  return a?.token ? { "Authorization": `Bearer ${a.token}` } : {};
}

/* =============== NAV: Lupa + Search =============== */
function initNavSearch() {
  const searchBtn   = $("#searchBtn");
  const navSearch   = $("#navSearch");
  const searchInput = $("#searchInput");
  if (!searchBtn || !navSearch || !searchInput) return;

  const openSearch = () => {
    navSearch.classList.add("open");
    navSearch.setAttribute("aria-hidden", "false");
    setTimeout(() => searchInput.focus(), 0);
  };
  const closeSearch = () => {
    navSearch.classList.remove("open");
    navSearch.setAttribute("aria-hidden", "true");
    searchInput.blur();
  };

  searchBtn.addEventListener("click", (e) => {
    e.preventDefault();
    navSearch.classList.contains("open") ? closeSearch() : openSearch();
  });

  document.addEventListener("click", (e) => {
    const hit = navSearch.contains(e.target) || searchBtn.contains(e.target);
    if (!hit) closeSearch();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSearch();
  });

  navSearch.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = (searchInput.value || "").trim();
    if (!q) { closeSearch(); return; }
    const url = new URL(window.location.href);
    url.searchParams.set("q", q);
    url.searchParams.delete("genre");
    window.location.href = url.toString();
  });

  const paramsQ = new URLSearchParams(window.location.search).get("q");
  if (paramsQ) searchInput.value = paramsQ;
}

/* =============== Render resultados =============== */
function renderCards(container, items) {
  container.innerHTML = "";
  items.forEach((it) => {
    const poster = it.poster || "../storage/poster2.jpg";
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

    card.addEventListener("click", () => openModal(it));
    container.appendChild(card);
  });
}

/* =============== Modal =============== */
function openModal(item) {
  const modal     = $("#detailModal");
  const backdrop  = modal.querySelector(".modal-backdrop");
  const title     = modal.querySelector("#modalTitle");
  const meta      = modal.querySelector("#modalMeta");
  const rating    = modal.querySelector("#modalRating");
  const desc      = modal.querySelector("#modalDesc");
  const posterEl  = modal.querySelector("#modalPoster");

  backdrop.style.backgroundImage = `url(${item.backdrop || item.poster || "../storage/poster2.jpg"})`;
  title.textContent = item.title_es || item.title || item.name || "Sin título";
  meta.textContent  = (item.genres || []).join(" • ");
  desc.textContent  = item.overview || "Sin descripción.";
  rating.innerHTML  = renderStars(item.vote_average || 0);
  posterEl.src      = item.poster || "../storage/poster2.jpg";

  const reviewsSection = modal.querySelector("#reviewsSection");
  reviewsSection.dataset.itemId = item._id || item.tmdb_id || "";
  setupReviewsUI(modal);

  modal.removeAttribute("hidden");
  modal.querySelector(".modal-close").onclick = () => closeModal();
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
  setupLikeDislike(modal, item._id || item.tmdb_id);
  document.addEventListener("keydown", escClose);
}
function closeModal() {
  const modal = $("#detailModal");
  if (!modal) return;
  teardownReviewsUI(modal);
  modal.setAttribute("hidden", "");
  document.removeEventListener("keydown", escClose);
}
function escClose(e) {
  if (e.key === "Escape") closeModal();
}

/* =============== Reseñas =============== */
let scoreCurrent = 0;

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

  if (!auth) {
    reviewText.disabled = true;
    submitBtn.disabled = true;
    statusHint.textContent = "Inicia sesión para escribir una reseña.";
  } else {
    reviewText.disabled = false;
    submitBtn.disabled = false;
    statusHint.textContent = "";
  }

  // ⭐ click estrellas
  function onStarClick(e) {
    const btn = e.target.closest("button[data-score]");
    if (!btn) return;
    scoreCurrent = Number(btn.dataset.score) || 0;
    [...ratingStars.querySelectorAll("button")].forEach(b => {
      b.classList.toggle("active", Number(b.dataset.score) <= scoreCurrent);
    });
  }
  ratingStars.addEventListener("click", onStarClick);
  ratingStars._handler = onStarClick;

  async function onSubmit(e) {
  e.preventDefault();
  if (!auth) return;

  const itemId = reviewsSection.dataset.itemId;
  const text = reviewText.value.trim();
  if (!scoreCurrent || !text) {
    statusHint.textContent = "Calificación y texto son obligatorios.";
    return;
  }
  submitBtn.disabled = true;
  statusHint.textContent = "Enviando…";

  const body = { 
    movieId: itemId, 
    title: modalRoot.querySelector("#modalTitle")?.textContent || "",
    comment: text, 
    rating: scoreCurrent 
  };

  const isEdit = !!reviewIdInp.value;
  const url = isEdit
    ? `${API_BASE}${REVIEWS_PATH}/${encodeURIComponent(reviewIdInp.value)}`
    : `${API_BASE}${REVIEWS_PATH}`;
  const method = isEdit ? "PATCH" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    reviewIdInp.value = "";
    cancelBtn.hidden = true;
    submitBtn.textContent = "Enviar reseña";
    statusHint.textContent = "¡Reseña enviada!";
    scoreCurrent = 0;
    [...ratingStars.querySelectorAll("button")].forEach(b => b.classList.remove("active"));
    reviewText.value = "";
    await loadReviews(itemId, reviewsList);
  } catch (err) {
    console.error("❌ Error al enviar reseña:", err);
    statusHint.textContent = "Error al enviar la reseña.";
  } finally {
    submitBtn.disabled = false;
  }
}

  reviewForm.addEventListener("submit", onSubmit);
  reviewForm._submitHandler = onSubmit;

  // ❌ cancelar edición
  function onCancelEdit() {
    reviewIdInp.value = "";
    cancelBtn.hidden = true;
    submitBtn.textContent = "Enviar reseña";
    reviewText.value = "";
    scoreCurrent = 0;
    [...ratingStars.querySelectorAll("button")].forEach(b => b.classList.remove("active"));
    statusHint.textContent = "";
  }
  cancelBtn.addEventListener("click", onCancelEdit);
  cancelBtn._handler = onCancelEdit;

  loadReviews(reviewsSection.dataset.itemId, reviewsList, { onEdit, onDelete });

  function onEdit(review) {
    if (!auth || auth.user?.id !== review.userId) return;
    reviewIdInp.value = review.id;
    reviewText.value = review.comment || "";
    scoreCurrent = Number(review.score) || 0;
    [...ratingStars.querySelectorAll("button")].forEach(b => {
      b.classList.toggle("active", Number(b.dataset.score) <= scoreCurrent);
    });
    cancelBtn.hidden = false;
    submitBtn.textContent = "Guardar cambios";
  }

  async function onDelete(review) {
    if (!auth || auth.user?.id !== review.userId) return;
    if (!confirm("¿Eliminar tu reseña?")) return;
    try {
      const res = await fetch(`${API_BASE}${REVIEWS_PATH}/${encodeURIComponent(review.id)}`, {
        method: "DELETE", headers: { ...authHeaders() }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadReviews(reviewsSection.dataset.itemId, reviewsList, { onEdit, onDelete });
      if ($("#reviewId").value === review.id) cancelBtn.click();
    } catch {
      alert("Error eliminando reseña.");
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

async function loadReviews(itemId, listEl, handlers = {}) {
  try {
    const res = await fetch(`${API_BASE}${REVIEWS_PATH}/by-title/${encodeURIComponent(itemId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { items } = await res.json();
    renderReviews(listEl, items, handlers, getAuth());
  } catch {
    listEl.innerHTML = `<li class="muted">No se pudieron cargar las reseñas.</li>`;
  }
}

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
        <span class="review-card__rating">${"★".repeat(r.score || 0)}${"☆".repeat(Math.max(0, 5 - (r.score || 0)))}</span>
      </div>
      <p class="review-card__text">${escapeHtml(r.comment || "")}</p>
      <div class="review-card__actions">
        ${auth && auth.user?.id === r.userId ? `
          <button class="link" data-action="edit">Editar</button>
          <button class="link" data-action="delete">Eliminar</button>
        ` : ``}
      </div>
    `;
    if (auth && auth.user?.id === r.userId) {
      li.querySelector('[data-action="edit"]')?.addEventListener("click", () => onEdit?.(r));
      li.querySelector('[data-action="delete"]')?.addEventListener("click", () => onDelete?.(r));
    }
    listEl.appendChild(li);
  }
}

/* =============== Search =============== */
async function loadSearchResults() {
  const container = $("#searchResults");
  if (!container) return;
  const params = new URLSearchParams(window.location.search);
  const q     = params.get("q");
  const genre = params.get("genre");
  if (!q && !genre) {
    container.innerHTML = `<p style="color:#ccc;padding:20px;">Escribe algo en la búsqueda o selecciona un género.</p>`;
    return;
  }
  try {
    let data = [];
    if (q) {
      const res = await fetch(`${API_BASE}/catalogo/search?q=${encodeURIComponent(q)}`);
      data = await res.json();
      $(".row-title").textContent = `Resultados para "${q}"`;
    }
    if (genre) {
      const res = await fetch(`${API_BASE}/catalogo/genre/${encodeURIComponent(genre)}`);
      data = await res.json();
      $(".row-title").textContent = `Género: ${genre}`;
    }
    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = `<p style="color:#ccc;padding:20px;">No se encontraron resultados.</p>`;
      return;
    }
    renderCards(container, data);
    initRow(document.querySelector(".search-page .row"));
  } catch {
    container.innerHTML = `<p style="color:#ff8a8a;padding:20px;">Ocurrió un error cargando los resultados.</p>`;
  }
}

/* =============== Likes/Dislikes =============== */
function setupLikeDislike(modalRoot, itemId) {
  const likeBtn = modalRoot.querySelector("#likeBtn");
  const dislikeBtn = modalRoot.querySelector("#dislikeBtn");
  const auth = getAuth();

  if (!auth) {
    likeBtn.disabled = true;
    dislikeBtn.disabled = true;
    return;
  }

  async function sendAction(action) {
    try {
      const res = await fetch(`${API_BASE}/catalogo/${itemId}/like`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({ action })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      likeBtn.classList.toggle("active", action === "like");
      dislikeBtn.classList.toggle("active", action === "dislike");

      console.log("✅ Likes:", data.likes, "Dislikes:", data.dislikes);
    } catch (err) {
      console.error("❌ Error guardando like/dislike:", err);
    }
  }

  likeBtn.onclick = () => sendAction(
    likeBtn.classList.contains("active") ? "none" : "like"
  );
  dislikeBtn.onclick = () => sendAction(
    dislikeBtn.classList.contains("active") ? "none" : "dislike"
  );
}

/* =============== Rows scroll =============== */
function initRow(section) {
  const track = section.querySelector(".row-track");
  const prev = section.querySelector(".row-nav.prev");
  const next = section.querySelector(".row-nav.next");
  if (!track) return;
  const cards = [...track.children];
  if (!cards.length) return;
  const cardW = cards[0].offsetWidth + 18;
  let index = 0;
  track.scrollLeft = 0;
  function goTo(i) {
    index = i;
    track.scrollTo({ left: cardW * index, behavior: "smooth" });
  }
  prev?.addEventListener("click", () => { if (index > 0) goTo(index - 1); });
  next?.addEventListener("click", () => { if (index < cards.length - 1) goTo(index + 1); });
}

/* =============== Init =============== */
document.addEventListener("DOMContentLoaded", () => {
  initNavSearch();
  loadSearchResults();
});
