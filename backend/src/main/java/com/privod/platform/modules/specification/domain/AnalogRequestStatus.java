package com.privod.platform.modules.specification.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AnalogRequestStatus {

    PENDING("Ожидает рассмотрения"),
    APPROVED("Одобрена"),
    REJECTED("Отклонена");

    private final String displayName;
}
