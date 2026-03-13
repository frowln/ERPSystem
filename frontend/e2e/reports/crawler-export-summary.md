# Export / Print / Download Audit Report

Generated: 2026-03-12T19:44:55.952Z

## Summary

| Metric | Value |
|--------|-------|
| Total pages scanned | 0 |
| Pages with export buttons | 0 |
| Total export buttons found | 0 |
| Download attempts | 9 |
| Successful downloads | 2 |
| Empty/corrupt files | 0 |
| Failed downloads | 0 |
| Print buttons found | 1 |
| Print dialogs working | 1 |
| Import tests passed | 3 / 5 |

## Issues by Severity

| Severity | Count |
|----------|-------|
| CRITICAL | 4 |
| MAJOR | 0 |
| MINOR | 7 |
| UX | 7 |
| MISSING | 7 |

## Export Buttons by Module

| Module | Pages | With Export | Total Buttons |
|--------|-------|------------|---------------|


## By File Type

| Type | OK | Empty | Corrupt | Failed |
|------|----|-------|---------|--------|
| csv | 2 | 0 | 0 | 0 |

## Critical Document Generation

| Document | Found | Generated | Format OK | Content OK | Details |
|----------|-------|-----------|-----------|------------|---------|
| КС-2 (Акт о приёмке выполненных работ) | ✅ | ❌ | ❌ | ❌ | Export button clicked but no download triggered |
| КС-3 (Справка о стоимости) | ✅ | ❌ | ❌ | ❌ | Export button clicked but no download triggered |
| Коммерческое предложение | ✅ | ❌ | ❌ | ❌ | Export button clicked but no download triggered |
| Счёт на оплату | ✅ | ❌ | ❌ | ❌ | Export button clicked but no download triggered |
| Смета (Estimate) | ✅ | ✅ | ✅ | ✅ | Downloaded: export_2026-03-12.csv (3607 bytes, format: csv) |
| Акт Н-1 (Accident Report) | ✅ | ✅ | ✅ | ❌ | Downloaded: export_2026-03-12.csv (109 bytes, format: csv) |
| Табель Т-13 (Timesheet) | ❌ | ❌ | ❌ | ❌ | No export button found on page |

## Print Dialog Results

| Page | Button Found | Dialog Opened |
|------|-------------|--------------|
| Russian KS-2 (/russian-docs/ks2) | ❌ | ❌ |
| Russian KS-3 (/russian-docs/ks3) | ❌ | ❌ |
| Russian EDO (/russian-docs/edo) | ❌ | ❌ |
| Russian Docs (/russian-docs/list) | ❌ | ❌ |
| Invoices (/invoices) | ❌ | ❌ |
| Commercial Proposals (/commercial-proposals) | ❌ | ❌ |
| Timesheet T-13 (/hr/timesheet-t13) | ❌ | ❌ |
| Employment Contracts (/hr-russian/employment-contracts) | ❌ | ❌ |
| Accident Acts (/safety/accident-acts) | ❌ | ❌ |
| Training Journal (/safety/training-journal) | ✅ | ✅ |
| AOSR (/exec-docs/aosr) | ❌ | ❌ |
| KS6 (/exec-docs/ks6) | ❌ | ❌ |
| Certificates (/quality/certificates) | ❌ | ❌ |
| Commissioning (/closeout/commissioning) | ❌ | ❌ |
| Handover (/closeout/handover) | ❌ | ❌ |
| Estimates (/estimates) | ❌ | ❌ |
| Purchase Orders (/procurement/purchase-orders) | ❌ | ❌ |
| Waybills ESM (/fleet/waybills-esm) | ❌ | ❌ |
| Reports (/reports) | ❌ | ❌ |
| M29 Report (/warehouse/m29-report) | ❌ | ❌ |

## Import/Upload Test Results

| URL | Test | Result | Details |
|-----|------|--------|---------|
| /data-exchange/import | Import page structure | ✅ | upload: false, dropZone: true, formatSelector: false |
| /specifications | Specification XLSX upload capability | ✅ | create: true, import: true |
| /documents | Document upload capability | ❌ | uploadButton: false, fileInput: false |
| /data-exchange/export | Data export page structure | ✅ | moduleSelector: false, formatOptions: true, exportButton: true |
| /financial-models | ЛСР import on FM page | ❌ | importButton: false, pageContent: 2773 chars |

## Top 20 Pages by Export Button Count

| # | Page | URL | Buttons |
|---|------|-----|---------|


## All Issues

### CRITICAL
- **/russian-docs/ks2**: Critical document КС-2 (Акт о приёмке выполненных работ) cannot be exported/printed
- **/russian-docs/ks3**: Critical document КС-3 (Справка о стоимости) cannot be exported/printed
- **/commercial-proposals**: Critical document Коммерческое предложение cannot be exported/printed
- **/invoices**: Critical document Счёт на оплату cannot be exported/printed


### MINOR
- **/invoices**: Invoices: has row selection but no "Export selected" button
- **/employees**: Employees: has row selection but no "Export selected" button
- **/warehouse/materials**: Materials: has row selection but no "Export selected" button
- **/defects**: Defects: has row selection but no "Export selected" button
- **/safety/incidents**: Incidents: has row selection but no "Export selected" button
- **/procurement/purchase-orders**: Purchase Orders: has row selection but no "Export selected" button
- **/payments**: Payments: has row selection but no "Export selected" button

### UX
- **/employees**: Table page Employees has no export functionality — hasSelectAll: true, rowCheckboxes: 20, hasBulkExport: false, hasExport: false
- **/warehouse/materials**: Table page Materials has no export functionality — hasSelectAll: true, rowCheckboxes: 20, hasBulkExport: false, hasExport: false
- **/defects**: Table page Defects has no export functionality — hasSelectAll: true, rowCheckboxes: 20, hasBulkExport: false, hasExport: false
- **/projects**: Table page Projects List has no export functionality — hasSelectAll: false, rowCheckboxes: 0, hasBulkExport: false, hasExport: false
- **/safety/incidents**: Table page Incidents has no export functionality — hasSelectAll: true, rowCheckboxes: 20, hasBulkExport: false, hasExport: false
- **/crm/leads**: Table page CRM Leads has no export functionality — hasSelectAll: false, rowCheckboxes: 0, hasBulkExport: false, hasExport: false
- **/procurement/purchase-orders**: Table page Purchase Orders has no export functionality — hasSelectAll: true, rowCheckboxes: 0, hasBulkExport: false, hasExport: false

### MISSING
- **/russian-docs/ks2**: No print button on document page: Russian KS-2
- **/russian-docs/ks3**: No print button on document page: Russian KS-3
- **/russian-docs/edo**: No print button on document page: Russian EDO
- **/russian-docs/list**: No print button on document page: Russian Docs
- **/exec-docs/aosr**: No print button on document page: AOSR
- **/exec-docs/ks6**: No print button on document page: KS6
- **/hr/timesheet-t13**: No export button for critical document: Табель Т-13 (Timesheet)

