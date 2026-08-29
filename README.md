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
| push to engine `production` | build against docs `production`, then build an image and deploy it |
| push to **content** `develop` | content repo dispatches CI here on `develop` — build only |
| push to **content** `production` | content repo dispatches Deploy here on `production` — build and deploy |

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

The built site is baked into an image and served by `static-web-server` (~5 MB) on the same VPS as
the API, behind the host nginx. **This replaced GitHub Pages.** One machine now terminates TLS for
`mycard24.ru`, `docs`, `api` and `app`, with a single wildcard certificate issued by acme.sh over
the Cloudflare DNS API and renewed from cron.

The container does not run nginx: nginx is already in front as TLS terminator and router, and a
second one inside would mean two configs for the same routing with only the outer one visible to
`nginx -t`. So the container serves files, and the vhost owns the 404 page and the cache policy —
HTML revalidates, because a legal document must never be served stale after it changes, while
fingerprinted assets stay immutable for a year.

Details in [deploy/README.md](deploy/README.md).

## One-time repository setup

On the repository's **production** environment:

| Kind | Name | Value |
|---|---|---|
| Secret | `SSH_KEY` | the deploy key's private half |
| Variable | `SSH_HOST` | `api.mycard24.ru` |
| Variable | `SSH_USER` | `root` |
| Variable | `SSH_PORT` | `48802` — **not 22** |
| Variable | `PROD_ENV` | the body of `prod.env.example` |

And optionally, as repository secrets:

| Kind | Name | Purpose |
| --- | --- | --- |
| Secret | `DOCS_REPO_TOKEN` | only if mycard24-docs is made private |
| Secret | `DOCSEARCH_APP_ID`, `DOCSEARCH_API_KEY`, `DOCSEARCH_INDEX_NAME` | enables Algolia search |

Search is optional by design: without those three the site builds and serves normally, minus the
search box.

Set the default branch to `develop` and protect `production`.

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
