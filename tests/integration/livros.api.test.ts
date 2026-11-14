import type { Express } from 'express';
import type { Pool } from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { criarApp } from '../../src/app';
import { criarPool, migrar } from '../../src/db';

/**
 * Testes de integração: API HTTP + PostgreSQL real.
 * No CI o banco é um "service container" do GitHub Actions; localmente use DATABASE_URL.
 */
let pool: Pool;
let app: Express;

const novoLivro = {
  titulo: 'Grande Sertão: Veredas',
  autor: 'João Guimarães Rosa',
  isbn: '978-85-209-2325-1',
  anoPublicacao: 1956,
};

beforeAll(async () => {
  pool = criarPool(process.env.DATABASE_URL);
  await migrar(pool);
  app = criarApp(pool);
});

beforeEach(async () => {
  await pool.query('TRUNCATE livros RESTART IDENTITY');
});

afterAll(async () => {
  await pool.end();
});

describe('GET /health', () => {
  it('confirma conexão com o banco', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', banco: 'ok' });
  });
});

describe('CRUD /api/livros', () => {
  it('POST cria o livro e persiste no PostgreSQL', async () => {
    const res = await request(app).post('/api/livros').send(novoLivro);
    expect(res.status).toBe(201);
    expect(res.headers.location).toBe(`/api/livros/${res.body.id}`);
    expect(res.body).toMatchObject({ ...novoLivro, isbn: '9788520923251', disponivel: true });

    const { rows } = await pool.query('SELECT titulo, isbn FROM livros');
    expect(rows).toEqual([{ titulo: novoLivro.titulo, isbn: '9788520923251' }]);
  });

  it('GET lista e GET /:id retorna o livro criado', async () => {
    const { body: criado } = await request(app).post('/api/livros').send(novoLivro);

    const lista = await request(app).get('/api/livros');
    expect(lista.status).toBe(200);
    expect(lista.body).toHaveLength(1);

    const item = await request(app).get(`/api/livros/${criado.id}`);
    expect(item.status).toBe(200);
    expect(item.body.titulo).toBe(novoLivro.titulo);
  });

  it('PUT atualiza parcialmente', async () => {
    const { body: criado } = await request(app).post('/api/livros').send(novoLivro);
    const res = await request(app).put(`/api/livros/${criado.id}`).send({ disponivel: false });
    expect(res.status).toBe(200);
    expect(res.body.disponivel).toBe(false);
    expect(res.body.titulo).toBe(novoLivro.titulo);
  });

  it('DELETE remove e GET passa a retornar 404', async () => {
    const { body: criado } = await request(app).post('/api/livros').send(novoLivro);
    expect((await request(app).delete(`/api/livros/${criado.id}`)).status).toBe(204);
    expect((await request(app).get(`/api/livros/${criado.id}`)).status).toBe(404);
  });

  it('retorna 409 para ISBN duplicado (restrição UNIQUE)', async () => {
    await request(app).post('/api/livros').send(novoLivro);
    const res = await request(app)
      .post('/api/livros')
      .send({ ...novoLivro, titulo: 'Outro' });
    expect(res.status).toBe(409);
  });

  it('retorna 400 com detalhes para dados inválidos', async () => {
    const res = await request(app).post('/api/livros').send({ titulo: '', isbn: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('dados inválidos');
    expect(res.body.detalhes.length).toBeGreaterThan(0);
  });

  it('retorna 400 para id inválido (tentativa de injeção)', async () => {
    const res = await request(app).get('/api/livros/1%3B%20DROP%20TABLE%20livros');
    expect(res.status).toBe(400);
    const { rows } = await pool.query("SELECT to_regclass('livros') AS tabela");
    expect(rows[0].tabela).toBe('livros');
  });

  it('retorna 400 para JSON malformado', async () => {
    const res = await request(app)
      .post('/api/livros')
      .set('Content-Type', 'application/json')
      .send('{"titulo":');
    expect(res.status).toBe(400);
  });
});
