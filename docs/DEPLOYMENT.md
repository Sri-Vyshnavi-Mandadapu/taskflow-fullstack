# Deployment

## 1. MongoDB Atlas

Open https://cloud.mongodb.com and select your project. Check Database Deployments for an existing cluster; if none exists, create a Free cluster. Create a database user with read/write access limited to the `taskflow` database. Atlas website users and database users are different.

Copy the connection URI from Connect > Drivers, inserting the database username and URL-encoded password. Store it only in `.env` and Netlify environment settings.

Configure Atlas Network Access for the server's outbound traffic. Standard Netlify Functions use dynamic outbound addresses. Allowing `0.0.0.0/0` is a broad demo configuration; only use it knowingly with a strong database password and a restricted database user. A fixed outbound network needs a different hosting/network configuration.

Official connection guidance: https://www.mongodb.com/docs/atlas/connect-to-database-deployment/

## 2. Server settings

Set these in https://app.netlify.com/projects/taskflow-fullstack/configuration/env for production:

| Variable | Value |
| --- | --- |
| MONGODB_URI | Atlas driver connection URI |
| MONGODB_DB | taskflow |
| TASKFLOW_ACCESS_KEY | Random shared workspace password of at least 24 characters |

Never prefix secrets with `VITE_`. Never commit `.env`. The existing local installation already has its generated workspace password in `.env`; preserve it unless intentionally rotating access.

For local database verification, put the same database settings in `.env` and run `npm run check:database`. This tests reads, not write permissions.

## 3. Publish

```sh
npx netlify login
npx netlify link --id 3ccfe6b8-3d17-4ff8-8530-d3686c913965
npm test
npm run deploy
```

This project uses manual Netlify deployment. Pushing to GitHub runs CI but does not automatically deploy unless the repository is separately linked in Netlify.

After changing environment variables, redeploy. Visit https://taskflow-fullstack.netlify.app and enter the workspace password. If Netlify shows a team login instead, inspect the project's visitor access settings.

## 4. Verify persistence

Create a temporary task, reload, edit its title and status, and check it in another browser using the same workspace password. Delete the temporary task afterwards. Do not mark live storage verified until this succeeds.

Browser-only tasks on a previous hostname are not automatically migrated.
