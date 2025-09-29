// =======================
// Admin (usa /api/v1/* existentes)
// =======================

// ------- Config -------
const HTML_BASE = "/html"; // dónde viven home.html, admin.html, etc.
const API = {
  BASE_URL: (localStorage.getItem("KARENFLIX_API") || "http://localhost:3000/api/v1").replace(/\/$/, ""),
  paths: {
    users: "/users",
    titles: "/catalogo",
    reviews: "/reviews",
  }
};

// ------- Helpers UI (defínelos ANTES de las vistas) -------
function KPI(label, val, tone){
  return `<div class="card kpi">
    <div>
      <h3>${escapeHtml(label)}</h3>
      <div class="val">${Number.isFinite(val) ? val : "-"}</div>
    </div>
    <span class="status ${tone||'approved'}">${tone||'ok'}</span>
  </div>`;
}
function Icon(name){
  const map = {
    grid: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" stroke="currentColor"/><rect x="14" y="3" width="7" height="7" stroke="currentColor"/><rect x="3" y="14" width="7" height="7" stroke="currentColor"/><rect x="14" y="14" width="7" height="7" stroke="currentColor"/></svg>',
    users:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M16 18c0-2.21-3.582-3-6-3s-6 .79-6 3" stroke="currentColor"/><circle cx="10" cy="8" r="3.5" stroke="currentColor"/></svg>',
    film: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor"/><path d="M8 5v14M16 5v14M4 9h4M4 15h4M16 9h4M16 15h4" stroke="currentColor"/></svg>',
    star: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 4l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 10l5.8-.8L12 4z" stroke="currentColor"/></svg>'
  };
  return map[name] || '';
}
function escapeHtml(str){
  return String(str).replace(/[&<>\"']/g, s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s]));
}
function formatDate(d){
  if(!d) return "";
  try { return new Date(d).toLocaleString(); } catch { return String(d); }
}

// ------- Auth -------
const Auth = {
  getToken(){ return localStorage.getItem("token"); },
  getUser(){ try { return JSON.parse(localStorage.getItem("user")||"null"); } catch { return null } },
  clear(){ localStorage.removeItem("token"); localStorage.removeItem("user"); },
  isAdmin(){
    const t = this.getToken();
    const u = this.getUser();
    return !!t && u && String(u.role||"").toLowerCase()==="admin";
  }
};

// ------- HTTP -------
async function http(path, opts = {}) {
  const url = API.BASE_URL + path;
  const token = localStorage.getItem("token") || "";
  if (!token) console.warn("[admin] NO hay token en localStorage para", location.origin);

  const res = await fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token,
      ...(opts.headers || {})
    }
  });

  if (!res.ok) {
    let msg = "";
    try { const j = await res.json(); msg = j?.message || j?.error || ""; }
    catch { msg = await res.text().catch(()=> ""); }
    throw new Error(`HTTP ${res.status} ${url}${msg ? " – " + msg : ""}`);
  }
  if (res.status === 204) return null;
  return res.json();
}


// ------- Nav -------
const Routes = [
  { path: "#/admin",        label:"Dashboard",  icon:"grid",  view: Dashboard },
  { path: "#/admin/users",  label:"Usuarios",   icon:"users", view: Users },
  { path: "#/admin/titles", label:"Títulos",    icon:"film",  view: Titles },
  { path: "#/admin/reviews",label:"Reseñas",    icon:"star",  view: Reviews },
];

function ensureNavContainer(){
  let nav = document.getElementById("nav");
  if (!nav) {
    const header = document.querySelector(".admin-header") || document.body;
    nav = document.createElement("nav");
    nav.id = "nav";
    nav.className = "nav";
    header.insertBefore(nav, header.querySelector(".spacer") || null);
  }
  return nav;
}
function mountNav(){
  const nav = ensureNavContainer();
  nav.innerHTML = `
    <small>General</small>
    ${Routes.map(r=>`<a href="${r.path}" data-path="${r.path}">${Icon(r.icon)} ${r.label}</a>`).join("")}
  `;
  setActiveLink();
}
function setActiveLink(){
  const now = location.hash || "#/admin";
  document.querySelectorAll(".nav a").forEach(a=>{
    a.classList.toggle("active", a.getAttribute("href")===now);
  });
}
window.addEventListener("hashchange", ()=>{ setActiveLink(); Router(); });

