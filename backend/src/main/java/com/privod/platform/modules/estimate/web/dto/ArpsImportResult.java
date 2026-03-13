package com.privod.platform.modules.estimate.web.dto;

import lombok.Builder;

import java.util.UUID;

/**
 * Результат импорта сметы из ARPS 1.10 XML (P1-EST-4).
 * Возвращает идентификатор созданной локальной сметы и счётчики
 * импортированных разделов и позиций.
 */
@Builder
public record ArpsImportResult(
        UUID estimateId,
        String estimateName,
        int sectionsCreated,
        int positionsCreated,
        UUID importHistoryId
) {}
