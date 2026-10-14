# ishaquenv.com on the SkiFi server

One container (`site`) serves the built site and a small API for the visitor
count and the wall. Notes and the count are JSON files in the `ishaque_data`
volume. Without the API (for example on Vercel) the site still works; the wall
and the visitor pill just stay hidden.

## First deploy (Dokploy at deploy.skifi.co)

1. Create a project "Ishaque", then a Docker Compose service built from GitHub:
   NAVICORP/ishaque, branch `main`, compose path `./deploy/docker-compose.yml`,
   autodeploy on push.
2. Environment: `ADMIN_TOKEN=<any long phrase, 12 characters or more>`.
3. Domains: `ishaquenv.com` and `www.ishaquenv.com` to service `site`, port
   8000, HTTPS with Let's Encrypt. Deploy.
4. DNS is on Vercel's nameservers. In Vercel, Domains, ishaquenv.com:
   add `A @ 179.198.218.204` and `CNAME www ishaquenv.com`, then remove the
   domain from the Vercel project. The old A value was `216.198.79.1`, for
   rollback.
5. In Dokploy: Web Server, Traefik, Reload, so the certificates are issued.

## Day to day

- Push to `main` and Dokploy rebuilds it.
- Remove a note at ishaquenv.com/wall-admin with the `ADMIN_TOKEN`.
- Run it locally: `npm run build && node server/site.mjs` (data goes to `.data/`).
