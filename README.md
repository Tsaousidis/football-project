# Football Intelligence

A personal football dashboard with Claude web research, email-verified accounts,
up to three selected teams, optional scheduled updates and manual Telegram briefings.
The interface is in English.

## Development

Use Node.js 24. Install with npm ci, copy .env.example to .env.local and configure
Supabase and server credentials. Run npm run dev and open http://localhost:3000.
Never commit .env.local.

## Checks and deployment

- npm run lint
- npm run typecheck (after Next.js generates route types)
- npm test
- npm run build
- npm run check:config (production settings; prints no secret values)

Start the production build with npm start.

Read [deployment and acceptance](docs/deployment.md) for the migration order,
required configuration, verified checks and remaining live tests.

## Setup guides

- [Email verification and recovery](docs/auth-setup.md)
- [Team selection](docs/team-selection-setup.md)
- [Claude research](docs/research-setup.md)
- [Telegram connection](docs/telegram-setup.md)
- [Telegram briefing delivery](docs/telegram-briefing.md)
- [Profile-controlled scheduler](docs/scheduler-setup.md)
- [Marketing homepage](docs/homepage.md)

Automatic research is off until enabled and saved in Profile. Disabling removes
the account's scheduled job. Telegram delivery remains an explicit dashboard action.
GitHub Actions has no periodic trigger.
