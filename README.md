# 🍬 Sistema de Controle de Estoque e Vendas de Trufas (PWA Mobile First)

Aplicativo moderno desenvolvido sob medida para controle de estoque e acompanhamento de vendas de trufas artesanais. O sistema funciona como um **PWA (Progressive Web App) 100% autônomo e offline no celular Android da sua esposa**, além de contar com a versão backend em Python (Flask + SQLite).

---

## 📌 1. Visão Geral & Problema

O controle manual em grupos de WhatsApp exigia recontagem constante e digitação repetitiva de sabores e quantidades.

### Benefícios do Sistema:
- **CRUD Completo:** Adicionar novos produtos/sabores, visualizar, alterar quantidades/preços e excluir.
- **Uso Exclusivo no Celular (Android):** Projetado para a rotina da sua esposa no smartphone dela, sem depender do computador ligado e sem necessidade de sincronização complexa.
- **Funcionamento 100% Offline:** Pode ser usado na rua, sem internet, mantendo os dados salvos com segurança no aparelho.
- **Relatório de Vendas (Diário & Mensal):**
  - Botão **"📊 Vendas"**: Exibe faturamento e total de trufas vendidas **Hoje** e no **Mês**, com detalhamento individual por sabor.
  - Baixa de estoque com confirmação prévia para evitar cliques acidentais.
- **Regra de Precificação Automática:**
  - Sabores com a palavra **"cravejado"** ou **"cravejada"**: **R$ 4,80**.
  - Demais sabores: **R$ 4,00**.
- **Compartilhador para WhatsApp:** Botão com 1 toque que formata o cardápio do dia com valores e quantidades para envio aos clientes.
- **Segurança dos Dados (Backup):** Botão para exportar uma cópia de segurança em arquivo (`.json`) e restaurar quando quiser.
- **Custo Zero Perpétuo:** Sem cobranças, sem servidores pagos e sem risco de taxas futuras.

---

## 🎨 2. Design & Experiência Visual (UI/UX)

- **Estilo Confeitaria Fina:** Tons de chocolate (`#5C3D2E`), avelã dourado (`#C8971A`) e fundo creme aconchegante (`#FDF8F0`).
- **Bordas Arredondadas:** Todos os botões, cartões e modais com acabamento suave (`border-radius: 14px - 22px`).
- **Sombras Suaves:** Efeito tátil de profundidade elegante (`box-shadow: 0 4px 14px rgba(92, 61, 46, 0.12)`).
- **Botões Grandes para Toque:** Botões `+` e `-` confortáveis para uso ágil durante o atendimento ou produção.

---

## 📱 3. Como Instalar no Celular da sua Esposa (PWA via GitHub Pages)

O aplicativo foi preparado para rodar via **GitHub Pages** (gratuito, com certificado HTTPS obrigatório para instalar apps no Android):

### Passo a passo para ativar:
1. **Subir o projeto para o GitHub:**
   - Crie o repositório na sua conta do GitHub.
   - Faça o commit e push dos arquivos do projeto.
2. **Ativar o GitHub Pages:**
   - No seu repositório no GitHub, vá em **Settings** > **Pages** (no menu lateral esquerdo).
   - Em *Branch*, selecione `main` (ou `master`), mantenha a pasta `/ (root)` e clique em **Save**.
   - O GitHub fornecerá um link HTTPS público (ex: `https://seu-usuario.github.io/estoque/`).
3. **Instalar no celular Android dela:**
   - Abra o link no **Google Chrome** do celular dela.
   - O próprio aplicativo exibirá um banner no topo: **"Instalar aplicativo na tela inicial"** (ou toque nos três pontinhos do Chrome > **"Instalar aplicativo"** / **"Adicionar à tela inicial"**).
   - O ícone **🍬 Trufas** aparecerá na tela do celular como um aplicativo comum.
   - Ao abrir, ele roda em tela cheia e funciona mesmo sem conexão com a internet!

---

## 💾 4. Segurança & Backup dos Dados

No topo direito do cabeçalho há o botão de **Segurança dos Dados** (ícone de nuvem):
- **Fazer Backup (Baixar Cópia):** Gera um arquivo `trufas_backup_DATA.json` com todos os produtos e o histórico de vendas. Sua esposa pode salvar no Google Drive ou enviar para si mesma no WhatsApp.
- **Restaurar Cópia Salva:** Caso troque de celular ou queira recuperar dados, basta selecionar o arquivo de backup e o estoque é restaurado instantaneamente.

---

## 💻 5. Como Executar Localmente com Python (Opcional)

Se você preferir executar o servidor Python/Flask no computador:

1. **Ativar o ambiente virtual:**
   ```powershell
   .venv\Scripts\Activate.ps1
   ```
2. **Executar a aplicação:**
   ```powershell
   python app.py
   ```
3. **Acessar pelo navegador:**
   - No PC: [http://localhost:5000](http://localhost:5000)
   - No celular dela (na mesma rede Wi-Fi): `http://SEU-IP-LOCAL:5000`

---

## 📁 6. Estrutura do Projeto

```text
estoque/
├── .gitignore               # Ignora .venv, __pycache__, banco SQLite local
├── README.md                # Documentação completa do projeto
├── rascunho.md              # Requisitos originais
├── requirements.txt         # Dependências Python (Flask, requests, pillow)
├── index.html               # Aplicação PWA autônoma offline (GitHub Pages)
├── manifest.json            # Manifesto de instalação PWA para Android
├── sw.js                    # Service Worker para funcionamento 100% offline
├── app.py                   # Servidor backend Flask (opção Python)
├── database.py              # Camada de conexão e tabelas SQLite
├── models.py                # CRUD, regras de preço e relatórios de vendas
├── templates/
│   ├── base.html            # Layout Jinja2 para a versão Flask
│   ├── index.html           # Tela principal para a versão Flask
│   └── produto_form.html    # Formulário para a versão Flask
└── static/
    ├── css/
    │   └── style.css        # Estilos modernos: chocolate, dourado, sombras leves
    ├── js/
    │   └── app.js           # Lógica do PWA: banco local, modais, WhatsApp e backup
    └── icons/
        ├── icon-192.png     # Ícone do app no Android (192x192)
        └── icon-512.png     # Ícone do app no Android (512x512)
```

---

## ⚙️ 7. Status do Projeto

- [x] **Fase 1 (Alinhamento & Requisitos):** Especificação aprovada.
- [x] **Fase 2 (Ambiente & Estrutura):** `.venv`, `requirements.txt` e `.gitignore` configurados.
- [x] **Fase 3 (Camada de Dados & Regra de Preços):** SQLite com tabelas e regras de precificação testadas.
- [x] **Fase 4 (CRUD & Lógica de Negócio):** Cadastro, edição, exclusão, +/-, relatório e cardápio.
- [x] **Fase 5 (Interface Mobile):** Design moderno com tons de confeitaria, bordas arredondadas e sombras.
- [x] **Fase 6 (Suporte PWA Offline):** Manifesto Android, Service Worker e persistência local no aparelho.
- [x] **Fase 7 (Testes & Validação):** Bateria de 46/46 testes automatizados aprovada.