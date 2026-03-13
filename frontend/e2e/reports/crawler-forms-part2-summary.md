# Form Completeness Crawler — Part 2 (HR → Admin)
Generated: 2026-03-12T20:01:39.743Z

## Overview

| Metric | Count |
|--------|-------|
| Total forms tested | 76 |
| Total form fields discovered | 408 |
| Fields filled successfully | 61 (15%) |
| Fields with validation | 24 |
| Forms submitted successfully | 4 |
| Forms with submit errors | 39 |
| Pages with JS errors | 54 |
| Negative tests passed | 14/15 |
| Negative tests failed | 1 |

## Issue Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 10 |
| MAJOR | 39 |
| MINOR | 1 |
| UX | 20 |
| MISSING | 0 |

## Group Breakdown

| Group | Forms | Fields | Filled | Submit OK | Issues |
|-------|-------|--------|--------|-----------|--------|
| H-HR | 11 | 124 | 24 | 6/11 | 12 |
| I-Safety | 10 | 33 | 14 | 4/10 | 10 |
| J-Quality | 12 | 62 | 2 | 4/12 | 12 |
| K-Warehouse | 11 | 18 | 0 | 3/11 | 10 |
| L-Fleet | 9 | 16 | 2 | 3/9 | 7 |
| M-Portal | 12 | 37 | 1 | 8/12 | 11 |
| N-Admin | 9 | 118 | 18 | 9/9 | 6 |
| O-ChangeManagement | 2 | 0 | 0 | 0/2 | 2 |

## Issues Detail

### CRITICAL (10)
- **/crew**: JS errors on "Crew Create (Modal)": Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/hr/work-orders**: JS errors on "HR Work Orders Page": Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/hr-russian/employment-contracts**: JS errors on "Employment Contracts (RU) Page": Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/safety/briefings**: JS errors on "Safety Briefing Create (Modal)": Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/safety/ppe**: JS errors on "PPE Issue (Modal)": Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/quality/checklists**: JS errors on "Quality Checklists Page": Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/maintenance/equipment**: JS errors on "Maintenance Equipment Page": Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/portal/tasks**: JS errors on "Portal Task Create (Modal)": Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/admin/users**: JS errors on "User Create (Modal)": Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/support/tickets**: JS errors on "Support Ticket Create (Modal)": Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th

### MAJOR (39)
- **/employees/new**: No submit button found or button disabled on form "Employee Create"
- **/crew**: No submit button found or button disabled on form "Crew Create (Modal)"
- **/hr/work-orders**: No submit button found or button disabled on form "HR Work Orders Page"
- **/leave/requests**: Could not find create button matching "создать|подать|новый|добавить|new" on page "Leave Requests Page"
- **/self-employed**: Could not find create button matching "добавить|создать|new" on page "Self-Employed Page"
- **/safety/incidents**: Could not find create button matching "зарегистрировать|создать|добавить|new" on page "Safety Incident Create (Modal)"
- **/safety/inspections**: Could not find create button matching "провести|создать|добавить|new" on page "Safety Inspection Create (Modal)"
- **/safety/briefings**: No submit button found or button disabled on form "Safety Briefing Create (Modal)"
- **/safety/training-journal**: Could not find create button matching "создать|добавить|записать|new" on page "Safety Training Journal Page"
- **/safety/accident-acts**: Could not find create button matching "создать|добавить|new" on page "Accident Act (Н-1) Page"
- **/safety/violations**: Could not find create button matching "создать|зафиксировать|добавить|new" on page "Safety Violations Page"
- **/defects**: Could not find create button matching "зафиксировать|создать|добавить|new" on page "Defect Create (Modal)"
- **/quality/checklists**: No submit button found or button disabled on form "Quality Checklists Page"
- **/quality/material-inspection**: Could not find create button matching "создать|добавить|new" on page "Material Inspection Create (Modal)"
- **/quality/checklist-templates**: Could not find create button matching "создать|добавить|new" on page "Checklist Templates Page"
- **/quality/tolerance-rules**: Could not find create button matching "создать|добавить|new" on page "Tolerance Rules Page"
- **/quality/certificates**: Could not find create button matching "создать|добавить|new" on page "Quality Certificates Page"
- **/punchlist/items**: Could not find create button matching "создать|добавить|new" on page "Punch List Items Page"
- **/quality/supervision-journal**: Could not find create button matching "создать|добавить|new" on page "Supervision Journal Page"
- **/procurement**: Could not find create button matching "создать|добавить|new" on page "Procurement Request Create (Modal)"
- **/procurement/purchase-orders**: Could not find create button matching "создать|добавить|new" on page "Purchase Order Create (Modal)"
- **/warehouse/materials**: Could not find create button matching "создать|добавить|new" on page "Material Create (Modal)"
- **/warehouse/movements**: Could not find create button matching "создать|добавить|new|выдать|переместить" on page "Warehouse Movements Page"
- **/warehouse/inventory**: Could not find create button matching "начать|создать|добавить|new" on page "Inventory Check Page"
- **/warehouse/limit-fence-cards**: Could not find create button matching "создать|добавить|new" on page "Limit Fence Cards Page"
- **/dispatch/orders**: Could not find create button matching "создать|добавить|new" on page "Dispatch Orders Page"
- **/operations/work-orders**: Could not find create button matching "создать|добавить|new" on page "Work Orders (Ops)"
- **/fleet**: Could not find create button matching "добавить|создать|new" on page "Fleet Vehicle Create (Modal)"
- **/fleet/waybills-esm**: Could not find create button matching "создать|добавить|new" on page "Waybill ESM Create (Modal)"
- **/fleet/fuel**: Could not find create button matching "добавить|создать|new" on page "Fuel Record Create (Modal)"
- **/fleet/maintenance**: Could not find create button matching "создать|добавить|new" on page "Maintenance Request Create (Modal)"
- **/maintenance/requests**: Could not find create button matching "создать|добавить|new" on page "Maintenance Requests Page"
- **/maintenance/equipment**: No submit button found or button disabled on form "Maintenance Equipment Page"
- **/portal/rfis**: Could not find create button matching "создать|добавить|new|отправить" on page "Portal RFI Create (Modal)"
- **/portal/defects**: Could not find create button matching "сообщить|создать|добавить|new" on page "Portal Defect Report (Modal)"
- **/portal/tasks**: No submit button found or button disabled on form "Portal Task Create (Modal)"
- **/portal/daily-reports**: Could not find create button matching "создать|добавить|отправить|new" on page "Portal Daily Report (Modal)"
- **/change-management/dashboard**: Could not find create button matching "создать|добавить|new|событие" on page "Change Event Create (Modal)"
- **/change-management/dashboard**: Could not find create button matching "ордер|order|создать ордер" on page "Change Order Create"

