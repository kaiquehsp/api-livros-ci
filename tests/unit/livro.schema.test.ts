import { describe, expect, it } from 'vitest';
import { livroSchema, livroUpdateSchema, normalizarIsbn, parseId } from '../../src/livros/livro.schema';

const valido = {
  titulo: 'Dom Casmurro',
  autor: 'Machado de Assis',
  isbn: '9788535910663',
  anoPublicacao: 1899,
};

describe('livroSchema', () => {
  it('aceita um livro válido e aplica disponivel=true por padrão', () => {
    expect(livroSchema.parse(valido)).toEqual({ ...valido, disponivel: true });
  });

  it('rejeita título vazio', () => {
    expect(livroSchema.safeParse({ ...valido, titulo: '   ' }).success).toBe(false);
  });

  it('rejeita ISBN com formato inválido', () => {
    expect(livroSchema.safeParse({ ...valido, isbn: '123' }).success).toBe(false);
  });

  it('rejeita ano de publicação no futuro', () => {
    const ano = new Date().getFullYear() + 1;
    expect(livroSchema.safeParse({ ...valido, anoPublicacao: ano }).success).toBe(false);
  });
});

describe('livroUpdateSchema', () => {
  it('aceita atualização parcial', () => {
    expect(livroUpdateSchema.parse({ disponivel: false })).toEqual({ disponivel: false });
  });

  it('rejeita corpo vazio', () => {
    expect(livroUpdateSchema.safeParse({}).success).toBe(false);
  });
});

describe('normalizarIsbn', () => {
  it('remove hífens e espaços', () => {
    expect(normalizarIsbn('978-85-359 1066-3')).toBe('9788535910663');
  });

  it('padroniza o dígito X em maiúsculo', () => {
    expect(normalizarIsbn('0-306-40615-x')).toBe('030640615X');
  });
});

describe('parseId', () => {
  it.each([
    ['1', 1],
    ['42', 42],
  ])('converte "%s" em %d', (entrada, esperado) => {
    expect(parseId(entrada)).toBe(esperado);
  });

  it.each(['0', '-1', 'abc', '1.5', '1;DROP TABLE livros', '99999999999999999999'])(
    'rejeita "%s"',
    (entrada) => {
      expect(parseId(entrada)).toBeNull();
    },
  );
});
