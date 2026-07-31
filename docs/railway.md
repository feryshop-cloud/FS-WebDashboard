# Railway Deployment

This app is configured for Railway with `railway.json`.

## Railway Service Domain

By default, the app is served from the root of its own Railway service domain.

Use this setup for the normal Railway deployment:

```text
NEXT_PUBLIC_BASE_PATH=
```

Expected routes:

```text
/dashboard
/login
```

Only set `NEXT_PUBLIC_BASE_PATH` when the dashboard is intentionally served
behind a path prefix through an external reverse proxy. `NEXT_PUBLIC_BASE_PATH`
is a build-time value in Next.js, so changing it requires a new deployment.

## Healthcheck

Railway checks:

```text
/api/health
```