### MINOR (1)
- **/employees/new**: Employee: 5000-char notes: No max-length constraint on text fields (1 fields)

### UX (20)
- **/timesheets**: No visible create/add button on list page "Timesheet List Page"
- **/hr/timesheet-t13**: No visible create/add button on list page "Timesheet T-13 Page"
- **/hr/certification-matrix**: No visible create/add button on list page "Certification Matrix Page"
- **/safety/metrics**: No visible create/add button on list page "Safety Metrics Page"
- **/safety/compliance**: No visible create/add button on list page "Safety Compliance Page"
- **/quality/defect-register**: No visible create/add button on list page "Defect Register Page"
- **/quality**: No visible create/add button on list page "Quality Dashboard"
- **/defects/dashboard**: No visible create/add button on list page "Defect Dashboard"
- **/warehouse/quick-receipt**: No visible create/add button on list page "Quick Receipt Page"
- **/warehouse/stock**: No visible create/add button on list page "Warehouse Stock Page"
- **/portal/photos**: No visible create/add button on list page "Portal Photos Page"
- **/portal**: No visible create/add button on list page "Portal Dashboard"
- **/portal/projects**: No visible create/add button on list page "Portal Projects Page"
- **/portal/documents**: No visible create/add button on list page "Portal Documents Page"
- **/portal/contracts**: No visible create/add button on list page "Portal Contracts Page"
- **/portal/schedule**: No visible create/add button on list page "Portal Schedule Page"
- **/admin/system-settings**: No visible create/add button on list page "System Settings Page"
- **/admin/security**: No visible create/add button on list page "Security Page"
- **/support/dashboard**: No visible create/add button on list page "Support Dashboard Page"
- **/monitoring**: No visible create/add button on list page "Monitoring Page"


## Pages with JS Errors

