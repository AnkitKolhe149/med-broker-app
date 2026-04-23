Deployment steps for Vercel (Frontend)

1. Project setup
- Create a Vercel account and link your GitHub repository.
- In Vercel, create a new Project and select the `frontend` folder as the root directory.

2. Build settings
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

3. Environment variables (Vite vars must start with `VITE_`):
- `VITE_API_BASE_URL` — URL of your backend API (e.g. `https://api.example.com`)
- `VITE_RAZORPAY_KEY_ID` — (optional) Razorpay Key ID for client usage (only public key)

4. Backend hosting (recommended separately)
- Keep the backend on a dedicated host (Render, Railway, DigitalOcean App Platform, Heroku, or your own VPS).
- Ensure the backend has a managed Postgres database and the following env vars (non-exhaustive):
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `RAZORPAY_ENABLED`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
  - `PLATFORM_COMMISSION_PERCENT`
  - Any other entries in `backend/.env.example`

5. Local testing
- Build locally to verify:

```bash
cd frontend
npm install
npm run build
npx serve dist  # or use vite preview
```

6. Notes
- Do NOT store secret keys (Razorpay secret, DB URL, JWT secret) in Vercel frontend envs. Put them in the backend host.
- If you want a proxy from Vercel to your API, configure Vercel rewrites to target `VITE_API_BASE_URL`.

If you want, I can create a small GitHub Action to run `npm run build` and preview the output before you connect to Vercel.
