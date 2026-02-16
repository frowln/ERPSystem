package com.privod.platform.modules.organization.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EnrichmentLogStatus {

    SUCCESS("Успешно"),
    FAILED("Ошибка"),
    PARTIAL("Частично");

    private final String displayName;
}
