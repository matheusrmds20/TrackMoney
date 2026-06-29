(function () {
  const API_BASE = "https://trackmoney.fly.dev";

  let categories = [];
  let editingId = null;
  let deletingId = null;
  let selectedType = "receita";

  function token() {
    return localStorage.getItem("auth_token") || "";
  }

  function headers(json = false) {
    const h = { Authorization: `Bearer ${token()}` };
    if (json) h["Content-Type"] = "application/json";
    return h;
  }

  function apiType(type) {
    const value = String(type || "").toLowerCase();
    if (value === "receita") return "income";
    if (value === "despesa") return "expense";
    if (value === "income" || value === "expense") return value;
    return "income";
  }


  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function el(id) {
    return document.getElementById(id);
  }

  function setVisible(id, visible) {
    const node = el(id);
    if (node) node.style.display = visible ? "flex" : "none";
  }

  function setState(state, message = "") {
    setVisible("cat-state-loading", state === "loading");
    setVisible("cat-state-empty", state === "empty");
    setVisible("cat-state-error", state === "error");
    setVisible("cat-grid", state === "grid");

    const errorMsg = el("cat-error-msg");
    if (errorMsg && message) errorMsg.textContent = message;
  }

  function updateStats(list) {
    const total = el("cat-stat-total");
    const receita = el("cat-stat-receita");
    const despesa = el("cat-stat-despesa");

    if (total) total.textContent = String(list.length);
    if (receita) receita.textContent = String(list.filter((item) => item.type === "Receita").length);
    if (despesa) despesa.textContent = String(list.filter((item) => item.type === "Despesa").length);
  }

  function badgeHtml(type) {
    if (type === "Receita") {
      return `<span class="card-badge badge-receita">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>Receita</span>`;
    }

    return `<span class="card-badge badge-despesa">
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4"/>
      </svg>Despesa</span>`;
  }

  function render(list) {
    const grid = el("cat-grid");
    if (!grid) return;

    if (!list.length) {
      grid.innerHTML = "";
      setState("empty");
      return;
    }

    grid.innerHTML = list
      .map(
        (item) => `
        <div class="cat-card type-${item.type}" id="catcard-${item.id}">
          <div class="card-top">
            ${badgeHtml(item.type)}
            <span class="card-id">#${item.id}</span>
          </div>
          <p class="card-name">${escapeHtml(item.name)}</p>
          <div class="card-actions">
            <button class="action-btn edit" type="button" data-id="${item.id}" data-name="${escapeHtml(item.name)}" data-type="${item.type}">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                     m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>Editar
            </button>
            <button class="action-btn del" type="button" data-id="${item.id}" data-name="${escapeHtml(item.name)}">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858
                     L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>Excluir
            </button>
          </div>
        </div>
      `
      )
      .join("");

    grid.querySelectorAll(".action-btn.edit").forEach((button) => {
      button.addEventListener("click", () => {
        catOpenModal(Number(button.dataset.id), button.dataset.name, button.dataset.type);
      });
    });

    grid.querySelectorAll(".action-btn.del").forEach((button) => {
      button.addEventListener("click", () => {
        catOpenDelete(Number(button.dataset.id), button.dataset.name);
      });
    });

    setState("grid");
  }

  async function loadCategories() {
    const grid = el("cat-grid");
    if (!grid) return;

    setState("loading");

    try {
      const res = await fetch(`${API_BASE}/category/list`, {
        headers: headers(),
      });

      if (res.status === 401) {
        localStorage.removeItem("auth_token");
        window.location.href = "index.html";
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Erro ${res.status}`);
      }

      categories = await res.json();
      updateStats(categories);
      render(categories);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      setState("error", error.message || "Não foi possível buscar as categorias.");
    }
  }

  async function apiCreate(name, type) {
    const res = await fetch(`${API_BASE}/category/create`, {
      method: "POST",
      headers: headers(true),
      body: JSON.stringify({ name, type: apiType(type) }),
    });

    if (res.status === 401) {
      localStorage.removeItem("auth_token");
      window.location.href = "index.html";
      return null;
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || `Erro ${res.status}`);
    return data;
  }

  async function apiUpdate(id, name, type) {
    const res = await fetch(`${API_BASE}/category/update/${id}`, {
      method: "PATCH",
      headers: headers(true),
      body: JSON.stringify({ name, type: apiType(type) }),
    });

    if (res.status === 401) {
      localStorage.removeItem("auth_token");
      window.location.href = "index.html";
      return null;
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || `Erro ${res.status}`);
    return data;
  }

  async function apiDelete(id) {
    const res = await fetch(`${API_BASE}/category/delete/${id}`, {
      method: "DELETE",
      headers: headers(),
    });

    if (res.status === 401) {
      localStorage.removeItem("auth_token");
      window.location.href = "index.html";
      return null;
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || `Erro ${res.status}`);
    }

    return true;
  }

  function setModalStatus(message, kind) {
    const node = el("cat-modal-status");
    if (!node) return;
    node.textContent = message;
    node.className = `status-msg ${kind}`;
  }

  function catOpenModal(id = null, name = "", type = "receita") {
    const modal = el("cat-modal-overlay");
    const title = el("cat-modal-title");
    const subtitle = el("cat-modal-sub");
    const btnLabel = el("cat-modal-btn-lbl");
    const input = el("cat-modal-name");
    const status = el("cat-modal-status");
    const submit = el("cat-modal-submit");

    if (!modal || !title || !subtitle || !btnLabel || !input || !status || !submit) return;

    editingId = id;
    selectedType = type;

    const isEdit = id !== null;
    title.textContent = isEdit ? "Editar Categoria" : "Nova Categoria";
    subtitle.textContent = isEdit ? "Altere os dados abaixo" : "Preencha os dados abaixo";
    btnLabel.textContent = isEdit ? "Salvar" : "Criar";
    input.value = name;
    status.textContent = "";
    status.className = "status-msg";
    submit.disabled = false;

    catSelectType(type);
    modal.classList.add("open");
    setTimeout(() => input.focus(), 50);
  }

  

  function catCloseModal() {
    const modal = el("cat-modal-overlay");
    const box = modal?.querySelector(".cat-modal-box");
    if (box) {
      box.classList.add("closing");
      setTimeout(() => {
        box.classList.remove("closing");
        modal?.classList.remove("open");
      }, 180);
    } else if (modal) {
      modal.classList.remove("open");
    }
    editingId = null;
  }

  function catCloseModalOverlay(event) {
    if (event.target === el("cat-modal-overlay")) catCloseModal();
  }

  function catSelectType(type) {
    selectedType = type;
    const receita = el("cat-type-receita");
    const despesa = el("cat-type-despesa");

    if (receita) receita.className = `cat-type-btn${type === "receita" ? " active receita" : ""}`;
    if (despesa) despesa.className = `cat-type-btn${type === "despesa" ? " active despesa" : ""}`;
  }

  async function catSubmitModal() {
    const input = el("cat-modal-name");
    const submit = el("cat-modal-submit");
    if (!input || !submit) return;

    const name = input.value.trim();
    if (!name) {
      setModalStatus("Informe o nome da categoria.", "error");
      return;
    }

    submit.disabled = true;
    setModalStatus(editingId !== null ? "Salvando..." : "Criando...", "info");

    try {
      if (editingId !== null) {
        const updated = await apiUpdate(editingId, name, selectedType);
        if (!updated) return;
        const index = categories.findIndex((item) => item.id === editingId);
        if (index !== -1) categories[index] = updated;
      } else {
        const created = await apiCreate(name, selectedType);
        if (!created) return;
        categories.push(created);
      }

      catCloseModal();
      updateStats(categories);
      render(categories);

      if (typeof showToast === "function") {
        showToast(editingId !== null ? "Categoria atualizada!" : "Categoria criada!");
      }
    } catch (error) {
      setModalStatus(error.message, "error");
      submit.disabled = false;
    }
  }

  function catOpenDelete(id, name) {
    deletingId = id;

    const modal = el("cat-delete-overlay");
    const modalName = el("cat-delete-name");
    const status = el("cat-delete-status");
    const confirm = el("cat-delete-confirm");

    if (!modal || !modalName || !status || !confirm) return;

    modalName.textContent = name;
    status.textContent = "";
    status.className = "status-msg";
    confirm.disabled = false;
    modal.classList.add("open");
  }

  function catCloseDelete() {
    const modal = el("cat-delete-overlay");
    const box = modal?.querySelector(".cat-modal-box");
    if (box) {
      box.classList.add("closing");
      setTimeout(() => {
        box.classList.remove("closing");
        modal?.classList.remove("open");
      }, 180);
    } else if (modal) {
      modal.classList.remove("open");
    }
    deletingId = null;
  }

  function catCloseDeleteOverlay(event) {
    if (event.target === el("cat-delete-overlay")) catCloseDelete();
  }

  async function catConfirmDelete() {
    if (deletingId === null) return;

    const confirm = el("cat-delete-confirm");
    const status = el("cat-delete-status");
    if (!confirm || !status) return;

    confirm.disabled = true;
    status.textContent = "Excluindo...";
    status.className = "status-msg info";

    try {
      await apiDelete(deletingId);
      categories = categories.filter((item) => item.id !== deletingId);
      catCloseDelete();
      updateStats(categories);
      render(categories);

      if (typeof showToast === "function") {
        showToast("Categoria excluída.");
      }
    } catch (error) {
      status.textContent = error.message;
      status.className = "status-msg error";
      confirm.disabled = false;
    }
  }

  function catFilter() {
    const search = el("cat-search");
    if (!search) return;

    const query = search.value.toLowerCase().trim();
    const filtered = query
      ? categories.filter((item) => item.name.toLowerCase().includes(query) || item.type.toLowerCase().includes(query))
      : categories;

    render(filtered);
  }


  function voltar() {
    const token = localStorage.getItem("auth_token");

    if (token) {
        window.location.href = "index.html#dashboard-view";
    } else {
        window.location.href = "index.html#auth-view";
    }
  }

  function init() {
    if (!token()) {
      window.location.href = "index.html#auth-vie";
      return;
    }

    loadCategories();
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      catCloseModal();
      catCloseDelete();
    }

    if (event.key === "Enter" && el("cat-modal-overlay")?.classList.contains("open")) {
      catSubmitModal();
    }
  });

  window.voltar = voltar;
  window.catLoad = loadCategories;
  window.catOpenModal = catOpenModal;
  window.catCloseModal = catCloseModal;
  window.catCloseModalOverlay = catCloseModalOverlay;
  window.catSelectType = catSelectType;
  window.catSubmitModal = catSubmitModal;
  window.catOpenDelete = catOpenDelete;
  window.catCloseDelete = catCloseDelete;
  window.catCloseDeleteOverlay = catCloseDeleteOverlay;
  window.catConfirmDelete = catConfirmDelete;
  window.catFilter = catFilter;
  window.catInit = init;

  document.addEventListener("DOMContentLoaded", init);
})();
