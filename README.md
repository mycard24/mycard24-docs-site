# mycard24-docs-site

Docusaurus engine for **https://docs.mycard24.ru**. This repo holds the build and the deploy; the
pages live in [mycard24-docs](https://github.com/mycard24/mycard24-docs) and are cloned in at build
time.

## Why two repos

Content changes are frequent, reviewable prose; engine changes are rare and technical. Splitting them
means a typo fix in a legal document never touches build configuration, and whoever writes the text
needs no Node toolchain.

## Locales

Russian only, and it is the binding version of every legal document. The engine is already wired for
more: adding `en` to `i18n.locales` in `docusaurus.config.ts` plus the files under
`i18n/<locale>/docusaurus-plugin-content-docs/current/` **in the content repo** is the whole change.
A page without a translation falls back to Russian.

Docs are served at the root (`routeBasePath: '/'`), so legal pages get short URLs:
`docs.mycard24.ru/legal/privacy_policy/`.

## Local development

```bash
npm ci
git clone https://github.com/mycard24/mycard24-docs.git external-docs
rm -rf docs i18n && mv external-docs/docs ./docs
npm start        # fast refresh
npm run build    # matches CI
npm run serve    # look at the built output
```

`docs/index.md` in this repo is a placeholder so the engine runs standalone; the build always
replaces it.

## Pipeline

`build.yml` is a reusable workflow and the only place the site is ever built. CI and Deploy both call
it, so what gets published is produced by exactly the steps that were validated.

| Trigger | What happens |
| --- | --- |
| push to engine `develop`, or a PR | build against docs `develop` (a PR builds against `production`) |
| push to engine `production` | build against docs `production`, then publish to Pages |
| push to **content** `develop` | content repo dispatches CI here on `develop` — build only |
| push to **content** `production` | content repo dispatches Deploy here on `production` — build and publish |

Content follows the engine branch: a build on `develop` clones docs `develop`, a build on
`production` clones docs `production`. Pull requests build against `production` content, since that
is what a merge will ship.

Releasing the engine is a fast-forward merge:

```bash
git switch production && git merge --ff-only develop && git push
```

A content-only change has no new engine commit, so the dispatch just re-runs the build on the same
engine sha against the new text.

## Runtime

GitHub Pages serves the static output; there is no server and no container. Pages handles TLS for
`docs.mycard24.ru` and applies its own caching, so unlike the API there is no nginx config here.

`static/CNAME` is what binds the custom domain, and it must reach the artifact on every deploy —
Pages drops the domain otherwise. The build fails rather than publishing without it.

## One-time repository setup

1. **Settings → Pages → Source: GitHub Actions.**
2. **Settings → Pages → Custom domain:** `docs.mycard24.ru`, then tick **Enforce HTTPS** once the
   certificate is issued.
3. **DNS:** `CNAME docs.mycard24.ru → mycard24.github.io`. (The apex `mycard24.ru` uses A records to
   `185.199.108–111.153` and belongs to the landing repo — leave it alone.)
4. **Settings → Branches:** default branch `develop`; protect `production`.

| Kind | Name | Purpose |
| --- | --- | --- |
| Secret (optional) | `DOCS_REPO_TOKEN` | only if mycard24-docs is made private |
| Secret (optional) | `DOCSEARCH_APP_ID`, `DOCSEARCH_API_KEY`, `DOCSEARCH_INDEX_NAME` | enables Algolia search |

Search is optional by design: without those three variables the site builds and serves normally,
minus the search box.

## Icons

`static/img/logo.svg` is the same mark as `public/icon.svg` in mycard24-web-landing — keep them
identical. Everything else in `static/` is generated from `static/img/favicon.svg`, which is that
mark on a square canvas:

```sh
rsvg-convert -w 16  -h 16  static/img/favicon.svg -o static/favicon-16x16.png
rsvg-convert -w 32  -h 32  static/img/favicon.svg -o static/favicon-32x32.png
rsvg-convert -w 192 -h 192 static/img/favicon.svg -o static/android-chrome-192x192.png
rsvg-convert -w 512 -h 512 static/img/favicon.svg -o static/android-chrome-512x512.png
# iOS composites a transparent PNG onto black, which would swallow the magenta card.
rsvg-convert -w 180 -h 180 --background-color=white static/img/favicon.svg -o static/apple-touch-icon.png
```

`favicon.ico` wraps the 16 and 32 px PNGs in an ICO container (PNG payloads, Vista and later).
