# My Portfolio (Vite + React)

## Run locally
```bash
npm install
npm run dev
```

## Deploy to GitHub Pages (Auto via GitHub Actions)
This repo is pre-configured to deploy automatically when you push to the `main` branch.

### 1) Create a GitHub repository
- Create a new repo on GitHub (any name you want, e.g. `my-portfolio`).

### 2) Enable Pages
In your repo:
- **Settings → Pages**
- **Source:** select **GitHub Actions**

### 3) Push your code
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git push -u origin main
```

After the workflow finishes, your site will be available on:
`https://USERNAME.github.io/REPO_NAME/`

## Notes
- `vite.config.js` is set to `base: "./"` which works well for GitHub Pages.
- If you ever switch to React Router (BrowserRouter), GitHub Pages may need extra handling for refresh/404.

## Dashboard data sync (important)
Edits you make in **/dashboard** are saved in **your current browser only** (localStorage). So:
- On another device/browser → you'll see the default data.
- To move your edits to another device (or make them the new default):
  1) Open Dashboard → **Export JSON File**
  2) On the other device, Dashboard → **Import JSON File**
  3) If you want everyone to see the same data by default, copy the exported JSON into `src/data/portfolio.json` then push to GitHub.

## If GitHub Pages shows: “404 There isn't a GitHub Pages site here”
That usually means Pages isn't enabled yet or the workflow didn't deploy.
1) Repo → **Settings → Pages → Source = GitHub Actions**
2) Repo → **Actions** → check the latest “Deploy to GitHub Pages” run is green.
