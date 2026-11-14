import { Pool } from 'pg';

export function criarPool(connectionString = process.env.DATABASE_URL): Pool {
  if (!connectionString) {
    throw new Error('DATABASE_URL não definida');
  }
  return new Pool({ connectionString, max: 10 });
}

/** Cria o esquema do banco (idempotente). */
export async function migrar(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS livros (
      id             SERIAL PRIMARY KEY,
      titulo         VARCHAR(200) NOT NULL,
      autor          VARCHAR(120) NOT NULL,
      isbn           VARCHAR(13)  NOT NULL UNIQUE,
      ano_publicacao INTEGER      NOT NULL,
      disponivel     BOOLEAN      NOT NULL DEFAULT TRUE,
      criado_em      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);
}
