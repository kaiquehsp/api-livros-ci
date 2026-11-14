import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Pool } from 'pg';
import { tratarErros } from './errors';
import { criarLivroRepository } from './livros/livro.repository';
import { criarLivroRoutes } from './livros/livro.routes';
import { criarLivroService } from './livros/livro.service';

export function criarApp(pool: Pool): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', async (_req, res) => {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', banco: 'ok' });
  });

  const service = criarLivroService(criarLivroRepository(pool));
  app.use('/api/livros', criarLivroRoutes(service));

  app.use((_req, res) => {
    res.status(404).json({ erro: 'rota não encontrada' });
  });
  app.use(tratarErros);
  return app;
}
