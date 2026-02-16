package com.privod.platform.modules.hrRussian.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CrewReportStatus {

    DRAFT("Черновик"),
    SUBMITTED("Отправлено"),
    APPROVED("Утверждено"),
    REJECTED("Отклонено");

    private final String displayName;
}
