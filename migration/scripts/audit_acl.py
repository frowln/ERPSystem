#!/usr/bin/env python3
"""
Odoo ACL & Record Rules Auditor.
Output: migration/artifacts/acl.json

Reads:
  - security/ir.model.access.csv (model-level ACL)
  - security/*.xml (record rules / ir.rule)
"""

import csv
import json
import os
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ODOO_ADDONS = os.environ.get(
    "ODOO_ADDONS_PATH",
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "odoo", "addons"),
)
OUTPUT = os.path.join(os.path.dirname(__file__), "..", "artifacts", "acl.json")


def find_modules(addons_path: str) -> list[str]:
    modules = []
    for entry in sorted(Path(addons_path).iterdir()):
        if entry.is_dir() and entry.name.startswith("construction_"):
            if (entry / "__manifest__.py").exists():
                modules.append(str(entry))
    return modules


def parse_acl_csv(filepath: str) -> list[dict]:
    """Parse ir.model.access.csv."""
    acls = []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                acls.append({
                    "id": row.get("id", ""),
                    "name": row.get("name", ""),
                    "model_id": row.get("model_id:id", row.get("model_id/id", "")),
                    "group_id": row.get("group_id:id", row.get("group_id/id", "")),
                    "perm_read": row.get("perm_read", "0") == "1",
                    "perm_write": row.get("perm_write", "0") == "1",
                    "perm_create": row.get("perm_create", "0") == "1",
                    "perm_unlink": row.get("perm_unlink", "0") == "1",
                })
    except Exception as e:
        print(f"  Warning: could not parse {filepath}: {e}", file=sys.stderr)
    return acls


def parse_record_rules(filepath: str) -> list[dict]:
    """Parse ir.rule records from XML files."""
    rules = []
    try:
        tree = ET.parse(filepath)
        root = tree.getroot()
        for record in root.iter("record"):
            if record.get("model") == "ir.rule":
                rule = {"id": record.get("id", "")}
                for field in record.findall("field"):
                    name = field.get("name", "")
                    if name == "name":
                        rule["name"] = field.text or ""
                    elif name == "model_id":
                        rule["model_ref"] = field.get("ref", "")
                    elif name == "domain_force":
                        rule["domain"] = field.text or ""
                    elif name == "groups":
                        # Can be eval="[(4, ref('group.id'))]" or similar
                        rule["groups_eval"] = field.get("eval", "")
                    elif name == "global":
                        rule["global"] = field.get("eval", field.text or "")
                    elif name in ("perm_read", "perm_write", "perm_create", "perm_unlink"):
                        rule[name] = field.get("eval", field.text or "")
                rules.append(rule)
    except Exception as e:
        print(f"  Warning: could not parse {filepath}: {e}", file=sys.stderr)
    return rules


def parse_groups(filepath: str) -> list[dict]:
    """Parse res.groups definitions from XML."""
    groups = []
    try:
        tree = ET.parse(filepath)
        root = tree.getroot()
        for record in root.iter("record"):
            if record.get("model") == "res.groups":
                group = {"id": record.get("id", "")}
                for field in record.findall("field"):
                    name = field.get("name", "")
                    if name == "name":
                        group["name"] = field.text or ""
                    elif name == "category_id":
                        group["category_ref"] = field.get("ref", "")
                    elif name == "implied_ids":
                        group["implied_eval"] = field.get("eval", "")
                groups.append(group)
    except Exception as e:
        pass
    return groups


def audit_module(module_path: str) -> dict:
    module_name = os.path.basename(module_path)
    security_dir = os.path.join(module_path, "security")

    result = {
        "module": module_name,
        "acl": [],
        "record_rules": [],
        "groups": [],
    }

    if not os.path.isdir(security_dir):
        return result

    # Parse ACL CSV
    acl_csv = os.path.join(security_dir, "ir.model.access.csv")
    if os.path.isfile(acl_csv):
        result["acl"] = parse_acl_csv(acl_csv)

    # Parse XML files for record rules and groups
    for xml_file in sorted(Path(security_dir).glob("*.xml")):
        result["record_rules"].extend(parse_record_rules(str(xml_file)))
        result["groups"].extend(parse_groups(str(xml_file)))

    return result


def main():
    addons_path = sys.argv[1] if len(sys.argv) > 1 else ODOO_ADDONS
    addons_path = os.path.abspath(addons_path)

    modules = find_modules(addons_path)
    print(f"Found {len(modules)} modules", file=sys.stderr)

    output = {"generated": "auto", "modules": []}

    for module_path in modules:
        data = audit_module(module_path)
        if data["acl"] or data["record_rules"] or data["groups"]:
            output["modules"].append(data)
            print(
                f"  {data['module']}: {len(data['acl'])} ACL, "
                f"{len(data['record_rules'])} rules, {len(data['groups'])} groups",
                file=sys.stderr,
            )

    total_acl = sum(len(m["acl"]) for m in output["modules"])
    total_rules = sum(len(m["record_rules"]) for m in output["modules"])
    total_groups = sum(len(m["groups"]) for m in output["modules"])
    output["totals"] = {
        "acl_entries": total_acl,
        "record_rules": total_rules,
        "groups": total_groups,
    }

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Done: {total_acl} ACL, {total_rules} rules, {total_groups} groups -> {OUTPUT}", file=sys.stderr)


if __name__ == "__main__":
    main()
