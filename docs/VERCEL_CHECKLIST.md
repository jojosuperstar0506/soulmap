# Vercel setup checklist — fix 404

Use this list in order. After each change, **redeploy** (Deployments → ⋯ → Redeploy) and test the **Visit** URL again.

---

## 1. General (Settings → General)

| Setting | Should be |
|--------|------------|
| **Framework Preset** | Next.js (auto-detected; don’t change unless wrong) |
| **Root Directory** | **Leave blank** (or `.`). If your app lives in a subfolder (e.g. `soulmap/`), set it to that folder. |
| **Node.js Version** | **20.x** (or 18.x if 20 isn’t available) |
| **Build Command** | Leave default, or `npm run build` (must use `next build --webpack` via your `package.json` script) |
| **Output Directory** | Leave default (empty for Next.js) |
| **Install Command** | Leave default (`npm install` or `yarn install`) |

---

## 2. Git (Settings → Git)

| Setting | Check |
|--------|--------|
| **Production Branch** | `main` (or whatever branch you push to) |
| **Connected repository** | Correct GitHub repo (e.g. `jojosuperstar0506/soulmap`) |

---

## 3. Environment variables (Settings → Environment Variables)

These are **not** required for the site to load (they don’t cause 404). Add them when you want features to work:

| Name | Where to use | Notes |
|------|----------------|-------|
| `GEMINI_API_KEY` | Production, Preview | If your app uses Gemini for Blueprint narrative |
| `ANTHROPIC_API_KEY` | Production, Preview | If your app uses Anthropic for Blueprint narrative |

- **Environment:** tick **Production** (and Preview if you want previews to work).
- After adding or changing variables, **redeploy** (variables are baked in at build time for some frameworks; for Next.js they’re usually runtime, but redeploy once to be sure).

---

## 4. Domains (Settings → Domains)

- Your default URL is something like `soulmap-xxxx.vercel.app` or `soulmap-lyart.vercel.app`.
- Make sure the domain you’re opening is listed here and has no error.
- If you added a custom domain, wait until it shows “Valid” and try that URL (or try the default `.vercel.app` URL first).

---

## 5. Build logs (to confirm the app built correctly)

1. Go to **Deployments**.
2. Open the **latest deployment** (the one that’s “Ready”).
3. Open the **Building** step / logs.
4. At the end you should see something like:
   ```text
   Route (app)
   ┌ ○ /
   └ ○ /_not-found
   ```
   If **`/`** is listed, the root route was built. If it’s missing, the build or repo structure is wrong (often **Root Directory**).

---

## 6. Root Directory (most common cause of 404)

- If your **GitHub repo root** has `package.json` and `src/` at the top level → **Root Directory** must be **empty** (or `.`).
- If your app is inside a subfolder (e.g. repo has `apps/soulmap/` with `package.json` inside) → set **Root Directory** to that folder (e.g. `apps/soulmap`).
- Wrong Root Directory makes Vercel build the wrong place and can result in 404 for `/`.

---

## 7. Clear cache and redeploy

1. **Deployments** → click **⋯** on the latest deployment.
2. **Redeploy**.
3. Enable **Clear build cache** (or “Redeploy with empty cache”).
4. Confirm. Wait for the new deployment to be **Ready**.
5. Open **Visit** for **this** new deployment (not an old URL).

---

## 8. What to try if it’s still 404

1. Open the **exact** deployment URL from the **Visit** button (e.g. `https://soulmap-9hep6k9bi-jojosuperstar0506s-projects.vercel.app/`).
2. Try with a trailing slash: `...vercel.app/` and without `...vercel.app`.
3. In **Build logs**, confirm **`/`** appears under **Route (app)**. If it doesn’t, fix **Root Directory** and/or repo structure, then push and redeploy again.

Environment variables are for API keys and feature behavior; they don’t fix 404. Focus on **Root Directory**, **Node version**, **build logs**, and **cache-free redeploy** first.
