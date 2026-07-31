# Railway Deployment

This app is configured for Railway with `railway.json`.

## Route Prefix

By default, the app is served from `/admin`.

For production behind the public storefront domain, keep this value:

```text
NEXT_PUBLIC_BASE_PATH=/admin
```

After rebuilding, routes will be prefixed automatically, for example:

```text
/admin/dashboard
/admin/login
```

`NEXT_PUBLIC_BASE_PATH` is a build-time value in Next.js, so changing it requires a new deployment.

## Healthcheck

Railway checks:

```text
/admin/api/health
```
