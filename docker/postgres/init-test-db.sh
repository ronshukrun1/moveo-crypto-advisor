#!/bin/bash
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  SELECT 'CREATE DATABASE moveo_crypto_advisor_test'
  WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'moveo_crypto_advisor_test'
  )\gexec
EOSQL
