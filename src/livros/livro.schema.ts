import { z } from 'zod';

const anoAtual = new Date().getFullYear();

const livroBase = z.object({
  titulo: z.string().trim().min(1, 'titulo é obrigatório').max(200),
  autor: z.string().trim().min(1, 'autor é obrigatório').max(120),
  isbn: z
    .string()
    .trim()
    .regex(/^(97[89])?\d{9}[\dX]$/, 'isbn deve ter 10 ou 13 dígitos'),
  anoPublicacao: z.number().int().min(1450).max(anoAtual),
  disponivel: z.boolean(),
});

/** Criação: disponivel é opcional e assume true. */
export const livroSchema = livroBase.extend({ disponivel: z.boolean().default(true) });

/** Atualização parcial: sem valores padrão, para não sobrescrever campos não enviados. */
export const livroUpdateSchema = livroBase.partial().refine((dados) => Object.keys(dados).length > 0, {
  message: 'informe ao menos um campo para atualizar',
});

export type LivroInput = z.infer<typeof livroSchema>;
export type LivroUpdate = z.infer<typeof livroUpdateSchema>;

export interface Livro extends LivroInput {
  id: number;
  criadoEm: string;
}

/** Remove hífens e espaços de um ISBN antes da validação. */
export function normalizarIsbn(isbn: string): string {
  return isbn.replace(/[-\s]/g, '').toUpperCase();
}

/** Converte o parâmetro de rota em ID numérico positivo, ou null se inválido. */
export function parseId(valor: string): number | null {
  if (!/^\d+$/.test(valor)) return null;
  const id = Number(valor);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
