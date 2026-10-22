# usage:
#   python server/run_sql.py --list                       list built-in checks
#   python server/run_sql.py duplicate_unit_tasks         run a built-in check
#   python server/run_sql.py -q "SELECT count(*) FROM users"
#   python server/run_sql.py -f path/to/query.sql
#   python server/run_sql.py -q "UPDATE ..." --write      allow changes (asks for confirmation)
#   python server/run_sql.py -f change.sql --dry-run      run with write access, then always roll back
#
# Connects to DATABASE_URI (from the environment or .env). Runs in a READ ONLY transaction
# unless --write is passed, so a mistaken UPDATE/DELETE is rejected by Postgres itself.
import argparse
import csv
import os
import sys
from urllib.parse import urlparse

import psycopg2
from dotenv import load_dotenv

load_dotenv()

# data checks from docs/review/REVIEW.md section 6
CHECKS = {
    "duplicate_unit_tasks": (
        "Units with more than one UnitTask for the same MasterTask (review finding C1)",
        """
        SELECT ut.unit_id, u.name AS unit_name, ut.task_id, mt.name AS task_name,
               COUNT(*) AS copies, array_agg(ut.id ORDER BY ut.id) AS unit_task_ids,
               array_agg((SELECT COUNT(*) FROM status_updates su WHERE su.task_id = ut.id) ORDER BY ut.id) AS updates_per_copy
        FROM unit_tasks ut
        JOIN units u ON u.id = ut.unit_id
        JOIN master_tasks mt ON mt.id = ut.task_id
        GROUP BY ut.unit_id, u.name, ut.task_id, mt.name
        HAVING COUNT(*) > 1
        ORDER BY ut.unit_id, ut.task_id
        """,
    ),
    "frozen_timestamps": (
        "Status updates sharing a timestamp to the microsecond, i.e. the import-time default (review finding C2)",
        """
        SELECT timestamp, COUNT(*) AS updates, MIN(id) AS first_id, MAX(id) AS last_id
        FROM status_updates
        WHERE timestamp <> date_trunc('day', timestamp)
        GROUP BY timestamp
        HAVING COUNT(*) > 1
        ORDER BY updates DESC, timestamp DESC
        """,
    ),
    "frozen_timestamps_summary": (
        "Status updates by timestamp origin: user-picked date (midnight), frozen default, or unique",
        """
        WITH classified AS (
            SELECT su.id,
                   CASE
                       WHEN su.timestamp = date_trunc('day', su.timestamp) THEN 'record_date (midnight, user-picked)'
                       WHEN COUNT(*) OVER (PARTITION BY su.timestamp) > 1 THEN 'frozen default (shared to the microsecond)'
                       ELSE 'unique (default, first use on that instance, or genuine)'
                   END AS origin,
                   su.timestamp
            FROM status_updates su
        )
        SELECT origin, COUNT(*) AS updates, COUNT(DISTINCT timestamp) AS distinct_timestamps,
               MIN(timestamp) AS earliest, MAX(timestamp) AS latest
        FROM classified
        GROUP BY origin
        ORDER BY updates DESC
        """,
    ),
    "duplicate_unit_task_details": (
        "Side-by-side state of each duplicated UnitTask copy and its status updates, to decide which copy to keep",
        """
        WITH dup AS (
            SELECT unit_id, task_id FROM unit_tasks GROUP BY unit_id, task_id HAVING COUNT(*) > 1
        )
        SELECT ut.unit_id, ut.task_id, ut.id AS unit_task_id,
               ut.sched_start::date AS sched_start, ut.sched_end::date AS sched_end,
               ut.status_code, ut.progress, ut.started_status, ut.started_date::date AS started,
               ut.complete_status, ut.complete_date::date AS completed,
               string_agg(su.task_status || ' @ ' || to_char(su.timestamp, 'YYYY-MM-DD') || ' by user ' || su.user_id,
                          '; ' ORDER BY su.timestamp, su.id) AS updates
        FROM unit_tasks ut
        JOIN dup ON dup.unit_id = ut.unit_id AND dup.task_id = ut.task_id
        LEFT JOIN status_updates su ON su.task_id = ut.id
        GROUP BY ut.id
        ORDER BY ut.unit_id, ut.id
        """,
    ),
    "duplicate_pair_diff": (
        "Exactly which fields differ between the two copies of each duplicate (what the cleanup's mirror check compares)",
        """
        WITH pairs AS (
            SELECT unit_id, MIN(id) AS keep_id, MAX(id) AS drop_id
            FROM unit_tasks GROUP BY unit_id, task_id HAVING COUNT(*) > 1
        ),
        updates AS (
            SELECT p.unit_id, p.keep_id, p.drop_id,
                   (SELECT string_agg(task_status || ' @ ' || timestamp || ' user ' || user_id || ' msg=' || COALESCE(message, '<none>'), ' | ' ORDER BY timestamp, id)
                    FROM status_updates WHERE task_id = p.keep_id) AS keep_updates,
                   (SELECT string_agg(task_status || ' @ ' || timestamp || ' user ' || user_id || ' msg=' || COALESCE(message, '<none>'), ' | ' ORDER BY timestamp, id)
                    FROM status_updates WHERE task_id = p.drop_id) AS drop_updates
            FROM pairs p
        )
        SELECT p.unit_id, p.keep_id, p.drop_id, f.field, f.keep_value, f.drop_value
        FROM pairs p
        JOIN unit_tasks k ON k.id = p.keep_id
        JOIN unit_tasks d ON d.id = p.drop_id
        CROSS JOIN LATERAL (VALUES
            ('sched_start', k.sched_start::text, d.sched_start::text),
            ('sched_end', k.sched_end::text, d.sched_end::text),
            ('status_code', k.status_code::text, d.status_code::text),
            ('progress', k.progress::text, d.progress::text),
            ('started_status', k.started_status::text, d.started_status::text),
            ('started_date', k.started_date::text, d.started_date::text),
            ('complete_status', k.complete_status::text, d.complete_status::text),
            ('complete_date', k.complete_date::text, d.complete_date::text)
        ) AS f(field, keep_value, drop_value)
        WHERE f.keep_value IS DISTINCT FROM f.drop_value
        UNION ALL
        SELECT unit_id, keep_id, drop_id, 'status_updates', keep_updates, drop_updates
        FROM updates
        WHERE keep_updates IS DISTINCT FROM drop_updates
        ORDER BY unit_id, field
        """,
    ),
    "duplicate_parents": (
        "Parent tasks of each duplicated MasterTask (explains why the duplicate was created)",
        """
        SELECT mtd.task_id, mt.name AS task_name, mtd.dependent_task_id AS parent_id, parent.name AS parent_name
        FROM master_task_dependencies mtd
        JOIN master_tasks mt ON mt.id = mtd.task_id
        JOIN master_tasks parent ON parent.id = mtd.dependent_task_id
        WHERE mtd.task_id IN (SELECT task_id FROM unit_tasks GROUP BY unit_id, task_id HAVING COUNT(*) > 1)
        ORDER BY mtd.task_id, mtd.dependent_task_id
        """,
    ),
    "revoked_members": (
        "Soft-deleted project memberships (these users had access until the S1 fix)",
        """
        SELECT pu.id, pu.project_id, p.name AS project, pu.user_id, us.email, pu.timestamp,
               EXISTS (SELECT 1 FROM project_users a WHERE a.user_id = pu.user_id
                       AND a.project_id = pu.project_id AND a.deleted = false) AS re_added,
               us.is_admin
        FROM project_users pu
        JOIN projects p ON p.id = pu.project_id
        JOIN users us ON us.id = pu.user_id
        WHERE pu.deleted = true
        ORDER BY pu.project_id, us.email
        """,
    ),
    "table_counts": (
        "Row counts for the main tables",
        """
        SELECT 'users' AS table_name, COUNT(*) AS rows FROM users
        UNION ALL SELECT 'projects', COUNT(*) FROM projects
        UNION ALL SELECT 'project_users', COUNT(*) FROM project_users
        UNION ALL SELECT 'groups', COUNT(*) FROM groups
        UNION ALL SELECT 'master_tasks', COUNT(*) FROM master_tasks
        UNION ALL SELECT 'master_task_dependencies', COUNT(*) FROM master_task_dependencies
        UNION ALL SELECT 'units', COUNT(*) FROM units
        UNION ALL SELECT 'unit_tasks', COUNT(*) FROM unit_tasks
        UNION ALL SELECT 'status_updates', COUNT(*) FROM status_updates
        """,
    ),
}


