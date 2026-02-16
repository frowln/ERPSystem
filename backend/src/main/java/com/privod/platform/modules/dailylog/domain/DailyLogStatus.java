package com.privod.platform.modules.dailylog.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DailyLogStatus {

    DRAFT("Черновик"),
    SUBMITTED("Отправлено"),
    APPROVED("Утверждено");

    private final String displayName;
}
