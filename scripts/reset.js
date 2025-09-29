(() => {
  const $ = (s,r=document)=>r.querySelector(s);

  const API_BASE = localStorage.getItem("KARENFLIX_API") || "http://localhost:3000/api/v1";
  const FORGOT_URL = `${API_BASE}/auth/forgot-password`;

  const email = $("#forgotEmail");
  const btn   = $("#btnForgot");
  const alert = $("#formAlert");

  const setAlert = (msg, ok=false) => {
    alert.textContent = msg || "";
    alert.classList.toggle("success", ok);
    alert.classList.toggle("error", !ok);
  };
  const lock = (on) => {
    if (on){ btn.dataset.t = btn.textContent; btn.textContent="Enviando…"; btn.disabled=true; }
    else   { btn.textContent = btn.dataset.t || "Enviar enlace"; btn.disabled=false; }
  };

  const vEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(val).trim().toLowerCase());

  $("#forgotForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setAlert("");

    const value = email.value.trim().toLowerCase();
    if (!vEmail(value)) { setAlert("Correo no válido"); return; }

    lock(true);
    try {
      const res = await fetch(FORGOT_URL, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ email: value })
      });
      const data = await res.json().catch(()=> ({}));

      if (!res.ok) {
        setAlert(data?.message || "No se pudo iniciar el proceso.");
        return;
      }

      // Mensaje general (no exponemos si existe el correo)
      setAlert("Si el correo existe, te enviamos instrucciones.", true);

      // ⬇️ DEV: si el backend devuelve link/devToken, auto-aplicamos el token sin email
      if (data?.link) {
        setTimeout(()=> location.href = data.link, 600);
      } else if (data?.devToken) {
        // Usa FRONT_BASE_URL del backend; pero como fallback armamos el link local
        const fallbackLink = `${location.origin}/pages/reset.html?token=${encodeURIComponent(data.devToken)}`;
        setTimeout(()=> location.href = fallbackLink, 600);
      }
    } catch (err) {
      console.error(err);
      setAlert("Error de red o servidor.");
    } finally {
      lock(false);
    }
  });
})();
