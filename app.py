import os
from flask import Flask, render_template, jsonify, flash, redirect, url_for, request, send_from_directory
from database import init_db
from models import (
    listar_produtos,
    buscar_produto,
    criar_produto,
    atualizar_produto,
    deletar_produto,
    adicionar_estoque,
    registrar_venda,
    relatorio_vendas,
)

app = Flask(__name__)
app.secret_key = "trufa-estoque-2026"

# Inicializa o banco (cria tabelas se não existirem)
with app.app_context():
    init_db()


# ─── Arquivos PWA ─────────────────────────────────────────────────────────────
@app.route("/manifest.json")
def manifest():
    return send_from_directory(os.path.dirname(__file__), "manifest.json", mimetype="application/manifest+json")


@app.route("/sw.js")
def service_worker():
    return send_from_directory(os.path.dirname(__file__), "sw.js", mimetype="application/javascript")


# ─── Tela Principal ───────────────────────────────────────────────────────────
@app.route("/")
def index():
    produtos = listar_produtos()
    return render_template("index.html", produtos=produtos)


# ─── Cadastrar Novo Sabor ─────────────────────────────────────────────────────
@app.route("/produto/novo", methods=["GET", "POST"])
def produto_novo():
    if request.method == "POST":
        nome = request.form.get("nome", "").strip()
        quantidade = request.form.get("quantidade", "0").strip()

        # Validações
        if not nome:
            flash("O nome do sabor não pode estar vazio.", "error")
            return render_template("produto_form.html", produto=None)
        try:
            quantidade = int(quantidade)
            if quantidade < 0:
                raise ValueError
        except ValueError:
            flash("A quantidade deve ser um número inteiro maior ou igual a zero.", "error")
            return render_template("produto_form.html", produto=None)

        criar_produto(nome, quantidade)
        flash(f'Sabor "{nome}" cadastrado com sucesso! 🍬', "success")
        return redirect(url_for("index"))

    return render_template("produto_form.html", produto=None)


# ─── Editar Sabor Existente ───────────────────────────────────────────────────
@app.route("/produto/<int:produto_id>/editar", methods=["GET", "POST"])
def produto_editar(produto_id):
    produto = buscar_produto(produto_id)
    if not produto:
        flash("Sabor não encontrado.", "error")
        return redirect(url_for("index"))

    if request.method == "POST":
        nome = request.form.get("nome", "").strip()
        quantidade = request.form.get("quantidade", "0").strip()

        # Validações
        if not nome:
            flash("O nome do sabor não pode estar vazio.", "error")
            return render_template("produto_form.html", produto=produto)
        try:
            quantidade = int(quantidade)
            if quantidade < 0:
                raise ValueError
        except ValueError:
            flash("A quantidade deve ser um número inteiro maior ou igual a zero.", "error")
            return render_template("produto_form.html", produto=produto)

        atualizar_produto(produto_id, nome, quantidade)
        flash(f'Sabor "{nome}" atualizado com sucesso! ✅', "success")
        return redirect(url_for("index"))

    return render_template("produto_form.html", produto=produto)


# ─── Excluir Sabor ────────────────────────────────────────────────────────────
@app.route("/produto/<int:produto_id>/deletar", methods=["POST"])
def produto_deletar(produto_id):
    produto = buscar_produto(produto_id)
    if not produto:
        flash("Sabor não encontrado.", "error")
        return redirect(url_for("index"))

    nome = produto["nome"]
    deletar_produto(produto_id)
    flash(f'Sabor "{nome}" excluído. 🗑️', "info")
    return redirect(url_for("index"))


# ─── Registrar Venda (botão −) ────────────────────────────────────────────────
@app.route("/produto/<int:produto_id>/venda", methods=["POST"])
def produto_venda(produto_id):
    produto = buscar_produto(produto_id)
    if not produto:
        flash("Sabor não encontrado.", "error")
        return redirect(url_for("index"))

    sucesso = registrar_venda(produto_id, quantidade=1)
    if sucesso:
        flash(f'Venda de "{produto["nome"]}" registrada! 💰', "success")
    else:
        flash(f'"{produto["nome"]}" está esgotado. Nenhuma baixa foi feita.', "error")
    return redirect(url_for("index"))


# ─── Adicionar ao Estoque (botão +) ──────────────────────────────────────────
@app.route("/produto/<int:produto_id>/adicionar", methods=["POST"])
def produto_adicionar(produto_id):
    produto = buscar_produto(produto_id)
    if not produto:
        flash("Sabor não encontrado.", "error")
        return redirect(url_for("index"))

    adicionar_estoque(produto_id, quantidade=1)
    flash(f'Estoque de "{produto["nome"]}" atualizado! +1 unidade. 📦', "success")
    return redirect(url_for("index"))


# ─── API: Relatório de Vendas ─────────────────────────────────────────────────
@app.route("/api/relatorio")
def api_relatorio():
    dados = relatorio_vendas()
    return jsonify(dados)


# ─── API: Cardápio para WhatsApp ─────────────────────────────────────────────
@app.route("/api/cardapio")
def api_cardapio():
    produtos = listar_produtos()
    linhas = []
    for p in produtos:
        preco_fmt = f"R$ {p['preco']:.2f}".replace(".", ",")
        if p["status"] == "disponivel":
            linhas.append(f"• {p['nome']}: {p['quantidade']} unid. — {preco_fmt} cada")
        else:
            linhas.append(f"• {p['nome']}: ESGOTADO")

    if linhas:
        corpo = "\n".join(linhas)
    else:
        corpo = "Nenhum sabor cadastrado ainda."

    mensagem = (
        "🍬 *Cardápio de Trufas Disponíveis Hoje:*\n\n"
        + corpo
        + "\n\n📲 Faça seu pedido respondendo a esta mensagem!"
    )
    return jsonify({"mensagem": mensagem})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
