# AI DevOps Engineer: frontend

Paste a GitHub repository, get a live deployment. React 19, TypeScript, Vite, Tailwind 4.

```bash
npm install
cp .env.example .env.local   # then fill it in
npm run dev
```

With `VITE_API_BASE_URL` blank the app runs in demo mode: scripted jobs, no backend, no sign-in.

## How it talks to the backend

| What | Where |
| --- | --- |
| Sign in with GitHub | Browser goes to Supabase (`/auth/v1/authorize?provider=github`), which returns to this site with a token in the URL hash. The token is kept in `localStorage` as `auth_token`. |
| Restore session | `GET /auth/session` with `Authorization: Bearer <token>`. Expected fields: `user_id` or `id`, `github_username`, `email`, `avatar_url`, `access_token`. |
| Sign out | `POST /auth/logout` |
| Jobs | `POST /jobs`, `GET /jobs`, `GET /jobs/{id}` |
| Live logs | WebSocket at `/ws/jobs`; the client sends the job id after it opens. Polls `GET /jobs/{id}` every 2s as a fallback. |
| Connect Vercel / Render | `GET /oauth/{platform}/authorize?user_id=...`, then `POST /oauth/{platform}/callback?user_id=...` with `{ code }` |
| Environment variables | Sent with `POST /jobs` as `env_vars` |

## Going live checklist

1. **Backend:** deployed over https, with CORS allowing this site's origin (and `http://localhost:5173` for dev).
2. **Vercel env vars:** `VITE_API_BASE_URL` (the https backend URL), `VITE_USE_MOCK=false`, `VITE_SUPABASE_URL`, optionally `VITE_SUPABASE_ANON_KEY`. Redeploy after changing them.
3. **Supabase > Authentication > URL Configuration:** Site URL and Redirect URLs include the deployed address.
4. **Supabase > Authentication > Providers > GitHub:** enabled, with a GitHub OAuth app whose callback URL is `https://<project>.supabase.co/auth/v1/callback`.
5. **Vercel and Render OAuth apps:** redirect URI points back to this site, so the callback page can finish the connection.
6. **Smoke test:** the navbar should not say "Demo mode"; signing in lands on the deploy form; a job streams logs.
