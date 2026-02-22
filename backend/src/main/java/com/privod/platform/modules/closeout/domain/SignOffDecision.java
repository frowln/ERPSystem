package com.privod.platform.modules.closeout.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SignOffDecision {

    APPROVED("Одобрено"),
    APPROVED_WITH_REMARKS("Одобрено с замечаниями"),
    REJECTED("Отклонено"),
    PENDING("Ожидает подписи");

    private final String displayName;
}
