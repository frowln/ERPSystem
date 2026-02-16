package com.privod.platform.modules.leave.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum LeaveAllocationStatus {

    DRAFT("Черновик"),
    APPROVED("Утверждён"),
    REFUSED("Отказано");

    private final String displayName;
}
