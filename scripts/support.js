(() => {
  const $ = (s, r=document) => r.querySelector(s);

  const API_BASE = localStorage.getItem("KARENFLIX_API") || "http://localhost:3000/api/v1";
  const SUPPORT_URL = `${API_BASE}/support`; // 🔧 necesitas crear este endpoint en tu backend

  const subjectEl = $("#supportSubject");
  const messageEl = $("#supportMessage");
  const btn       = $("#btnSupport");
  const alertBox  = $("#formAlert");

  const setAlert = (msg, ok=false) => {
    alertBox.textContent = msg || "";
    alertBox.classList.toggle("success", ok);
    alertBox.classList.toggle("error", !ok);
  };

  const lock = (on) => {
    if (on) {
      btn.dataset.t = btn.textContent;
      btn.textContent = "Enviando…";
      btn.disabled = true;
    } else {
      btn.textContent = btn.dataset.t || "Enviar";
      btn.disabled = false;
    }
  };

  $("#supportForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setAlert("");

    const subject = subjectEl.value.trim();
    const message = messageEl.value.trim();
    if (!subject || !message) {
      setAlert("Debes escribir un asunto y un mensaje.");
      return;
    }

    const auth = JSON.parse(localStorage.getItem("auth") || "{}");
    if (!auth?.token) {
      setAlert("Debes iniciar sesión.");
      return;
    }

    lock(true);
    try {
      const res = await fetch(SUPPORT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${auth.token}`
        },
        body: JSON.stringify({ subject, message })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setAlert(data?.message || "No se pudo enviar tu mensaje.");
        return;
      }

      setAlert("Mensaje enviado ✅. Te responderemos pronto.", true);
      subjectEl.value = "";
      messageEl.value = "";
    } catch (err) {
      console.error(err);
      setAlert("Error de red o servidor.");
    } finally {
      lock(false);
    }
  });
})();
