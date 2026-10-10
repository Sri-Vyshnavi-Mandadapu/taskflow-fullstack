# Architecture and API

The browser calls the same-origin `/api/board` endpoint. Netlify routes it to `netlify/functions/board.mjs`, which checks the workspace password, validates requests, and reads or updates MongoDB. The MongoDB URI never goes to the browser.

One document with `_id: workspace` in the `boards` collection stores the shared board. Writes include a version number; the server atomically checks it and increments it to reject stale saves. Connections are reused across warm function invocations.

## HTTP API

Both methods require `Authorization: Bearer <workspace password>`.

- `GET /api/board`: returns `{ tasks, version }`.
- `PUT /api/board`: accepts JSON `{ tasks, version }` and returns the confirmed saved board.

Responses: 400 invalid data; 401 wrong password; 405 unsupported method; 409 version conflict; 413 oversized request; 415 unsupported content type; 503 unavailable or unconfigured database.

Each task contains `id`, `title`, `description`, `status`, `priority`, `tags`, and `createdAt` (epoch milliseconds). Status is `todo`, `in-progress`, or `done`; priority is `low`, `medium`, or `high`.

Limits: 500 tasks, 200 title characters, 5,000 description characters, 10 tags of 40 characters, and 1 MB request bodies.

## Failure behavior

Changes appear after the server confirms the write. A failed or uncertain save disables further edits until reloading the board. A reload resolves the latest version after a conflict. Theme preferences are browser-local.

## Tests

`npm test` covers authorization, validation, CRUD, concurrent initial saves, stale writes, malformed requests, and safe error responses. Database access is replaced with an in-memory collection for these tests. `npm run check:database` checks actual database connectivity without modifying tasks.
