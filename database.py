# database.py
# Conexão e inicialização do banco de dados SQLite

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "estoque.db")


def get_connection():
    """Retorna uma conexão com o banco de dados SQLite."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Permite acessar colunas pelo nome
    return conn


def init_db():
    """Cria as tabelas do banco de dados caso ainda não existam."""
    conn = get_connection()
    cursor = conn.cursor()

    # Tabela de produtos/sabores
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            quantidade INTEGER NOT NULL DEFAULT 0,
            preco REAL NOT NULL DEFAULT 4.00,
            status TEXT NOT NULL DEFAULT 'disponivel',
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Tabela de histórico de vendas (gerada a cada baixa de estoque)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS historico_vendas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            produto_id INTEGER NOT NULL,
            nome_produto TEXT NOT NULL,
            quantidade_vendida INTEGER NOT NULL DEFAULT 1,
            preco_unitario REAL NOT NULL,
            total REAL NOT NULL,
            vendido_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (produto_id) REFERENCES produtos(id)
        )
    """)

    conn.commit()
    conn.close()

