#!/usr/bin/env python3
"""
Read-only Odoo database metadata extractor.

This script never mutates Odoo DB state:
- opens a read-only transaction
- executes SELECT-only queries against Odoo metadata tables
- writes extracted metadata to /privod2_next/migration/artifacts
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    import psycopg
except ImportError:
    psycopg = None


OUTPUT_DIR = Path("/Users/damirkasimov/Desktop/privod2/privod2_next/migration/artifacts")
ASSUMPTIONS_FILE = Path("/Users/damirkasimov/Desktop/privod2/privod2_next/migration/assumptions.json")

DB_HOST = os.getenv("ODOO_DB_HOST", "localhost")
DB_PORT = int(os.getenv("ODOO_DB_PORT", "5432"))
DB_NAME = os.getenv("ODOO_DB_NAME", "postgres")
DB_USER = os.getenv("ODOO_DB_USER", "odoo")
DB_PASSWORD = os.getenv("ODOO_DB_PASSWORD", "odoo")


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def write_json(name: str, payload: dict[str, Any]) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUTPUT_DIR / name
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def safe_append_assumption(message: str) -> None:
    if not ASSUMPTIONS_FILE.exists():
        return
    data = json.loads(ASSUMPTIONS_FILE.read_text(encoding="utf-8"))
    assumptions = data.get("assumptions", [])
    marker = {
        "id": "A-DB-READONLY",
        "category": "db_audit",
        "assumption": message,
        "rationale": "Database credentials or connectivity were unavailable during automated read-only audit.",
        "risk": "medium",
    }
    if not any(item.get("id") == marker["id"] for item in assumptions):
        assumptions.append(marker)
        data["assumptions"] = assumptions
        ASSUMPTIONS_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def fetch_all(cur: Any, query: str) -> list[dict[str, Any]]:
    cur.execute(query)
    cols = [desc.name for desc in cur.description]
    out: list[dict[str, Any]] = []
    for row in cur.fetchall():
        item = {}
        for idx, col in enumerate(cols):
            value = row[idx]
            if isinstance(value, datetime):
                value = value.isoformat()
            item[col] = value
        out.append(item)
    return out


def main() -> None:
    probe = {
        "generated_at": utc_now(),
        "mode": "read-only",
        "db": {"host": DB_HOST, "port": DB_PORT, "name": DB_NAME, "user": DB_USER},
        "status": "unknown",
    }

    if psycopg is None:
        probe["status"] = "skipped"
        probe["reason"] = "psycopg is not installed"
        write_json("db_probe.json", probe)
        safe_append_assumption("Read-only DB audit skipped because psycopg is not installed.")
        return

    dsn = f"host={DB_HOST} port={DB_PORT} dbname={DB_NAME} user={DB_USER} password={DB_PASSWORD}"
    try:
        with psycopg.connect(dsn) as conn:
            with conn.cursor() as cur:
                cur.execute("BEGIN TRANSACTION READ ONLY")

                snapshot = {
                    "generated_at": utc_now(),
                    "mode": "read-only",
                    "models": fetch_all(
                        cur,
                        """
                        SELECT m.id, m.model, m.name, m.info, m.state
                        FROM ir_model m
                        WHERE m.model LIKE 'construction.%' OR m.model LIKE 'project.%'
                        ORDER BY m.model
                        """,
                    ),
                    "fields": fetch_all(
                        cur,
                        """
                        SELECT f.id, m.model AS model, f.name, f.field_description, f.ttype, f.relation, f.required, f.readonly, f.store
                        FROM ir_model_fields f
                        JOIN ir_model m ON m.id = f.model_id
                        WHERE m.model LIKE 'construction.%' OR m.model LIKE 'project.%'
                        ORDER BY m.model, f.name
                        """,
                    ),
                    "acl": fetch_all(
                        cur,
                        """
                        SELECT a.id, a.name, m.model, g.full_name AS group_name,
                               a.perm_read, a.perm_write, a.perm_create, a.perm_unlink
                        FROM ir_model_access a
                        LEFT JOIN ir_model m ON m.id = a.model_id
                        LEFT JOIN res_groups g ON g.id = a.group_id
                        ORDER BY m.model, a.name
                        """,
                    ),
                    "record_rules": fetch_all(
                        cur,
                        """
                        SELECT r.id, r.name, m.model, r.domain_force,
                               r.perm_read, r.perm_write, r.perm_create, r.perm_unlink
                        FROM ir_rule r
                        LEFT JOIN ir_model m ON m.id = r.model_id
                        ORDER BY m.model, r.name
                        """,
                    ),
                    "menus": fetch_all(
                        cur,
                        """
                        SELECT id, name, parent_id, action, sequence
                        FROM ir_ui_menu
                        ORDER BY id
                        """,
                    ),
                    "views": fetch_all(
                        cur,
                        """
                        SELECT id, name, model, type, priority, inherit_id
                        FROM ir_ui_view
                        ORDER BY id
                        """,
                    ),
                    "reports": fetch_all(
                        cur,
                        """
                        SELECT id, name, model, report_name, report_type
                        FROM ir_actions_report
                        ORDER BY id
                        """,
                    ),
                }

                cur.execute("ROLLBACK")

        write_json("db_snapshot.json", snapshot)
        probe["status"] = "ok"
        probe["reason"] = "metadata extracted in read-only transaction"
        write_json("db_probe.json", probe)
    except Exception as exc:
        probe["status"] = "failed"
        probe["reason"] = str(exc)
        write_json("db_probe.json", probe)
        safe_append_assumption("Read-only DB audit failed due to connectivity or permissions; source scan artifacts were used.")


if __name__ == "__main__":
    main()
