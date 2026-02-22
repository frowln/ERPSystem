package com.privod.platform.modules.esg.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EsgReportStatus {

    DRAFT("Черновик"),
    GENERATED("Сформирован"),
    APPROVED("Утверждён"),
    PUBLISHED("Опубликован");

    private final String displayName;
}
