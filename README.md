# Revolution Trading Room

A real-time, browser-based trading room platform: authenticated rooms with live
audio/video, chat, alerts, a collaborative whiteboard, theming, and Spotify
integration.

## Tech Stack

- **UI:** React 19 + TypeScript 6, [Fluent UI](https://react.fluentui.dev/)
  components, Framer Motion, Tailwind CSS 4
- **State:** Zustand (with Immer), React Router 7
- **Backend:** [Supabase](https://supabase.com/) (auth, Postgres, storage, realtime)
- **Real-time media:** LiveKit + Daily
- **Build/test:** Vite 8 (Rolldown), Vitest 4, Playwright, ESLint 9, Puppeteer

## Requirements

- **Node.js `24.16.0`** (see `engines` in `package.json`; an `.nvmrc` is provided)
- npm `>= 10`

## Getting Started

```bash
npm install
cp .env.example .env   # then fill in the values below
npm run dev
```

### Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | yes | Supabase project URL (must be HTTPS) |
| `VITE_SUPABASE_ANON_KEY` | yes | Supabase anonymous/public API key |
| `VITE_API_BASE_URL` | no | Optional API base URL |
| `VITE_LIVEKIT_URL` | no | LiveKit server URL for real-time media |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | TypeScript type-check (no emit) |
| `npm run lint` / `lint:fix` | ESLint over `src`, `tests`, `scripts` |
| `npm run test:unit` | Run unit tests (Vitest) |
| `npm run test:coverage` | Unit tests with coverage |
| `npm run test:e2e` | Playwright end-to-end tests |

## Project Structure

```
src/
  app/          Application shell & routing (lazy-loaded routes)
  components/   Feature UI (trading, chat, rooms, alerts, modals, theme)
  features/     Self-contained features (whiteboard, audio, chat, mic, theme)
  store/        Zustand stores (auth, theme, integrations, …)
  services/     Domain/services layer (Supabase API, audio, camera, sound)
  lib/          Cross-cutting libs (supabase client, monitoring, errors)
  icons/        Curated FluentUI icon barrel + Font Awesome setup
  utils/        Shared utilities (performance, logging, validation)
```

See [`CHANGELOG.md`](./CHANGELOG.md) for the modernization history.
