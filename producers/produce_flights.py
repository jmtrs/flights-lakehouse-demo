import json, os, time, pathlib
from confluent_kafka import Producer

broker  = os.getenv("KAFKA_BROKER", "localhost:9092")
topic   = os.getenv("KAFKA_TOPIC",  "flight-events")
json_fp = pathlib.Path(os.getenv("EVENT_FILE", "/app/data/sample_flights.json"))

events  = json.loads(json_fp.read_text())

producer = Producer({"bootstrap.servers": broker})


def done(err, msg):
    if err:
        print("⚠️ ", err)
    else:
        print(f"✅  {msg.key().decode()} @ offset {msg.offset()}")


for rec in events:
    producer.produce(topic, key=rec["flight_id"], value=json.dumps(rec), on_delivery=done)
    producer.poll(0)
    time.sleep(0.1)

producer.flush()
print("✔︎ Todos los eventos enviados")
