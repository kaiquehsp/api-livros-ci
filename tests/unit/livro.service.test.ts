import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import { HttpError } from '../../src/errors';
import type { LivroRepository } from '../../src/livros/livro.repository';
import type { Livro } from '../../src/livros/livro.schema';
import { criarLivroService } from '../../src/livros/livro.service';

const livro: Livro = {
  id: 1,
  titulo: 'Dom Casmurro',
  autor: 'Machado de Assis',
  isbn: '9788535910663',
  anoPublicacao: 1899,
  disponivel: true,
  criadoEm: '2026-01-01T00:00:00.000Z',
};

function repoFalso(): LivroRepository {
  return {
    listar: vi.fn().mockResolvedValue([livro]),
    buscarPorId: vi.fn().mockResolvedValue(null),
    buscarPorIsbn: vi.fn().mockResolvedValue(null),
    criar: vi.fn().mockImplementation((d) => Promise.resolve({ ...livro, ...d, id: 2 })),
    atualizar: vi.fn().mockImplementation((id, d) => Promise.resolve({ ...livro, ...d, id })),
    remover: vi.fn().mockResolvedValue(true),
  };
}

describe('LivroService (repositório simulado)', () => {
  let repo: LivroRepository;
  let service: ReturnType<typeof criarLivroService>;

  beforeEach(() => {
    repo = repoFalso();
    service = criarLivroService(repo);
  });

  it('cria livro normalizando o ISBN', async () => {
    const criado = await service.criar({ ...livro, isbn: '978-85-359-1066-3', id: undefined });
    expect(repo.criar).toHaveBeenCalledWith(expect.objectContaining({ isbn: '9788535910663' }));
    expect(criado.id).toBe(2);
  });

  it('impede ISBN duplicado com erro 409', async () => {
    vi.mocked(repo.buscarPorIsbn).mockResolvedValue(livro);
    await expect(service.criar(livro)).rejects.toMatchObject({ status: 409 });
    expect(repo.criar).not.toHaveBeenCalled();
  });

  it('propaga erro de validação para corpo inválido', async () => {
    await expect(service.criar({ titulo: '' })).rejects.toBeInstanceOf(ZodError);
  });

  it('retorna 404 ao obter livro inexistente', async () => {
    await expect(service.obter(99)).rejects.toEqual(new HttpError(404, 'livro 99 não encontrado'));
  });

  it('permite atualizar mantendo o próprio ISBN', async () => {
    vi.mocked(repo.buscarPorId).mockResolvedValue(livro);
    vi.mocked(repo.buscarPorIsbn).mockResolvedValue(livro);
    const atualizado = await service.atualizar(1, { isbn: livro.isbn, disponivel: false });
    expect(atualizado.disponivel).toBe(false);
  });

  it('retorna 404 ao remover livro inexistente', async () => {
    vi.mocked(repo.remover).mockResolvedValue(false);
    await expect(service.remover(5)).rejects.toMatchObject({ status: 404 });
  });
});