def print_table(columns, rows):
    cells = [[("" if v is None else str(v)) for v in row] for row in rows]
    widths = [max([len(c)] + [len(r[i]) for r in cells]) for i, c in enumerate(columns)]
    print("  ".join(c.ljust(w) for c, w in zip(columns, widths)))
    print("  ".join("-" * w for w in widths))
    for r in cells:
        print("  ".join(v.ljust(w) for v, w in zip(r, widths)))


def main():
    parser = argparse.ArgumentParser(description="Run SQL against DATABASE_URI (read-only by default).")
    parser.add_argument("check", nargs="?", help="name of a built-in check (see --list)")
    parser.add_argument("-q", "--query", help="SQL string to run")
    parser.add_argument("-f", "--file", help="file containing SQL to run")
    parser.add_argument("--list", action="store_true", help="list built-in checks and exit")
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument("--write", action="store_true", help="allow changes and commit (asks for confirmation)")
    modes.add_argument("--dry-run", action="store_true", help="allow changes, show the result, then roll back")
    parser.add_argument("--yes", action="store_true", help="skip the --write confirmation prompt")
    parser.add_argument("--csv", metavar="PATH", help="also write results to a CSV file")
    args = parser.parse_args()

    if args.list:
        for name, (description, _) in CHECKS.items():
            print(f"{name.ljust(28)} {description}")
        return 0

    sources = [s for s in (args.check, args.query, args.file) if s]
    if len(sources) != 1:
        parser.error("give exactly one of: a check name, -q/--query, or -f/--file")

    if args.check:
        if args.check not in CHECKS:
            parser.error(f"unknown check '{args.check}' (see --list)")
        sql = CHECKS[args.check][1]
    elif args.query:
        sql = args.query
    else:
        with open(args.file) as f:
            sql = f.read()

    uri = os.getenv("DATABASE_URI")
    if not uri:
        print("DATABASE_URI is not set.", file=sys.stderr)
        return 1
    # SQLAlchemy-style URIs (postgresql+psycopg2://) aren't understood by psycopg2
    uri = uri.replace("postgresql+psycopg2://", "postgresql://", 1)
    target = urlparse(uri)
    target_label = f"{target.hostname}{target.path}"

    mode = "READ-WRITE" if args.write else "dry run, will roll back" if args.dry_run else "read-only"
    print(f"Database: {target_label} ({mode})", file=sys.stderr)

    if args.write and not args.yes:
        print("\n" + sql.strip() + "\n", file=sys.stderr)
        answer = input(f"Run this with WRITE access against {target_label}? Type 'yes' to continue: ")
        if answer.strip() != "yes":
            print("Aborted.", file=sys.stderr)
            return 1

    conn = psycopg2.connect(uri)
    conn.set_session(readonly=not (args.write or args.dry_run))
    try:
        with conn.cursor() as cur:
            cur.execute(sql)
            # RAISE NOTICE output from DO blocks / functions
            for notice in conn.notices:
                print(notice.strip(), file=sys.stderr)
            if cur.description:
                columns = [d.name for d in cur.description]
                rows = cur.fetchall()
                print_table(columns, rows)
                print(f"\n({len(rows)} row{'s' if len(rows) != 1 else ''})", file=sys.stderr)
                if args.csv:
                    with open(args.csv, "w", newline="") as f:
                        writer = csv.writer(f)
                        writer.writerow(columns)
                        writer.writerows(rows)
                    print(f"Wrote {args.csv}", file=sys.stderr)
            else:
                print(f"{cur.statusmessage} ({cur.rowcount} row{'s' if cur.rowcount != 1 else ''} affected)", file=sys.stderr)

        if args.write:
            conn.commit()
            print("Committed.", file=sys.stderr)
        else:
            conn.rollback()
            if args.dry_run:
                print("Dry run: rolled back, nothing was changed.", file=sys.stderr)
    except psycopg2.Error as e:
        for notice in conn.notices:
            print(notice.strip(), file=sys.stderr)
        conn.rollback()
        print(f"SQL error: {e.pgerror or e}", file=sys.stderr)
        return 1
    finally:
        conn.close()
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except BrokenPipeError:
        # output piped to head/less and closed early
        sys.stderr.close()
        sys.exit(0)
