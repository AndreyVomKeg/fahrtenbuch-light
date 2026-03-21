-- Create database and user
CREATE USER fb WITH PASSWORD 'CHANGE_ME';
CREATE DATABASE fahrtenbuch OWNER fb;

-- Connect to fahrtenbuch DB, then run:

-- GoBD: Protect change_log from UPDATE/DELETE
CREATE OR REPLACE FUNCTION prevent_change_log_mutation() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'change_log is append-only: % not allowed', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_update_change_log BEFORE UPDATE ON change_log
  FOR EACH ROW EXECUTE FUNCTION prevent_change_log_mutation();
CREATE TRIGGER no_delete_change_log BEFORE DELETE ON change_log
  FOR EACH ROW EXECUTE FUNCTION prevent_change_log_mutation();
