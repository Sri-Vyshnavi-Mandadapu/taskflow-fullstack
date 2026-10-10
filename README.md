# TaskFlow

A responsive shared task board built with React, Vite, Node.js Netlify Functions, and MongoDB Atlas.

**Website:** https://taskflow-fullstack.netlify.app

## Features

- Create, edit, delete, and move tasks between To Do, In Progress, and Done.
- Search tasks, filter priorities, sort tasks, and track completion.
- Light and dark themes, responsive layout, and drag-and-drop controls.
- Password-protected shared workspace and server-side database access.
- Version checks prevent stale saves from overwriting another tab's changes.

## Run locally

Use Node.js 22 or newer (Node.js 22 is used in hosting and CI).

```sh
npm ci
# Copy .env.example to .env and supply your server settings.
npm run dev
```

Open http://localhost:8888. The Netlify development server runs the frontend and API together.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Frontend and API development |
| `npm test` | Backend authorization, validation, persistence, and conflict tests |
| `npm run build` | Production frontend build |
| `npm run check:database` | Read-only check of the configured MongoDB connection |
| `npm run workspace:password` | Display the password from your own local .env |
| `npm run deploy` | Build and deploy to the linked Netlify project |

## Workspace password

This is a shared board password, not your Netlify, GitHub, or Atlas login. The server setting `TASKFLOW_ACCESS_KEY` supplies it. For this local installation, run `npm run workspace:password` to display it. Fresh clones must configure their own `.env`; secrets are never included in Git.

Anyone with the password can read and change the shared board. It remains in browser session storage until sign-out or the browser session ends. This project does not implement individual user accounts, password recovery, or login throttling.

## Project structure

```text
.github/workflows/ci.yml  Automated tests and build
netlify/functions/       Node.js API and MongoDB access
src/
  components/            Task cards, columns, statistics, and editor
  hooks/                 API requests and board synchronization
  state/                 Task state transitions
  App.jsx                Dashboard composition
  Workspace.jsx          Workspace password screen
  main.jsx               React entry point
  styles.css             Responsive styles and themes
public/                  Public static assets
scripts/                 Local setup and database utilities
tests/                   Backend behavior tests
docs/                    Architecture and deployment documentation
.env.example             Server variable template (no real secrets)
netlify.toml             Hosting, API routing, and development settings
```

## Deployment and database setup

See [deployment instructions](docs/DEPLOYMENT.md), [architecture and API](docs/ARCHITECTURE.md), and [current setup status](BACKEND-SETUP.md).

The frontend and API deploy together. MongoDB Atlas must be configured before tasks can be saved. CI checks run without a database using an in-memory test double; live persistence needs a separate Atlas verification.
