package com.privod.platform.modules.regulatory.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ReportStatus {

    DRAFT("Черновик"),
    PREPARED("Подготовлен"),
    SUBMITTED("Отправлен"),
    ACCEPTED("Принят"),
    REJECTED("Отклонён");

    private final String displayName;
}