// ------- Vistas -------
async function Dashboard(){
  const [usersRes, titlesRes, reviewsRes] = await Promise.allSettled([
    http(API.paths.users),
    http(API.paths.titles),
    http(API.paths.reviews)
  ]);

  const countFrom = (s) => {
    if (s.status !== "fulfilled" || !s.value) return 0;
    const v = s.value;
    if (Array.isArray(v)) return v.length;
    if (Array.isArray(v.items)) return v.items.length;
    if (typeof v.total === "number") return v.total;
    return 0;
  };

  const users   = countFrom(usersRes);
  const titles  = countFrom(titlesRes);
  const reviews = countFrom(reviewsRes);
  const pending = 0;

  return `
    <section class="grid">
      <div class="cards">
        ${KPI("Usuarios",   users)}
        ${KPI("Títulos",    titles)}
        ${KPI("Pendientes", pending, 'pending')}
        ${KPI("Reseñas",    reviews)}
      </div>
      <div class="card">
        <div class="toolbar">
          <strong>Actividad reciente</strong>
          <span class="pill">cliente</span>
        </div>
        <div class="muted">Sin endpoint de logs configurado.</div>
      </div>
    </section>
  `;
}

async function Users(){
  const data = await http(API.paths.users);
  const list = Array.isArray(data) ? data : (data.users || data.items || []);

  if (!Array.isArray(list)) {
    return `<div class="card"><h3>Usuarios</h3><pre>${escapeHtml(JSON.stringify(data,null,2))}</pre></div>`;
  }

  const rows = list.map(u=>`
    <tr>
      <td>${escapeHtml(u.email || u.username || "")}</td>
      <td><span class="pill">${escapeHtml((u.role||"user"))}</span></td>
      <td>${u.banned ? '<span class="status rejected">baneado</span>' : '<span class="status approved">ok</span>'}</td>
      <td>${formatDate(u.createdAt)}</td>
      <td style="text-align:right">
        ${(u._id || u.id) ? `<button class="btn" onclick="openUser('${u._id || u.id}')">Editar</button>` : ""}
      </td>
    </tr>
  `).join("");

  return `
    <section class="grid">
      <div class="toolbar">
        <input class="input" placeholder="Buscar email…" oninput="filterUsers(this.value)"/>
      </div>
      <div class="card">
        <table>
          <thead><tr><th>Email</th><th>Rol</th><th>Estado</th><th>Alta</th><th></th></tr></thead>
          <tbody id="userRows">${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

async function Titles(){
  const data = await http(API.paths.titles);
  const list = Array.isArray(data) ? data : (data.items || data.results || []);
  if (!Array.isArray(list)) {
    return `<div class="card"><h3>Títulos</h3><pre>${escapeHtml(JSON.stringify(data,null,2))}</pre></div>`;
  }
  const rows = list.map(t=>`
    <tr>
      <td>${escapeHtml(t.title || t.name || t.titulo || "")}</td>
      <td>${t.year || t.anio || ""}</td>
      <td><span class="pill">${escapeHtml(t.category || t.categoria || "-")}</span></td>
      <td><span class="status ${t.status||'approved'}">${escapeHtml(t.status||'ok')}</span></td>
      <td style="text-align:right">
        ${(t._id||t.id) ? `<button class="btn" onclick="editTitle('${t._id || t.id}')">Editar</button>` : ""}
      </td>
    </tr>
  `).join("");

  return `
    <section class="grid">
      <div class="toolbar">
        <div class="muted">Filtrado básico</div>
      </div>
      <div class="card">
        <table>
          <thead><tr><th>Título</th><th>Año</th><th>Categoría</th><th>Estado</th><th></th></tr></thead>
          <tbody id="titleRows">${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

async function Reviews(){
  const data = await http(API.paths.reviews);
  const list = Array.isArray(data) ? data : (data.items || []);
  const rows = list.map(r=>`
    <tr>
      <td>${escapeHtml(r.titleId || r.title || "-")}</td>
      <td>${r.score || r.rating || "-"}</td>
      <td>${escapeHtml(r.comment || r.text || "")}</td>
      <td>${formatDate(r.createdAt)}</td>
      <td style="text-align:right">
        ${(r._id||r.id) ? `<button class="btn" onclick="deleteReview('${r._id || r.id}')">Eliminar</button>` : ""}
      </td>
    </tr>
  `).join("");

  return `
    <section class="grid">
      <div class="card">
        <table>
          <thead><tr><th>Título</th><th>Score</th><th>Comentario</th><th>Fecha</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

// ------- Acciones mínimas -------
window.filterUsers = function(q){
  const rows = document.querySelectorAll('#userRows tr');
  rows.forEach(tr=>{
    tr.style.display = tr.firstElementChild.textContent.toLowerCase().includes(q.toLowerCase())? "" : "none";
  });
};
window.deleteReview = async function(id){
  if(!id) return;
  if(!confirm('¿Eliminar reseña?')) return;
  await http(`${API.paths.reviews}/${id}`, { method:'DELETE' });
  Router();
};
window.openUser = async function(id){
  const data = await http(API.paths.users);
  const list = Array.isArray(data) ? data : (data.items || []);
  const u = list.find(x=>(x._id||x.id)===id);
  if(!u) return;
  openModal("Editar usuario", `
    <div class="row">
      <div class="col">
        <label>Email</label>
        <input class="input" id="uEmail" value="${escapeHtml(u.email||'')}" disabled/>
      </div>
      <div class="col">
        <label>Rol</label>
        <select id="uRole">
          <option ${u.role==='user'?'selected':''}>user</option>
          <option ${u.role==='admin'?'selected':''}>admin</option>
        </select>
      </div>
    </div>
    <div class="row" style="margin-top:8px">
      <div class="col">
        <label>Estado</label>
        <select id="uBanned">
          <option value="false" ${!u.banned?'selected':''}>Activo</option>
          <option value="true"  ${u.banned?'selected':''}>Baneado</option>
        </select>
      </div>
    </div>
  `,
  `<button class="btn btn--ghost" onclick="closeModal()">Cancelar</button>
   <button class="btn btn--accent" onclick="saveUser('${id}')">Guardar</button>`);
};
window.saveUser = async function(id){
  const role = document.getElementById('uRole').value;
  const banned = document.getElementById('uBanned').value === 'true';
  try{
    await http(`/users/${id}`, { method:'PATCH', body: JSON.stringify({role,banned}) });
    closeModal(); Router();
  }catch(e){
    alert("No se pudo actualizar el usuario: " + e.message);
  }
};

// ------- Modal -------
const modal       = document.getElementById('modal');
const modalBody   = document.getElementById('modalBody');
const modalTitle  = document.getElementById('modalTitle');
const modalFooter = document.getElementById('modalFooter');
document.getElementById('closeModal')?.addEventListener("click", closeModal);

function openModal(title, body, footer){
  if(!modal) return;
  if (modalTitle)  modalTitle.textContent = title;
  if (modalBody)   modalBody.innerHTML = body;
  if (modalFooter) modalFooter.innerHTML = footer || '';
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
}
function closeModal(){
  if(!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
}

// ------- UI global -------
document.getElementById('logout')?.addEventListener("click", () => {
  Auth.clear();
  window.location.replace(`/index.html`);
});
const rolePill = document.getElementById('role-pill');
if(rolePill) rolePill.textContent = 'rol: ' + (Auth.getUser()?.role || '-');

// ------- Router principal -------
async function Router(){
  const el = document.getElementById("view") || document.body;
  if (!Auth.isAdmin()){
    el.innerHTML = `
      <div class="card">
        <h2>Necesitas iniciar sesión</h2>
        <p class="muted">Abre <code>/index.html</code>, inicia sesión como <strong>admin</strong> y vuelve a <code>/html/admin.html</code>.</p>
      </div>`;
    return;
  }
  const hash = location.hash || "#/admin";
  const route = Routes.find(r=>r.path===hash) || Routes[0];
  try{
    el.innerHTML = await route.view();
    route.afterMount && route.afterMount();
    setActiveLink();
  }catch(err){
    el.innerHTML = `<div class="card"><h3>Error</h3><p style="color:#ff9b9b">${escapeHtml(String(err.message||err))}</p></div>`;
  }
}

// ------- Boot -------
function startAdmin(){
  ensureNavContainer();
  mountNav();
  if (!location.hash) location.hash = "#/admin";
  Router();
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startAdmin);
} else {
  startAdmin();
}
