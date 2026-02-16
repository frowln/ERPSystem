#!/usr/bin/env python3
"""
Odoo Model Auditor — reads construction_* modules and extracts model definitions.
Output: migration/artifacts/models.json

Usage:
    python3 audit_models.py [--odoo-path /path/to/odoo/addons]
"""

import ast
import json
import os
import re
import sys
from pathlib import Path

ODOO_ADDONS = os.environ.get(
    "ODOO_ADDONS_PATH",
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "odoo", "addons"),
)
OUTPUT = os.path.join(os.path.dirname(__file__), "..", "artifacts", "models.json")


FIELD_TYPE_MAP = {
    "Char": "string",
    "Text": "text",
    "Html": "html",
    "Integer": "integer",
    "Float": "float",
    "Monetary": "decimal",
    "Boolean": "boolean",
    "Date": "date",
    "Datetime": "datetime",
    "Binary": "binary",
    "Selection": "selection",
    "Many2one": "many2one",
    "One2many": "one2many",
    "Many2many": "many2many",
    "Reference": "reference",
    "Image": "image",
}


def find_modules(addons_path: str) -> list[str]:
    """Find all construction_* module directories."""
    modules = []
    for entry in sorted(Path(addons_path).iterdir()):
        if entry.is_dir() and entry.name.startswith("construction_"):
            manifest = entry / "__manifest__.py"
            if manifest.exists():
                modules.append(str(entry))
    return modules


def parse_manifest(module_path: str) -> dict:
    """Parse __manifest__.py and return its dict."""
    manifest_path = os.path.join(module_path, "__manifest__.py")
    try:
        with open(manifest_path, "r", encoding="utf-8") as f:
            content = f.read()
        tree = ast.literal_eval(content)
        return tree if isinstance(tree, dict) else {}
    except Exception:
        return {}


def extract_field_info(call_node: ast.Call) -> dict:
    """Extract field metadata from an AST Call node like fields.Char(...)."""
    info = {}

    # Get field type from the call
    if isinstance(call_node.func, ast.Attribute):
        info["type"] = call_node.func.attr
    elif isinstance(call_node.func, ast.Name):
        info["type"] = call_node.func.id

    # Parse keyword arguments
    for kw in call_node.keywords:
        if kw.arg == "string":
            if isinstance(kw.value, ast.Constant):
                info["string"] = kw.value.value
        elif kw.arg == "required":
            if isinstance(kw.value, ast.Constant):
                info["required"] = kw.value.value
        elif kw.arg == "comodel_name":
            if isinstance(kw.value, ast.Constant):
                info["relation"] = kw.value.value
        elif kw.arg == "selection":
            if isinstance(kw.value, ast.List):
                selections = []
                for elt in kw.value.elts:
                    if isinstance(elt, ast.Tuple) and len(elt.elts) >= 2:
                        key = elt.elts[0].value if isinstance(elt.elts[0], ast.Constant) else "?"
                        label = elt.elts[1].value if isinstance(elt.elts[1], ast.Constant) else "?"
                        selections.append({"key": key, "label": label})
                info["selection"] = selections
        elif kw.arg == "inverse_name":
            if isinstance(kw.value, ast.Constant):
                info["inverse_name"] = kw.value.value
        elif kw.arg == "relation":
            if isinstance(kw.value, ast.Constant):
                info["relation_table"] = kw.value.value
        elif kw.arg == "default":
            if isinstance(kw.value, ast.Constant):
                info["default"] = kw.value.value
        elif kw.arg == "index":
            if isinstance(kw.value, ast.Constant):
                info["index"] = kw.value.value
        elif kw.arg == "tracking":
            if isinstance(kw.value, ast.Constant):
                info["tracking"] = kw.value.value
        elif kw.arg == "ondelete":
            if isinstance(kw.value, ast.Constant):
                info["ondelete"] = kw.value.value
        elif kw.arg == "copy":
            if isinstance(kw.value, ast.Constant):
                info["copy"] = kw.value.value
        elif kw.arg == "readonly":
            if isinstance(kw.value, ast.Constant):
                info["readonly"] = kw.value.value
        elif kw.arg == "store":
            if isinstance(kw.value, ast.Constant):
                info["store"] = kw.value.value
        elif kw.arg == "compute":
            if isinstance(kw.value, ast.Constant):
                info["compute"] = kw.value.value

    # First positional arg is often comodel_name for relational fields
    if call_node.args and "relation" not in info:
        if isinstance(call_node.args[0], ast.Constant) and isinstance(call_node.args[0].value, str):
            ftype = info.get("type", "")
            if ftype in ("Many2one", "One2many", "Many2many"):
                info["relation"] = call_node.args[0].value

    return info


