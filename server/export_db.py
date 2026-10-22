# usage:
#   python server/export_db.py                      full export to exports/<db>-<UTC timestamp>/
#   python server/export_db.py --out /path/to/dir   choose the output directory
#   python server/export_db.py --no-csv             skip the per-table CSV files
#   python server/export_db.py --pg-dump /usr/lib/postgresql/17/bin/pg_dump
#
# Exports DATABASE_URI (from the environment or .env). Read-only: nothing on the server is changed.
# Produces:
#   <db>.dump       pg_dump custom-format archive (schema + data), restore with pg_restore
#   schema.sql      plain-SQL schema, for reading/diffing
#   csv/<table>.csv every table's rows, taken in one consistent snapshot
#   manifest.json   server/client versions, row counts, file sizes and sha256 checksums
#
# Restore into an empty database:
#   createdb projectpilot_restore
#   pg_restore --no-owner --no-privileges -d projectpilot_restore exports/<dir>/<db>.dump
#
# The export contains password hashes and client data: it is written owner-only (0700/0600)
# and exports/ is git-ignored. Don't commit or share it.
import argparse
import glob
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from urllib.parse import urlparse, urlunparse, parse_qsl

import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv

load_dotenv()

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def connection_parts(uri, use_pooler):
    uri = uri.replace("postgresql+psycopg2://", "postgresql://", 1)
    parsed = urlparse(uri)
    host = parsed.hostname
    # Neon recommends a direct (non-pooled) connection for pg_dump
    if not use_pooler and host and host.endswith(".neon.tech") and "-pooler." in host:
        host = host.replace("-pooler.", ".", 1)
    netloc = f"{parsed.username}@{host}" if parsed.username else host
    if parsed.port:
        netloc += f":{parsed.port}"
    # password stays out of the URI (and out of `ps`); libpq reads it from PGPASSWORD
    safe_uri = urlunparse(parsed._replace(netloc=netloc))
    return safe_uri, parsed.password, host, parsed.path.lstrip("/")


def major_version(text):
    match = re.search(r"(\d+)(?:\.(\d+))?", text)
    return int(match.group(1)) if match else 0


def find_pg_dump(server_major, explicit):
    if explicit:
        return explicit
    candidates = []
    for path in [shutil.which("pg_dump")] + glob.glob("/usr/lib/postgresql/*/bin/pg_dump"):
        if path and os.path.exists(path):
            # e.g. "pg_dump (PostgreSQL) 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)"
            out = subprocess.run([path, "--version"], capture_output=True, text=True).stdout
            match = re.search(r"\(PostgreSQL\)\s+(\d+)", out)
            if match:
                candidates.append((int(match.group(1)), path))
    usable = sorted(c for c in candidates if c[0] >= server_major)
    return usable[0][1] if usable else None


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def run(cmd, env):
    result = subprocess.run(cmd, env=env, capture_output=True, text=True)
    if result.returncode != 0:
        print(result.stderr.strip(), file=sys.stderr)
        raise SystemExit(f"{os.path.basename(cmd[0])} failed (exit {result.returncode})")
    return result.stdout


