[![status-badge](http://57.131.20.39:8000/api/badges/1/status.svg)](http://57.131.20.39:8000/repos/1)

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

## Docker

Build the production image:

```bash
docker build -t nokan-taskboard .
```

The build stage reads the `.env` file (if present in the project root), so ensure it contains valid Supabase and auth credentials before you build.

Run the container (update the `.env` path if needed to forward the same values at runtime):

```bash
docker run --env-file .env -p 6969:3000 nokan-taskboard
```

The app listens on port `3000` inside the container; the command above maps it to host port `6969`.

## Learn More

To learn more about Next.js, take a look at the following resources:

-    [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
-    [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