def parse_python_file(filepath: str) -> list[dict]:
    """Parse a Python file and extract model definitions."""
    models = []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            source = f.read()
        tree = ast.parse(source)
    except Exception as e:
        print(f"  Warning: could not parse {filepath}: {e}", file=sys.stderr)
        return []

    for node in ast.walk(tree):
        if not isinstance(node, ast.ClassDef):
            continue

        model_info = {
            "class_name": node.name,
            "name": None,
            "description": None,
            "inherit": [],
            "inherits": {},
            "fields": [],
            "sql_constraints": [],
            "methods": [],
            "rec_name": None,
            "order": None,
            "check_company_auto": False,
        }

        for item in node.body:
            # _name = 'model.name'
            if isinstance(item, ast.Assign):
                for target in item.targets:
                    if isinstance(target, ast.Name):
                        if target.id == "_name" and isinstance(item.value, ast.Constant):
                            model_info["name"] = item.value.value
                        elif target.id == "_description" and isinstance(item.value, ast.Constant):
                            model_info["description"] = item.value.value
                        elif target.id == "_rec_name" and isinstance(item.value, ast.Constant):
                            model_info["rec_name"] = item.value.value
                        elif target.id == "_order" and isinstance(item.value, ast.Constant):
                            model_info["order"] = item.value.value
                        elif target.id == "_check_company_auto":
                            model_info["check_company_auto"] = True
                        elif target.id == "_inherit":
                            if isinstance(item.value, ast.Constant):
                                model_info["inherit"] = [item.value.value]
                            elif isinstance(item.value, ast.List):
                                model_info["inherit"] = [
                                    e.value for e in item.value.elts
                                    if isinstance(e, ast.Constant)
                                ]
                        elif target.id == "_inherits":
                            if isinstance(item.value, ast.Dict):
                                for k, v in zip(item.value.keys, item.value.values):
                                    if isinstance(k, ast.Constant) and isinstance(v, ast.Constant):
                                        model_info["inherits"][k.value] = v.value
                        elif target.id == "_sql_constraints":
                            if isinstance(item.value, ast.List):
                                for elt in item.value.elts:
                                    if isinstance(elt, ast.Tuple) and len(elt.elts) >= 2:
                                        parts = [
                                            e.value if isinstance(e, ast.Constant) else "?"
                                            for e in elt.elts
                                        ]
                                        model_info["sql_constraints"].append(parts)

                        # Field definitions: field_name = fields.Type(...)
                        if isinstance(item.value, ast.Call):
                            func = item.value.func
                            is_field = False
                            if isinstance(func, ast.Attribute):
                                if isinstance(func.value, ast.Name) and func.value.id == "fields":
                                    is_field = True
                            if is_field:
                                field_info = extract_field_info(item.value)
                                field_info["name"] = target.id
                                model_info["fields"].append(field_info)

            # Methods
            if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                if not item.name.startswith("_"):
                    model_info["methods"].append(item.name)
                elif item.name.startswith("_compute_") or item.name.startswith("_onchange_"):
                    model_info["methods"].append(item.name)
                elif item.name in ("_check_dates", "_check_amounts", "_check_state"):
                    model_info["methods"].append(item.name)

        if model_info["name"] or model_info["inherit"]:
            models.append(model_info)

    return models


def audit_module(module_path: str) -> dict:
    """Audit a single module."""
    module_name = os.path.basename(module_path)
    manifest = parse_manifest(module_path)

    models_dir = os.path.join(module_path, "models")
    all_models = []

    if os.path.isdir(models_dir):
        for py_file in sorted(Path(models_dir).glob("*.py")):
            if py_file.name == "__init__.py":
                continue
            models = parse_python_file(str(py_file))
            for m in models:
                m["source_file"] = str(py_file.relative_to(module_path))
            all_models.extend(models)

    return {
        "module": module_name,
        "display_name": manifest.get("name", module_name),
        "summary": manifest.get("summary", ""),
        "category": manifest.get("category", ""),
        "depends": manifest.get("depends", []),
        "models": all_models,
    }


def main():
    addons_path = sys.argv[1] if len(sys.argv) > 1 else ODOO_ADDONS
    addons_path = os.path.abspath(addons_path)

    if not os.path.isdir(addons_path):
        print(f"Error: addons path not found: {addons_path}", file=sys.stderr)
        sys.exit(1)

    modules = find_modules(addons_path)
    print(f"Found {len(modules)} construction_* modules", file=sys.stderr)

    result = {"generated": "auto", "modules_count": len(modules), "modules": []}

    for module_path in modules:
        print(f"  Auditing {os.path.basename(module_path)}...", file=sys.stderr)
        module_data = audit_module(module_path)
        result["modules"].append(module_data)

    total_models = sum(len(m["models"]) for m in result["modules"])
    total_fields = sum(
        len(f["fields"]) for m in result["modules"] for f in m["models"]
    )
    result["total_models"] = total_models
    result["total_fields"] = total_fields

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"Done: {total_models} models, {total_fields} fields -> {OUTPUT}", file=sys.stderr)


if __name__ == "__main__":
    main()
