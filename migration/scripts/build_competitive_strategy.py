#!/usr/bin/env python3
"""
Builds a competitor benchmark + leapfrog strategy artifact for ERP rewrite.
Source: repository competitors.csv + curated additions for local market.
"""

from __future__ import annotations

import csv
import json
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path("/Users/damirkasimov/Desktop/privod2")
NEXT = ROOT / "privod2_next"
COMPETITORS_CSV = ROOT / "competitors.csv"
OUT_FILE = NEXT / "migration" / "artifacts" / "competitive_benchmark_2026.json"


def load_competitors() -> list[dict]:
    rows: list[dict] = []
    with COMPETITORS_CSV.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            normalized: dict[str, str] = {}
            for k, v in row.items():
                if not isinstance(k, str):
                    continue
                if isinstance(v, list):
                    normalized[k] = " | ".join(str(x) for x in v if x is not None).strip()
                else:
                    normalized[k] = str(v or "").strip()
            rows.append(normalized)
    # Ensure explicitly requested platforms are represented.
    manual = [
        {
            "product": "PUSK.app",
            "company": "PUSK",
            "country": "RU",
            "modules": "Construction workflow, estimates, planning, docs",
            "USP": "Local construction specialization, practical UX in Russian context",
            "SaaS/on-prem": "SaaS",
            "BIM": "Partial",
            "mobile_offline": "Mobile",
            "ai_features": "Not public/limited",
            "target_segment": "SMB/Enterprise",
            "price_model": "Subscription",
            "integration_examples": "Local accounting/EDO expected",
            "notes": "Curated entry: verify against latest public product sheet",
            "source_link": "https://pusk.app/",
        },
        {
            "product": "БИТ.Строительство",
            "company": "Первый Бит",
            "country": "RU",
            "modules": "1C-based construction accounting, budgeting, contracts, execution docs",
            "USP": "Deep localization and 1C ecosystem compatibility",
            "SaaS/on-prem": "On-prem/Hybrid",
            "BIM": "Limited",
            "mobile_offline": "Partial",
            "ai_features": "Limited",
            "target_segment": "SMB/Enterprise",
            "price_model": "License + implementation",
            "integration_examples": "1C stack, local banks/EDO",
            "notes": "Curated entry",
            "source_link": "https://www.1cbit.ru/",
        },
    ]
    known = {r.get("product", "").lower() for r in rows}
    for m in manual:
        if m["product"].lower() not in known:
            rows.append(m)
    return rows


def main() -> None:
    competitors = load_competitors()

    strengths = [
        {
            "theme": "Глубокая локализация РФ (1С/БИТ/Парус/Галактика)",
            "leaders": ["1C", "БИТ.Строительство", "Parus", "Galaktika"],
            "how_to_beat": [
                "Нативные КС-2/КС-3/М-29/КС-6/ТОРГ-12/УПД без костылей",
                "Интеграции 1С/ЭДО/банки с идемпотентностью, reconciliation и SLA мониторингом",
                "ABAC на уровне проекта/юрлица/объекта + непрерывный audit trail",
            ],
        },
        {
            "theme": "CDE + document control enterprise уровня (Aconex/ACC)",
            "leaders": ["Oracle Aconex", "Autodesk Construction Cloud"],
            "how_to_beat": [
                "ISO 19650 lifecycle (WIP/Shared/Published/Archived) как default",
                "Трассируемость ревизий/трансмитталов/RFI/Submittals в одном графе связей",
                "Согласования и digital signatures с версионированием и юридическим следом",
            ],
        },
        {
            "theme": "Field execution UX и мобильность (Procore/PlanRadar/Buildertrend)",
            "leaders": ["Procore", "PlanRadar", "Buildertrend"],
            "how_to_beat": [
                "Offline-first mobile flows (inspect → defect → assign → close) за <60 сек",
                "Фото/видео/геометки/голосовые заметки как first-class entity",
                "Супербыстрые role dashboards + saved views + bulk ops + keyboard actions",
            ],
        },
        {
            "theme": "Планирование CPM/EVM (Primavera/Bentley)",
            "leaders": ["Primavera P6", "Bentley SYNCHRO"],
            "how_to_beat": [
                "CPM+EVM в едином контуре с cost/procurement/fact data",
                "What-if сценарии и ранние предупреждения по SPI/CPI",
                "Связь WBS задач с документами, актами и закупками end-to-end",
            ],
        },
    ]

    world_class_backlog = [
        "WebRTC SFU/MCU call stack (audio/video/screenshare), recording + transcript + action items",
        "Integration marketplace with signed connectors (1C, Diadoc, Sbis, banks, BIM, IoT)",
        "Realtime collaborative tables/forms with conflict-safe autosave and audit diff",
        "AI co-pilot per role (РП/ПТО/финансы/снабжение) with explainable recommendations",
        "Deterministic migration harness old->new with scenario replay and parity gates in CI",
    ]

    report = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "source": str(COMPETITORS_CSV),
        "competitors_total": len(competitors),
        "competitors": competitors,
        "strength_themes": strengths,
        "world_class_leapfrog_backlog": world_class_backlog,
        "priority_90_days": [
            "Close functional parity gaps for 29 missing modules from module_parity_matrix.json",
            "Ship production-grade communication stack including video/audio calls",
            "Expand automated equivalence scenarios to 30+ (API+UI+workflow+integration contracts)",
            "Introduce design-system hardening: enterprise table performance budget and visual regression gates",
        ],
    }

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote: {OUT_FILE}")
    print(f"Competitors analyzed: {len(competitors)}")


if __name__ == "__main__":
    main()
