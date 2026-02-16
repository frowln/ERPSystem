package com.privod.platform.modules.leave.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum LeaveRequestStatus {

    DRAFT("Черновик"),
    SUBMITTED("На рассмотрении"),
    APPROVED("Утверждён"),
    REFUSED("Отказано"),
    CANCELLED("Отменён");

    private final String displayName;
}
