// =======================
// Admin Frontend (Vanilla JS)
// SIN MOCK. Conecta a tu API real.
// =======================

const API = {
  BASE_URL: "http://localhost:3000/api", // <- cámbialo al deploy real
};

// ------- Auth mínima (usa localStorage) -------
const Auth = {
  getToken(){ return localStorage.getItem("token"); },
  getUser(){ try { return JSON.parse(localStorage.getItem("user")||"null"); } catch { return null } },
  setSession({token,user}){ localStorage.setItem("token", token); localStorage.setItem("user", JSON.stringify(user)); },
  clear(){ localStorage.removeItem("token"); localStorage.removeItem("user"); },
};

// (opcional) autologin dev: comenta esto en producción
if(!Auth.getToken()){
  // Deja vacío si no quieres autologin; aquí solo ayuda a ver el panel.
  // Auth.setSession({ token: "dev.jwt", user: { id:"u1", email:"admin@karenflix.dev", role:"admin" } });
}

// ------- HTTP real -------
async function http(path, opts={}){
  const res = await fetch(API.BASE_URL + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + (Auth.getToken() || ""),
      ...(opts.headers || {})
    }
  });
  if(!res.ok){
    const text = await res.text().catch(()=> "");
    throw new Error(`HTTP ${res.status} – ${text || res.statusText}`);
  }
  // algunos endpoints pueden responder 204
  if(res.status === 204) return null;
  return res.json();
}

// ------- Router & Nav -------
const Routes = [
  { path: "#/admin",           label:"Dashboard",  icon:"grid",    view: Dashboard },
  { path: "#/admin/users",     label:"Usuarios",   icon:"users",   view: Users },
  { path: "#/admin/categories",label:"Categorías", icon:"tags",    view: Categories },
  { path: "#/admin/titles",    label:"Títulos",    icon:"film",    view: Titles },
  { path: "#/admin/reviews",   label:"Reseñas",    icon:"star",    view: Reviews }
];

