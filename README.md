# Flights‑Lakehouse Demo ✈️🗄️

Minimal, reproducible **stream‑to‑lakehouse** sandbox.  Everything runs in Docker Compose; one clone & one command and you’re live.

| Component                     | Purpose                                                 | Image                                |
| ----------------------------- | ------------------------------------------------------- | ------------------------------------ |
| **Kafka 3.5** + **Zookeeper** | Durable event bus                                       | `bitnami/kafka`                      |
| **ksqlDB 0.29**               | Stream processing / CDC                                 | `confluentinc/ksqldb-server`         |
| **ksql‑init job**             | Automatically creates streams at startup                | `confluentinc/ksqldb-cli`            |
| **MinIO**                     | S3‑compatible object storage                            | `minio/minio`                        |
| **Prometheus / Grafana**      | Metrics & dashboards                                    | `prom/prometheus`, `grafana/grafana` |
| **Flight‑producer**           | Publishes sample events (Python 3.11 + confluent‑kafka) | `producers/Dockerfile`               |

---

## 1  Prerequisites

* Docker Desktop 20+
* Docker Compose v2 (bundled with Docker)
* (Optional) GitHub CLI if you’ll push commits

---

## 2  Project layout

```
flights‑lakehouse‑demo/
├ docker/                 ─ docker‑compose.yml
├ ksql/
│   ├ init.sql            ─ declarative stream definition
│   └ wait.sh             ─ waits for ksqlDB → runs init.sql
├ producers/
│   ├ Dockerfile          ─ builds flight‑producer image
│   ├ requirements.txt
│   └ produce_flights.py  ─ reads data/sample_flights.json
├ data/
│   └ sample_flights.json ─ 10 mock events (extend as you like)
└ config/
    └ prometheus.yml
```

---

## 3  Quick start

```bash
# 1  Clone and enter the repo
 git clone https://github.com/<your‑user>/flights‑lakehouse‑demo.git
 cd flights‑lakehouse‑demo/docker

# 2  Launch the stack (Kafka, ksqlDB, MinIO, …)
 docker compose up -d          # ~40 s the first time

# 3  Publish the sample events
 docker compose build flight-producer   # first time only
 docker compose run --rm flight-producer
```

### Verify

```bash
docker compose exec ksqldb-cli \
  ksql http://ksqldb-server:8088 \
  -e "SET 'auto.offset.reset'='earliest'; \
      SELECT * FROM flight_events_raw EMIT CHANGES LIMIT 10;"
```

You should see the ten rows **IB200 … IB209** and then *Limit Reached*.

---

## 4  Every‑day commands

| Purpose                          | Command                                                         |
| -------------------------------- | --------------------------------------------------------------- |
| Stop containers (keep data)      | `docker compose stop`                                           |
| Remove containers (keep volumes) | `docker compose down`                                           |
| Full reset (wipe volumes)        | `docker compose down --volumes --remove-orphans`                |
| Tail logs                        | `docker compose logs -f kafka`                                  |
| Enter ksqlDB CLI                 | `docker compose exec ksqldb-cli ksql http://ksqldb-server:8088` |

---

## 5  Changing / adding events

1. Edit **`data/sample_flights.json`** (array of JSON objects).
2. Republish:

```bash
docker compose run --rm flight-producer
```

---

## 6  How the ksqlDB stream is created

`ksql/wait.sh` waits until `http://ksqldb-server:8088/info` responds, then pipes
`ksql/init.sql` into the CLI. If the SQL fails the init‑container exits non‑zero
and *docker compose ps* shows it immediately.

---

## 7  Troubleshooting

| Symptom                                                                  | How to fix                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FLIGHT_EVENTS_RAW does not exist`                                       | `docker compose logs ksql-init` → check for SQL error or missing execute bit on **wait.sh**.                                                                                                                               |
| Producer error *Failed to resolve 'kafka:9092'* (running outside Docker) | Use default `localhost:9092` (already in script).                                                                                                                                                                          |
| ARM Mac *exec format error*                                              | `platform: linux/amd64` pinned for ksqlDB images.                                                                                                                                                                          |
| Athena error *Iceberg table without metadata location*                   | Glue entry exists but no Iceberg snapshot yet.<br>• **Option A**: run Spark job (next section) – it writes first snapshot.<br>• **Option B**: create a dummy table via Athena CTAS (`CREATE TABLE … AS SELECT 1 LIMIT 0`). |

---

## 8  Deploy to AWS (optional)

### 8.1  Extra prerequisites

| Tool       | Min version | Check                         |
| ---------- | ----------- | ----------------------------- |
| Node.js    | 18          | `node -v`                     |
| npm        |  9          | `npm -v`                      |
| AWS CLI    |  2          | `aws sts get-caller-identity` |
| AWS CDK v2 | 2.130+      | `cdk --version`               |

### 8.2  Bootstrap & deploy

```bash
cd infra
npm i               # installs CDK libraries
cdk bootstrap aws://<account-id>/<region>   # once
npm run build       # compile TypeScript
cdk deploy          # creates bucket + Glue catalog + Iceberg table
```

Verify in Athena:

1. Set workgroup result location to `s3://flights-raw-<account>/athena-results/`
2. Run `SELECT * FROM flights_demo.flight_legs LIMIT 10;`
   Expect the metadata‑location error until the first snapshot is written.

Destroy:

```bash
cdk destroy
```

---

## 9  Next steps

* **Spark Structured Streaming** – consume `flight-events` and write the first Iceberg snapshot.
* **Dagster + dbt** – build and test analytics layer.

---

## 10  License

MIT – free to use, no warranty.
