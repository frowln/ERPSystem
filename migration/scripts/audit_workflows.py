#!/usr/bin/env python3
"""
Odoo Workflow/State Machine Auditor.
Output: migration/artifacts/workflows.json

For each model with a state/status Selection field, extracts:
  - States (selection values)
  - Transitions (action_* / button_* methods that change state)
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
OUTPUT = os.path.join(os.path.dirname(__file__), "..", "artifacts", "workflows.json")


def find_modules(addons_path: str) -> list[str]:
    modules = []
    for entry in sorted(Path(addons_path).iterdir()):
        if entry.is_dir() and entry.name.startswith("construction_"):
            if (entry / "__manifest__.py").exists():
                modules.append(str(entry))
    return modules


def extract_state_fields(source: str) -> list[dict]:
    """Find Selection fields named 'state' or 'status' and extract their values."""
    results = []
    try:
        tree = ast.parse(source)
    except SyntaxError:
        return results

    for node in ast.walk(tree):
        if not isinstance(node, ast.ClassDef):
            continue

        model_name = None
        state_fields = []
        action_methods = []

        for item in node.body:
            if isinstance(item, ast.Assign):
                for target in item.targets:
                    if isinstance(target, ast.Name) and target.id == "_name":
                        if isinstance(item.value, ast.Constant):
                            model_name = item.value.value

                    if isinstance(target, ast.Name) and target.id in ("state", "status"):
                        if isinstance(item.value, ast.Call):
                            func = item.value.func
                            if isinstance(func, ast.Attribute) and func.attr == "Selection":
                                selections = []
                                for kw in item.value.keywords:
                                    if kw.arg == "selection" and isinstance(kw.value, ast.List):
                                        for elt in kw.value.elts:
                                            if isinstance(elt, ast.Tuple) and len(elt.elts) >= 2:
                                                key = elt.elts[0].value if isinstance(elt.elts[0], ast.Constant) else "?"
                                                label = elt.elts[1].value if isinstance(elt.elts[1], ast.Constant) else "?"
                                                selections.append({"key": key, "label": label})
                                # Also check first positional arg
                                if not selections and item.value.args:
                                    arg = item.value.args[0]
                                    if isinstance(arg, ast.List):
                                        for elt in arg.elts:
                                            if isinstance(elt, ast.Tuple) and len(elt.elts) >= 2:
                                                key = elt.elts[0].value if isinstance(elt.elts[0], ast.Constant) else "?"
                                                label = elt.elts[1].value if isinstance(elt.elts[1], ast.Constant) else "?"
                                                selections.append({"key": key, "label": label})
                                if selections:
                                    default_val = None
                                    for kw in item.value.keywords:
                                        if kw.arg == "default" and isinstance(kw.value, ast.Constant):
                                            default_val = kw.value.value
                                    state_fields.append({
                                        "field": target.id,
                                        "states": selections,
                                        "default": default_val,
                                    })

            # Find action/button methods
            if isinstance(item, ast.FunctionDef):
                name = item.name
                if name.startswith(("action_", "button_", "_action_")):
                    # Try to find state assignment in the method body
                    transitions = []
                    for sub in ast.walk(item):
                        if isinstance(sub, ast.Assign):
                            for t in sub.targets:
                                if isinstance(t, ast.Attribute) and t.attr in ("state", "status"):
                                    if isinstance(sub.value, ast.Constant):
                                        transitions.append(sub.value.value)
                    action_methods.append({
                        "method": name,
                        "transitions_to": transitions,
                    })

        if model_name and state_fields:
            results.append({
                "class": node.name,
                "model": model_name,
                "state_fields": state_fields,
                "actions": action_methods,
            })

    return results


def audit_module(module_path: str) -> list[dict]:
    models_dir = os.path.join(module_path, "models")
    workflows = []

    if not os.path.isdir(models_dir):
        return workflows

    for py_file in sorted(Path(models_dir).glob("*.py")):
        if py_file.name == "__init__.py":
            continue
        try:
            source = py_file.read_text(encoding="utf-8")
        except Exception:
            continue
        results = extract_state_fields(source)
        for r in results:
            r["source"] = str(py_file.relative_to(module_path))
        workflows.extend(results)

    return workflows


def main():
    addons_path = sys.argv[1] if len(sys.argv) > 1 else ODOO_ADDONS
    addons_path = os.path.abspath(addons_path)

    modules = find_modules(addons_path)
    print(f"Found {len(modules)} modules", file=sys.stderr)

    output = {"generated": "auto", "workflows": []}

    for module_path in modules:
        module_name = os.path.basename(module_path)
        workflows = audit_module(module_path)
        for w in workflows:
            w["module"] = module_name
            output["workflows"].append(w)

    output["total_workflows"] = len(output["workflows"])

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Done: {len(output['workflows'])} workflows -> {OUTPUT}", file=sys.stderr)


if __name__ == "__main__":
    main()
