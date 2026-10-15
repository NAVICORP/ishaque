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

## Backups

The `backup` service tars `/data` (notes.json, stats.json, secret.json) into the
`ishaque_backups` volume once a day and keeps the latest 14. To restore one:

    docker run --rm -v ishaque_backups:/backups alpine ls -1t /backups
    docker run --rm -v ishaque_backups:/backups -v ishaque_data:/data alpine \
      sh -c 'tar -xzf /backups/ishaque-YYYYMMDD-HHMM.tar.gz -C /data'

then restart the `site` service. To copy a backup off the server:

    docker run --rm -v ishaque_backups:/backups alpine cat /backups/ishaque-YYYYMMDD-HHMM.tar.gz > ishaque.tar.gz

## Note alerts

Set `NOTIFY_URL` to any webhook that accepts JSON `{ "text": "..." }` (ntfy,
Slack, Discord, Make, n8n) and every new note on the wall posts there. For
Telegram, set `NOTIFY_URL` to
`https://api.telegram.org/bot<token>/sendMessage` and `NOTIFY_CHAT` to your chat
id.

## Visits

`/wall-admin` shows the visitor count, visits per day for the last 30 days and
the sites people came from (hostnames only). Visitor addresses are stored only
as a keyed hash for rate limiting, and dropped from notes after 30 days.
