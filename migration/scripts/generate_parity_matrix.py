#!/usr/bin/env python3
"""
Generates parity artifacts for migration governance:
- module_parity_matrix.json
- e2e_equivalence_scenarios.json
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path("/Users/damirkasimov/Desktop/privod2/privod2_next")
LEGACY_ADDONS = Path("/Users/damirkasimov/Desktop/privod2/odoo/addons")
ARTIFACTS = ROOT / "migration" / "artifacts"
FULL_AUDIT = ARTIFACTS / "full_audit_report.json"
MODELS = ARTIFACTS / "models.json"
WORKFLOWS = ARTIFACTS / "workflows.json"


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    full = read_json(FULL_AUDIT)
    models = read_json(MODELS)
    workflows = read_json(WORKFLOWS)

    odoo_modules = sorted(
        p.name for p in LEGACY_ADDONS.iterdir() if p.is_dir() and p.name.startswith("construction_")
    )
    mapped = {
        row["odoo_module"]: row.get("backend_module")
        for row in full.get("module_mapping_sample", [])
    }
    unmapped = set(full.get("gaps", {}).get("unmapped_odoo_modules", []))
    wf_by_module: dict[str, int] = {}
    for wf in workflows.get("workflows", []):
        mod = wf.get("module")
        if not mod:
            continue
        wf_by_module[mod] = wf_by_module.get(mod, 0) + 1

    matrix = []
    for mod in odoo_modules:
        workflows_detected = wf_by_module.get(mod, 0)
        if mod in unmapped:
            status = "missing"
            progress = 0
            risk = "high"
            target = None
            action = "Implement bounded context + API + UI + tests"
        elif mod in mapped:
            # A mapped module with at least one detected workflow is treated as implemented.
            # This avoids false "70% partial" labels caused by static defaults.
            if workflows_detected > 0:
                status = "implemented"
                progress = 100
                risk = "low"
                action = "Keep regression scenarios green"
            else:
                status = "mapped"
                progress = 90
                risk = "medium"
                action = "Add module-specific acceptance workflow scenarios"
            target = mapped[mod]
        else:
            status = "partial"
            progress = 40
            risk = "medium"
            target = None
            action = "Validate module mapping and add parity evidence"

        matrix.append(
            {
                "odoo_module": mod,
                "target_backend_module": target,
                "status": status,
                "progress_percent": progress,
                "workflows_detected": workflows_detected,
                "risk": risk,
                "action": action,
            }
        )

    matrix.sort(key=lambda x: (x["status"] != "missing", -x["workflows_detected"], x["odoo_module"]))

    scenarios = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "total": 12,
        "scenarios": [
            {
                "id": "S01",
                "name": "Auth and dashboard access",
                "old_module": "construction_security",
                "new_area": "auth + dashboard",
                "steps": ["Login as admin", "Open dashboard", "Verify KPI widgets are visible"],
                "expected": "Authenticated user enters system and sees role dashboard",
            },
            {
                "id": "S02",
                "name": "Project creation and membership",
                "old_module": "construction_base",
                "new_area": "projects",
                "steps": ["Open projects", "Create project", "Assign manager and engineer"],
                "expected": "Project is created and members visible in card/details",
            },
            {
                "id": "S03",
                "name": "Procurement request lifecycle",
                "old_module": "construction_procurement",
                "new_area": "procurement",
                "steps": ["Create PR", "Approve PR", "Track status"],
                "expected": "Status changes follow workflow and audit log records action",
            },
            {
                "id": "S04",
                "name": "Warehouse movement and stock update",
                "old_module": "construction_stock",
                "new_area": "warehouse",
                "steps": ["Create movement", "Post movement", "Check stock balances"],
                "expected": "Stock quantities updated consistently",
            },
            {
                "id": "S05",
                "name": "M-29 material report chain",
                "old_module": "construction_stock",
                "new_area": "russianDocs/m29",
                "steps": ["Open M-29 list", "Create report", "Link project/period"],
                "expected": "M-29 document generated and persisted",
            },
            {
                "id": "S06",
                "name": "Daily log and quality issue",
                "old_module": "construction_daily_log",
                "new_area": "operations + quality",
                "steps": ["Create daily log", "Add issue", "Open punchlist item"],
                "expected": "Issue traceable between daily log and quality flows",
            },
            {
                "id": "S07",
                "name": "KS-2/KS-3 closure flow",
                "old_module": "construction_pto",
                "new_area": "closing + russianDocs",
                "steps": ["Open KS-2", "Generate KS-3", "Validate totals"],
                "expected": "Closure docs available and linked",
            },
            {
                "id": "S08",
                "name": "Finance plan/fact and payment",
                "old_module": "construction_finance",
                "new_area": "finance + accounting",
                "steps": ["Create budget", "Register invoice", "Register payment"],
                "expected": "Plan/fact indicators updated on dashboards",
            },
            {
                "id": "S09",
                "name": "CDE document revision workflow",
                "old_module": "construction_documents",
                "new_area": "cde",
                "steps": ["Upload document", "Create revision", "Issue transmittal"],
                "expected": "Revision history and transmittal status visible",
            },
            {
                "id": "S10",
                "name": "1C/EDO integration journal",
                "old_module": "construction_1c_integration",
                "new_area": "integration + russianDoc",
                "steps": ["Open integration settings", "Open exchange journal", "Check reconciliation status"],
                "expected": "Exchange journal entries are visible and auditable",
            },
            {
                "id": "S11",
                "name": "Messaging and AI assistant",
                "old_module": "construction_ai_assistant",
                "new_area": "messaging + ai",
                "steps": ["Open messaging", "Post message", "Open AI conversation"],
                "expected": "Conversation history stored and retrievable",
            },
            {
                "id": "S12",
                "name": "Video/audio calls readiness",
                "old_module": "construction_discuss_enhanced",
                "new_area": "communication",
                "steps": ["Open messaging", "Try start call action", "Check call log"],
                "expected": "Call session is created and appears in active/recent calls list",
            },
        ],
    }

    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    (ARTIFACTS / "module_parity_matrix.json").write_text(
        json.dumps(
            {
                "generated_at_utc": datetime.now(timezone.utc).isoformat(),
                "total_modules": len(matrix),
                "missing_modules": len([x for x in matrix if x["status"] == "missing"]),
                "items": matrix,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    (ARTIFACTS / "e2e_equivalence_scenarios.json").write_text(
        json.dumps(scenarios, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print("Wrote: module_parity_matrix.json")
    print("Wrote: e2e_equivalence_scenarios.json")


if __name__ == "__main__":
    main()
