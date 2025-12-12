<img width="3456" height="2044" alt="screencapture-localhost-3000-2025-11-24-18_52_57" src="https://github.com/user-attachments/assets/365c273a-21d1-4565-9e2e-0e8dd5349a28" />



https://github.com/user-attachments/assets/7d557d2a-9f3c-4dcc-a70d-750b9210129e



This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
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

## Hosting

### Prerequisites

- **Node.js**: Version 20 or higher.
- **Database**: PostgreSQL database.

### Environment Variables

You need to set the following environment variables in your hosting provider's dashboard or a `.env` file:

```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
```

### Deployment

#### Vercel (Recommended)

1.  Push your code to a Git repository (GitHub, GitLab, Bitbucket).
2.  Import the project into [Vercel](https://vercel.com).
3.  Vercel will automatically detect Next.js.
4.  Set the `DATABASE_URL` environment variable in the Vercel project settings.
    - You can use Vercel Postgres, Supabase, Neon, or any other Postgres provider.
5.  **Database Migrations**: To ensure your database schema is up to date during deployment, update the **Build Command** in Vercel settings to:
    ```bash
    npx prisma migrate deploy && next build
    ```
6.  Deploy!

#### Self-Hosting (Docker / Node.js)

1.  **Setup Environment**: Ensure `DATABASE_URL` is set.
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Apply Migrations**:
    ```bash
    npx prisma migrate deploy
    ```
4.  **Build**:
    ```bash
    npm run build
    ```
5.  **Start**:
    ```bash
    npm start
    ```
