package com.privod.platform.modules.design.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DesignReviewStatus {

    PENDING("Ожидает"),
    APPROVED("Утверждено"),
    REJECTED("Отклонено"),
    REVISION_REQUESTED("Запрошена доработка");

    private final String displayName;
}
