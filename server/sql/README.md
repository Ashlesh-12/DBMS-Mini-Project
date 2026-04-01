# SQL Setup (MySQL Workbench)

Use these files in order:

1. `01_schema.sql` (creates tables, trigger, function, procedures)
2. `02_seed.sql` (loads sample data)
3. `03_verify.sql` (validates setup)

## In MySQL Workbench

1. Open your target connection.
2. Select the correct schema (database) in the left panel.
3. Run `01_schema.sql`.
4. Run `02_seed.sql`.
5. Run `03_verify.sql` and confirm no errors.

## Required backend env

Set these in `server/.env`:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME` (must match the schema where you ran scripts)
- `DB_SSL=true` only if your MySQL provider requires TLS

## Expected quick checks

- `GET /health` returns `{"status":"ok","db":"connected"}`
- `GET /rooms` returns rows
- Admin dashboard lists rooms and faculty
