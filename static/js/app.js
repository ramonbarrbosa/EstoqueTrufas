// static/js/app.js — Sistema de Estoque de Trufas PWA Offline
// Armazenamento 100% local no celular (localStorage) com funcionamento offline

// ─── Registro do Service Worker (Offline) ────────────────────────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => console.log("PWA Service Worker registrado!", reg.scope))
      .catch((err) => console.log("Falha ao registrar Service Worker:", err));
  });
}

// ─── Captura do Prompt de Instalação no Android ─────────────────────────────
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const banner = document.getElementById("installBanner");
  if (banner) banner.style.display = "flex";
});

document.addEventListener("DOMContentLoaded", () => {
  const btnInstalar = document.getElementById("btnInstalarApp");
  if (btnInstalar) {
    btnInstalar.addEventListener("click", async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          document.getElementById("installBanner").style.display = "none";
        }
        deferredPrompt = null;
      }
    });
  }
});

// ─── Armazenamento Local (localStorage) ──────────────────────────────────────
const STORAGE_PRODUTOS = "trufas_produtos_v1";
const STORAGE_VENDAS = "trufas_vendas_v1";

function carregarProdutos() {
  const data = localStorage.getItem(STORAGE_PRODUTOS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function salvarProdutosStorage(produtos) {
  localStorage.setItem(STORAGE_PRODUTOS, JSON.stringify(produtos));
}

function carregarVendas() {
  const data = localStorage.getItem(STORAGE_VENDAS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function salvarVendasStorage(vendas) {
  localStorage.setItem(STORAGE_VENDAS, JSON.stringify(vendas));
}

// ─── Regra de Precificação ───────────────────────────────────────────────────
function calcularPreco(nome) {
  const lower = (nome || "").toLowerCase();
  if (lower.includes("cravejado") || lower.includes("cravejada")) {
    return 4.80;
  }
  return 4.00;
}

// ─── Notificações Toast ──────────────────────────────────────────────────────
function showToast(mensagem, tipo = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const iconClass =
    tipo === "success"
      ? "fa-circle-check"
      : tipo === "error"
      ? "fa-circle-xmark"
      : "fa-circle-info";

  const toast = document.createElement("div");
  toast.className = `flash flash--${tipo}`;
  toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${mensagem}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = "opacity 0.4s ease";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}

// ─── Renderização da Lista de Produtos ───────────────────────────────────────
function renderizarProdutos() {
  const produtos = carregarProdutos();
  const listEl = document.getElementById("productList");
  const emptyEl = document.getElementById("emptyState");

  // Ordenar alfabeticamente
  produtos.sort((a, b) => a.nome.localeCompare(b.nome));

  // Atualizar cards de resumo do topo
  const totalSabores = produtos.length;
  const disponiveis = produtos.filter((p) => p.quantidade > 0).length;
  const totalUnidades = produtos.reduce((acc, p) => acc + (Number(p.quantidade) || 0), 0);

  const sumSaboresEl = document.getElementById("sumSabores");
  const sumDispEl = document.getElementById("sumDisponiveis");
  const sumUnidEl = document.getElementById("sumUnidades");

  if (sumSaboresEl) sumSaboresEl.textContent = totalSabores;
  if (sumDispEl) sumDispEl.textContent = disponiveis;
  if (sumUnidEl) sumUnidEl.textContent = totalUnidades;

  if (!listEl) return;

  if (produtos.length === 0) {
    listEl.innerHTML = "";
    if (emptyEl) emptyEl.style.display = "flex";
    return;
  }

  if (emptyEl) emptyEl.style.display = "none";

  listEl.innerHTML = produtos
    .map((p) => {
      const isEsgotado = p.quantidade <= 0;
      const precoFmt = Number(p.preco || calcularPreco(p.nome)).toFixed(2).replace(".", ",");
      const isLow = p.quantidade > 0 && p.quantidade <= 3;

      let qtyClass = "qty-number";
      if (isEsgotado) qtyClass += " qty-number--zero";
      else if (isLow) qtyClass += " qty-number--low";

      return `
      <div class="product-card ${isEsgotado ? "product-card--esgotado" : ""}">
        <div class="product-header">
          <div>
            <h3 class="product-name">${p.nome}</h3>
            <span class="price-badge">
              <i class="fa-solid fa-tag"></i> R$ ${precoFmt}
            </span>
          </div>
          <span class="status-badge ${isEsgotado ? "status-badge--esgotado" : "status-badge--disponivel"}">
            <i class="fa-solid ${isEsgotado ? "fa-circle-xmark" : "fa-circle-check"}"></i>
            ${isEsgotado ? "Esgotado" : "Disponível"}
          </span>
        </div>

        <div class="product-body">
          <div class="qty-control">
            <button
              class="qty-btn qty-btn--minus"
              onclick="darBaixaVenda('${p.id}')"
              ${isEsgotado ? "disabled" : ""}
              title="Registrar 1 venda"
            >
              <i class="fa-solid fa-minus"></i>
            </button>

            <div class="qty-display">
              <span class="${qtyClass}">${p.quantidade}</span>
              <span class="qty-unit">unid.</span>
            </div>

            <button
              class="qty-btn qty-btn--plus"
              onclick="adicionarEstoqueRapido('${p.id}')"
              title="Adicionar 1 unidade"
            >
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>

          <div class="product-actions">
            <button
              class="action-btn action-btn--edit"
              onclick="editarProdutoModal('${p.id}')"
              title="Editar sabor"
            >
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button
              class="action-btn action-btn--delete"
              onclick="deletarProdutoConfirm('${p.id}')"
              title="Excluir sabor"
            >
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}

// ─── Ações de Estoque (+ / -) ────────────────────────────────────────────────
function adicionarEstoqueRapido(id) {
  const produtos = carregarProdutos();
  const produto = produtos.find((p) => String(p.id) === String(id));
  if (!produto) return;

  produto.quantidade = (Number(produto.quantidade) || 0) + 1;
  produto.status = "disponivel";
  salvarProdutosStorage(produtos);
  renderizarProdutos();
  showToast(`+1 unidade adicionada em "${produto.nome}"! 📦`, "success");
}

function darBaixaVenda(id) {
  const produtos = carregarProdutos();
  const produto = produtos.find((p) => String(p.id) === String(id));
  if (!produto || produto.quantidade <= 0) {
    showToast(`"${produto ? produto.nome : "Sabor"}" está esgotado!`, "error");
    return;
  }

  const ok = confirm(
    `Registrar 1 venda de:\n"${produto.nome}"?\n\nO estoque será reduzido em 1 unidade.`
  );
  if (!ok) return;

  produto.quantidade -= 1;
  if (produto.quantidade <= 0) {
    produto.status = "esgotado";
  }

  // Registrar no histórico de vendas
  const vendas = carregarVendas();
  vendas.push({
    id: Date.now(),
    produto_id: produto.id,
    nome_produto: produto.nome,
    quantidade_vendida: 1,
    preco_unitario: Number(produto.preco) || calcularPreco(produto.nome),
    total: Number(produto.preco) || calcularPreco(produto.nome),
    vendido_em: new Date().toISOString()
  });

  salvarProdutosStorage(produtos);
  salvarVendasStorage(vendas);
  renderizarProdutos();
  showToast(`Venda de "${produto.nome}" registrada! 💰`, "success");
}

function deletarProdutoConfirm(id) {
  const produtos = carregarProdutos();
  const produto = produtos.find((p) => String(p.id) === String(id));
  if (!produto) return;

  const ok = confirm(`Excluir o sabor "${produto.nome}"?\n\nEsta ação não pode ser desfeita.`);
  if (!ok) return;

  const atualizados = produtos.filter((p) => String(p.id) !== String(id));
  salvarProdutosStorage(atualizados);
  renderizarProdutos();
  showToast(`Sabor "${produto.nome}" excluído. 🗑️`, "info");
}

// ─── Modal: Cadastro e Edição de Sabor ───────────────────────────────────────
function abrirModalProduto() {
  document.getElementById("formProduto").reset();
  document.getElementById("prodId").value = "";
  document.getElementById("modalProdutoTitulo").innerHTML = `<i class="fa-solid fa-plus"></i> Novo Sabor`;
  atualizarPreviewPrecoModal("");
  abrirModal("modalProduto");
  setTimeout(() => document.getElementById("prodNome").focus(), 150);
}

function editarProdutoModal(id) {
  const produtos = carregarProdutos();
  const produto = produtos.find((p) => String(p.id) === String(id));
  if (!produto) return;

  document.getElementById("prodId").value = produto.id;
  document.getElementById("prodNome").value = produto.nome;
  document.getElementById("prodQtd").value = produto.quantidade;
  document.getElementById("modalProdutoTitulo").innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Editar Sabor`;

  atualizarPreviewPrecoModal(produto.nome);
  abrirModal("modalProduto");
}

function atualizarPreviewPrecoModal(nome) {
  const preview = document.getElementById("prodPrecoPreview");
  if (!preview) return;

  const preco = calcularPreco(nome);
  const isCravejado = preco === 4.80;
  preview.textContent = isCravejado
    ? "🌟 Cravejado — Preço: R$ 4,80"
    : "Sabor padrão — Preço: R$ 4,00";
}

function salvarProduto(event) {
  event.preventDefault();
  const id = document.getElementById("prodId").value;
  const nome = document.getElementById("prodNome").value.trim();
  const quantidade = parseInt(document.getElementById("prodQtd").value, 10);

  if (!nome) {
    alert("Informe o nome do sabor.");
    return;
  }
  if (isNaN(quantidade) || quantidade < 0) {
    alert("Informe uma quantidade válida.");
    return;
  }

  const produtos = carregarProdutos();
  const preco = calcularPreco(nome);
  const status = quantidade > 0 ? "disponivel" : "esgotado";

  if (id) {
    // Edição
    const index = produtos.findIndex((p) => String(p.id) === String(id));
    if (index !== -1) {
      produtos[index].nome = nome;
      produtos[index].quantidade = quantidade;
      produtos[index].preco = preco;
      produtos[index].status = status;
      produtos[index].atualizado_em = new Date().toISOString();
      showToast(`Sabor "${nome}" atualizado! ✅`, "success");
    }
  } else {
    // Novo sabor
    produtos.push({
      id: Date.now().toString(),
      nome,
      quantidade,
      preco,
      status,
      criado_em: new Date().toISOString()
    });
    showToast(`Sabor "${nome}" cadastrado! 🍬`, "success");
  }

  salvarProdutosStorage(produtos);
  renderizarProdutos();
  fecharModal("modalProduto");
}

// ─── Modal: Relatório de Vendas ──────────────────────────────────────────────
function abrirRelatorio() {
  abrirModal("modalRelatorio");
  const container = document.getElementById("relatorioConteudo");
  const vendas = carregarVendas();

  const hojeStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const mesAtualStr = hojeStr.slice(0, 7); // YYYY-MM

  // Vendas de hoje
  const vendasHoje = vendas.filter((v) => (v.vendido_em || "").startsWith(hojeStr));
  const fatHoje = vendasHoje.reduce((acc, v) => acc + (Number(v.total) || 0), 0);
  const qtdHoje = vendasHoje.reduce((acc, v) => acc + (Number(v.quantidade_vendida) || 1), 0);

  // Vendas do mês
  const vendasMes = vendas.filter((v) => (v.vendido_em || "").startsWith(mesAtualStr));
  const fatMes = vendasMes.reduce((acc, v) => acc + (Number(v.total) || 0), 0);
  const qtdMes = vendasMes.reduce((acc, v) => acc + (Number(v.quantidade_vendida) || 1), 0);

  // Agrupado por sabor no mês
  const porSabor = {};
  vendasMes.forEach((v) => {
    const nome = v.nome_produto || "Sabor";
    if (!porSabor[nome]) {
      porSabor[nome] = { quantidade: 0, faturamento: 0 };
    }
    porSabor[nome].quantidade += Number(v.quantidade_vendida) || 1;
    porSabor[nome].faturamento += Number(v.total) || 0;
  });

  const detalhes = Object.keys(porSabor)
    .map((nome) => ({
      nome,
      quantidade: porSabor[nome].quantidade,
      faturamento: porSabor[nome].faturamento
    }))
    .sort((a, b) => b.faturamento - a.faturamento);

  const fmt = (v) =>
    "R$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  let detalhesHtml = "";
  if (detalhes.length > 0) {
    detalhesHtml = detalhes
      .map(
        (d) => `
      <div class="relatorio-detalhe-item">
        <span class="relatorio-detalhe-nome">${d.nome}</span>
        <span class="relatorio-detalhe-valores">
          <span>${d.quantidade} unid.</span>
          <strong>${fmt(d.faturamento)}</strong>
        </span>
      </div>`
      )
      .join("");
  } else {
    detalhesHtml = `<div class="relatorio-vazio">
      <i class="fa-regular fa-face-meh"></i> Nenhuma venda registrada este mês ainda.
    </div>`;
  }

  container.innerHTML = `
    <div class="relatorio-grid">
      <div class="relatorio-card">
        <div class="relatorio-card-label"><i class="fa-regular fa-clock"></i> Hoje</div>
        <div class="relatorio-card-valor">${fmt(fatHoje)}</div>
        <div class="relatorio-card-qtd">${qtdHoje} unid. vendidas</div>
      </div>
      <div class="relatorio-card relatorio-card--mes">
        <div class="relatorio-card-label"><i class="fa-regular fa-calendar"></i> Este mês</div>
        <div class="relatorio-card-valor">${fmt(fatMes)}</div>
        <div class="relatorio-card-qtd">${qtdMes} unid. vendidas</div>
      </div>
    </div>
    <div class="relatorio-secao-titulo">📊 Detalhamento por sabor — Mês atual</div>
    <div>${detalhesHtml}</div>
  `;
}

// ─── Modal: Compartilhar no WhatsApp ─────────────────────────────────────────
function compartilharWhatsApp() {
  abrirModal("modalWhatsApp");
  const preview = document.getElementById("whatsappTexto");
  const btnWpp = document.getElementById("btnAbrirWpp");
  const produtos = carregarProdutos();

  produtos.sort((a, b) => a.nome.localeCompare(b.nome));

  let linhas = [];
  produtos.forEach((p) => {
    const preco = Number(p.preco || calcularPreco(p.nome)).toFixed(2).replace(".", ",");
    if (p.quantidade > 0) {
      linhas.push(`• ${p.nome}: ${p.quantidade} unid. — R$ ${preco} cada`);
    } else {
      linhas.push(`• ${p.nome}: ESGOTADO`);
    }
  });

  let corpo = linhas.length > 0 ? linhas.join("\n") : "Nenhum sabor cadastrado ainda.";

  const mensagem = `🍬 *Cardápio de Trufas Disponíveis Hoje:*\n\n${corpo}\n\n📲 Faça seu pedido respondendo a esta mensagem!`;

  preview.textContent = mensagem;

  const encoded = encodeURIComponent(mensagem);
  btnWpp.href = `https://wa.me/?text=${encoded}`;
}

async function copiarTexto() {
  const texto = document.getElementById("whatsappTexto").textContent;
  try {
    await navigator.clipboard.writeText(texto);
    const feedback = document.getElementById("copyFeedback");
    feedback.style.display = "block";
    setTimeout(() => (feedback.style.display = "none"), 2500);
  } catch (e) {
    const ta = document.createElement("textarea");
    ta.value = texto;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    alert("Mensagem copiada!");
  }
}

// ─── Backup e Restauração de Dados ───────────────────────────────────────────
function exportarBackup() {
  const produtos = carregarProdutos();
  const vendas = carregarVendas();
  const backup = {
    versao: 1,
    data_exportacao: new Date().toISOString(),
    produtos,
    vendas
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
  const hoje = new Date().toISOString().slice(0, 10);
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `trufas_backup_${hoje}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  showToast("Cópia de backup baixada com sucesso! 💾", "success");
}

function importarBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data && Array.isArray(data.produtos)) {
        salvarProdutosStorage(data.produtos);
        if (Array.isArray(data.vendas)) {
          salvarVendasStorage(data.vendas);
        }
        renderizarProdutos();
        fecharModal("modalBackup");
        showToast("Dados restaurados com sucesso! 🍬", "success");
      } else {
        alert("O arquivo selecionado não é um backup válido.");
      }
    } catch (err) {
      alert("Erro ao ler o arquivo de backup: formato inválido.");
    }
  };
  reader.readAsText(file);
}

// ─── Funções de Controle de Modais ───────────────────────────────────────────
function abrirModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("open");
}

function fecharModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("open");
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-overlay.open").forEach((m) =>
      m.classList.remove("open")
    );
  }
});

// ─── Inicialização da Aplicação ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Listener do input de nome para atualizar o preview de preço
  const prodNomeInput = document.getElementById("prodNome");
  if (prodNomeInput) {
    prodNomeInput.addEventListener("input", (e) => {
      atualizarPreviewPrecoModal(e.target.value);
    });
  }

  // Renderizar a lista de produtos gravados
  renderizarProdutos();
});
