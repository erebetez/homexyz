
CREATE TABLE devices (id text PRIMARY KEY, name text NOT NULL, description text, ip text NOT NULL, status text NOT NULL);

CREATE TABLE states (key text PRIMARY KEY, id text REFERENCES devices NOT NULL, inserted timestamptz NOT NULL, updated timestamptz NOT NULL, attribute json);

-- trail is a list of objects. each object can have a origin, timestamp, user, etc.
CREATE TABLE events (key text REFERENCES states NOT NULL, inserted timestamptz NOT NULL, value jsonb, trail jsonb);

CREATE TABLE logs (index SERIAL, id text REFERENCES devices, key text REFERENCES states, inserted timestamptz NOT NULL, loglevel text, message text, irritants json);

ALTER TABLE devices OWNER TO homez;
ALTER TABLE states OWNER TO homez;
ALTER TABLE events OWNER TO homez;
ALTER TABLE logs OWNER TO homez;

GRANT INSERT ON devices TO homez;
GRANT UPDATE ON devices TO homez;

GRANT INSERT ON states TO homez;
GRANT UPDATE ON states TO homez;

GRANT INSERT ON events TO homez;
GRANT INSERT ON logs TO homez;

-- Events for event table
CREATE OR REPLACE FUNCTION notify_watcher()
  RETURNS trigger AS
$BODY$
    BEGIN
        PERFORM pg_notify(TG_TABLE_NAME, row_to_json(NEW)::text);
        RETURN NULL;
    END; 
$BODY$
  LANGUAGE plpgsql VOLATILE;

CREATE TRIGGER notify_new_event
  AFTER INSERT
  ON events
  FOR EACH ROW
  EXECUTE PROCEDURE notify_watcher();

CREATE TRIGGER notify_update_device
  AFTER UPDATE
  ON devices
  FOR EACH ROW
  EXECUTE PROCEDURE notify_watcher();


