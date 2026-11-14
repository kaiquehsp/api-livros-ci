import type { Pool } from 'pg';
import type { Livro, LivroInput, LivroUpdate } from './livro.schema';

export interface LivroRepository {
  listar(): Promise<Livro[]>;
  buscarPorId(id: number): Promise<Livro | null>;
  buscarPorIsbn(isbn: string): Promise<Livro | null>;
  criar(dados: LivroInput): Promise<Livro>;
  atualizar(id: number, dados: LivroUpdate): Promise<Livro | null>;
  remover(id: number): Promise<boolean>;
}

const COLUNAS = `id, titulo, autor, isbn, ano_publicacao AS "anoPublicacao",
  disponivel, criado_em AS "criadoEm"`;

/** Mapeia campos da API para colunas SQL (lista fechada: evita SQL injection em nomes de coluna). */
const MAPA_COLUNAS = new Map<string, string>([
  ['titulo', 'titulo'],
  ['autor', 'autor'],
  ['isbn', 'isbn'],
  ['anoPublicacao', 'ano_publicacao'],
  ['disponivel', 'disponivel'],
]);

/** Repositório PostgreSQL. Todas as consultas usam parâmetros ($1, $2...). */
export function criarLivroRepository(pool: Pool): LivroRepository {
  return {
    async listar() {
      const { rows } = await pool.query<Livro>(`SELECT ${COLUNAS} FROM livros ORDER BY id`);
      return rows;
    },

    async buscarPorId(id) {
      const { rows } = await pool.query<Livro>(`SELECT ${COLUNAS} FROM livros WHERE id = $1`, [id]);
      return rows[0] ?? null;
    },

    async buscarPorIsbn(isbn) {
      const { rows } = await pool.query<Livro>(`SELECT ${COLUNAS} FROM livros WHERE isbn = $1`, [isbn]);
      return rows[0] ?? null;
    },

    async criar(d) {
      const { rows } = await pool.query<Livro>(
        `INSERT INTO livros (titulo, autor, isbn, ano_publicacao, disponivel)
         VALUES ($1, $2, $3, $4, $5) RETURNING ${COLUNAS}`,
        [d.titulo, d.autor, d.isbn, d.anoPublicacao, d.disponivel],
      );
      return rows[0];
    },

    async atualizar(id, dados) {
      const pares = Object.entries(dados).flatMap(([campo, valor]) => {
        const coluna = MAPA_COLUNAS.get(campo);
        return coluna && valor !== undefined ? [{ coluna, valor }] : [];
      });
      const sets = pares.map(({ coluna }, i) => `${coluna} = $${i + 1}`);
      const valores = pares.map(({ valor }) => valor);
      const { rows } = await pool.query<Livro>(
        `UPDATE livros SET ${sets.join(', ')} WHERE id = $${pares.length + 1} RETURNING ${COLUNAS}`,
        [...valores, id],
      );
      return rows[0] ?? null;
    },

    async remover(id) {
      const { rowCount } = await pool.query('DELETE FROM livros WHERE id = $1', [id]);
      return (rowCount ?? 0) > 0;
    },
  };
}
