-- 0001_initial.sql  (Stage 1 baseline)
-- Applied to a brand-new data.db. Forward-only. Runs inside one transaction.
-- The application inserts the 'activity_id' and 'created_at' rows when it creates an Activity.
-- Later stages add tables in their own numbered migrations (responses, participants, events, ...).
-- Until the first release, migrations may be squashed (see SCHEMA_GOVERNANCE.md).

PRAGMA application_id = 1094931542;  -- 0x41435456 ("ACTV"); not checked against any public registry

CREATE TABLE meta (
  key   TEXT NOT NULL PRIMARY KEY,
  value TEXT NOT NULL
) STRICT;

PRAGMA user_version = 1;
