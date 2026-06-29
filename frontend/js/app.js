const API = "https://trackmoney.fly.dev";
let currentTab = "login";

function setStatus(id, msg, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = "status-msg " + type;
}


function mostraDashboard() {
  document.getElementById('auth-view').style.display = "none";
  document.getElementById('dashboard-view').style.display = "flex";
}

function mostrarAuth() {
    document.getElementById('dashboard-view').style.display = "none";
    document.getElementById('auth-view').style.display = "flex"

}

function clearStatus() {
  setStatus("login-status", "", "");
  setStatus("reg-status", "", "");
}


function switchTab(tab) {
  currentTab = tab;
  ["login", "register"].forEach(t => {
    document.getElementById(`tab-btn-${t}`)?.classList.toggle("active", t === tab);
    document.getElementById(`tab-line-${t}`)?.classList.toggle("active", t === tab);
    const form = document.getElementById(`${t}-form`);
    if (form) form.style.display = t === tab ? "block" : "none";
  });
  clearStatus();
}

function toggleEye(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  const isPass = inp.type === "password";
  inp.type = isPass ? "text" : "password";
  const svg = btn.querySelector("svg");
  if (!svg) return;
  svg.innerHTML = isPass
    ? `<path stroke-linecap="round" stroke-linejoin="round"
         d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7
            a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243
            M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29
            m7.532 7.532l3.29 3.29M3 3l3.59 3.59
            m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7
            a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>`
    : `<path stroke-linecap="round" stroke-linejoin="round"
         d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
       <path stroke-linecap="round" stroke-linejoin="round"
         d="M2.458 12C3.732 7.943 7.523 5 12 5
            c4.478 0 8.268 2.943 9.542 7
            -1.274 4.057-5.064 7-9.542 7
            -4.477 0-8.268-2.943-9.542-7z"/>`;
}

async function doLogin() {
  const email = document.getElementById("login-email")?.value.trim() || "";
  const pass = document.getElementById("login-password")?.value || "";
  if (!email || !pass) {
    setStatus("login-status", "Preencha e-mail e senha.", "error");
    return;
  }

  setStatus("login-status", "Autenticando…", "info");
  try {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", pass);

    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      if (!data.access_token) {
        setStatus("login-status", "Resposta inválida da API. Tente novamente.", "error");
        return;
      }
      localStorage.setItem("auth_token", data.access_token);
      window.location.hash = "#dashboard-view";
    } else {
      const detail = data.detail || data.message || "Credenciais inválidas";
      const isAuthError = res.status === 401 || res.status === 403;
      setStatus(
        "login-status",
        isAuthError ? "E-mail ou senha incorretos." : `Erro ${res.status}: ${detail}`,
        "error"
      );
    }
  } catch (ex) {
    setStatus("login-status", "Nao foi possivel fazer login, tente novamente.", "error");
  }
}

function showDashboard() {
  const hash = window.location.hash || "#auth-view";
  const token = localStorage.getItem("auth_token");
    
  if (hash === "#dashboard-view" && token) {
    mostraDashboard()
  } else {
    mostrarAuth()
  }
}

window.addEventListener('DOMContentLoaded', showDashboard)
window.addEventListener('hashchange', showDashboard);


async function doRegister() {
  const email = document.getElementById("reg-email")?.value.trim() || "";
  const pass = document.getElementById("reg-password")?.value || "";
  const confirm = document.getElementById("reg-confirm")?.value || "";
  if (!email || !pass) {
    setStatus("reg-status", "Preencha todos os campos.", "error");
    return;
  }
  if (pass !== confirm) {
    setStatus("reg-status", "As senhas não coincidem.", "error");
    return;
  }

  setStatus("reg-status", "Criando conta…", "info");
  try {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({email, password: pass }),
    });

    if (res.ok || res.status === 201) {
      ["reg-email", "reg-password", "reg-confirm"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
      setStatus("reg-status", "", "");
      showToast("Conta criada! Faça o login.");
      switchTab("login");
    } else {
      const err = await res.json().catch(() => ({}));
      setStatus("reg-status", `Erro: ${err.detail || "Erro no cadastro"}`, "error");
    }
  } catch (ex) {
    setStatus("reg-status", "Nao foi possivel concluir o cadastro.", "error");
  }
}

function doLogout() {
  localStorage.removeItem("auth_token");
  window.location.hash = "#auth-view";
}

function showToast(msg) {
  const t = document.createElement("div");
  t.textContent = msg;
  Object.assign(t.style, {
    position: "fixed",
    bottom: "24px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "var(--success)",
    color: "#080C14",
    padding: "12px 24px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "600",
    zIndex: "9999",
    opacity: "0",
    transition: "opacity .3s",
    fontFamily: "'DM Sans', sans-serif",
  });
  document.body.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity = "1"; });
  setTimeout(() => {
    t.style.opacity = "0";
    setTimeout(() => t.remove(), 400);
  }, 3000);
}

document.addEventListener("keydown", e => {
  if (e.key !== "Enter") return;
  if (currentTab === "login") doLogin();
  else doRegister();
});
