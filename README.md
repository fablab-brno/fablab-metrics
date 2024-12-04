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

## Fabman configuration

Resource metrics are configured using following resource metadata:

- `METRICS_EQUIPMENT_TYPE` - Resource type - "machine" or "entrance". Resources with `entrace` value are used to
  calculate daily visits. Resources with `machine` value are used to calculate resource usage.
- `METRICS_CATEGORY` - Category name (only for `METRICS_EQUIPMENT_TYPE=machine`), e.g. "3D Printers", to be used when
  calculating resource usage. Multiple resources with the same category name are groupped together.

Training courses metrics are configured using following resource metadata:

- `METRICS_CATEGORY` - Training courses with same category are groupped together, e.g. `3D Printers`
- `METRICS_TRAINING_LEVEL` - Possible values: `bozp`, `basic`, `advanced`

## Architecture

This project uses Python on backend to extract data from Fabman API and Next.js on frontend to render metrics in Nivo
charts. It vaguely follows ETL architecture (Extract - Transform - Load). Data are **e*xtracted from Fabman API and
stored locally in sqlite database. These data are further **t**ransformed using sql queries for each metric. Final
datasets are stored in JSON in `DATA_PATH` directory. These JSONs are read directly by Next.js API routes.