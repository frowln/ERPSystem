#!/usr/bin/env python3
"""
Odoo Menu & View Auditor.
Output: migration/artifacts/menus.json, migration/artifacts/views.json
"""

import json
import os
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ODOO_ADDONS = os.environ.get(
    "ODOO_ADDONS_PATH",
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "odoo", "addons"),
)
MENUS_OUTPUT = os.path.join(os.path.dirname(__file__), "..", "artifacts", "menus.json")
VIEWS_OUTPUT = os.path.join(os.path.dirname(__file__), "..", "artifacts", "views.json")


def find_modules(addons_path):
    modules = []
    for entry in sorted(Path(addons_path).iterdir()):
        if entry.is_dir() and entry.name.startswith("construction_"):
            if (entry / "__manifest__.py").exists():
                modules.append(str(entry))
    return modules


def parse_xml_safe(filepath):
    try:
        tree = ET.parse(filepath)
        return tree.getroot()
    except Exception:
        return None


def extract_menus(root, module_name):
    menus = []
    for mi in root.iter("menuitem"):
        menu = {
            "module": module_name,
            "id": mi.get("id", ""),
            "name": mi.get("name", ""),
            "parent": mi.get("parent", ""),
            "action": mi.get("action", ""),
            "sequence": mi.get("sequence", ""),
            "groups": mi.get("groups", ""),
        }
        menus.append(menu)
    return menus


def extract_views(root, module_name):
    views = []
    for record in root.iter("record"):
        model = record.get("model", "")
        if model == "ir.ui.view":
            view = {
                "module": module_name,
                "id": record.get("id", ""),
            }
            for field in record.findall("field"):
                name = field.get("name", "")
                if name == "name":
                    view["name"] = field.text or ""
                elif name == "model":
                    view["target_model"] = field.text or ""
                elif name == "type":
                    view["view_type"] = field.text or ""
                elif name == "inherit_id":
                    view["inherit_ref"] = field.get("ref", "")
                elif name == "arch":
                    arch_type = field.get("type", "")
                    if arch_type == "xml":
                        arch_text = ET.tostring(field, encoding="unicode", method="xml")
                        if "<tree" in arch_text or "<list" in arch_text:
                            view["view_type"] = "list"
                        elif "<form" in arch_text:
                            view["view_type"] = "form"
                        elif "<kanban" in arch_text:
                            view["view_type"] = "kanban"
                        elif "<search" in arch_text:
                            view["view_type"] = "search"
                        elif "<pivot" in arch_text:
                            view["view_type"] = "pivot"
                        elif "<graph" in arch_text:
                            view["view_type"] = "graph"
                        elif "<calendar" in arch_text:
                            view["view_type"] = "calendar"
                        elif "<gantt" in arch_text:
                            view["view_type"] = "gantt"
                        elif "<dashboard" in arch_text:
                            view["view_type"] = "dashboard"

            views.append(view)

        # Also find ir.actions.act_window
        if model == "ir.actions.act_window":
            action = {
                "module": module_name,
                "id": record.get("id", ""),
                "type": "action",
            }
            for field in record.findall("field"):
                name = field.get("name", "")
                if name == "name":
                    action["name"] = field.text or ""
                elif name == "res_model":
                    action["target_model"] = field.text or ""
                elif name == "view_mode":
                    action["view_mode"] = field.text or ""
            views.append(action)

    return views


def extract_reports(root, module_name):
    reports = []
    for record in root.iter("record"):
        if record.get("model") in ("ir.actions.report", "ir.actions.report.xml"):
            report = {"module": module_name, "id": record.get("id", "")}
            for field in record.findall("field"):
                name = field.get("name", "")
                if name == "name":
                    report["name"] = field.text or ""
                elif name == "model":
                    report["target_model"] = field.text or ""
                elif name == "report_name":
                    report["template"] = field.text or ""
                elif name == "report_type":
                    report["report_type"] = field.text or ""
            reports.append(report)

    # Template-based reports
    for tmpl in root.iter("template"):
        tid = tmpl.get("id", "")
        if tid:
            reports.append({
                "module": module_name,
                "id": tid,
                "type": "qweb_template",
            })

    return reports


def main():
    addons_path = sys.argv[1] if len(sys.argv) > 1 else ODOO_ADDONS
    addons_path = os.path.abspath(addons_path)

    modules = find_modules(addons_path)
    all_menus = []
    all_views = []
    all_reports = []

    for module_path in modules:
        module_name = os.path.basename(module_path)
        # Scan all XML files in views/, data/, security/, report/
        for subdir in ("views", "data", "security", "report", "reports", "wizard"):
            xml_dir = os.path.join(module_path, subdir)
            if not os.path.isdir(xml_dir):
                continue
            for xml_file in sorted(Path(xml_dir).glob("*.xml")):
                root = parse_xml_safe(str(xml_file))
                if root is None:
                    continue
                all_menus.extend(extract_menus(root, module_name))
                all_views.extend(extract_views(root, module_name))
                all_reports.extend(extract_reports(root, module_name))

        # Also check root-level XML
        for xml_file in Path(module_path).glob("*.xml"):
            root = parse_xml_safe(str(xml_file))
            if root is not None:
                all_menus.extend(extract_menus(root, module_name))

    # Write menus
    menus_output = {
        "generated": "auto",
        "total": len(all_menus),
        "menus": all_menus,
    }
    os.makedirs(os.path.dirname(MENUS_OUTPUT), exist_ok=True)
    with open(MENUS_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(menus_output, f, ensure_ascii=False, indent=2)

    # Write views
    views_output = {
        "generated": "auto",
        "total_views": len([v for v in all_views if v.get("type") != "action"]),
        "total_actions": len([v for v in all_views if v.get("type") == "action"]),
        "views": all_views,
    }
    with open(VIEWS_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(views_output, f, ensure_ascii=False, indent=2)

    # Write reports
    reports_output = {
        "generated": "auto",
        "total": len(all_reports),
        "reports": all_reports,
    }
    reports_path = os.path.join(os.path.dirname(MENUS_OUTPUT), "reports.json")
    with open(reports_path, "w", encoding="utf-8") as f:
        json.dump(reports_output, f, ensure_ascii=False, indent=2)

    print(f"Menus: {len(all_menus)} -> {MENUS_OUTPUT}", file=sys.stderr)
    print(f"Views/Actions: {len(all_views)} -> {VIEWS_OUTPUT}", file=sys.stderr)
    print(f"Reports: {len(all_reports)} -> {reports_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
