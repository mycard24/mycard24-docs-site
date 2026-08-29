# Deploying to the VPS

`docs.mycard24.ru`. One container holding the built site, fronted by the host's nginx on the same box as the
API. **This replaced GitHub Pages** — one machine terminating TLS, one wildcard certificate, one
place to look when something is wrong.

## Layout on the server

```
/opt/mycard24-docs-site/
  docker-compose.yml     copied by CD from this repo
  .env                   written by CD, mode 0600 — PROD_ENV plus IMAGE and IMAGE_TAG
```

No database, no volumes, nothing to back up: the site is baked into the image, so the image tag
*is* the release.

## Why the container does not run nginx

It runs `static-web-server`, about 5 MB. nginx is already in front as TLS terminator and router; a
second one inside would mean two configs describing the same routing, with only the outer one
visible to `nginx -t`. The container serves files and the vhost decides everything else — including
the 404 page and the cache headers.

## Releasing

`develop` → `production` is a fast-forward merge, and the push is the release:

```bash
git switch production && git merge --ff-only develop && git push
```

CD builds the image, pushes it to GHCR tagged with the commit SHA, writes `.env`, restarts the
container, then fetches `https://docs.mycard24.ru/` and fails on anything but a 200 — a running container is
not the same as a served site.

## Rolling back

The image is tagged by commit SHA and `.env` pins one exactly.

**From GitHub** — Actions → CD → *Run workflow*, with the known-good SHA in `image_tag`. The build
is skipped: that image already exists.

**On the server**:

```bash
cd /opt/mycard24-docs-site
sed -i 's/^IMAGE_TAG=.*/IMAGE_TAG=<known-good-sha>/' .env
docker compose pull && docker compose up -d
```

The next ordinary deploy overwrites `.env`, so this is a stopgap.

## Required configuration

On the repository's **production** environment:

| Kind | Name | Value |
|---|---|---|
| Secret | `SSH_KEY` | the deploy key's private half |
| Variable | `SSH_HOST` | `api.mycard24.ru` |
| Variable | `SSH_USER` | `root` |
| Variable | `SSH_PORT` | `48802` — **not 22** |
| Variable | `PROD_ENV` | the body of `prod.env.example` |
| Variable | `DEPLOY_PATH` | optional; defaults to `/opt/mycard24-docs-site` |

`SSH_KEY` is the only secret. `PROD_ENV` here is a port and a memory limit — nothing sensitive.

## Certificates

A wildcard for `*.mycard24.ru`, issued with **acme.sh over the Cloudflare DNS API** and installed at
`/etc/ssl/mycard24.ru.pem` and `.key`. Not certbot. Renewal runs from cron four times a day and
reloads nginx itself, so a new vhost on this domain needs no certificate work at all.

## Host nginx

`deploy/nginx/docs.mycard24.ru.conf` is the vhost. Copy it to `/etc/nginx/sites-available/`, symlink into
`sites-enabled/`, then `nginx -t && systemctl reload nginx`.
