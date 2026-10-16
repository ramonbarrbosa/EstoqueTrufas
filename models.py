# models.py
# Regras de negócio, CRUD de produtos e cálculo de vendas

from database import get_connection
from datetime import date


# ─── Regra de Preço ────────────────────────────────────────────────────────────

def calcular_preco(nome: str) -> float:
    """Retorna R$4,80 se o nome contiver 'cravejado/cravejada', caso contrário R$4,00."""
    nome_lower = nome.lower()
    if "cravejado" in nome_lower or "cravejada" in nome_lower:
        return 4.80
    return 4.00


# ─── CRUD de Produtos ───────────────────────────────────────────────────────────

def listar_produtos():
    """Retorna todos os produtos ordenados por nome."""
    conn = get_connection()
    produtos = conn.execute(
        "SELECT * FROM produtos ORDER BY nome ASC"
    ).fetchall()
    conn.close()
    return produtos


def buscar_produto(produto_id: int):
    """Retorna um produto pelo ID."""
    conn = get_connection()
    produto = conn.execute(
        "SELECT * FROM produtos WHERE id = ?", (produto_id,)
    ).fetchone()
    conn.close()
    return produto


def criar_produto(nome: str, quantidade: int) -> int:
    """Cria um produto com o preço calculado automaticamente. Retorna o ID criado."""
    preco = calcular_preco(nome)
    status = "disponivel" if quantidade > 0 else "esgotado"
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO produtos (nome, quantidade, preco, status) VALUES (?, ?, ?, ?)",
        (nome.strip(), quantidade, preco, status)
    )
    conn.commit()
    produto_id = cursor.lastrowid
    conn.close()
    return produto_id


def atualizar_produto(produto_id: int, nome: str, quantidade: int):
    """Atualiza nome, quantidade, preço (recalculado) e status de um produto."""
    preco = calcular_preco(nome)
    status = "disponivel" if quantidade > 0 else "esgotado"
    conn = get_connection()
    conn.execute(
        """UPDATE produtos
           SET nome = ?, quantidade = ?, preco = ?, status = ?,
               atualizado_em = CURRENT_TIMESTAMP
           WHERE id = ?""",
        (nome.strip(), quantidade, preco, status, produto_id)
    )
    conn.commit()
    conn.close()


def deletar_produto(produto_id: int):
    """Exclui um produto pelo ID."""
    conn = get_connection()
    conn.execute("DELETE FROM produtos WHERE id = ?", (produto_id,))
    conn.commit()
    conn.close()


# ─── Controle de Estoque (+ / -) ───────────────────────────────────────────────

def adicionar_estoque(produto_id: int, quantidade: int = 1):
    """Adiciona unidades ao estoque (nova fornada). Atualiza status para disponível."""
    conn = get_connection()
    conn.execute(
        """UPDATE produtos
           SET quantidade = quantidade + ?,
               status = 'disponivel',
               atualizado_em = CURRENT_TIMESTAMP
           WHERE id = ?""",
        (quantidade, produto_id)
    )
    conn.commit()
    conn.close()


def registrar_venda(produto_id: int, quantidade: int = 1):
    """
    Dá baixa de 'quantidade' unidades do estoque e registra no histórico de vendas.
    Retorna False se o estoque for insuficiente.
    """
    conn = get_connection()
    produto = conn.execute(
        "SELECT * FROM produtos WHERE id = ?", (produto_id,)
    ).fetchone()

    if not produto or produto["quantidade"] < quantidade:
        conn.close()
        return False

    nova_qtd = produto["quantidade"] - quantidade
    novo_status = "disponivel" if nova_qtd > 0 else "esgotado"

    conn.execute(
        """UPDATE produtos
           SET quantidade = ?, status = ?, atualizado_em = CURRENT_TIMESTAMP
           WHERE id = ?""",
        (nova_qtd, novo_status, produto_id)
    )
    conn.execute(
        """INSERT INTO historico_vendas
               (produto_id, nome_produto, quantidade_vendida, preco_unitario, total)
           VALUES (?, ?, ?, ?, ?)""",
        (produto_id, produto["nome"], quantidade,
         produto["preco"], produto["preco"] * quantidade)
    )
    conn.commit()
    conn.close()
    return True


# ─── Relatório de Vendas ────────────────────────────────────────────────────────

def relatorio_vendas():
    """Retorna dicionário com faturamento e quantidade vendida hoje e no mês."""
    conn = get_connection()
    hoje = date.today().isoformat()
    mes_atual = hoje[:7]  # Formato: YYYY-MM

    # Vendas de hoje
    hoje_row = conn.execute(
        """SELECT COALESCE(SUM(total), 0) AS faturamento,
                  COALESCE(SUM(quantidade_vendida), 0) AS quantidade
           FROM historico_vendas
           WHERE DATE(vendido_em) = ?""",
        (hoje,)
    ).fetchone()

    # Vendas do mês
    mes_row = conn.execute(
        """SELECT COALESCE(SUM(total), 0) AS faturamento,
                  COALESCE(SUM(quantidade_vendida), 0) AS quantidade
           FROM historico_vendas
           WHERE strftime('%Y-%m', vendido_em) = ?""",
        (mes_atual,)
    ).fetchone()

    # Detalhamento por sabor no mês
    detalhes = conn.execute(
        """SELECT nome_produto,
                  SUM(quantidade_vendida) AS quantidade,
                  SUM(total) AS faturamento
           FROM historico_vendas
           WHERE strftime('%Y-%m', vendido_em) = ?
           GROUP BY nome_produto
           ORDER BY faturamento DESC""",
        (mes_atual,)
    ).fetchall()

    conn.close()
    return {
        "hoje": {
            "faturamento": round(hoje_row["faturamento"], 2),
            "quantidade": hoje_row["quantidade"],
        },
        "mes": {
            "faturamento": round(mes_row["faturamento"], 2),
            "quantidade": mes_row["quantidade"],
        },
        "detalhes_mes": [dict(d) for d in detalhes],
    }

