This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Automatic football research

There is no periodic GitHub Actions trigger. `scheduled-research.yml` can only
be started explicitly with **Run workflow**. This checks saved, enabled Profile
schedules; it does not force research before their selected time. With no due
schedules the endpoint returns `updatedUsers: 0`.

Profile saves schedule preferences but does not enable a background scheduler.
Controlling the workflow itself from Profile still requires a server-side scheduler
integration. Until that is connected, use **Refresh research** on the dashboard
for an immediate update. Opening a page does not request fresh AI research.

If an older workflow is already published, disable it in GitHub Actions immediately
to stop its old cron trigger. Local changes only take effect after publication on
the default branch. Disable the old `Daily football update` workflow too, if present.
Already-running requests can still finish.

Deployment setup:

- Apply `supabase/schema.sql` when initializing the database, including
  `schedule_settings` and its row-level access policies.
- Set repository Actions variable `APP_URL` to the deployed application's base URL.
- Set repository Actions secret `CRON_SECRET` to match the deployment's `CRON_SECRET`.
- Configure the deployment's Supabase variables, including `SUPABASE_SERVICE_ROLE_KEY`,
  and the research provider credentials from `.env.example`.
- Publish the workflow on the repository's default branch and deploy the application changes.

Run schedule regression checks with Node.js 24: `node --test tests/schedule.test.mjs`.

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

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