function mountNav(){
  const nav = document.getElementById("nav");
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

// ------- Router principal -------
async function Router(){
  if(!Auth.ensureAdmin()) return;
  const hash = location.hash || "#/admin";
  const route = Routes.find(r=>r.path===hash) || Routes[0];
  const el = document.getElementById("view");
  try{
    el.innerHTML = await route.view();
    route.afterMount && route.afterMount();
  }catch(err){
    el.innerHTML = Render.error(String(err.message || err));
  }
}

// ------- Views -------
async function Dashboard(){
  const m = await http("/admin/metrics");
  return `
    <section class="grid">
      <div class="cards">
        ${KPI("Usuarios",   m.users)}
        ${KPI("Títulos",    m.titles)}
        ${KPI("Pendientes", m.pending, 'pending')}
        ${KPI("Reseñas",    m.reviews)}
      </div>
      <div class="card">
        <div class="toolbar">
          <strong>Actividad reciente</strong>
          <span class="pill">últimas 24h</span>
        </div>
        ${await TableLogs()}
      </div>
    </section>
  `;
}

async function Users(){
  const res = await http("/admin/users");
  const rows = res.items.map(u=>`
    <tr>
      <td>${u.email}</td>
      <td><span class="pill">${u.role}</span></td>
      <td>${u.banned ? '<span class="status rejected">baneado</span>' : '<span class="status approved">ok</span>'}</td>
      <td>${formatDate(u.createdAt)}</td>
      <td style="text-align:right">
        <button class="btn" onclick="openUser('${u._id || u.id}')">Editar</button>
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

async function Categories(){
  const res = await http("/admin/categories");
  const rows = res.items.map(c=>`
    <tr>
      <td>${c.name}</td>
      <td><code>${c.slug}</code></td>
      <td style="text-align:right">
        <button class="btn" onclick="editCategory('${c._id || c.id}')">Editar</button>
        <button class="btn" onclick="removeCategory('${c._id || c.id}')">Eliminar</button>
      </td>
    </tr>
  `).join("");

  return `
    <section class="grid">
      <div class="toolbar">
        <button class="btn btn--accent" onclick="createCategory()">Nueva categoría</button>
      </div>
      <div class="card">
        <table>
          <thead><tr><th>Nombre</th><th>Slug</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

async function Titles(){
  const res  = await http("/admin/titles");
  const cats = (await http("/admin/categories")).items.reduce((acc,x)=>{acc[x._id||x.id]=x;return acc;}, {});
  const rows = res.items.map(t=>`
    <tr>
      <td>${t.title}</td>
      <td>${t.year || ""}</td>
      <td><span class="pill">${cats[t.categoryId]?.name || "-"}</span></td>
      <td><span class="status ${t.status}">${t.status}</span></td>
      <td style="text-align:right">
        <button class="btn" onclick="editTitle('${t._id || t.id}')">Editar</button>
        <button class="btn" onclick="approveTitle('${t._id || t.id}')">Aprobar</button>
        <button class="btn" onclick="rejectTitle('${t._id || t.id}')">Rechazar</button>
      </td>
    </tr>
  `).join("");

  return `
    <section class="grid">
      <div class="toolbar">
        <select id="filterStatus" onchange="filterTitles(this.value)">
          <option value="">Todos</option>
          <option value="pending">Pendientes</option>
          <option value="approved">Aprobados</option>
          <option value="rejected">Rechazados</option>
        </select>
        <button class="btn btn--accent" onclick="createTitle()">Nuevo título</button>
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
  const res = await http("/admin/reviews");
  const mapTitle = (await http("/admin/titles")).items.reduce((a,x)=>{a[x._id||x.id]=x.title;return a;}, {});
  const rows = res.items.map(r=>`
    <tr>
      <td>${mapTitle[r.titleId] || r.titleId}</td>
      <td>${r.score}</td>
      <td>${escapeHtml(r.comment)}</td>
      <td>👍 ${r.likes} / 👎 ${r.dislikes}</td>
      <td>${formatDate(r.createdAt)}</td>
      <td style="text-align:right"><button class="btn" onclick="deleteReview('${r._id || r.id}')">Eliminar</button></td>
    </tr>
  `).join("");

  return `
    <section class="grid">
      <div class="card">
        <table>
          <thead><tr><th>Título</th><th>Score</th><th>Comentario</th><th>Reacciones</th><th>Fecha</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

async function Settings(){
  return `
    <section class="grid">
      <div class="card">
        <div class="row">
          <div class="col">
            <label>API Base URL</label>
            <input class="input" id="apiBase" value="${API.BASE_URL}"/>
          </div>
          <div class="col">
            <label>Nota</label>
            <input class="input" value="Este panel usa API real (sin mock)" disabled/>
          </div>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px">
          <button class="btn btn--accent" onclick="saveSettings()">Guardar</button>
        </div>
      </div>
    </section>
  `;
}

async function Logs(){
  return `
    <section class="grid">
      <div class="card">
        ${await TableLogs()}
      </div>
    </section>
  `;
}

async function TableLogs(){
  const res = await http("/admin/logs");
  const rows = res.items.map(l=>`
    <tr>
      <td>${l.actor}</td>
      <td>${l.action}</td>
      <td>${l.target}</td>
      <td>${formatDate(l.at)}</td>
    </tr>
  `).join("");
  return `<table>
    <thead><tr><th>Actor</th><th>Acción</th><th>Target</th><th>Fecha</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// ------- Helpers UI -------
function KPI(label, val, tone){
  return `<div class="card kpi">
    <div>
      <h3>${label}</h3>
      <div class="val">${val}</div>
    </div>
    <span class="status ${tone||'approved'}">${tone||'ok'}</span>
  </div>`;
}
function Icon(name){
  const map = {
    grid: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" stroke="currentColor"/><rect x="14" y="3" width="7" height="7" stroke="currentColor"/><rect x="3" y="14" width="7" height="7" stroke="currentColor"/><rect x="14" y="14" width="7" height="7" stroke="currentColor"/></svg>',
    users:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M16 18c0-2.21-3.582-3-6-3s-6 .79-6 3" stroke="currentColor"/><circle cx="10" cy="8" r="3.5" stroke="currentColor"/></svg>',
    tags: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 13L12 21L3 12V3h9l8 10z" stroke="currentColor"/></svg>',
    film: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor"/><path d="M8 5v14M16 5v14M4 9h4M4 15h4M16 9h4M16 15h4" stroke="currentColor"/></svg>',
    star: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 4l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 10l5.8-.8L12 4z" stroke="currentColor"/></svg>',
    settings:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 8a4 4 0 100 8 4 4 0 000-8z" stroke="currentColor"/><path d="M19 12a7 7 0 01-.2 1.7l2.1 1.6-2 3.5-2.5-1a7.2 7.2 0 01-1.5.9l-.4 2.7H9.5l-.4-2.7a7.2 7.2 0 01-1.5-.9l-2.5 1-2-3.5 2.1-1.6A7 7 0 017 12c0-.6.1-1.1.2-1.7L5.1 8.7l2-3.5 2.5 1c.5-.3 1-.6 1.5-.9l.4-2.7h3.6l.4 2.7c.5.3 1 .6 1.5.9l2.5-1 2 3.5-2.1 1.6c.1.6.1 1.1.1 1.7z" stroke="currentColor"/></svg>',
    clock:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor"/><path d="M12 8v5l3 2" stroke="currentColor"/></svg>'
  };
  return map[name] || '';
}
function escapeHtml(str){
  return String(str).replace(/[&<>\"']/g, s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s]));
}
function formatDate(d){
  if(!d) return "";
  try{ return new Date(d).toLocaleString(); }catch{ return String(d); }
}

// ------- Actions (Users) -------
window.openUser = async function(id){
  const {items} = await http("/admin/users");
  const u = items.find(x=>(x._id||x.id)===id);
  openModal("Editar usuario", `
    <div class="row">
      <div class="col">
        <label>Email</label>
        <input class="input" id="uEmail" value="${u.email}" disabled/>
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
}
window.saveUser = async function(id){
  const role = document.getElementById('uRole').value;
  const banned = document.getElementById('uBanned').value === 'true';
  await http(`/admin/users/${id}`, { method:'PATCH', body: JSON.stringify({role,banned}) });
  closeModal(); Router();
}
window.filterUsers = function(q){
  const rows = document.querySelectorAll('#userRows tr');
  rows.forEach(tr=>{
    tr.style.display = tr.firstElementChild.textContent.toLowerCase().includes(q.toLowerCase())? "" : "none";
  });
}

// ------- Actions (Categories) -------
window.createCategory = function(){
  openModal("Nueva categoría", `
    <div class="row">
      <div class="col"><label>Nombre</label><input class="input" id="catName" placeholder="Ej. Superhéroes"/></div>
      <div class="col"><label>Slug</label><input class="input" id="catSlug" placeholder="superheroes"/></div>
    </div>
  `,
  `<button class="btn btn--ghost" onclick="closeModal()">Cancelar</button>
   <button class="btn btn--accent" onclick="saveCategory()">Crear</button>`);
}
window.saveCategory = async function(){
  const name = document.getElementById('catName').value.trim();
  const slug = document.getElementById('catSlug').value.trim();
  if(!name || !slug) return alert('Completa los campos');
  await http('/admin/categories', { method:'POST', body: JSON.stringify({name,slug})});
  closeModal(); Router();
}
window.editCategory = async function(id){
  const {items} = await http('/admin/categories');
  const c = items.find(x=>(x._id||x.id)===id);
  openModal("Editar categoría", `
    <div class="row">
      <div class="col"><label>Nombre</label><input class="input" id="catName" value="${c.name}"/></div>
      <div class="col"><label>Slug</label><input class="input" id="catSlug" value="${c.slug}"/></div>
    </div>
  `,
  `<button class="btn btn--ghost" onclick="closeModal()">Cancelar</button>
   <button class="btn btn--accent" onclick="updateCategory('${id}')">Guardar</button>`);
}
window.updateCategory = async function(id){
  const name = document.getElementById('catName').value.trim();
  const slug = document.getElementById('catSlug').value.trim();
  await http(`/admin/categories/${id}`, { method:'PUT', body: JSON.stringify({name,slug})});
  closeModal(); Router();
}
window.removeCategory = async function(id){
  if(!confirm('¿Eliminar categoría?')) return;
  await http(`/admin/categories/${id}`, { method:'DELETE' });
  Router();
}

// ------- Actions (Titles) -------
window.createTitle = async function(){
  const cats = (await http('/admin/categories')).items;
  openModal("Nuevo título", `
    <div class="row">
      <div class="col"><label>Título</label><input class="input" id="tTitle" placeholder="Ej. Dune"/></div>
      <div class="col"><label>Año</label><input class="input" id="tYear" type="number" placeholder="2024"/></div>
    </div>
    <div class="row" style="margin-top:8px">
      <div class="col"><label>Categoría</label>
        <select id="tCat">${cats.map(c=>`<option value="${c._id||c.id}">${c.name}</option>`).join("")}</select>
      </div>
      <div class="col"><label>Estado</label>
        <select id="tStatus"><option>draft</option><option>pending</option><option>approved</option></select>
      </div>
    </div>
  `,
  `<button class="btn btn--ghost" onclick="closeModal()">Cancelar</button>
   <button class="btn btn--accent" onclick="saveTitle()">Crear</button>`);
}
window.saveTitle = async function(){
  const title = document.getElementById('tTitle').value.trim();
  const year = +document.getElementById('tYear').value;
  const categoryId = document.getElementById('tCat').value;
  const status = document.getElementById('tStatus').value;
  if(!title) return alert('Título requerido');
  await http('/admin/titles', { method:'POST', body: JSON.stringify({title,year,categoryId,status})});
  closeModal(); Router();
}
window.editTitle = async function(id){
  const {items} = await http('/admin/titles');
  const t = items.find(x=>(x._id||x.id)===id);
  const cats = (await http('/admin/categories')).items;
  openModal("Editar título", `
    <div class="row">
      <div class="col"><label>Título</label><input class="input" id="tTitle" value="${t.title}"/></div>
      <div class="col"><label>Año</label><input class="input" id="tYear" type="number" value="${t.year||''}"/></div>
    </div>
    <div class="row" style="margin-top:8px">
      <div class="col"><label>Categoría</label>
        <select id="tCat">${cats.map(c=>`<option value="${c._id||c.id}" ${(t.categoryId===(c._id||c.id))?'selected':''}>${c.name}</option>`).join("")}</select>
      </div>
      <div class="col"><label>Estado</label>
        <select id="tStatus">
          <option ${t.status==='draft'?'selected':''}>draft</option>
          <option ${t.status==='pending'?'selected':''}>pending</option>
          <option ${t.status==='approved'?'selected':''}>approved</option>
          <option ${t.status==='rejected'?'selected':''}>rejected</option>
        </select>
      </div>
    </div>
  `,
  `<button class="btn btn--ghost" onclick="closeModal()">Cancelar</button>
   <button class="btn btn--accent" onclick="updateTitle('${id}')">Guardar</button>`);
}
window.updateTitle = async function(id){
  const title = document.getElementById('tTitle').value.trim();
  const year = +document.getElementById('tYear').value;
  const categoryId = document.getElementById('tCat').value;
  const status = document.getElementById('tStatus').value;
  await http(`/admin/titles/${id}`, { method:'PATCH', body: JSON.stringify({title,year,categoryId,status})});
  closeModal(); Router();
}
window.approveTitle = async function(id){ await http(`/admin/titles/${id}/approve`, { method:'PATCH' }); Router(); }
window.rejectTitle  = async function(id){
  const reason = prompt('Motivo del rechazo:')||'';
  await http(`/admin/titles/${id}/reject`, { method:'PATCH', body: JSON.stringify({reason}) });
  Router();
}

// ------- Actions (Reviews) -------
window.deleteReview = async function(id){
  if(!confirm('¿Eliminar reseña?')) return;
  await http(`/admin/reviews/${id}`, { method:'DELETE' });
  Router();
}

// ------- Settings -------
window.saveSettings = function(){
  API.BASE_URL = document.getElementById('apiBase').value;
  alert('Guardado (frontend)');
}

// ------- Modal helpers -------
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const modalTitle = document.getElementById('modalTitle');
const modalFooter = document.getElementById('modalFooter');
document.getElementById('closeModal').onclick = closeModal;

function openModal(title, body, footer){
  modalTitle.textContent = title;
  modalBody.innerHTML = body;
  modalFooter.innerHTML = footer||'';
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
}
function closeModal(){
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
}

// ------- Global UI events -------
document.getElementById('logout').onclick = () => {
  Auth.clear();
  window.location.replace(`${location.origin}/index.html`);
};

document.getElementById('role-pill').textContent = 'rol: ' + (Auth.getUser()?.role || '-');

// ------- Render helpers -------
const Render = {
  notAllowed(){
    document.getElementById("view").innerHTML = `
      <div class="card">
        <h2>Acceso restringido</h2>
        <p>Necesitas una sesión de administrador para ver este módulo.</p>
      </div>`;
  },
  error(msg){
    return `<div class="card"><h3>Error</h3><p style="color:#ff9b9b">${escapeHtml(msg)}</p></div>`;
  }
};

// ------- Boot -------
mountNav();
Router();
