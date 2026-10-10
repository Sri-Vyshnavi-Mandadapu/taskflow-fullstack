# Current setup status

- Project: https://taskflow-fullstack.netlify.app
- Netlify project ID: `3ccfe6b8-3d17-4ff8-8530-d3686c913965` (unchanged after renaming).
- React frontend and Node.js backend are implemented.
- Production `MONGODB_DB` and `TASKFLOW_ACCESS_KEY` are configured.
- Workspace password is saved locally in ignored `.env`; run `npm run workspace:password` to view it.
- `MONGODB_URI` is still missing as of 2026-10-10. Atlas account access is not connected, so existence of a cluster cannot yet be confirmed.
- Live database persistence remains unverified. Configure Atlas and redeploy before using the board for saved tasks.

See [deployment instructions](docs/DEPLOYMENT.md) and [architecture](docs/ARCHITECTURE.md).
