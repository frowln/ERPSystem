package com.privod.platform.modules.portfolio.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PrequalificationStatus {

    DRAFT("Черновик"),
    SUBMITTED("Подан"),
    APPROVED("Одобрен"),
    REJECTED("Отклонён"),
    EXPIRED("Просрочен");

    private final String displayName;
}
