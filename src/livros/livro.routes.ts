import { Router } from 'express';
import { HttpError } from '../errors';
import { parseId } from './livro.schema';
import type { LivroService } from './livro.service';

function idDaRota(valor: string): number {
  const id = parseId(valor);
  if (id === null) throw new HttpError(400, 'id inválido');
  return id;
}

export function criarLivroRoutes(service: LivroService): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(await service.listar());
  });

  router.get('/:id', async (req, res) => {
    res.json(await service.obter(idDaRota(req.params.id)));
  });

  router.post('/', async (req, res) => {
    const livro = await service.criar(req.body);
    res.status(201).location(`/api/livros/${livro.id}`).json(livro);
  });

  router.put('/:id', async (req, res) => {
    res.json(await service.atualizar(idDaRota(req.params.id), req.body));
  });

  router.delete('/:id', async (req, res) => {
    await service.remover(idDaRota(req.params.id));
    res.status(204).end();
  });

  return router;
}
