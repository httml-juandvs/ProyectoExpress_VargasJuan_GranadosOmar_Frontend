(() => {
  "use strict";

  // ---------- Utils ----------
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function ensureErr(input) {
    let box = input?.parentElement?.querySelector?.(".error-msg");
    if (!box && input?.parentElement) {
      box = document.createElement("div");
      box.className = "error-msg";
      input.parentElement.appendChild(box);
    }
    return box;
  }
  function fieldErr(input, msg) {
    if (!input) return;
    input.classList.add("invalid");
    input.setAttribute("aria-invalid", "true");
    const box = ensureErr(input);
    if (box) box.textContent = msg || "";
  }
  function fieldOk(input) {
    if (!input) return;
    input.classList.remove("invalid");
    input.removeAttribute("aria-invalid");
    const box = input.parentElement?.querySelector?.(".error-msg");
    if (box) box.textContent = "";
  }
  function setFormAlert(msg, type = "error") {
    const el = $("#formAlert");
    if (!el) return;
    el.textContent = msg || "";
    el.style.color = type === "success" ? "#7DFFA3" : "#ff8a8a";
  }
  function lockButton(btn, locked = true, textLocked = "Procesando…") {
    if (!btn) return;
    if (locked) {
      btn.dataset.originalText = btn.textContent;
      btn.textContent = textLocked;
      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");
    } else {
      btn.textContent = btn.dataset.originalText || "Enviar";
      btn.disabled = false;
      btn.removeAttribute("aria-busy");
    }
  }

  // ---------- Tabs (Login / Register) ----------
  const tabs         = $$(".tab");
  const loginForm    = $("#loginForm");
  const registerForm = $("#registerForm");
  const subtitle     = $("#subtitle");

  function setActiveTab(tabName) {
    tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === tabName));
    const isLogin = tabName === "login";
    loginForm?.classList.toggle("hidden", !isLogin);
    registerForm?.classList.toggle("hidden",  isLogin);
    if (subtitle) {
      subtitle.textContent = isLogin
        ? "Inicia sesión para ver tus programas favoritos."
        : "Regístrate ahora para ver tus programas favoritos.";
    }
  }
  tabs.forEach(t => t.addEventListener("click", () => setActiveTab(t.dataset.tab)));
  setActiveTab("login"); // estado inicial seguro

  // ---------- Validaciones (Registro) ----------
  const fullName    = $("#fullName");
  const regEmail    = $("#regEmail");
  const regPassword = $("#regPassword");
  const regConfirm  = $("#regConfirm");
  const regTerms    = $("#regTerms");
  const btnRegister = $("#btnRegister");

  const vName = (el) => {
    if (!el) return false;
    const ok = el.value.trim().length >= 3;
    ok ? fieldOk(el) : fieldErr(el, "Mínimo 3 caracteres.");
    return ok;
  };
  const vEmail = (el) => {
    if (!el) return false;
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim().toLowerCase());
    ok ? fieldOk(el) : fieldErr(el, "Correo no válido.");
    return ok;
  };
  const vPass = (el) => {
    if (!el) return false;
    const ok = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(el.value);
    ok ? fieldOk(el) : fieldErr(el, "Min. 8 carac., 1 mayúscula, 1 minúscula y 1 número.");
    return ok;
  };
  const vConf = (p, c) => {
    if (!p || !c) return false;
    const ok = c.value === p.value && c.value !== "";
    ok ? fieldOk(c) : fieldErr(c, "Las contraseñas no coinciden.");
    return ok;
  };
  const vTerms = (el) => {
    if (!el) return false;
    const ok = el.checked;
    ok ? fieldOk(el) : fieldErr(el, "Debes aceptar los términos.");
    return ok;
  };

  [fullName, regEmail, regPassword].forEach(el => {
    el?.addEventListener("input", () => {
      if (el === fullName)    vName(el);
      if (el === regEmail)    vEmail(el);
      if (el === regPassword) vPass(el);
    });
  });
  regConfirm?.addEventListener("input", () => vConf(regPassword, regConfirm));
  regTerms?.addEventListener("change", () => vTerms(regTerms));

  // ---------- API ----------
  const API_BASE      = localStorage.getItem("KARENFLIX_API") || "http://localhost:3000/api/v1";
  const REGISTER_URL  = `${API_BASE}/auth/register`;
  const LOGIN_URL     = `${API_BASE}/auth/login`;

  // ---------- Submit: Registro ----------
  registerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setFormAlert("");

    const ok = [
      vName(fullName),
      vEmail(regEmail),
      vPass(regPassword),
      vConf(regPassword, regConfirm),
      vTerms(regTerms)
    ].every(Boolean);

    if (!ok) { setFormAlert("Revisa los campos marcados en rojo."); return; }

    const payload = {
      name: fullName.value.trim(),
      email: regEmail.value.trim().toLowerCase(),
      password: regPassword.value
    };

    lockButton(btnRegister, true, "Registrando…");
    try {
      const res  = await fetch(REGISTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setFormAlert("¡Cuenta creada! Ya puedes iniciar sesión.", "success");
        registerForm.reset();
        setActiveTab("login"); // vuelve a Login
      } else if (res.status === 409) {
        fieldErr(regEmail, "Ese correo ya está registrado.");
        setFormAlert("Ese correo ya está registrado.");
      } else {
        setFormAlert(data?.message || data?.error || "No se pudo completar el registro.");
      }
    } catch (err) {
      console.error(err);
      setFormAlert("Error de red. Verifica tu conexión o el servidor.");
    } finally {
      lockButton(btnRegister, false);
    }
  });

  // ---------- Submit: Login ----------
  const loginEmail    = $("#loginEmail");
  const loginPassword = $("#loginPassword");

  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setFormAlert(""); // limpiar mensajes

    const email = loginEmail.value.trim().toLowerCase();
    const password = loginPassword.value.trim();

    if (!email || !password) {
      setFormAlert("Debes ingresar correo y contraseña.");
      return;
    }

    const btnLogin = loginForm.querySelector("button[type=submit]");
    lockButton(btnLogin, true, "Ingresando…");
    try {
      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user || {}));

        setFormAlert("Bienvenido 👋", "success");

        setTimeout(() => {
          window.location.href = "./home.html";
        }, 800);
      } else {
        setFormAlert(data?.msg || data?.message || "Credenciales inválidas.");
      }
    } catch (err) {
      console.error("Error de login:", err);
      setFormAlert("Error de red o servidor no disponible.");
    } finally {
      lockButton(btnLogin, false);
    }
  });
})();
