#!/usr/bin/env bash
set -Eeuo pipefail

print_usage() {
  cat <<'USAGE'
mysql-run.sh - Run a SQL command or file against MySQL.

Usage:
  ./scripts/mysql-run.sh [options] [--file path.sql | --execute "SQL;"]
  cat schema.sql | ./scripts/mysql-run.sh [options]

Options:
  --host, -H        MySQL host (default: $MYSQL_HOST or 127.0.0.1)
  --port, -P        MySQL port (default: $MYSQL_PORT or 3306)
  --user, -u        MySQL user (default: $MYSQL_USER or root)
  --password, -p    MySQL password (default: $MYSQL_PASSWORD)
  --database, -d    Database to use (default: $MYSQL_DATABASE)
  --create-db       Create the database if it does not exist
  --file, -f        Path to .sql file to execute
  --execute, -e     Inline SQL to execute (quote your SQL)
  --ssl-mode        SSL mode (e.g., REQUIRED, VERIFY_CA, VERIFY_IDENTITY)
  --ssl-ca          Path to CA cert (if required)
  --help            Show this help

Environment:
  MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE,
  MYSQL_SSL_MODE, MYSQL_SSL_CA can be used as defaults.

Examples:
  ./scripts/mysql-run.sh -H 127.0.0.1 -u root -p secret -d mydb --create-db
  ./scripts/mysql-run.sh -d mydb --file scripts/01_create_tables.sql
  ./scripts/mysql-run.sh -d mydb --execute "SELECT COUNT(*) FROM products;"
  cat scripts/mysql_seed_data.sql | ./scripts/mysql-run.sh -d mydb
USAGE
}

err() { echo "Error: $*" >&2; }
require() { command -v "$1" >/dev/null 2>&1 || { err "Required command '$1' not found."; exit 127; }; }

HOST="${MYSQL_HOST:-127.0.0.1}"
PORT="${MYSQL_PORT:-3306}"
USER="${MYSQL_USER:-root}"
PASSWORD="${MYSQL_PASSWORD:-}"
DATABASE="${MYSQL_DATABASE:-}"

SQL_FILE=""
SQL_EXECUTE=""
CREATE_DB="false"
SSL_MODE="${MYSQL_SSL_MODE:-}"
SSL_CA="${MYSQL_SSL_CA:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host|-H) HOST="$2"; shift 2;;
    --port|-P) PORT="$2"; shift 2;;
    --user|-u) USER="$2"; shift 2;;
    --password|-p) PASSWORD="$2"; shift 2;;
    --database|-d) DATABASE="$2"; shift 2;;
    --file|-f) SQL_FILE="$2"; shift 2;;
    --execute|-e) SQL_EXECUTE="$2"; shift 2;;
    --create-db) CREATE_DB="true"; shift;;
    --ssl-mode) SSL_MODE="$2"; shift 2;;
    --ssl-ca) SSL_CA="$2"; shift 2;;
    --help|-h|-") print_usage; exit 0;;
    *) err "Unknown option: $1"; print_usage; exit 1;;
  esac
done

require mysql

MYSQL_BASE_ARGS=("--host=$HOST" "--port=$PORT" "--user=$USER" "--protocol=TCP" "--default-character-set=utf8mb4")
if [[ -n "$SSL_MODE" ]]; then MYSQL_BASE_ARGS+=("--ssl-mode=$SSL_MODE"); fi
if [[ -n "$SSL_CA" ]]; then MYSQL_BASE_ARGS+=("--ssl-ca=$SSL_CA"); fi

MYSQL_ARGS=("${MYSQL_BASE_ARGS[@]}")
if [[ -n "$DATABASE" ]]; then MYSQL_ARGS+=("--database=$DATABASE"); fi

if [[ "$CREATE_DB" == "true" ]]; then
  if [[ -z "$DATABASE" ]]; then err "--create-db requires --database"; exit 1; fi
  MYSQL_PWD="$PASSWORD" mysql "${MYSQL_BASE_ARGS[@]}" --execute "CREATE DATABASE IF NOT EXISTS \`$DATABASE\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
fi

# Determine input source
if [[ -n "$SQL_FILE" && -n "$SQL_EXECUTE" ]]; then
  err "Use only one of --file or --execute"; exit 1
fi

if [[ -n "$SQL_FILE" ]]; then
  if [[ ! -f "$SQL_FILE" ]]; then err "SQL file not found: $SQL_FILE"; exit 1; fi
  MYSQL_PWD="$PASSWORD" mysql "${MYSQL_ARGS[@]}" < "$SQL_FILE"
  exit $?
fi

if [[ -n "$SQL_EXECUTE" ]]; then
  MYSQL_PWD="$PASSWORD" mysql "${MYSQL_ARGS[@]}" --execute "$SQL_EXECUTE"
  exit $?
fi

# If stdin is not a TTY, read from it; otherwise show usage
if [[ ! -t 0 ]]; then
  MYSQL_PWD="$PASSWORD" mysql "${MYSQL_ARGS[@]}"
else
  print_usage; exit 1
fi
