This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
pnpm dev
# or
npm run dev
# or
yarn dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Ambiente de Desenvolvimento Local

Para rodar o projeto localmente com o banco de dados PostgreSQL via Docker:

1. Instale as dependências:
   ```bash
   pnpm install
   ```

2. Inicialize o ambiente local e rode os testes (configura o banco de dados e cria dados de teste):
   ```bash
   pnpm setup:local
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   pnpm dev
   ```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

### Comandos Úteis

- `pnpm docker:up`: Inicia apenas o banco de dados PostgreSQL.
- `pnpm docker:down`: Para e remove os containers Docker.
- `pnpm db:seed`: Popula o banco com dados iniciais para testes.
- `pnpm check:all`: Roda verificação de tipos, lint e testes unitários.
- `pnpm test`: Roda os testes unitários/integração com Vitest.
- `pnpm test:e2e`: Roda os testes ponta-a-ponta com Playwright.

access: https://dividi-two.vercel.app

## Licença

Este projeto está licenciado sob os termos da licença MIT. Consulte o arquivo [LICENSE](./LICENSE) para obter mais detalhes.