def main():
    parser = argparse.ArgumentParser(description="Full export of DATABASE_URI (pg_dump archive, schema, CSVs, manifest).")
    parser.add_argument("--out", help="output directory (default: exports/<db>-<UTC timestamp>)")
    parser.add_argument("--no-csv", action="store_true", help="skip per-table CSV export")
    parser.add_argument("--pg-dump", help="path to a pg_dump at least as new as the server")
    parser.add_argument("--use-pooler", action="store_true", help="keep Neon's -pooler host instead of connecting directly")
    args = parser.parse_args()

    uri = os.getenv("DATABASE_URI")
    if not uri:
        print("DATABASE_URI is not set.", file=sys.stderr)
        return 1
    safe_uri, password, host, dbname = connection_parts(uri, args.use_pooler)

    env = dict(os.environ)
    if password:
        env["PGPASSWORD"] = password
    print(f"Database: {host}/{dbname} (read-only export)", file=sys.stderr)

    conn = psycopg2.connect(safe_uri, password=password)
    conn.set_session(readonly=True, isolation_level="REPEATABLE READ")
    with conn.cursor() as cur:
        cur.execute("SHOW server_version")
        server_version = cur.fetchone()[0]
    server_major = major_version(server_version)

    pg_dump = find_pg_dump(server_major, args.pg_dump)
    if not pg_dump:
        conn.close()
        print(
            f"No pg_dump >= {server_major} found (server is PostgreSQL {server_version}).\n"
            f"Install a matching client, e.g. on Ubuntu with the PGDG apt repo:\n"
            f"  sudo apt install postgresql-client-{server_major}\n"
            f"then re-run (it is picked up from /usr/lib/postgresql/{server_major}/bin automatically),\n"
            f"or pass --pg-dump /path/to/pg_dump.",
            file=sys.stderr,
        )
        return 1
    pg_dump_version = run([pg_dump, "--version"], env).strip()
    pg_restore = os.path.join(os.path.dirname(pg_dump), "pg_restore")
    if not os.path.exists(pg_restore):
        pg_restore = shutil.which("pg_restore")

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_dir = os.path.abspath(args.out or os.path.join(REPO_ROOT, "exports", f"{dbname}-{stamp}"))
    if os.path.exists(out_dir) and os.listdir(out_dir):
        conn.close()
        print(f"Output directory is not empty: {out_dir}", file=sys.stderr)
        return 1
    os.makedirs(out_dir, mode=0o700, exist_ok=True)
    os.chmod(out_dir, 0o700)
    os.umask(0o077)
    print(f"Output:   {out_dir}", file=sys.stderr)
    print(f"Server:   PostgreSQL {server_version}; client: {pg_dump_version}", file=sys.stderr)

    # 1. restorable archive
    dump_path = os.path.join(out_dir, f"{dbname}.dump")
    print("Dumping archive...", file=sys.stderr)
    run([pg_dump, "--format=custom", "--compress=6", "--file", dump_path, "--dbname", safe_uri], env)

    # 2. readable schema
    schema_path = os.path.join(out_dir, "schema.sql")
    run([pg_dump, "--schema-only", "--no-owner", "--no-privileges", "--file", schema_path, "--dbname", safe_uri], env)

    # sanity check: the archive is readable and contains table data
    listing = run([pg_restore, "--list", dump_path], env) if pg_restore else ""
    archived_tables = sorted(set(re.findall(r"TABLE DATA \S+ (\S+) ", listing)))

    # 3. CSVs + row counts, one consistent snapshot
    tables = []
    with conn.cursor() as cur:
        cur.execute("""
            SELECT table_schema, table_name FROM information_schema.tables
            WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ('pg_catalog', 'information_schema')
            ORDER BY table_schema, table_name
        """)
        table_names = cur.fetchall()
        if not args.no_csv:
            os.makedirs(os.path.join(out_dir, "csv"), mode=0o700, exist_ok=True)
        for schema, table in table_names:
            ident = sql.Identifier(schema, table)
            cur.execute(sql.SQL("SELECT COUNT(*) FROM {}").format(ident))
            rows = cur.fetchone()[0]
            entry = {"table": f"{schema}.{table}", "rows": rows}
            if not args.no_csv:
                name = table if schema == "public" else f"{schema}.{table}"
                csv_path = os.path.join(out_dir, "csv", f"{name}.csv")
                with open(csv_path, "w", newline="") as f:
                    cur.copy_expert(sql.SQL("COPY {} TO STDOUT WITH (FORMAT csv, HEADER true)").format(ident).as_string(conn), f)
                entry["csv"] = os.path.relpath(csv_path, out_dir)
            tables.append(entry)
            print(f"  {entry['table']:<40} {rows:>8} rows", file=sys.stderr)
    conn.rollback()
    conn.close()

    missing = [t["table"].split(".", 1)[1] for t in tables if t["rows"] and t["table"].split(".", 1)[1] not in archived_tables]
    if pg_restore and missing:
        print(f"WARNING: archive listing has no data entry for: {', '.join(missing)}", file=sys.stderr)

    files = []
    for root, _, names in os.walk(out_dir):
        for name in sorted(names):
            path = os.path.join(root, name)
            files.append({"file": os.path.relpath(path, out_dir), "bytes": os.path.getsize(path), "sha256": sha256(path)})

    manifest = {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "host": host,
        "database": dbname,
        "server_version": server_version,
        "pg_dump": pg_dump_version,
        "tables": tables,
        "total_rows": sum(t["rows"] for t in tables),
        "files": files,
        "restore": f"pg_restore --no-owner --no-privileges -d <empty_db> {dbname}.dump",
        "note": "CSV row counts come from one snapshot; the .dump is pg_dump's own consistent snapshot taken moments earlier.",
    }
    with open(os.path.join(out_dir, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)

    size = sum(f["bytes"] for f in files)
    print(f"\nDone: {len(tables)} tables, {manifest['total_rows']} rows, {size / 1024 / 1024:.1f} MB in {out_dir}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
