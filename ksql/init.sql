-- Crea el topic si no existe y define la clave
CREATE STREAM flight_events_raw (
    flight_id     STRING KEY,
    status        STRING,
    departure_ts  STRING
) WITH (
    KAFKA_TOPIC='flight-events',
    PARTITIONS=1,
    VALUE_FORMAT='JSON'
);
