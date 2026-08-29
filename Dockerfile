# syntax=docker/dockerfile:1
# The docs site as an immutable image: the built static site plus a ~5 MB server to hand it out.
#
# The Markdown does NOT live here — CI clones mycard24-docs into ./docs before the build context is
# sent, exactly as the CI build does. So the image is reproducible from one engine commit plus one
# content commit, and neither the container nor the server needs git.

# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Builds every configured locale into /app/build.
ARG DOCSEARCH_APP_ID
ARG DOCSEARCH_API_KEY
ARG DOCSEARCH_INDEX_NAME
RUN npm run build

# ---- serve ----
FROM joseluisq/static-web-server:2-alpine AS runtime

# Docusaurus emits build/, not dist/.
COPY --from=build /app/build /public

ENV SERVER_ROOT=/public \
    SERVER_HOST=0.0.0.0 \
    SERVER_PORT=8080 \
    SERVER_HEALTH=true \
    # trailingSlash is on, so every route is a real <route>/index.html. Serve it for a directory
    # request rather than listing the directory.
    SERVER_DIRECTORY_LISTING=false \
    SERVER_LOG_LEVEL=info

EXPOSE 8080
