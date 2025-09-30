const API_BASE = "http://localhost:3000/api/v1";
const REVIEWS_URL = `${API_BASE}/reviews`;
const PROFILE_URL = `${API_BASE}/auth/profile`;
const PASSWORD_URL = `${API_BASE}/auth/password`;

/* ====================== Helpers ====================== */
function getAuth() {
  try {
    return JSON.parse(localStorage.getItem("auth")) || null;
  } catch {
    return null;
  }
}
function authHeaders() {
  const a = getAuth();
  return a?.token ? { "Authorization": `Bearer ${a.token}` } : {};
}

/* ====================== Perfil ====================== */
async function loadProfile() {
  const auth = getAuth();
  const nameEl = document.getElementById("profileName");
  const emailEl = document.getElementById("profileEmail");
  const avatarEl = document.getElementById("profileAvatar");

  if (!auth) {
    nameEl.textContent = "Invitado";
    emailEl.textContent = "Inicia sesión para ver tu perfil";
    avatarEl.src = "../storage/iconamoon_profile-thin.png";
    return;
  }

  const user = auth.user || auth;
  nameEl.textContent = user.name || user.username || "Usuario";
  emailEl.textContent = user.email || "";
  avatarEl.src = "../storage/iconamoon_profile-thin.png";
}

/* ====================== Reseñas ====================== */
async function loadUserReviews() {
  const auth = getAuth();
  const list = document.getElementById("userReviewsList");

  if (!auth) {
    list.innerHTML = `<li class="muted">Debes iniciar sesión para ver tus reseñas.</li>`;
    return;
  }

  try {
    const res = await fetch(`${REVIEWS_URL}/me`, {
      headers: { "Accept": "application/json", ...authHeaders() }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const reviews = Array.isArray(data.items) ? data.items : [];

    if (!reviews.length) {
      list.innerHTML = `<li class="muted">Aún no has escrito reseñas.</li>`;
      return;
    }

    list.innerHTML = "";
    reviews.forEach(r => {
      const li = document.createElement("li");
      li.className = "review-card";
      li.innerHTML = `
        <div class="review-card__head">
          <span class="review-card__user">${r.userName || "Yo"}</span>
          <span class="review-card__rating">
            ${"★".repeat(r.score || 0)}${"☆".repeat(Math.max(0, 5 - (r.score || 0)))}
          </span>
        </div>
        <p class="review-card__text">${r.comment || ""}</p>
        <small class="muted">${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</small>
      `;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("Error cargando reseñas:", err);
    list.innerHTML = `<li class="muted">No se pudieron cargar reseñas.</li>`;
  }
}

/* ====================== Configuración ====================== */
function initProfileSettings() {
  // Asegura que arranquen ocultos y aria-expanded="false"
  document.querySelectorAll(".btn-toggle").forEach(btn => {
    const target = document.querySelector(btn.dataset.target);
    if (!target) return;
    target.classList.add("hidden");
    btn.setAttribute("aria-expanded", "false");

    btn.addEventListener("click", () => {
      const isOpen = !target.classList.contains("hidden");
      target.classList.toggle("hidden", isOpen);
      btn.setAttribute("aria-expanded", String(!isOpen));
    });
  });

  // === Form usuario ===
  document.getElementById("formUsername")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newUsername = document.getElementById("newUsername").value.trim();
    const password = document.getElementById("passForUsername").value;
    const alert = document.getElementById("alertUsername");

    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ newName: newUsername, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");

      alert.textContent = "Usuario actualizado";
      alert.classList.add("success");
      const auth = getAuth();
      if (auth?.user && newUsername) {
        auth.user.name = newUsername;
        localStorage.setItem("auth", JSON.stringify(auth));
      }
      loadProfile();
    } catch (err) {
      alert.textContent = err.message;
      alert.classList.remove("success");
    }
  });

  // === Form correo ===
  document.getElementById("formEmail")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newEmail = document.getElementById("newEmail").value.trim();
    const password = document.getElementById("passForEmail").value;
    const alert = document.getElementById("alertEmail");

    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ newEmail, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");

      alert.textContent = "Correo actualizado";
      alert.classList.add("success");
      const auth = getAuth();
      if (auth?.user && newEmail) {
        auth.user.email = newEmail;
        localStorage.setItem("auth", JSON.stringify(auth));
      }
      loadProfile();
    } catch (err) {
      alert.textContent = err.message;
      alert.classList.remove("success");
    }
  });

  // === Form contraseña ===
  document.getElementById("formPassword")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const current = document.getElementById("currentPassword").value;
    const newPass = document.getElementById("newPassword").value;
    const confirm = document.getElementById("confirmPassword").value;
    const alert = document.getElementById("alertPassword");

    if (newPass !== confirm) {
      alert.textContent = "Las contraseñas no coinciden";
      alert.classList.remove("success");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ currentPassword: current, newPassword: newPass })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");

      alert.textContent = "Contraseña actualizada";
      alert.classList.add("success");
    } catch (err) {
      alert.textContent = err.message;
      alert.classList.remove("success");
    }
  });
}


/* ====================== Init ====================== */
document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
  loadUserReviews();
  initProfileSettings();
});
