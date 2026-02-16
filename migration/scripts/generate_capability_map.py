#!/usr/bin/env python3
"""
Generate capability_map.json from audit artifacts.
Groups modules by business domain and maps capabilities.
"""

import json
import os
import sys

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "artifacts")
OUTPUT = os.path.join(ARTIFACTS_DIR, "capability_map.json")

# Manual domain mapping based on module analysis
DOMAIN_MAP = {
    "core": {
        "name": "Ядро платформы",
        "modules": [
            "construction_base", "construction_rbac", "construction_security",
            "construction_mfa", "construction_auth_oidc", "construction_cache",
            "construction_search", "construction_monitoring", "construction_devops",
            "construction_pwa", "construction_ui_improvements", "construction_theme",
        ],
        "capabilities": [
            "Управление пользователями и ролями (RBAC/ABAC)",
            "Многофакторная аутентификация (MFA)",
            "SSO через OIDC",
            "Глобальный полнотекстовый поиск",
            "Кеширование и оптимизация",
            "Мониторинг и healthcheck",
            "PWA (прогрессивное веб-приложение)",
            "Настройка UI (тема, сайдбар)",
        ],
    },
    "project_management": {
        "name": "Управление проектами",
        "modules": [
            "construction_project_enhanced", "construction_planning",
            "construction_gantt", "construction_kpi",
            "construction_calendar_integration", "construction_reporting_calendar",
            "construction_punch_list",
        ],
        "capabilities": [
            "Паспорт проекта (даты, бюджет, команда, статус)",
            "WBS и декомпозиция работ",
            "Диаграмма Ганта с зависимостями",
            "KPI и дашборды руководителя",
            "Контрольные точки и вехи",
            "Punch-list (замечания/дефекты)",
            "Календарь проекта",
        ],
    },
    "contracts": {
        "name": "Договоры и юридический блок",
        "modules": [
            "construction_contract", "construction_legal",
            "construction_contractor_portal", "construction_tolerance",
        ],
        "capabilities": [
            "Реестр договоров (заказчик/поставщик/субподряд)",
            "Дополнительные соглашения",
            "Удержания и гарантии",
            "Портал подрядчиков",
            "Допуски и отклонения",
            "Юридические документы",
        ],
    },
    "estimates_pto": {
        "name": "Сметы и ПТО",
        "modules": [
            "construction_estimate", "construction_specification",
            "construction_pto", "construction_submittals",
            "construction_design", "construction_drawing_annotation",
            "construction_bim",
        ],
        "capabilities": [
            "Сметная документация (локальные/объектные/сводные)",
            "Спецификации материалов и оборудования",
            "КС-2 (акты выполненных работ)",
            "КС-3 (справки о стоимости)",
            "M-29 (отчёт о расходе материалов)",
            "Submittals (передача материалов)",
            "BIM-интеграция",
            "Аннотации на чертежах",
        ],
    },
    "procurement_supply": {
        "name": "Снабжение и закупки",
        "modules": [
            "construction_procurement", "construction_purchase_integration",
            "construction_material_analogs", "construction_reservation",
        ],
        "capabilities": [
            "Заявки на закупку",
            "Тендеры и сравнение предложений",
            "Заказ поставщикам",
            "Аналоги материалов",
            "Резервирование материалов",
            "Отслеживание поставок",
        ],
    },
    "warehouse": {
        "name": "Склад и логистика",
        "modules": [
            "construction_stock", "construction_stock_integration",
            "construction_stock_limits", "construction_logistics",
            "construction_dispatch",
        ],
        "capabilities": [
            "Складской учёт (приход/расход/перемещение)",
            "Лимитно-заборные карты",
            "Инвентаризация",
            "Минимальные остатки и алерты",
            "Логистика и маршруты доставки",
            "Диспетчеризация транспорта",
        ],
    },
    "finance": {
        "name": "Финансы и учёт",
        "modules": [
            "construction_finance", "construction_russian_accounting",
            "construction_journals",
        ],
        "capabilities": [
            "Cash-flow (поступления/выплаты)",
            "Начисления (accrual) — выручка/затраты",
            "Дебиторская/кредиторская задолженность (AR/AP)",
            "Маржинальный анализ (план/факт)",
            "Бюджетирование проектов",
            "Российский бухгалтерский учёт",
            "Журналы операций",
        ],
    },
    "documents_edo": {
        "name": "Документы и ЭДО",
        "modules": [
            "construction_documents", "construction_russian_documents",
            "construction_edo_generator", "construction_edi_sbis",
            "construction_kep", "construction_ocr",
        ],
        "capabilities": [
            "Реестр документов проекта (CDE)",
            "Версионирование документов",
            "Согласование (workflow)",
            "Российские первичные документы (УПД, счета-фактуры, ТОРГ-12)",
            "ЭДО через Диадок/СБИС",
            "Квалифицированная электронная подпись (КЭП)",
            "OCR распознавание документов",
        ],
    },
    "hr_safety": {
        "name": "HR и охрана труда",
        "modules": [
            "construction_hr", "construction_hr_russian",
            "construction_safety", "construction_crew_time",
            "construction_certificates", "construction_ens",
        ],
        "capabilities": [
            "Кадровый учёт сотрудников",
            "Российский кадровый документооборот",
            "Инциденты и расследования",
            "Инструктажи по ТБ",
            "Бригадный табель",
            "Сертификаты и допуски сотрудников",
            "Уведомления ЕНС",
        ],
    },
    "operations": {
        "name": "Оперативное управление",
        "modules": [
            "construction_daily_log", "construction_monthly_schedule",
            "construction_ops", "construction_photo_progress",
            "construction_fleet_integration", "construction_maintenance_integration",
            "construction_iot",
        ],
        "capabilities": [
            "Ежедневный журнал работ",
            "Месячно-суточный график (МСГ)",
            "Оперативное планирование",
            "Фотофиксация прогресса",
            "Управление техникой/флотом",
            "ТОиР (техобслуживание)",
            "IoT датчики и телеметрия",
        ],
    },
    "analytics": {
        "name": "Аналитика и отчётность",
        "modules": [
            "construction_analytics", "construction_reports",
            "construction_regulatory_reports", "construction_lrv",
        ],
        "capabilities": [
            "Дашборды (CEO, РП, ПТО, снабжение)",
            "Аналитические отчёты",
            "Регуляторная отчётность РФ",
            "Журнал учёта выполненных работ",
        ],
    },
    "integrations": {
        "name": "Интеграции",
        "modules": [
            "construction_1c_integration", "construction_integration",
            "construction_integrations_enhanced", "construction_crm_integration",
            "construction_timesheet_integration",
        ],
        "capabilities": [
            "1С двусторонний обмен (справочники, документы, проводки)",
            "Банковские выписки (API банков)",
            "CRM интеграция",
            "Табели в бухгалтерию",
        ],
    },
    "ai": {
        "name": "AI ассистент",
        "modules": [
            "construction_ai", "construction_ai_assistant",
        ],
        "capabilities": [
            "Чат-бот с GPT (контекстный анализ проектов)",
            "Анализ документов",
            "Рекомендации по задачам",
            "Локальный fallback (без GPT)",
        ],
    },
    "portals": {
        "name": "Порталы и мобильность",
        "modules": [
            "construction_mobile", "construction_api",
            "construction_website", "construction_support",
        ],
        "capabilities": [
            "REST API для мобильных приложений",
            "Публичный сайт/портал заказчика",
            "Портал технической поддержки",
            "Мобильная адаптация (PWA)",
        ],
    },
}


