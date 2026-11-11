"""cascade de exclusao de conta: transacoes e categorias do usuario

Revision ID: 8c1d9a7f3b21
Revises: 0fa6c111d1fe

Motivo: `DELETE /auth/me` (LGPD - direito ao esquecimento) falhava com
IntegrityError quando o usuario tinha lancamentos ou categorias, porque as FKs
apontavam para users.id sem ON DELETE CASCADE.
"""
from alembic import op

revision = "8c1d9a7f3b21"
down_revision = "0fa6c111d1fe"
branch_labels = None
depends_on = None


def _drop_fk(table: str, column: str) -> None:
    """Dropa a FK de `column` sem depender do nome gerado pelo Postgres."""
    op.execute(
        f"""
        DO $$
        DECLARE c_name text;
        BEGIN
            SELECT tc.constraint_name INTO c_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
             AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_name = '{table}'
              AND kcu.column_name = '{column}';
            IF c_name IS NOT NULL THEN
                EXECUTE format('ALTER TABLE {table} DROP CONSTRAINT %I', c_name);
            END IF;
        END $$;
        """
    )


def upgrade() -> None:
    # Lancamentos do titular: apagar junto com a conta.
    _drop_fk("trasactions", "user_id")
    op.create_foreign_key(
        "fk_trasactions_user_id_users",
        "trasactions",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # Categorias: mantem as transacoes (ja apagadas) intactas, mas evita orfaos.
    _drop_fk("category", "user_id")
    op.create_foreign_key(
        "fk_category_user_id_users",
        "category",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("fk_category_user_id_users", "category", type_="foreignkey")
    op.create_foreign_key(
        "category_user_id_fkey", "category", "users", ["user_id"], ["id"]
    )

    op.drop_constraint("fk_trasactions_user_id_users", "trasactions", type_="foreignkey")
    op.create_foreign_key(
        "trasactions_user_id_fkey", "trasactions", "users", ["user_id"], ["id"]
    )
