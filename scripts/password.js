(() => {
  const $ = (s, r=document) => r.querySelector(s);

  const API_BASE = localStorage.getItem("KARENFLIX_API") || "http://localhost:3000/api/v1";
  const PASSWORD_URL = `${API_BASE}/auth/password`;

  const currentPass = $("#currentPass");
  const newPass     = $("#newPass");
  const newConf     = $("#newConf");
  const btn         = $("#btnPassword");
  const alertBox    = $("#formAlert");

  const setAlert = (msg, ok=false) => {
    alertBox.textContent = msg || "";
    alertBox.classList.toggle("success", ok);
    alertBox.classList.toggle("error", !ok);
  };

  const lock = (on) => {
    if (on) {
      btn.dataset.t = btn.textContent;
      btn.textContent = "Guardando…";
      btn.disabled = true;
    } else {
      btn.textContent = btn.dataset.t || "Guardar";
      btn.disabled = false;
    }
  };

  const vPass = (val) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(String(val));

  $("#passwordForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setAlert("");

    const current = currentPass.value.trim();
    const pass = newPass.value.trim();
    const conf = newConf.value.trim();

    if (!current || !pass || !conf) {
      setAlert("Todos los campos son obligatorios.");
      return;
    }
    if (pass !== conf) {
      setAlert("Las contraseñas no coinciden.");
      return;
    }
    if (!vPass(pass)) {
      setAlert("La nueva contraseña no cumple con los requisitos.");
      return;
    }

    const auth = JSON.parse(localStorage.getItem("auth") || "{}");
    if (!auth?.token) {
      setAlert("Debes iniciar sesión.");
      return;
    }

    lock(true);
    try {
      const res = await fetch(PASSWORD_URL, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${auth.token}`
        },
        body: JSON.stringify({ currentPassword: current, newPassword: pass })
      });

      const data = await res.json().catch(()=> ({}));

      if (!res.ok) {
        setAlert(data?.message || "No se pudo cambiar la contraseña.");
        return;
      }

      setAlert("Contraseña actualizada ✅", true);
      currentPass.value = newPass.value = newConf.value = "";
    } catch (err) {
      console.error(err);
      setAlert("Error de red o servidor.");
    } finally {
      lock(false);
    }
  });
})();