def main():
    # Load models.json to enrich with stats
    models_path = os.path.join(ARTIFACTS_DIR, "models.json")
    models_data = {}
    if os.path.exists(models_path):
        with open(models_path, "r", encoding="utf-8") as f:
            raw = json.load(f)
        for mod in raw.get("modules", []):
            models_data[mod["module"]] = {
                "model_count": len(mod.get("models", [])),
                "field_count": sum(len(m.get("fields", [])) for m in mod.get("models", [])),
            }

    # Build output
    output = {
        "generated": "auto",
        "domains": {},
        "summary": {
            "total_domains": len(DOMAIN_MAP),
            "total_modules": sum(len(d["modules"]) for d in DOMAIN_MAP.values()),
            "total_capabilities": sum(len(d["capabilities"]) for d in DOMAIN_MAP.values()),
        },
    }

    for domain_key, domain in DOMAIN_MAP.items():
        domain_modules = []
        for mod_name in domain["modules"]:
            stats = models_data.get(mod_name, {})
            domain_modules.append({
                "name": mod_name,
                "models": stats.get("model_count", 0),
                "fields": stats.get("field_count", 0),
            })

        output["domains"][domain_key] = {
            "name": domain["name"],
            "modules": domain_modules,
            "capabilities": domain["capabilities"],
            "module_count": len(domain_modules),
            "total_models": sum(m["models"] for m in domain_modules),
            "total_fields": sum(m["fields"] for m in domain_modules),
        }

    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Capability map: {len(DOMAIN_MAP)} domains -> {OUTPUT}", file=sys.stderr)


if __name__ == "__main__":
    main()
