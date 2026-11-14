import { criarApp } from './app';
import { criarPool, migrar } from './db';

async function main() {
  const pool = criarPool();
  await migrar(pool);
  const porta = Number(process.env.PORT ?? 3000);
  const server = criarApp(pool).listen(porta, () => {
    console.log(`API de livros ouvindo na porta ${porta}`);
  });

  const encerrar = () => {
    server.close(() => void pool.end().then(() => process.exit(0)));
  };
  process.on('SIGTERM', encerrar);
  process.on('SIGINT', encerrar);
}

main().catch((err: unknown) => {
  console.error('Falha ao iniciar a API:', err);
  process.exit(1);
});
