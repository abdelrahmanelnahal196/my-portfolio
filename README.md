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
