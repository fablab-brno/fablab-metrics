Fablab Metrics
==============

Simple analytics from Fabman data originally built for FabLab Brno but open-sourced for the public.

## App configuration

Following environment variables are used for configuration:

- `FABMAN_API_KEY` - Authentication api key for Fabman API.
- `FABMAN_API_URL` - URL of Fabman API. (Default: `https://fabman.io/api/v1/`)
- `AUTH_PASSWORD` - Authentication password for visiting the metrics website.
- `SECRET_KEY` - Salt used for hashing. Set it to arbitrary random value.
- `COOKIE_AUTH` - Cookie name to store hashed authentication password. (Default: `fablab-metrics-auth`)
- `API_KEY` - Authentication key used when refreshing metrics using URL `/api/refresh`. Set it to arbitrary random
  value.
- `DATA_PATH` -Path to data directory containing final datasets JSONs (Default: `<cwd>/data`)
- `DB_PATH` - Path to SQLite database (Default: `<cwd>/metrics.db`)
- `MACHINE_SLA_HOURS` - Default time limit (in hours) for fixing a machine that is out of order. (Default: `168`)

## Fabman configuration

Resource metrics are configured using following resource metadata:

- `METRICS_EQUIPMENT_TYPE` - Resource type - "machine" or "entrance". Resources with `entrace` value are used to
  calculate daily visits. Resources with `machine` value are used to calculate resource usage.
- `METRICS_CATEGORY` - Category name (only for `METRICS_EQUIPMENT_TYPE=machine`), e.g. "3D Printers", to be used when
  calculating resource usage. Multiple resources with the same category name are groupped together.

- `METRICS_SLA_HOURS` - Optional per-machine override of `MACHINE_SLA_HOURS`.

Machine maintenance metrics (tab "Údržba strojů") are reconstructed from Fabman resource logs of type
`resourceDisabled` and `resourceEnabled`: an outage lasts from disabling a machine until it is enabled again. The whole
history of these logs is fetched on every dataloader run. Only resources with `METRICS_EQUIPMENT_TYPE=machine` count.

Perceived machine availability (tab "Údržba strojů") answers what a member finds when they come to the lab. Each visit
(first entrance check-in of a member per day) gets the worst state of the categories of machines the member is trained
on, i.e. holds any of the training courses that unlock the machine in Fabman: `ok`, `limited` (fewer machines work than
usually run at the same time, i.e. the 90th percentile of concurrent use at check-ins during the previous 180 days) or
`unavailable` (no machine of the category works).

Training courses metrics are configured using following resource metadata:

- `METRICS_CATEGORY` - Training courses with same category are groupped together, e.g. `3D Printers`
- `METRICS_TRAINING_LEVEL` - Possible values: `bozp`, `basic`, `advanced`

## Architecture

This project uses Python on backend to extract data from Fabman API and Next.js on frontend to render metrics in Nivo
charts. It vaguely follows ETL architecture (Extract - Transform - Load). Data are **e*xtracted from Fabman API and
stored locally in sqlite database. These data are further **t**ransformed using sql queries for each metric. Final
datasets are stored in JSON in `DATA_PATH` directory. These JSONs are read directly by Next.js API routes.