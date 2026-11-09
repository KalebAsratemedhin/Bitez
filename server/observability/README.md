## Observability configs (used by main `docker-compose.yml`)

Logs only for now (Grafana + Loki + Promtail). Prometheus is deferred.

```bash
# from server/
docker compose up --build
```

| File / folder | Used by |
|---------------|---------|
| `loki-config.yml` | Loki storage/settings |
| `promtail-config.yml` | Promtail → Loki shipping |
| `grafana/provisioning/` | Auto-wires Loki in Grafana |

### URLs

- Grafana: http://localhost:3007 (`admin` / `admin`) → Explore → Loki
- Loki ready: http://localhost:3100/ready

Useful queries: `{compose_service="order"}` or `{service="auth"}`
