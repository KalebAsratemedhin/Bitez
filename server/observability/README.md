## Observability (UI): logs + metrics + queues + DB

This folder provides a browser-based monitoring bundle:

- **Grafana**: dashboards + Logs Explore UI
- **Loki**: log storage/search backend
- **Promtail**: collects Docker container logs and ships to Loki
- **Prometheus**: metrics storage (baseline; you can add `/metrics` later)
- **(Optional)** RabbitMQ Management UI
- **(Optional)** MongoDB + Mongo Express UI

### Quick start (logs + metrics UI only)

From `server/observability/`:

```bash
docker compose -f docker-compose.observability.yml up -d
```

Then open:

- **Grafana**: `http://localhost:3007` (user/pass: `admin` / `admin`)
- **Loki**: `http://localhost:3100/ready`
- **Prometheus**: `http://localhost:9090`

In Grafana:

1. Add a Loki data source: URL `http://loki:3100`
2. Use **Explore** to query logs, e.g. `{service="order"}` or `{requestId="req_..."}`

### Optional infra UIs (RabbitMQ + Mongo)

If you want RabbitMQ Management + Mongo Express:

```bash
docker compose --profile infra -f docker-compose.observability.yml up -d
```

Open:

- **RabbitMQ Management**: `http://localhost:15672` (guest/guest)
- **Mongo Express**: `http://localhost:8081`

### Notes

- Promtail reads Docker logs via `/var/run/docker.sock`. This is great for local dev, but for production you’ll likely switch to an agent/collector.
- Your Node services already produce structured JSON logs via `pino`. The Promtail config attempts to parse those fields and promote `service`, `level`, and `requestId` as labels.

