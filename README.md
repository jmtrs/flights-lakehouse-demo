# Flights‑Lakehouse Demo ✈️🗄️

Minimal, fully reproducible local **data‑lakehouse** stack.  Everything is defined in *docker‑compose* so any dev can spin it up with one command.

| Component                     | Purpose                      | Image                                |
| ----------------------------- | ---------------------------- | ------------------------------------ |
| **Kafka 3.5** + **Zookeeper** | Durable event bus            | `bitnami/kafka`                      |
| **ksqlDB 0.29**               | Stream processing / CDC      | `confluentinc/ksqldb-server`         |
| **ksql‑init job**             | Creates streams at startup   | `confluentinc/ksqldb-cli`            |
| **MinIO**                     | S3‑compatible object storage | `minio/minio`                        |
| **Prometheus**                | Metrics scrape               | `prom/prometheus`                    |
| **Grafana**                   | Dashboards                   | `grafana/grafana`                    |
| **Flight‑producer**           | Publishes sample events      | `producers/Dockerfile` (Python 3.11) |

---

## 1  Prerequisites

* Docker Desktop 20+
* Docker Compose v2 (bundled with Docker)
* (Optional) GitHub CLI if you want to push commits

---

## 2  Project layout

```
flights-lakehouse-demo/
├ docker/                 ← docker-compose.yml
├ ksql/
│   ├ init.sql            ← declarative stream definition
│   └ wait.sh             ← waits for ksqlDB → runs init.sql
├ producers/
│   ├ Dockerfile
│   ├ requirements.txt
│   └ produce_flights.py  ← reads data/sample_flights.json
├ data/
│   └ sample_flights.json ← 10 mock events (easy to extend)
└ config/
    └ prometheus.yml
```

---

## 3  Quick start (90 s)

```bash
# ① Clone and enter the repo
 git clone https://github.com/<your-user>/flights-lakehouse-demo.git
 cd flights-lakehouse-demo/docker

# ② Launch the entire stack
 docker compose up -d        # ~40 s the first time

# ③ Publish sample events
 docker compose build flight-producer   # first time only
 docker compose run --rm flight-producer
```

### Check it worked

```bash
docker compose exec ksqldb-cli \
  ksql http://ksqldb-server:8088 \
  -e "SET 'auto.offset.reset'='earliest'; \
      SELECT * FROM flight_events_raw EMIT CHANGES LIMIT 10;"
```

You should see the ten rows `IB200` … `IB209`, then **"Limit Reached"**.

---

## 4  Every‑day commands

| Action                                      | Command                                                         |
| ------------------------------------------- | --------------------------------------------------------------- |
| **Stop & keep data**                        | `docker compose stop`                                           |
| **Stop & remove containers (keep volumes)** | `docker compose down`                                           |
| **Full reset (wipe volumes)**               | `docker compose down --volumes --remove-orphans`                |
| **Tail logs of a service**                  | `docker compose logs -f kafka`                                  |
| **Enter ksqlDB CLI**                        | `docker compose exec ksqldb-cli ksql http://ksqldb-server:8088` |

---

## 5  Adding or changing events

1. Edit `data/sample_flights.json` (any valid list of JSON objects)
2. Re‑run the producer:

```bash
docker compose run --rm flight-producer
```

---

## 6  How the ksqlDB stream is created

* `ksql/wait.sh` waits until `http://ksqldb-server:8088/info` is live.
* It pipes `ksql/init.sql` into the CLI.
* If the SQL fails, the container exits non‑zero and you’ll see it in `docker compose ps`.

---

## 7  Troubleshooting

| Symptom                                                                     | Fix                                                                                   |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `FLIGHT_EVENTS_RAW does not exist`                                          | Check `docker compose logs ksql-init` – likely SQL error or `wait.sh` not executable. |
| Producer error `Failed to resolve 'kafka:9092'` when run **outside** Docker | Use default `localhost:9092` (already handled).                                       |
| ARM Mac “exec format error”                                                 | `platform: linux/amd64` already set for ksqlDB images.                                |

---

## 8  Next steps

* **CDK / AWS** – S3 bucket, Glue catalog, Iceberg tables, Athena queries.
* **Spark Structured Streaming** – ingest `flight-events` → Iceberg.
* **Dagster + dbt** – model & test analytics layer.

---

## 9  License

MIT – do anything you want, no warranty.
