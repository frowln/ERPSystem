#!/usr/bin/env python3
"""
Odoo Integrations Auditor — finds external API calls, webhooks, cron jobs.
Output: migration/artifacts/integrations.json
"""

import json
import os
import re
import sys
from pathlib import Path

ODOO_ADDONS = os.environ.get(
    "ODOO_ADDONS_PATH",
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "odoo", "addons"),
)
OUTPUT = os.path.join(os.path.dirname(__file__), "..", "artifacts", "integrations.json")


def find_modules(addons_path):
    modules = []
    for entry in sorted(Path(addons_path).iterdir()):
        if entry.is_dir() and entry.name.startswith("construction_"):
            if (entry / "__manifest__.py").exists():
                modules.append(str(entry))
    return modules


def scan_file(filepath):
    """Scan a file for integration indicators."""
    findings = []
    try:
        content = Path(filepath).read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return findings

    # External HTTP calls
    for pattern, label in [
        (r'requests\.(get|post|put|patch|delete)\s*\(', "HTTP API call"),
        (r'http_requests\.(get|post|put|patch|delete)\s*\(', "HTTP API call"),
        (r'urllib\.request', "HTTP (urllib)"),
        (r'xmlrpc\.client', "XML-RPC call"),
        (r'zeep\.', "SOAP call"),
    ]:
        for m in re.finditer(pattern, content):
            line_no = content[:m.start()].count("\n") + 1
            findings.append({"type": label, "line": line_no, "match": m.group(0)})

    # Known service patterns
    for pattern, label in [
        (r'openai|chat_completion|gpt', "OpenAI API"),
        (r'1[cсС].*интеграц|exchange_1c|sync_1c|odata', "1C Integration"),
        (r'diadoc|sbis|edi_|edo_', "EDO (Diadoc/SBIS)"),
        (r'bank_api|bank_statement|bank_sync', "Bank API"),
        (r'sms_|send_sms|twilio|smsc', "SMS Gateway"),
        (r'telegram|tg_bot', "Telegram Bot"),
        (r'smtp|send_mail|mail\.template', "Email"),
        (r'webhook|callback_url', "Webhook"),
        (r'ir\.cron|_cron_|cron_method', "Scheduled Job (cron)"),
        (r'mqtt|iot_|sensor_', "IoT/MQTT"),
        (r'minio|s3_|boto3|aws', "S3/MinIO Storage"),
        (r'redis|cache_', "Redis Cache"),
        (r'elasticsearch|opensearch', "Search Engine"),
    ]:
        for m in re.finditer(pattern, content, re.IGNORECASE):
            line_no = content[:m.start()].count("\n") + 1
            findings.append({"type": label, "line": line_no, "match": m.group(0)})

    return findings


def audit_module(module_path):
    module_name = os.path.basename(module_path)
    all_findings = {}

    for py_file in Path(module_path).rglob("*.py"):
        if "__pycache__" in str(py_file):
            continue
        findings = scan_file(str(py_file))
        if findings:
            rel = str(py_file.relative_to(module_path))
            all_findings[rel] = findings

    return {"module": module_name, "files": all_findings}


def main():
    addons_path = sys.argv[1] if len(sys.argv) > 1 else ODOO_ADDONS
    addons_path = os.path.abspath(addons_path)

    modules = find_modules(addons_path)
    output = {"generated": "auto", "modules": [], "summary": {}}

    type_counts = {}
    for module_path in modules:
        data = audit_module(module_path)
        if data["files"]:
            output["modules"].append(data)
            for findings_list in data["files"].values():
                for f in findings_list:
                    t = f["type"]
                    type_counts[t] = type_counts.get(t, 0) + 1

    output["summary"] = dict(sorted(type_counts.items(), key=lambda x: -x[1]))

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Integrations: {len(output['modules'])} modules with integrations -> {OUTPUT}", file=sys.stderr)
    for k, v in sorted(type_counts.items(), key=lambda x: -x[1]):
        print(f"  {k}: {v}", file=sys.stderr)


if __name__ == "__main__":
    main()
