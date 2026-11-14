import { HttpError } from '../errors';
import type { LivroRepository } from './livro.repository';
import { livroSchema, livroUpdateSchema, normalizarIsbn, type Livro } from './livro.schema';

/** Regras de negócio de livros, independentes de HTTP e do banco. */
export function criarLivroService(repo: LivroRepository) {
  async function obter(id: number): Promise<Livro> {
    const livro = await repo.buscarPorId(id);
    if (!livro) throw new HttpError(404, `livro ${id} não encontrado`);
    return livro;
  }

  async function garantirIsbnLivre(isbn: string, idAtual?: number) {
    const existente = await repo.buscarPorIsbn(isbn);
    if (existente && existente.id !== idAtual) {
      throw new HttpError(409, `já existe um livro com o ISBN ${isbn}`);
    }
  }

  return {
    listar: () => repo.listar(),

    obter,

    async criar(corpo: unknown): Promise<Livro> {
      const bruto = corpo as Record<string, unknown> | undefined;
      const dados = livroSchema.parse({
        ...bruto,
        isbn: typeof bruto?.isbn === 'string' ? normalizarIsbn(bruto.isbn) : bruto?.isbn,
      });
      await garantirIsbnLivre(dados.isbn);
      return repo.criar(dados);
    },

    async atualizar(id: number, corpo: unknown): Promise<Livro> {
      const bruto = corpo as Record<string, unknown> | undefined;
      const dados = livroUpdateSchema.parse({
        ...bruto,
        ...(typeof bruto?.isbn === 'string' ? { isbn: normalizarIsbn(bruto.isbn) } : {}),
      });
      await obter(id);
      if (dados.isbn) await garantirIsbnLivre(dados.isbn, id);
      const atualizado = await repo.atualizar(id, dados);
      if (!atualizado) throw new HttpError(404, `livro ${id} não encontrado`);
      return atualizado;
    },

    async remover(id: number): Promise<void> {
      const removido = await repo.remover(id);
      if (!removido) throw new HttpError(404, `livro ${id} não encontrado`);
    },
  };
}

export type LivroService = ReturnType<typeof criarLivroService>;