- **/employees** (Employee List Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/crew** (Crew Create (Modal)): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/hr/work-orders** (HR Work Orders Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/leave/requests** (Leave Requests Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/hr-russian/employment-contracts** (Employment Contracts (RU) Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/self-employed** (Self-Employed Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/hr/staffing-schedule** (Staffing Schedule Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/hr/certification-matrix** (Certification Matrix Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/safety/incidents** (Safety Incident Create (Modal)): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/safety/inspections** (Safety Inspection Create (Modal)): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/safety/briefings** (Safety Briefing Create (Modal)): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/safety/training-journal** (Safety Training Journal Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/safety/ppe** (PPE Issue (Modal)): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/safety/accident-acts** (Accident Act (Н-1) Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/safety** (Safety Dashboard): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/safety/metrics** (Safety Metrics Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/safety/violations** (Safety Violations Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/defects** (Defect Create (Modal)): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/quality/checklists** (Quality Checklists Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/quality/material-inspection** (Material Inspection Create (Modal)): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/quality/checklist-templates** (Checklist Templates Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/quality/tolerance-rules** (Tolerance Rules Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/quality/certificates** (Quality Certificates Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/quality/defect-register** (Defect Register Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/quality** (Quality Dashboard): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/punchlist/dashboard** (Punch List Dashboard): Received NaN for the `%s` attribute. If this is expected, cast the value to a string. children
- **/quality/supervision-journal** (Supervision Journal Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/procurement** (Procurement Request Create (Modal)): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/procurement/purchase-orders** (Purchase Order Create (Modal)): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/warehouse/inventory** (Inventory Check Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/warehouse/limit-fence-cards** (Limit Fence Cards Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/dispatch/orders** (Dispatch Orders Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/warehouse/stock** (Warehouse Stock Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/warehouse/locations** (Warehouse Locations Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/operations/work-orders** (Work Orders (Ops)): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/fleet** (Fleet Vehicle Create (Modal)): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/fleet/waybills-esm** (Waybill ESM Create (Modal)): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/fleet/fuel** (Fuel Record Create (Modal)): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/fleet/maintenance** (Maintenance Request Create (Modal)): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/maintenance/requests** (Maintenance Requests Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/maintenance/equipment** (Maintenance Equipment Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/fleet/usage-logs** (Fleet Usage Logs Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/fleet/maintenance-schedule** (Fleet Maintenance Schedule Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/fleet/fuel-accounting** (Fleet Fuel Accounting Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/portal/tasks** (Portal Task Create (Modal)): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/portal/projects** (Portal Projects Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/portal/documents** (Portal Documents Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/portal/contracts** (Portal Contracts Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/portal/invoices** (Portal Invoices Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/portal/ks2-drafts** (Portal KS-2 Drafts Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/admin/users** (User Create (Modal)): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/support/tickets** (Support Ticket Create (Modal)): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th
- **/admin/permissions** (Permissions Page): Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every rende
- **/monitoring** (Monitoring Page): Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move th

## Negative Tests Detail

| Test | Group | Result | Detail |
|------|-------|--------|--------|
| Employee: Empty submit | H-HR | PASS | Validation working correctly |
| Safety Incident: Empty submit (modal) | I-Safety | PASS | Validation working correctly |
| Defect: Empty submit (modal) | J-Quality | PASS | Validation working correctly |
| Support Ticket: Empty submit (modal) | N-Admin | PASS | Validation working correctly |
| Change Event: Empty submit (modal) | O-ChangeManagement | PASS | Validation working correctly |
| Employee: Invalid СНИЛС (3 digits) | H-HR | PASS | Validation working correctly |
| Employee: Invalid ИНН (3 digits) | H-HR | PASS | Validation working correctly |
| Employee: Invalid email | H-HR | PASS | Validation working correctly |
| Employee: Negative salary | H-HR | PASS | Validation working correctly |
| Material: Empty name (modal) | K-Warehouse | PASS | Validation working correctly |
| Employee: XSS in lastName | H-HR | PASS | Validation working correctly |
| Support Ticket: XSS in description | N-Admin | PASS | Validation working correctly |
| Defect: SQL injection in description | J-Quality | PASS | Validation working correctly |
| Employee: 5000-char notes | H-HR | FAIL | MINOR: Fields accepted >3000 chars without truncation: notes=5000 |
| Safety Incident: 5000-char description | I-Safety | PASS | Validation working correctly |

## Form Field Inventory

### Employee Create (/employees/new)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | YES |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | YES |
| lastName | text | Фамилия* (Обязательное поле) | YES | YES |
| firstName | text | Имя* (Обязательное поле) | YES | YES |
| middleName | text | Отчество | --- | YES |
| position | text | Должность* (Обязательное поле) | YES | YES |
| departmentId | select | Отдел* (Обязательное поле) | YES | YES |
| phone | text | Телефон | --- | YES |
| email | email | Email | --- | YES |
| hireDate | date | Дата приёма* (Обязательное поле) | YES | YES |
| contractType | select | Тип договора* (Обязательное поле) | YES | YES |
| projectId | select | Объект | --- | YES |
| passportNumber | text | Паспорт (серия и номер) | --- | YES |
| inn | text | ИНН | --- | YES |
| snils | text | СНИЛС | --- | YES |
| hourlyRate | text | Часовая ставка (руб.) | --- | YES |
| monthlyRate | text | Месячная ставка (руб.) | --- | YES |
| notes | textarea | Примечания | --- | YES |

### Employee List Page (/employees)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |
| text:Поиск по ФИО, должности... | text | Поиск по ФИО, должности... | --- | NO |
| select: | select |  | --- | NO |
| select:Выбрать сохраненный вид таблицы | select | Выбрать сохраненный вид таблицы | --- | NO |
| checkbox:Выбрать все строки на странице | checkbox | Выбрать все строки на странице | --- | NO |
| checkbox:Выбрать строку 0 | checkbox | Выбрать строку 0 | --- | NO |
| checkbox:Выбрать строку 1 | checkbox | Выбрать строку 1 | --- | NO |
| checkbox:Выбрать строку 2 | checkbox | Выбрать строку 2 | --- | NO |
| checkbox:Выбрать строку 3 | checkbox | Выбрать строку 3 | --- | NO |
| checkbox:Выбрать строку 4 | checkbox | Выбрать строку 4 | --- | NO |
| checkbox:Выбрать строку 5 | checkbox | Выбрать строку 5 | --- | NO |
| checkbox:Выбрать строку 6 | checkbox | Выбрать строку 6 | --- | NO |
| checkbox:Выбрать строку 7 | checkbox | Выбрать строку 7 | --- | NO |
| checkbox:Выбрать строку 8 | checkbox | Выбрать строку 8 | --- | NO |
| checkbox:Выбрать строку 9 | checkbox | Выбрать строку 9 | --- | NO |
| checkbox:Выбрать строку 10 | checkbox | Выбрать строку 10 | --- | NO |
| checkbox:Выбрать строку 11 | checkbox | Выбрать строку 11 | --- | NO |
| checkbox:Выбрать строку 12 | checkbox | Выбрать строку 12 | --- | NO |
| checkbox:Выбрать строку 13 | checkbox | Выбрать строку 13 | --- | NO |
| checkbox:Выбрать строку 14 | checkbox | Выбрать строку 14 | --- | NO |
| checkbox:Выбрать строку 15 | checkbox | Выбрать строку 15 | --- | NO |
| checkbox:Выбрать строку 16 | checkbox | Выбрать строку 16 | --- | NO |
| checkbox:Выбрать строку 17 | checkbox | Выбрать строку 17 | --- | NO |
| checkbox:Выбрать строку 18 | checkbox | Выбрать строку 18 | --- | NO |
| checkbox:Выбрать строку 19 | checkbox | Выбрать строку 19 | --- | NO |

### Crew Create (Modal) (/crew)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | YES |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | YES |

### Timesheet List Page (/timesheets)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |
| text:Поиск по сотруднику, объекту... | text | Поиск по сотруднику, объекту... | --- | NO |
| select:Выбрать сохраненный вид таблицы | select | Выбрать сохраненный вид таблицы | --- | NO |
| checkbox:Выбрать все строки на странице | checkbox | Выбрать все строки на странице | --- | NO |
| checkbox:Выбрать строку 0 | checkbox | Выбрать строку 0 | --- | NO |
| checkbox:Выбрать строку 1 | checkbox | Выбрать строку 1 | --- | NO |
| checkbox:Выбрать строку 2 | checkbox | Выбрать строку 2 | --- | NO |
| checkbox:Выбрать строку 3 | checkbox | Выбрать строку 3 | --- | NO |
| checkbox:Выбрать строку 4 | checkbox | Выбрать строку 4 | --- | NO |
| checkbox:Выбрать строку 5 | checkbox | Выбрать строку 5 | --- | NO |
| checkbox:Выбрать строку 6 | checkbox | Выбрать строку 6 | --- | NO |
| checkbox:Выбрать строку 7 | checkbox | Выбрать строку 7 | --- | NO |
| checkbox:Выбрать строку 8 | checkbox | Выбрать строку 8 | --- | NO |
| checkbox:Выбрать строку 9 | checkbox | Выбрать строку 9 | --- | NO |
| checkbox:Выбрать строку 10 | checkbox | Выбрать строку 10 | --- | NO |
| checkbox:Выбрать строку 11 | checkbox | Выбрать строку 11 | --- | NO |
| checkbox:Выбрать строку 12 | checkbox | Выбрать строку 12 | --- | NO |
| checkbox:Выбрать строку 13 | checkbox | Выбрать строку 13 | --- | NO |
| checkbox:Выбрать строку 14 | checkbox | Выбрать строку 14 | --- | NO |
| checkbox:Выбрать строку 15 | checkbox | Выбрать строку 15 | --- | NO |
| checkbox:Выбрать строку 16 | checkbox | Выбрать строку 16 | --- | NO |
| checkbox:Выбрать строку 17 | checkbox | Выбрать строку 17 | --- | NO |
| checkbox:Выбрать строку 18 | checkbox | Выбрать строку 18 | --- | NO |
| checkbox:Выбрать строку 19 | checkbox | Выбрать строку 19 | --- | NO |

### Timesheet T-13 Page (/hr/timesheet-t13)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |
| _r_16_ | select | Объект | --- | NO |
| _r_17_ | select | Месяц | --- | NO |

### HR Work Orders Page (/hr/work-orders)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | YES |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | YES |
| text:Поиск по номеру, описанию, бригаде. | text | Поиск по номеру, описанию, бригаде... | --- | YES |
| select: | select |  | --- | YES |
| select: | select |  | --- | YES |
| select:Выбрать сохраненный вид таблицы | select | Выбрать сохраненный вид таблицы | --- | YES |
| checkbox:Выбрать все строки на странице | checkbox | Выбрать все строки на странице | --- | YES |
| checkbox:Выбрать строку 0 | checkbox | Выбрать строку 0 | --- | YES |
| checkbox:Выбрать строку 1 | checkbox | Выбрать строку 1 | --- | YES |
| checkbox:Выбрать строку 2 | checkbox | Выбрать строку 2 | --- | YES |
| checkbox:Выбрать строку 3 | checkbox | Выбрать строку 3 | --- | YES |
| checkbox:Выбрать строку 4 | checkbox | Выбрать строку 4 | --- | YES |
| _r_8_ | select | Тип наряда* (Обязательное поле) | YES | YES |
| _r_9_ | text | Объект* (Обязательное поле) | YES | YES |
| _r_a_ | text | Бригада* (Обязательное поле) | YES | YES |
| _r_b_ | textarea | Описание работ* (Обязательное поле) | YES | YES |
| _r_c_ | date | Дата начала* (Обязательное поле) | YES | YES |
| _r_d_ | date | Дата окончания | --- | YES |
| _r_e_ | textarea | Требования безопасности | --- | YES |

### Employment Contracts (RU) Page (/hr-russian/employment-contracts)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | YES |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | YES |

### Staffing Schedule Page (/hr/staffing-schedule)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |
| text:Поиск по отделу, должности... | text | Поиск по отделу, должности... | --- | NO |
| select: | select |  | --- | NO |
| select: | select |  | --- | NO |
| select:Выбрать сохраненный вид таблицы | select | Выбрать сохраненный вид таблицы | --- | NO |
| checkbox:Выбрать все строки на странице | checkbox | Выбрать все строки на странице | --- | NO |
| checkbox:Выбрать строку 0 | checkbox | Выбрать строку 0 | --- | NO |
| checkbox:Выбрать строку 1 | checkbox | Выбрать строку 1 | --- | NO |
| checkbox:Выбрать строку 2 | checkbox | Выбрать строку 2 | --- | NO |
| checkbox:Выбрать строку 3 | checkbox | Выбрать строку 3 | --- | NO |
| checkbox:Выбрать строку 4 | checkbox | Выбрать строку 4 | --- | NO |
| checkbox:Выбрать строку 5 | checkbox | Выбрать строку 5 | --- | NO |
| checkbox:Выбрать строку 6 | checkbox | Выбрать строку 6 | --- | NO |
| checkbox:Выбрать строку 7 | checkbox | Выбрать строку 7 | --- | NO |
| checkbox:Выбрать строку 8 | checkbox | Выбрать строку 8 | --- | NO |
| checkbox:Выбрать строку 9 | checkbox | Выбрать строку 9 | --- | NO |
| checkbox:Выбрать строку 10 | checkbox | Выбрать строку 10 | --- | NO |
| checkbox:Выбрать строку 11 | checkbox | Выбрать строку 11 | --- | NO |
| checkbox:Выбрать строку 12 | checkbox | Выбрать строку 12 | --- | NO |
| checkbox:Выбрать строку 13 | checkbox | Выбрать строку 13 | --- | NO |
| checkbox:Выбрать строку 14 | checkbox | Выбрать строку 14 | --- | NO |

### Certification Matrix Page (/hr/certification-matrix)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |
| text:Поиск... | text | Поиск... | --- | NO |
| select: | select |  | --- | NO |
| select:Выбрать сохраненный вид таблицы | select | Выбрать сохраненный вид таблицы | --- | NO |
| checkbox:Выбрать все строки на странице | checkbox | Выбрать все строки на странице | --- | NO |

### Safety Briefing Create (Modal) (/safety/briefings)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | YES |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | YES |
| _r_8_ | select | Label type* (Обязательное поле) | YES | YES |
| _r_9_ | date | Label date* (Обязательное поле) | YES | YES |
| _r_a_ | text | Label instructor* (Обязательное поле) | YES | YES |
| _r_b_ | text | Label topic* (Обязательное поле) | YES | YES |
| _r_c_ | textarea | Label notes | --- | YES |
| text:Placeholder attendee name | text | Placeholder attendee name | --- | YES |

### PPE Issue (Modal) (/safety/ppe)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | YES |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | YES |
| text:Поиск по наименованию... | text | Поиск по наименованию... | --- | YES |
| _r_g_ | select | Наименование СИЗ* (Обязательное поле) | YES | YES |
| _r_h_ | text | Сотрудник* (Обязательное поле) | YES | YES |
| _r_i_ | text | Размер | --- | YES |
| _r_j_ | number | Количество | --- | YES |

### Safety Dashboard (/safety)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |
| text:Поиск... | text | Поиск... | --- | NO |
| select:Выбрать сохраненный вид таблицы | select | Выбрать сохраненный вид таблицы | --- | NO |
| checkbox:Выбрать все строки на странице | checkbox | Выбрать все строки на странице | --- | NO |
| checkbox:Выбрать строку 0 | checkbox | Выбрать строку 0 | --- | NO |
| checkbox:Выбрать строку 1 | checkbox | Выбрать строку 1 | --- | NO |
| checkbox:Выбрать строку 2 | checkbox | Выбрать строку 2 | --- | NO |
| checkbox:Выбрать строку 3 | checkbox | Выбрать строку 3 | --- | NO |
| checkbox:Выбрать строку 4 | checkbox | Выбрать строку 4 | --- | NO |
| checkbox:Выбрать строку 5 | checkbox | Выбрать строку 5 | --- | NO |
| checkbox:Выбрать строку 6 | checkbox | Выбрать строку 6 | --- | NO |
| checkbox:Выбрать строку 7 | checkbox | Выбрать строку 7 | --- | NO |

### Safety Metrics Page (/safety/metrics)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |
| select: | select |  | --- | NO |

### Safety Compliance Page (/safety/compliance)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |

### Quality Checklists Page (/quality/checklists)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | YES |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | YES |

### Defect Register Page (/quality/defect-register)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |
| text:Поиск по номеру, месту... | text | Поиск по номеру, месту... | --- | NO |
| select: | select |  | --- | NO |
| select: | select |  | --- | NO |
| select: | select |  | --- | NO |
| select: | select |  | --- | NO |
| select:Выбрать сохраненный вид таблицы | select | Выбрать сохраненный вид таблицы | --- | NO |
| checkbox:Выбрать все строки на странице | checkbox | Выбрать все строки на странице | --- | NO |
| checkbox:Выбрать строку 0 | checkbox | Выбрать строку 0 | --- | NO |
| checkbox:Выбрать строку 1 | checkbox | Выбрать строку 1 | --- | NO |
| checkbox:Выбрать строку 2 | checkbox | Выбрать строку 2 | --- | NO |
| checkbox:Выбрать строку 3 | checkbox | Выбрать строку 3 | --- | NO |
| checkbox:Выбрать строку 4 | checkbox | Выбрать строку 4 | --- | NO |
| checkbox:Выбрать строку 5 | checkbox | Выбрать строку 5 | --- | NO |
| checkbox:Выбрать строку 6 | checkbox | Выбрать строку 6 | --- | NO |
| checkbox:Выбрать строку 7 | checkbox | Выбрать строку 7 | --- | NO |
| checkbox:Выбрать строку 8 | checkbox | Выбрать строку 8 | --- | NO |
| checkbox:Выбрать строку 9 | checkbox | Выбрать строку 9 | --- | NO |
| checkbox:Выбрать строку 10 | checkbox | Выбрать строку 10 | --- | NO |
| checkbox:Выбрать строку 11 | checkbox | Выбрать строку 11 | --- | NO |
| checkbox:Выбрать строку 12 | checkbox | Выбрать строку 12 | --- | NO |
| checkbox:Выбрать строку 13 | checkbox | Выбрать строку 13 | --- | NO |
| checkbox:Выбрать строку 14 | checkbox | Выбрать строку 14 | --- | NO |
| checkbox:Выбрать строку 15 | checkbox | Выбрать строку 15 | --- | NO |
| checkbox:Выбрать строку 16 | checkbox | Выбрать строку 16 | --- | NO |
| checkbox:Выбрать строку 17 | checkbox | Выбрать строку 17 | --- | NO |
| checkbox:Выбрать строку 18 | checkbox | Выбрать строку 18 | --- | NO |
| checkbox:Выбрать строку 19 | checkbox | Выбрать строку 19 | --- | NO |

### Quality Dashboard (/quality)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |
| text:Поиск по номеру, названию... | text | Поиск по номеру, названию... | --- | NO |
| select: | select |  | --- | NO |
| select: | select |  | --- | NO |
| select:Выбрать сохраненный вид таблицы | select | Выбрать сохраненный вид таблицы | --- | NO |
| checkbox:Выбрать все строки на странице | checkbox | Выбрать все строки на странице | --- | NO |
| checkbox:Выбрать строку 0 | checkbox | Выбрать строку 0 | --- | NO |
| checkbox:Выбрать строку 1 | checkbox | Выбрать строку 1 | --- | NO |
| checkbox:Выбрать строку 2 | checkbox | Выбрать строку 2 | --- | NO |
| checkbox:Выбрать строку 3 | checkbox | Выбрать строку 3 | --- | NO |
| checkbox:Выбрать строку 4 | checkbox | Выбрать строку 4 | --- | NO |
| checkbox:Выбрать строку 5 | checkbox | Выбрать строку 5 | --- | NO |
| checkbox:Выбрать строку 6 | checkbox | Выбрать строку 6 | --- | NO |
| checkbox:Выбрать строку 7 | checkbox | Выбрать строку 7 | --- | NO |
| checkbox:Выбрать строку 8 | checkbox | Выбрать строку 8 | --- | NO |
| checkbox:Выбрать строку 9 | checkbox | Выбрать строку 9 | --- | NO |
| checkbox:Выбрать строку 10 | checkbox | Выбрать строку 10 | --- | NO |
| checkbox:Выбрать строку 11 | checkbox | Выбрать строку 11 | --- | NO |
| checkbox:Выбрать строку 12 | checkbox | Выбрать строку 12 | --- | NO |
| checkbox:Выбрать строку 13 | checkbox | Выбрать строку 13 | --- | NO |
| checkbox:Выбрать строку 14 | checkbox | Выбрать строку 14 | --- | NO |
| checkbox:Выбрать строку 15 | checkbox | Выбрать строку 15 | --- | NO |
| checkbox:Выбрать строку 16 | checkbox | Выбрать строку 16 | --- | NO |
| checkbox:Выбрать строку 17 | checkbox | Выбрать строку 17 | --- | NO |
| checkbox:Выбрать строку 18 | checkbox | Выбрать строку 18 | --- | NO |
| checkbox:Выбрать строку 19 | checkbox | Выбрать строку 19 | --- | NO |

### Defect Dashboard (/defects/dashboard)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |

### Punch List Dashboard (/punchlist/dashboard)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |

### Quick Receipt Page (/warehouse/quick-receipt)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |
| _r_o_ | text | Метка Материал | --- | NO |
| _r_p_ | text | Метка Количество* (Обязательное поле) | YES | NO |

### Warehouse Stock Page (/warehouse/stock)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |
| text:Поиск по материалу, складу... | text | Поиск по материалу, складу... | --- | NO |
| select:Выбрать сохраненный вид таблицы | select | Выбрать сохраненный вид таблицы | --- | NO |

### Warehouse Locations Page (/warehouse/locations)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |
| text:Поиск по коду, названию... | text | Поиск по коду, названию... | --- | NO |
| select: | select |  | --- | NO |
| select:Выбрать сохраненный вид таблицы | select | Выбрать сохраненный вид таблицы | --- | NO |
| checkbox:Выбрать все строки на странице | checkbox | Выбрать все строки на странице | --- | NO |
| checkbox:Выбрать строку 0 | checkbox | Выбрать строку 0 | --- | NO |
| checkbox:Выбрать строку 1 | checkbox | Выбрать строку 1 | --- | NO |
| checkbox:Выбрать строку 2 | checkbox | Выбрать строку 2 | --- | NO |
| checkbox:Выбрать строку 3 | checkbox | Выбрать строку 3 | --- | NO |

### Maintenance Equipment Page (/maintenance/equipment)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | YES |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | YES |

### Fleet Usage Logs Page (/fleet/usage-logs)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |
| text:Поиск... | text | Поиск... | --- | NO |
| select: | select |  | --- | NO |
| select: | select |  | --- | NO |

### Fleet Maintenance Schedule Page (/fleet/maintenance-schedule)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |

### Fleet Fuel Accounting Page (/fleet/fuel-accounting)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |
| text:Поиск по технике, АЗС... | text | Поиск по технике, АЗС... | --- | NO |
| select: | select |  | --- | NO |
| select: | select |  | --- | NO |
| date:с | date | с | --- | NO |
| date:по | date | по | --- | NO |

### Portal Task Create (Modal) (/portal/tasks)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | YES |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | YES |
| select:Выбрать сохраненный вид таблицы | select | Выбрать сохраненный вид таблицы | --- | YES |
| _r_c_ | select | Исполнитель* (Обязательное поле) | YES | YES |
| _r_d_ | text | Заголовок* (Обязательное поле) | YES | YES |
| _r_e_ | select | Объект | --- | YES |
| _r_f_ | textarea | Описание | --- | YES |
| _r_g_ | select | Приоритет | --- | YES |
| _r_h_ | date | Срок выполнения | --- | YES |

### Portal Photos Page (/portal/photos)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |

### Portal Dashboard (/portal)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |

### Portal Projects Page (/portal/projects)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |
| text:Поиск по названию, коду... | text | Поиск по названию, коду... | --- | NO |
| select: | select |  | --- | NO |
| select:Выбрать сохраненный вид таблицы | select | Выбрать сохраненный вид таблицы | --- | NO |

### Portal Documents Page (/portal/documents)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |
| text:Поиск по названию, файлу... | text | Поиск по названию, файлу... | --- | NO |
| select: | select |  | --- | NO |
| select:Выбрать сохраненный вид таблицы | select | Выбрать сохраненный вид таблицы | --- | NO |
| checkbox:Выбрать все строки на странице | checkbox | Выбрать все строки на странице | --- | NO |

### Portal Contracts Page (/portal/contracts)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |
| text:Поиск по номеру, объекту... | text | Поиск по номеру, объекту... | --- | NO |
| select: | select |  | --- | NO |
| select:Выбрать сохраненный вид таблицы | select | Выбрать сохраненный вид таблицы | --- | NO |

### Portal Invoices Page (/portal/invoices)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |
| text:Поиск по номеру, договору... | text | Поиск по номеру, договору... | --- | NO |
| select:Выбрать сохраненный вид таблицы | select | Выбрать сохраненный вид таблицы | --- | NO |

### Portal KS-2 Drafts Page (/portal/ks2-drafts)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |

### Portal Schedule Page (/portal/schedule)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |

### User Create (Modal) (/admin/users)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | YES |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | YES |
| text:Поиск по имени, email... | text | Поиск по имени, email... | --- | YES |
| select:Выбрать сохраненный вид таблицы | select | Выбрать сохраненный вид таблицы | --- | YES |
| checkbox:Выбрать все строки на странице | checkbox | Выбрать все строки на странице | --- | YES |
| checkbox:Выбрать строку 0 | checkbox | Выбрать строку 0 | --- | YES |
| checkbox:Выбрать строку 1 | checkbox | Выбрать строку 1 | --- | YES |
| checkbox:Выбрать строку 2 | checkbox | Выбрать строку 2 | --- | YES |
| checkbox:Выбрать строку 3 | checkbox | Выбрать строку 3 | --- | YES |
| checkbox:Выбрать строку 4 | checkbox | Выбрать строку 4 | --- | YES |
| checkbox:Выбрать строку 5 | checkbox | Выбрать строку 5 | --- | YES |
| checkbox:Выбрать строку 6 | checkbox | Выбрать строку 6 | --- | YES |
| checkbox:Выбрать строку 7 | checkbox | Выбрать строку 7 | --- | YES |
| checkbox:Выбрать строку 8 | checkbox | Выбрать строку 8 | --- | YES |
| checkbox:Выбрать строку 9 | checkbox | Выбрать строку 9 | --- | YES |
| checkbox:Выбрать строку 10 | checkbox | Выбрать строку 10 | --- | YES |
| checkbox:Выбрать строку 11 | checkbox | Выбрать строку 11 | --- | YES |
| checkbox:Выбрать строку 12 | checkbox | Выбрать строку 12 | --- | YES |
| checkbox:Выбрать строку 13 | checkbox | Выбрать строку 13 | --- | YES |
| checkbox:Выбрать строку 14 | checkbox | Выбрать строку 14 | --- | YES |
| checkbox:Выбрать строку 15 | checkbox | Выбрать строку 15 | --- | YES |
| checkbox:Выбрать строку 16 | checkbox | Выбрать строку 16 | --- | YES |
| checkbox:Выбрать строку 17 | checkbox | Выбрать строку 17 | --- | YES |
| checkbox:Выбрать строку 18 | checkbox | Выбрать строку 18 | --- | YES |
| checkbox:Выбрать строку 19 | checkbox | Выбрать строку 19 | --- | YES |
| _r_c_ | text | Имя* (Обязательное поле) | YES | YES |
| _r_d_ | text | Фамилия* (Обязательное поле) | YES | YES |
| _r_e_ | email | Email* (Обязательное поле) | YES | YES |
| _r_f_ | select | Роль* (Обязательное поле) | YES | YES |
| _r_g_ | password | Пароль* (Обязательное поле) | YES | YES |
| checkbox:Debug Test | checkbox | Debug Test | --- | YES |
| checkbox:авыавы | checkbox | авыавы | --- | YES |
| checkbox:Базовый пользователь | checkbox | Базовый пользователь | --- | YES |
| checkbox:Менеджер проектов | checkbox | Менеджер проектов | --- | YES |
| checkbox:Руководитель | checkbox | Руководитель | --- | YES |
| checkbox:Бухгалтер | checkbox | Бухгалтер | --- | YES |
| checkbox:Кладовщик | checkbox | Кладовщик | --- | YES |
| checkbox:Инженер ОТ | checkbox | Инженер ОТ | --- | YES |
| checkbox:HR-менеджер | checkbox | HR-менеджер | --- | YES |
| checkbox:Администратор | checkbox | Администратор | --- | YES |

### Department Create (Modal) (/admin/departments)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | YES |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | YES |
| text:Поиск по названию или коду... | text | Поиск по названию или коду... | --- | YES |
| text:Название подразделения | text | Название подразделения | --- | YES |
| text:Например: OMTS | text | Например: OMTS | --- | YES |
| select:Родительское подразделение | select | Родительское подразделение | --- | YES |
| number:Порядок сортировки | number | Порядок сортировки | --- | YES |
| textarea:Краткое описание функций подраз | textarea | Краткое описание функций подразделения | --- | YES |

### System Settings Page (/admin/system-settings)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |
| text: | text |  | --- | NO |

### Support Ticket Create (Modal) (/support/tickets)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | YES |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | YES |
| _r_c_ | textarea | Добавить комментарий | --- | YES |
| checkbox:Внутренний комментарий | checkbox | Внутренний комментарий | --- | YES |
| _r_d_ | select | Изменить статус | --- | YES |

### Admin Dashboard Page (/admin/dashboard)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |

### Permissions Page (/admin/permissions)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |

### Security Page (/admin/security)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |
| number: | number |  | --- | NO |
| number: | number |  | --- | NO |
| number: | number |  | --- | NO |
| number: | number |  | --- | NO |

### Support Dashboard Page (/support/dashboard)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |

### Monitoring Page (/monitoring)
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
| text:Поиск по объектам, документам... | text | Поиск по объектам, документам... | --- | NO |
| textarea:Задайте вопрос... | textarea | Задайте вопрос... | --- | NO |
| select:Выбрать сохраненный вид таблицы | select | Выбрать сохраненный вид таблицы | --- | NO |


## Domain Expert Assessment — Part 2 Modules

### HR Module Business Rules
1. **СНИЛС format**: XXX-XXX-XXX XX (11 digits) — negative test verifies rejection of 3-digit input
2. **ИНН format**: 12 digits for individual (физлицо), 10 digits for legal entity — negative test included
3. **Salary validation**: No negative salaries allowed — negative test included
4. **Work hours**: 8h normal / 12h max per day, 40h normal / 60h max per week
5. **Leave auto-calculation**: Days count should auto-compute from date range
6. **Employment contracts**: Must include all statutory fields per ТК РФ

### Safety Module Business Rules
1. **Incident severity**: Must be assigned (Микротравма / Лёгкий / Средний / Тяжёлый / Смертельный)
2. **Corrective actions**: At least 1 required per incident
3. **Training expiry**: Certificates have expiry dates — system should warn when approaching
4. **PPE tracking**: Issue date + expiry, link to employee, size/type
5. **Briefing types**: 5 statutory types (Вводный/Первичный/Повторный/Целевой/Внеплановый)
6. **Акт Н-1**: Mandatory form for workplace accidents per ТК РФ ст. 229.2

### Quality Module Business Rules
1. **Defect severity**: 3 levels (Незначительный/Существенный/Критический) — affects SLA
2. **Open defect aging**: >30 days = red flag
3. **Inspection pass rate**: <80% = failing (needs management attention)
4. **Tolerance rules**: Engineering tolerances from СНиП/СП standards
5. **Material inspection**: Certificate of conformity required for structural materials
6. **Punch list**: Pre-handover items must all be resolved before closeout

### Warehouse Module Business Rules
1. **Stock balance**: Cannot issue more than available (negative stock = CRITICAL)
2. **Min/max stock**: Alerts when below minimum
3. **Limit-fence cards**: Control material consumption per project vs. plan
4. **FIFO**: Materials should be issued in order received
5. **M-29 report**: Statutory material consumption report

### Fleet Module Business Rules
1. **Fuel total**: liters * price_per_liter (verified: 150 * 62.00 = 9,300.00)
2. **Odometer**: end > start (can't go backwards)
3. **Maintenance types**: Плановое (scheduled) vs Аварийное (emergency)
4. **ESM waybills**: Required for every vehicle trip per transportation law

### Portal Module Business Rules
1. **RFI workflow**: Created → Assigned → Answered → Closed
2. **Subcontractor visibility**: Only sees own projects/documents
3. **Document signatures**: Electronic sign-off for КС-2, КП
4. **Task assignment**: Portal user can only see tasks assigned to them

### Admin / Change Management Rules
1. **User roles**: 5 distinct roles with different permissions
2. **Change order impact**: Must quantify budget + schedule impact
3. **Approval workflow**: Change orders require explicit approval before execution
4. **Support SLA**: Priority-based response times

### Potential Gaps (Expected Findings)
- Some modal forms may lack visible create buttons (page structure varies)
- Timesheet T-13 is a complex grid form — may not have standard field discovery
- Portal pages require portal-role auth (testing as admin may show different UI)
- Change management dashboard combines events + orders on one page
- Max-length constraints on text fields should be enforced at HTML level
