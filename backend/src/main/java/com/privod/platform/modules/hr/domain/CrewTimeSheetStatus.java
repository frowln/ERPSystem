package com.privod.platform.modules.hr.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CrewTimeSheetStatus {

    DRAFT("Черновик"),
    SUBMITTED("Отправлено"),
    APPROVED("Утверждено"),
    REJECTED("Отклонено");

    private final String displayName;
}
