#!/usr/bin/env python3
"""
Frontend UI gap audit.

Creates:
  migration/artifacts/ui_gap_audit_report.json

Detects evidence of non-production UI fragments:
- console.log actions
- explicit placeholder/in-development text
- mock placeholderData usage
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path("/Users/damirkasimov/Desktop/privod2/privod2_next")
FRONTEND_SRC = ROOT / "frontend" / "src"
ARTIFACTS = ROOT / "migration" / "artifacts"
REPORT = ARTIFACTS / "ui_gap_audit_report.json"

CONSOLE_LOG_RX = re.compile(r"console\.log\(")
PLACEHOLDER_RX = re.compile(
    r"раздел в разработке|находится в разработке|будет доступен в следующей версии|скоро будет доступен|функционал .* в разработке|заглушк",
    flags=re.IGNORECASE,
)
MOCK_PLACEHOLDER_DATA_RX = re.compile(r"placeholderData:\s*mock", flags=re.IGNORECASE)


def tsx_files() -> list[Path]:
    return sorted(FRONTEND_SRC.rglob("*.tsx"))


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT))


def scan() -> dict:
    files = tsx_files()
    with_console = []
    with_placeholder_text = []
    with_mock_placeholder_data = []

    for file in files:
        text = file.read_text(encoding="utf-8")
        if CONSOLE_LOG_RX.search(text):
            with_console.append(rel(file))
        if PLACEHOLDER_RX.search(text):
            with_placeholder_text.append(rel(file))
        if MOCK_PLACEHOLDER_DATA_RX.search(text):
            with_mock_placeholder_data.append(rel(file))

    unique_files = sorted(set(with_console + with_placeholder_text + with_mock_placeholder_data))
    files_scanned = max(1, len(files))
    gap_file_ratio = len(unique_files) / files_scanned
    ui_hardening_percent = max(0.0, 100.0 * (1.0 - gap_file_ratio))

    return {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "scope": "frontend/src/**/*.tsx",
        "summary": {
            "files_scanned": len(files),
            "files_with_console_log": len(with_console),
            "files_with_placeholder_text": len(with_placeholder_text),
            "files_with_mock_placeholder_data": len(with_mock_placeholder_data),
            "files_with_any_gap_signal": len(unique_files),
            "gap_file_ratio": round(gap_file_ratio, 4),
            "ui_hardening_percent": round(ui_hardening_percent, 2),
        },
        "signals": {
            "console_log_files": with_console,
            "placeholder_text_files": with_placeholder_text,
            "mock_placeholder_data_files": with_mock_placeholder_data,
        },
        "notes": [
            "This report is heuristic and only detects textual signals, not semantic correctness.",
            "ui_hardening_percent measures UI production hardening, not business parity index.",
        ],
    }


def main() -> None:
    report = scan()
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote: {REPORT}")
    print(f"UI hardening: {report['summary']['ui_hardening_percent']}%")
    print(f"Files with any gap signal: {report['summary']['files_with_any_gap_signal']}")


if __name__ == "__main__":
    main()

